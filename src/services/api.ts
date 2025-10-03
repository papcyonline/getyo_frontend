import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiResponse, User, Task, Event, Conversation } from '../types';
import config from '../config/environment';
import NetInfo from '@react-native-community/netinfo';

// Enhanced error types
interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
}

// Request retry configuration
interface RetryConfig {
  retries: number;
  retryDelay: number;
  retryCondition?: (error: AxiosError) => boolean;
}

class ApiService {
  private api: AxiosInstance;
  private baseURL: string;
  private defaultRetryConfig: RetryConfig = {
    retries: 3,
    retryDelay: 1000,
    retryCondition: (error: AxiosError) => {
      // Only retry on network errors or 5xx server errors
      // DO NOT retry on 4xx client errors (like auth failures)
      if (!error.response) {
        // Network error - retry
        return true;
      }

      const status = error.response.status;
      // Only retry on server errors (5xx), not client errors (4xx)
      return status >= 500 && status < 600;
    }
  };

  constructor() {
    this.baseURL = config.API_BASE_URL;

    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: config.API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for comprehensive error handling
    this.api.interceptors.response.use(
      (response) => {
        // Log successful responses in debug mode
        if (config.DEBUG) {
          console.log(`✅ API Success: ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
        }
        return response;
      },
      async (error) => {
        const enhancedError = await this.handleApiError(error);
        return Promise.reject(enhancedError);
      }
    );
  }

  // Enhanced error handling method
  private async handleApiError(error: AxiosError): Promise<ApiError> {
    const networkState = await NetInfo.fetch();

    // Log detailed error information
    console.error('🔥 API Error Details:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method,
      networkConnected: networkState.isConnected,
      data: error.response?.data,
    });

    // Handle 401 - Unauthorized (token expired/invalid)
    if (error.response?.status === 401) {
      console.log('🔑 Unauthorized - clearing auth data');
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('user');

      return {
        message: 'Session expired. Please log in again.',
        code: 'AUTH_EXPIRED',
        status: 401,
        details: error.response?.data
      };
    }

    // Handle 400 - Bad Request
    if (error.response?.status === 400) {
      const serverMessage = error.response?.data?.error || error.response?.data?.message;
      return {
        message: serverMessage || 'Invalid request. Please check your input.',
        code: 'BAD_REQUEST',
        status: 400,
        details: error.response?.data
      };
    }

    // Handle 403 - Forbidden
    if (error.response?.status === 403) {
      return {
        message: 'Access denied. You don\'t have permission for this action.',
        code: 'FORBIDDEN',
        status: 403,
        details: error.response?.data
      };
    }

    // Handle 404 - Not Found
    if (error.response?.status === 404) {
      return {
        message: 'Resource not found.',
        code: 'NOT_FOUND',
        status: 404,
        details: error.response?.data
      };
    }

    // Handle 500+ - Server Errors
    if (error.response?.status && error.response.status >= 500) {
      return {
        message: 'Server error. Please try again later.',
        code: 'SERVER_ERROR',
        status: error.response.status,
        details: error.response?.data
      };
    }

    // Handle network errors
    if (!networkState.isConnected) {
      return {
        message: 'No internet connection. Please check your network and try again.',
        code: 'NETWORK_ERROR',
        status: 0,
        details: { networkState }
      };
    }

    // Handle timeout
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return {
        message: 'Server is starting up. This may take up to 60 seconds on first request. Please try again.',
        code: 'TIMEOUT',
        status: 0,
        details: { timeout: config.API_TIMEOUT, hint: 'Render.com free tier cold start' }
      };
    }

    // Handle general network/connection errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || !error.response) {
      return {
        message: 'Unable to connect to server. Please check your connection.',
        code: 'CONNECTION_ERROR',
        status: 0,
        details: { originalError: error.message }
      };
    }

    // Fallback for unknown errors
    return {
      message: 'An unexpected error occurred. Please try again.',
      code: 'UNKNOWN_ERROR',
      status: error.response?.status || 0,
      details: error.response?.data || error.message
    };
  }

  // Retry mechanism for failed requests
  private async requestWithRetry<T>(
    requestFn: () => Promise<AxiosResponse<T>>,
    retryConfig: Partial<RetryConfig> = {}
  ): Promise<AxiosResponse<T>> {
    const config = { ...this.defaultRetryConfig, ...retryConfig };
    let lastError: AxiosError;

    for (let attempt = 0; attempt <= config.retries; attempt++) {
      try {
        if (attempt > 0) {
          console.log(`📡 Retry attempt ${attempt}/${config.retries}`);
          await this.delay(config.retryDelay * attempt); // Exponential backoff
        }

        const response = await requestFn();

        if (attempt > 0) {
          console.log(`✅ Request succeeded on retry ${attempt}`);
        }

        return response;
      } catch (error) {
        lastError = error as AxiosError;

        // Don't retry if this is the last attempt or if retry condition fails
        if (attempt === config.retries || !config.retryCondition?.(lastError)) {
          break;
        }

        console.log(`❌ Attempt ${attempt + 1} failed, retrying...`, {
          error: lastError.message,
          status: lastError.response?.status
        });
      }
    }

    throw lastError!;
  }

  // Network connectivity check
  private async checkNetworkConnectivity(): Promise<boolean> {
    try {
      const networkState = await NetInfo.fetch();
      return networkState.isConnected ?? false;
    } catch (error) {
      console.error('Failed to check network connectivity:', error);
      return false;
    }
  }

  // Utility delay function
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Health check
  async healthCheck(): Promise<any> {
    try {
      const response = await this.api.get('/health');
      return response.data;
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }

  // Authentication with enhanced error handling and retry
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    try {
      // Check network connectivity first
      const isConnected = await this.checkNetworkConnectivity();
      if (!isConnected) {
        throw {
          message: 'No internet connection. Please check your network.',
          code: 'NETWORK_ERROR',
          status: 0
        };
      }

      console.log('🔐 Attempting login for:', email);

      // DO NOT retry login requests - they should only be attempted once
      // Retrying auth failures can lock accounts or cause rate limiting
      const response = await this.api.post('/api/auth/login', { email, password });

      const { user, token } = response.data.data;

      // Store token and user data
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));

      console.log('✅ Login successful for:', email);
      return { user, token };
    } catch (error: any) {
      console.error('❌ Login failed:', {
        email,
        error: error.message || error,
        code: error.code,
        status: error.status
      });
      throw error;
    }
  }

  async register(userData: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }): Promise<{ user: User; token: string }> {
    try {
      // Check network connectivity first
      const isConnected = await this.checkNetworkConnectivity();
      if (!isConnected) {
        throw {
          message: 'No internet connection. Please check your network.',
          code: 'NETWORK_ERROR',
          status: 0
        };
      }

      console.log('📝 Attempting registration for:', userData.email);

      // DO NOT retry registration requests - they should only be attempted once
      // Retrying could create duplicate accounts or cause validation issues
      const response = await this.api.post('/api/auth/register', userData);

      const { user, token } = response.data.data;

      // Store token and user data
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));

      console.log('✅ Registration successful for:', userData.email);
      return { user, token };
    } catch (error: any) {
      console.error('❌ Registration failed:', {
        email: userData.email,
        error: error.message || error,
        code: error.code,
        status: error.status
      });
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await this.api.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage regardless
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('user');
    }
  }

  async googleAuth(googleUser: {
    idToken: string;
    email: string;
    name: string;
  }): Promise<{ user: User; token: string }> {
    try {
      console.log('🔐 Google OAuth attempt');
      const response = await this.api.post('/api/auth/oauth/google', googleUser);
      const { user, token } = response.data.data;

      // Store token and user data
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));

      console.log('✅ Google OAuth successful');
      return { user, token };
    } catch (error: any) {
      console.error('❌ Google OAuth failed:', error);
      throw error;
    }
  }

  async appleAuth(appleUser: {
    identityToken: string;
    email: string;
    fullName?: string;
  }): Promise<{ user: User; token: string }> {
    try {
      console.log('🔐 Apple OAuth attempt');
      const response = await this.api.post('/api/auth/oauth/apple', appleUser);
      const { user, token } = response.data.data;

      // Store token and user data
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));

      console.log('✅ Apple OAuth successful');
      return { user, token };
    } catch (error: any) {
      console.error('❌ Apple OAuth failed:', error);
      throw error;
    }
  }

  // OTP Management
  async sendPhoneOTP(phone: string): Promise<ApiResponse<null>> {
    try {
      const response = await this.api.post('/api/auth/send-phone-otp', { phone });
      return response.data;
    } catch (error) {
      console.error('Send phone OTP failed:', error);
      throw error;
    }
  }

  async sendEmailOTP(email: string): Promise<ApiResponse<null>> {
    try {
      const response = await this.api.post('/api/auth/send-email-otp', { email });
      return response.data;
    } catch (error) {
      console.error('Send email OTP failed:', error);
      throw error;
    }
  }

  async verifyOTP(identifier: string, otp: string, type: 'phone' | 'email'): Promise<ApiResponse<null>> {
    try {
      const response = await this.api.post('/api/auth/verify-otp', {
        identifier,
        otp,
        type
      });
      return response.data;
    } catch (error) {
      console.error('Verify OTP failed:', error);
      throw error;
    }
  }

  // User management
  async getProfile(): Promise<User> {
    try {
      const response = await this.api.get('/api/users/profile');
      return response.data.data;
    } catch (error) {
      console.error('Get profile failed:', error);
      throw error;
    }
  }

  async updateProfile(userData: Partial<User>): Promise<User> {
    try {
      const response = await this.api.put('/api/users/profile', userData);
      return response.data.data;
    } catch (error) {
      console.error('Update profile failed:', error);
      throw error;
    }
  }

  async updatePreferences(preferences: any): Promise<any> {
    try {
      const response = await this.api.put('/api/users/preferences', { preferences });
      return response.data.data;
    } catch (error) {
      console.error('Update preferences failed:', error);
      throw error;
    }
  }

  // Task management
  async getTasks(): Promise<Task[]> {
    try {
      const response = await this.api.get('/api/tasks');
      return response.data.data;
    } catch (error) {
      console.error('Get tasks failed:', error);
      throw error;
    }
  }

  async createTask(taskData: Omit<Task, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    try {
      const response = await this.api.post('/api/tasks', taskData);
      return response.data.data;
    } catch (error) {
      console.error('Create task failed:', error);
      throw error;
    }
  }

  async updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
    try {
      const response = await this.api.put(`/api/tasks/${taskId}`, updates);
      return response.data.data;
    } catch (error) {
      console.error('Update task failed:', error);
      throw error;
    }
  }

  async deleteTask(taskId: string): Promise<void> {
    try {
      await this.api.delete(`/api/tasks/${taskId}`);
    } catch (error) {
      console.error('Delete task failed:', error);
      throw error;
    }
  }

  // Event management
  async getEvents(): Promise<Event[]> {
    try {
      const response = await this.api.get('/api/events');
      return response.data.data;
    } catch (error) {
      console.error('Get events failed:', error);
      throw error;
    }
  }

  async createEvent(eventData: Omit<Event, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Event> {
    try {
      const response = await this.api.post('/api/events', eventData);
      return response.data.data;
    } catch (error) {
      console.error('Create event failed:', error);
      throw error;
    }
  }

  async updateEvent(eventId: string, updates: Partial<Event>): Promise<Event> {
    try {
      const response = await this.api.put(`/api/events/${eventId}`, updates);
      return response.data.data;
    } catch (error) {
      console.error('Update event failed:', error);
      throw error;
    }
  }

  async deleteEvent(eventId: string): Promise<void> {
    try {
      await this.api.delete(`/api/events/${eventId}`);
    } catch (error) {
      console.error('Delete event failed:', error);
      throw error;
    }
  }

  // Conversation management
  async getConversations(): Promise<Conversation[]> {
    try {
      const response = await this.api.get('/api/conversations');
      return response.data.data;
    } catch (error) {
      console.error('Get conversations failed:', error);
      throw error;
    }
  }

  async getConversation(conversationId: string): Promise<Conversation> {
    try {
      const response = await this.api.get(`/api/conversations/${conversationId}`);
      return response.data.data;
    } catch (error) {
      console.error('Get conversation failed:', error);
      throw error;
    }
  }

  // Send message and get AI response
  async sendMessage(message: string, conversationId?: string): Promise<ApiResponse<{
    conversationId: string;
    messages: any[];
    aiResponse: string;
  }>> {
    try {
      const response = await this.api.post('/api/conversations/send-message', {
        message,
        conversationId
      });
      return response.data;
    } catch (error) {
      console.error('Send message failed:', error);
      throw error;
    }
  }

  // Transcribe audio and get AI response
  async transcribeAndRespond(audioUri: string, conversationId?: string): Promise<ApiResponse<{
    conversationId: string;
    messages: any[];
    aiResponse: string;
    transcript?: string;
  }>> {
    try {
      const formData = new FormData();
      formData.append('audio', {
        uri: audioUri,
        type: 'audio/wav',
        name: 'audio.wav'
      } as any);

      if (conversationId) {
        formData.append('conversationId', conversationId);
      }

      const response = await this.api.post('/api/conversations/transcribe', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Transcribe and respond failed:', error);
      throw error;
    }
  }

  // Voice processing
  async processVoiceInput(audioData: FormData): Promise<{
    transcription: string;
    confidence: number;
    intent?: any;
  }> {
    try {
      const response = await this.api.post('/api/voice/process', audioData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.data;
    } catch (error) {
      console.error('Voice processing failed:', error);
      throw error;
    }
  }

  // Enhanced Registration for onboarding flow
  async registerEnhanced(data: {
    userDetails: {
      fullName: string;
      preferredName: string;
      title?: string;
    };
    email: string;
    phone: string;
    assistantName: string;
    password?: string;
  }): Promise<{ user: User; token: string; passwordGenerated: boolean }> {
    try {
      const response = await this.api.post('/api/auth/register-enhanced', data);
      const { user, token, passwordGenerated } = response.data.data;

      // Store token and user data
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));

      return { user, token, passwordGenerated };
    } catch (error) {
      console.error('Enhanced registration failed:', error);
      throw error;
    }
  }

  // Personal Assistant Setup
  async setupAssistant(assistantName: string, assistantProfileImage?: string): Promise<ApiResponse<{
    assistantName: string;
    assistantProfileImage?: string;
  }>> {
    try {
      // Create FormData for multipart upload
      const formData = new FormData();
      formData.append('assistantName', assistantName);

      if (assistantProfileImage) {
        // Check if it's a URI (file) or base64 string
        if (assistantProfileImage.startsWith('file://') || assistantProfileImage.startsWith('content://')) {
          // Multipart upload for file URI
          formData.append('profileImage', {
            uri: assistantProfileImage,
            type: 'image/jpeg',
            name: 'profile.jpg'
          } as any);
        } else {
          // Fallback to base64 in body for data URIs
          formData.append('assistantProfileImage', assistantProfileImage);
        }
      }

      const response = await this.api.post('/api/assistant/setup', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Setup assistant failed:', error);
      throw error;
    }
  }

  async getAssistantSetup(): Promise<ApiResponse<{
    assistantName: string;
    assistantProfileImage?: string;
  }>> {
    try {
      const response = await this.api.get('/api/assistant/setup');
      return response.data;
    } catch (error) {
      console.error('Get assistant setup failed:', error);
      throw error;
    }
  }

  async updateAssistantVoice(assistantGender: string, assistantVoice: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.post('/api/users/assistant-voice', {
        assistantGender,
        assistantVoice
      });
      return response.data;
    } catch (error) {
      console.error('Update assistant voice failed:', error);
      throw error;
    }
  }

  // Utility methods
  getBaseURL(): string {
    return this.baseURL;
  }

  // Agent Configuration Management
  async getAgentConfiguration(): Promise<any> {
    try {
      const response = await this.api.get('/api/agent-config');
      return response.data.data;
    } catch (error) {
      console.error('Get agent configuration failed:', error);
      throw error;
    }
  }

  async updateAgentPersonality(
    traits: string[],
    communicationStyle?: string,
    responseStyle?: string
  ): Promise<any> {
    try {
      const response = await this.api.put('/api/agent-config/personality', {
        traits,
        communicationStyle,
        responseStyle,
      });
      return response.data.data;
    } catch (error) {
      console.error('Update agent personality failed:', error);
      throw error;
    }
  }

  async updateAgentAvailability(availability: {
    alwaysAvailable?: boolean;
    workingHours?: {
      enabled: boolean;
      startTime: string;
      endTime: string;
      timezone: string;
    };
    availableDays?: string[];
    quietHours?: {
      enabled: boolean;
      startTime: string;
      endTime: string;
    };
    urgentOnly?: boolean;
    preferredTimeSlots?: Array<{
      id: string;
      label: string;
      time: string;
      selected: boolean;
    }>;
  }): Promise<any> {
    try {
      const response = await this.api.put('/api/agent-config/availability', availability);
      return response.data.data;
    } catch (error) {
      console.error('Update agent availability failed:', error);
      throw error;
    }
  }

  async updateAgentTaskCategories(
    enabledCategories: string[],
    priorityOrder?: string[]
  ): Promise<any> {
    try {
      const response = await this.api.put('/api/agent-config/task-categories', {
        enabledCategories,
        priorityOrder: priorityOrder || enabledCategories,
      });
      return response.data.data;
    } catch (error) {
      console.error('Update agent task categories failed:', error);
      throw error;
    }
  }

  async updateAgentLearning(learning: {
    adaptToUserStyle?: boolean;
    learnFromInteractions?: boolean;
    suggestImprovements?: boolean;
    contextualLearning?: boolean;
  }): Promise<any> {
    try {
      const response = await this.api.put('/api/agent-config/learning', learning);
      return response.data.data;
    } catch (error) {
      console.error('Update agent learning preferences failed:', error);
      throw error;
    }
  }

  async updateAgentPrivacy(privacy: {
    dataRetentionDays?: number;
    shareAnalytics?: boolean;
    personalizeExperience?: boolean;
    crossDeviceSync?: boolean;
  }): Promise<any> {
    try {
      const response = await this.api.put('/api/agent-config/privacy', privacy);
      return response.data.data;
    } catch (error) {
      console.error('Update agent privacy settings failed:', error);
      throw error;
    }
  }


  async completeAgentSetup(): Promise<any> {
    try {
      const response = await this.api.post('/api/agent-config/complete-setup');
      return response.data.data;
    } catch (error) {
      console.error('Complete agent setup failed:', error);
      throw error;
    }
  }

  async getAgentConfigDefaults(): Promise<any> {
    try {
      const response = await this.api.get('/api/agent-config/defaults');
      return response.data.data;
    } catch (error) {
      console.error('Get agent config defaults failed:', error);
      throw error;
    }
  }

  async saveConversationData(conversationData: {
    messages: Array<{
      id: string;
      type: 'ai' | 'user';
      message: string;
      timestamp: Date;
    }>;
    conversationSummary?: string;
  }): Promise<any> {
    try {
      const response = await this.api.post('/api/agent-config/conversation', conversationData);
      return response.data.data;
    } catch (error) {
      console.error('Save conversation data failed:', error);
      throw error;
    }
  }

  async checkConnection(): Promise<boolean> {
    try {
      // First check network connectivity
      const isConnected = await this.checkNetworkConnectivity();
      if (!isConnected) {
        console.log('🔴 No network connection');
        return false;
      }

      // Then check if server is reachable
      await this.healthCheck();
      console.log('🟢 Server connection successful');
      return true;
    } catch (error: any) {
      console.log('🔴 Server connection failed:', {
        error: error.message,
        code: error.code,
        status: error.status
      });
      return false;
    }
  }

  // Enhanced connection diagnostics
  async getConnectionDiagnostics(): Promise<{
    networkConnected: boolean;
    serverReachable: boolean;
    apiBaseUrl: string;
    lastError?: any;
  }> {
    const networkConnected = await this.checkNetworkConnectivity();
    let serverReachable = false;
    let lastError;

    if (networkConnected) {
      try {
        await this.healthCheck();
        serverReachable = true;
      } catch (error) {
        lastError = error;
      }
    }

    return {
      networkConnected,
      serverReachable,
      apiBaseUrl: this.baseURL,
      lastError
    };
  }

  // Transcription service
  // AI Assistant Settings Management
  async getAIAssistantSettings(): Promise<any> {
    try {
      const response = await this.api.get('/api/agent-config/ai-assistant');
      return response.data.data;
    } catch (error) {
      console.error('Get AI Assistant settings failed:', error);
      throw error;
    }
  }

  async updateAIAssistantSettings(settings: {
    coreAI?: any;
    taskManagement?: any;
    research?: any;
    communication?: any;
    intelligenceLevels?: any;
  }): Promise<any> {
    try {
      const response = await this.api.put('/api/agent-config/ai-assistant', settings);
      return response.data.data;
    } catch (error) {
      console.error('Update AI Assistant settings failed:', error);
      throw error;
    }
  }

  async toggleAIAssistantSetting(category: string, setting: string, value: boolean): Promise<any> {
    try {
      const response = await this.api.put('/api/agent-config/ai-assistant/toggle', {
        category,
        setting,
        value
      });
      return response.data.data;
    } catch (error) {
      console.error('Toggle AI Assistant setting failed:', error);
      throw error;
    }
  }

  async transcribeAudio(audioUri: string): Promise<{
    text: string;
    confidence: number;
    service: string;
  } | null> {
    try {
      const formData = new FormData();
      formData.append('audio', {
        uri: audioUri,
        type: 'audio/m4a',
        name: 'recording.m4a',
      } as any);

      const response = await this.api.post('/transcription/whisper', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success && response.data.data) {
        return {
          text: response.data.data.text,
          confidence: response.data.data.confidence,
          service: response.data.data.service
        };
      }

      return null;
    } catch (error) {
      console.error('Transcription API error:', error);
      return null;
    }
  }

  // ========== INTEGRATION METHODS ==========

  async getIntegrationStatus(): Promise<any> {
    try {
      const response = await this.requestWithRetry(() =>
        this.api.get('/integrations/status')
      );
      return response.data.data;
    } catch (error) {
      console.error('Get integration status failed:', error);
      throw error;
    }
  }

  async connectGoogleCalendar(authCode: string, redirectUri?: string): Promise<any> {
    try {
      const response = await this.requestWithRetry(() =>
        this.api.post('/integrations/google-calendar/connect', {
          authCode,
          redirectUri
        })
      );
      return response.data;
    } catch (error) {
      console.error('Connect Google Calendar failed:', error);
      throw error;
    }
  }

  async disconnectGoogleCalendar(): Promise<any> {
    try {
      const response = await this.requestWithRetry(() =>
        this.api.post('/integrations/google-calendar/disconnect')
      );
      return response.data;
    } catch (error) {
      console.error('Disconnect Google Calendar failed:', error);
      throw error;
    }
  }

  async getGoogleCalendarEvents(startDate?: string, endDate?: string, maxResults?: number): Promise<any> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (maxResults) params.append('maxResults', maxResults.toString());

      const response = await this.requestWithRetry(() =>
        this.api.get(`/integrations/google-calendar/events?${params.toString()}`)
      );
      return response.data.data;
    } catch (error) {
      console.error('Get Google Calendar events failed:', error);
      throw error;
    }
  }

  async connectAppleCalendar(permissionData?: { hasPermission: boolean; calendarSource: string }): Promise<any> {
    try {
      const response = await this.requestWithRetry(() =>
        this.api.post('/integrations/apple-calendar/connect', permissionData || {})
      );
      return response.data;
    } catch (error) {
      console.error('Connect Apple Calendar failed:', error);
      throw error;
    }
  }

  async disconnectAppleCalendar(): Promise<any> {
    try {
      const response = await this.requestWithRetry(() =>
        this.api.post('/integrations/apple-calendar/disconnect')
      );
      return response.data;
    } catch (error) {
      console.error('Disconnect Apple Calendar failed:', error);
      throw error;
    }
  }

  // Voice conversation methods
  async saveVoiceConversation(data: {
    transcript: Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>;
    extractedData: any;
  }): Promise<any> {
    try {
      const response = await this.api.post('/api/conversations/voice-session', data);
      return response.data;
    } catch (error) {
      console.error('Save voice conversation failed:', error);
      throw error;
    }
  }

  async extractTasksFromConversation(conversationText: string): Promise<any> {
    try {
      const response = await this.api.post('/api/conversations/extract-tasks', {
        conversationText,
      });
      return response.data;
    } catch (error) {
      console.error('Extract tasks from conversation failed:', error);
      throw error;
    }
  }

  // Wake word settings
  async getWakeWordSettings(): Promise<any> {
    try {
      const response = await this.api.get('/api/users/wake-word');
      return response.data;
    } catch (error) {
      console.error('Get wake word settings failed:', error);
      throw error;
    }
  }

  async updateWakeWordSettings(settings: { wakeWord?: string; enabled?: boolean }): Promise<any> {
    try {
      const response = await this.api.put('/api/users/wake-word', settings);
      return response.data;
    } catch (error) {
      console.error('Update wake word settings failed:', error);
      throw error;
    }
  }

  // Reminder methods
  async createReminder(reminder: {
    message: string;
    time: string;
  }): Promise<any> {
    try {
      const response = await this.api.post('/api/reminders', reminder);
      return response.data;
    } catch (error) {
      console.error('Create reminder failed:', error);
      throw error;
    }
  }
}

export default new ApiService();