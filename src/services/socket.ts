import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { store } from '../store';
import config from '../config/environment';
import {
  addMessage,
  startConversation,
  endConversation,
  updateConversationContext,
} from '../store/slices/conversationSlice';
import {
  addTask,
  updateTask,
  removeTask,
} from '../store/slices/taskSlice';
import {
  addEvent,
  updateEvent,
  removeEvent,
} from '../store/slices/calendarSlice';
import {
  startListening,
  stopListening,
  startProcessing,
  stopProcessing,
  setVoiceError,
} from '../store/slices/voiceSlice';

class SocketService {
  private socket: Socket | null = null;
  private connected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private baseURL: string;

  constructor() {
    this.baseURL = config.SOCKET_URL;
    this.maxReconnectAttempts = config.SOCKET_RECONNECT_ATTEMPTS;
  }

  async connect(): Promise<void> {
    // If already connected, return immediately
    if (this.socket && this.connected) {
      console.log('🟢 Socket already connected');
      return Promise.resolve();
    }

    // If socket exists but not connected, disconnect first
    if (this.socket) {
      console.log('🔄 Cleaning up existing socket connection');
      this.socket.disconnect();
      this.socket.removeAllListeners();
      this.socket = null;
    }

    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        console.log('⚠️ No authentication token found, skipping socket connection');
        // Don't throw error - allow app to work without socket for logged out users
        return Promise.resolve();
      }

      console.log('🔌 Attempting socket connection to:', this.baseURL);

      this.socket = io(this.baseURL, {
        auth: {
          token,
        },
        transports: ['websocket', 'polling'], // Try websocket first, fallback to polling
        timeout: 30000, // Increased timeout
        reconnection: true,
        reconnectionDelay: 2000, // Increased initial delay
        reconnectionDelayMax: 10000, // Increased max delay
        reconnectionAttempts: this.maxReconnectAttempts,
        forceNew: true, // Force new connection
        upgrade: true,
        autoConnect: true,
      });

      this.setupEventListeners();

      return new Promise((resolve, reject) => {
        if (!this.socket) return reject(new Error('Socket not initialized'));

        // Set up connection timeout
        const connectionTimeout = setTimeout(() => {
          if (!this.connected) {
            console.log('⏰ Socket connection timeout after 30 seconds');
            this.socket?.disconnect();
            reject(new Error('Connection timeout'));
          }
        }, 30000); // 30 second timeout

        this.socket.on('connect', () => {
          console.log('✅ Connected to server via WebSocket');
          this.connected = true;
          this.reconnectAttempts = 0;
          clearTimeout(connectionTimeout);
          resolve();
        });

        this.socket.on('connect_error', (error: any) => {
          console.error('❌ Socket connection error:', {
            message: error.message,
            description: error.description || 'No description',
            context: error.context || 'No context',
            type: error.type || error.constructor.name
          });
          this.connected = false;
          clearTimeout(connectionTimeout);
          reject(error);
        });

        // Additional error handling
        this.socket.on('error', (error) => {
          console.error('🔥 Socket general error:', error);
        });

        this.socket.on('disconnect', (reason) => {
          console.log('🔌 Socket disconnected:', reason);
          this.connected = false;
          clearTimeout(connectionTimeout);
        });
      });
    } catch (error) {
      console.error('💥 Failed to initialize socket:', error);
      throw error;
    }
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from server:', reason);
      this.connected = false;

      if (reason === 'io server disconnect') {
        // Server initiated disconnect, don't try to reconnect
        return;
      }

      // Auto-reconnect
      this.attemptReconnect();
    });

    // Voice processing events
    this.socket.on('voice:listening', (data) => {
      console.log('Voice listening started:', data);
      store.dispatch(startListening());
    });

    this.socket.on('voice:transcription', (data) => {
      console.log('Voice transcription received:', data);
      store.dispatch(stopListening());

      if (data.transcription) {
        store.dispatch(stopProcessing());
        // Handle transcription result
        this.handleTranscription(data);
      }
    });

    this.socket.on('voice:error', (data) => {
      console.error('Voice processing error:', data);
      store.dispatch(setVoiceError(data.error));
      store.dispatch(stopListening());
      store.dispatch(stopProcessing());
    });

    this.socket.on('voice:stopped', (data) => {
      console.log('Voice recording stopped:', data);
      store.dispatch(stopListening());
    });

    // AI response events
    this.socket.on('ai:response', (data) => {
      console.log('AI response received:', data);

      // Add AI message to current conversation
      const message = {
        id: Date.now().toString(),
        role: 'assistant' as const,
        content: data.content,
        timestamp: new Date().toISOString(),
        metadata: {
          actionItems: data.actionItems,
          ...data.context,
        },
      };

      // Get current conversation ID from store if needed
      const state = store.getState();
      const conversationId = state.conversation.activeConversation?.id || '';

      store.dispatch(addMessage({
        conversationId,
        message
      }));
    });

    this.socket.on('ai:error', (data) => {
      console.error('AI processing error:', data);
    });

    // Conversation events
    this.socket.on('conversation:created', (data) => {
      console.log('Conversation created:', data);
      store.dispatch(startConversation({
        id: data.conversationId,
        userId: '', // Will be set by the reducer
        messages: [],
        context: data.context,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
    });

    this.socket.on('conversation:message', (data) => {
      console.log('Conversation message received:', data);
      store.dispatch(addMessage(data.message));
    });

    this.socket.on('conversation:ended', (data) => {
      console.log('Conversation ended:', data);
      store.dispatch(endConversation(data.conversationId));
    });

    this.socket.on('conversation:error', (data) => {
      console.error('Conversation error:', data);
    });

    // Task events
    this.socket.on('task:created', (task) => {
      console.log('Task created:', task);
      store.dispatch(addTask(task));
    });

    this.socket.on('task:updated', (data) => {
      console.log('Task updated:', data);
      if (data.action === 'update') {
        store.dispatch(updateTask(data.task));
      }
    });

    this.socket.on('task:ai_created', (data) => {
      console.log('AI-generated task created:', data);
      store.dispatch(addTask(data.task));
    });

    this.socket.on('task:error', (data) => {
      console.error('Task error:', data);
    });

    // Event events
    this.socket.on('event:created', (event) => {
      console.log('Event created:', event);
      store.dispatch(addEvent(event));
    });

    this.socket.on('event:updated', (data) => {
      console.log('Event updated:', data);
      if (data.action === 'update') {
        store.dispatch(updateEvent(data.event));
      }
    });

    this.socket.on('event:error', (data) => {
      console.error('Event error:', data);
    });

    // Notification events
    this.socket.on('notification:push', (notification) => {
      console.log('Push notification received:', notification);
      // Handle push notification display
      this.handlePushNotification(notification);
    });

    this.socket.on('daily:briefing', (data) => {
      console.log('Daily briefing received:', data);
      // Handle daily briefing
    });

    // Typing indicators
    this.socket.on('user:typing', (data) => {
      console.log('User typing:', data);
      // Handle typing indicator
    });

    this.socket.on('user:offline', (data) => {
      console.log('User went offline:', data);
    });
  }

  private handleTranscription(data: {
    transcription: string;
    confidence: number;
    intent?: any;
  }): void {
    // Add user message to conversation
    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: data.transcription,
      timestamp: new Date().toISOString(),
      metadata: {
        confidence: data.confidence,
        intent: data.intent,
      },
    };

    // Get current conversation ID from store if needed
    const state = store.getState();
    const conversationId = state.conversation.activeConversation?.id || '';

    store.dispatch(addMessage({
      conversationId,
      message: userMessage
    }));
  }

  private handlePushNotification(notification: {
    title: string;
    body: string;
    data?: any;
  }): void {
    // In a real app, you'd show a local notification here
    console.log('Showing notification:', notification);
  }

  private async attemptReconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('❌ Max reconnection attempts reached, stopping reconnection');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(Math.pow(2, this.reconnectAttempts) * 1000, 30000); // Exponential backoff with max 30s

    console.log(`🔄 Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(async () => {
      try {
        console.log(`🔄 Reconnection attempt ${this.reconnectAttempts} starting...`);
        await this.connect();
        console.log('✅ Reconnection successful!');
      } catch (error) {
        console.error(`❌ Reconnection attempt ${this.reconnectAttempts} failed:`, error);
        // Continue trying until max attempts reached
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.attemptReconnect();
        }
      }
    }, delay);
  }

  // Voice methods
  async startVoiceRecording(): Promise<void> {
    if (!this.socket?.connected) {
      throw new Error('Socket not connected');
    }

    this.socket.emit('voice:start');
  }

  async sendVoiceData(audioData: Buffer): Promise<void> {
    if (!this.socket?.connected) {
      throw new Error('Socket not connected');
    }

    this.socket.emit('voice:data', audioData);
  }

  async stopVoiceRecording(): Promise<void> {
    if (!this.socket?.connected) {
      throw new Error('Socket not connected');
    }

    this.socket.emit('voice:end');
  }

  // Conversation methods
  async startConversationSession(context?: any): Promise<void> {
    if (!this.socket?.connected) {
      throw new Error('Socket not connected');
    }

    this.socket.emit('conversation:start', { context });
  }

  async sendMessage(conversationId: string, message: string, audioUrl?: string): Promise<void> {
    if (!this.socket?.connected) {
      throw new Error('Socket not connected');
    }

    this.socket.emit('conversation:message', {
      conversationId,
      message,
      audioUrl,
    });
  }

  async endConversationSession(conversationId: string): Promise<void> {
    if (!this.socket?.connected) {
      throw new Error('Socket not connected');
    }

    this.socket.emit('conversation:end', { conversationId });
  }

  // Task methods
  async createTask(taskData: any): Promise<void> {
    if (!this.socket?.connected) {
      throw new Error('Socket not connected');
    }

    this.socket.emit('task:create', taskData);
  }

  async updateTaskRealtime(taskId: string, updates: any): Promise<void> {
    if (!this.socket?.connected) {
      throw new Error('Socket not connected');
    }

    this.socket.emit('task:update', { taskId, updates });
  }

  // Event methods
  async createEvent(eventData: any): Promise<void> {
    if (!this.socket?.connected) {
      throw new Error('Socket not connected');
    }

    this.socket.emit('event:create', eventData);
  }

  async updateEventRealtime(eventId: string, updates: any): Promise<void> {
    if (!this.socket?.connected) {
      throw new Error('Socket not connected');
    }

    this.socket.emit('event:update', { eventId, updates });
  }

  // Typing indicators
  startTyping(): void {
    if (this.socket?.connected) {
      this.socket.emit('typing:start');
    }
  }

  stopTyping(): void {
    if (this.socket?.connected) {
      this.socket.emit('typing:stop');
    }
  }

  // Utility methods
  isConnected(): boolean {
    return this.connected && this.socket?.connected === true;
  }

  async disconnect(): Promise<void> {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      console.log('Socket disconnected');
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

export default new SocketService();