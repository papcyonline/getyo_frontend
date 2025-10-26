import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import secureStorage from './secureStorage';
import { ApiResponse, User, Task, Event, Conversation } from '../types';
import config from '../config/environment';
import NetInfo from '@react-native-community/netinfo';
import { fromByteArray } from 'base64-js';
import { store } from '../store';
import { clearUser } from '../store/slices/userSlice';

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

    // Request interceptor to add auth token and handle FormData
    this.api.interceptors.request.use(
      async (config) => {
        const token = await secureStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Remove Content-Type header for FormData to let axios set it with boundary
        if (config.data instanceof FormData) {
          delete config.headers['Content-Type'];
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

    // Handle 401 - Unauthorized (token expired/invalid) - do this first before logging
    if (error.response?.status === 401) {
      console.log('🔑 Session expired - logging out');
      await secureStorage.deleteItem('authToken');
      await AsyncStorage.removeItem('user');

      // Dispatch Redux action to clear user state and trigger navigation
      store.dispatch(clearUser());
      console.log('✅ User logged out - redirecting to login');

      return {
        message: 'Session expired. Please log in again.',
        code: 'AUTH_EXPIRED',
        status: 401,
        details: error.response?.data
      };
    }

    // Log detailed error information (only for non-401 errors)
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
  async login(email: string, password: string): Promise<{ user?: User; token?: string; requires2FA?: boolean; email?: string }> {
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

      // Check if 2FA is required
      if (response.data.data.requires2FA) {
        console.log('🔐 2FA required for:', email);
        return {
          requires2FA: true,
          email: response.data.data.email
        };
      }

      // Normal login - extract user and token
      const { user, token } = response.data.data;

      // Store token securely and user data
      await secureStorage.setItem('authToken', token);
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

      // Store token securely and user data
      await secureStorage.setItem('authToken', token);
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

  async authenticateWithApple(appleData: {
    identityToken: string;
    email?: string;
    fullName?: { firstName?: string; lastName?: string };
  }): Promise<{ user: User; token: string }> {
    try {
      const isConnected = await this.checkNetworkConnectivity();
      if (!isConnected) {
        throw {
          message: 'No internet connection. Please check your network.',
          code: 'NETWORK_ERROR',
          status: 0
        };
      }

      console.log('🍎 Attempting Apple authentication');

      const response = await this.api.post('/api/auth/oauth/apple', appleData);

      const { user, token } = response.data.data;

      await secureStorage.setItem('authToken', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));

      console.log('✅ Apple authentication successful');
      return { user, token };
    } catch (error: any) {
      console.error('❌ Apple authentication failed:', error);
      throw error;
    }
  }

  async authenticateWithGoogle(googleData: {
    accessToken: string;
    email: string;
    name: string;
    photo?: string;
  }): Promise<{ user: User; token: string }> {
    try {
      const isConnected = await this.checkNetworkConnectivity();
      if (!isConnected) {
        throw {
          message: 'No internet connection. Please check your network.',
          code: 'NETWORK_ERROR',
          status: 0
        };
      }

      console.log('🔵 Attempting Google authentication');

      const response = await this.api.post('/api/auth/oauth/google', googleData);

      const { user, token } = response.data.data;

      await secureStorage.setItem('authToken', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));

      console.log('✅ Google authentication successful');
      return { user, token };
    } catch (error: any) {
      console.error('❌ Google authentication failed:', error);
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
      await secureStorage.deleteItem('authToken');
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

      // Store token securely and user data
      await secureStorage.setItem('authToken', token);
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

      // Store token securely and user data
      await secureStorage.setItem('authToken', token);
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
      const response = await this.api.post('/api/auth/verify-reset-otp', {
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
    } catch (error: any) {
      // Don't log 401 errors - they're handled gracefully
      if (error.status !== 401) {
        console.error('Get profile failed:', error);
      }
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
  async getTasks(params?: {
    status?: string;
    priority?: string;
    category?: string;
    sortBy?: string;
    limit?: number;
  }): Promise<Task[]> {
    try {
      const response = await this.api.get('/api/tasks', { params });
      return response.data.data;
    } catch (error) {
      console.error('Get tasks failed:', error);
      throw error;
    }
  }

  async getTask(taskId: string): Promise<Task> {
    try {
      const response = await this.api.get(`/api/tasks/${taskId}`);
      return response.data.data;
    } catch (error) {
      console.error('Get task failed:', error);
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

  async searchTasks(query: string): Promise<Task[]> {
    try {
      const response = await this.api.get('/api/tasks/search', { params: { query } });
      return response.data.data;
    } catch (error) {
      console.error('Search tasks failed:', error);
      throw error;
    }
  }

  async getOverdueTasks(): Promise<Task[]> {
    try {
      const response = await this.api.get('/api/tasks/overdue');
      return response.data.data;
    } catch (error) {
      console.error('Get overdue tasks failed:', error);
      throw error;
    }
  }

  async getUpcomingTasks(days: number = 7): Promise<Task[]> {
    try {
      const response = await this.api.get('/api/tasks/upcoming', { params: { days } });
      return response.data.data;
    } catch (error) {
      console.error('Get upcoming tasks failed:', error);
      throw error;
    }
  }

  async getTaskStats(): Promise<any> {
    try {
      const response = await this.api.get('/api/tasks/stats');
      return response.data.data;
    } catch (error) {
      console.error('Get task stats failed:', error);
      throw error;
    }
  }

  async markTaskCompleted(taskId: string): Promise<Task> {
    try {
      const response = await this.api.patch(`/api/tasks/${taskId}/complete`);
      return response.data.data;
    } catch (error) {
      console.error('Mark task completed failed:', error);
      throw error;
    }
  }

  async addSubtask(taskId: string, text: string): Promise<Task> {
    try {
      const response = await this.api.post(`/api/tasks/${taskId}/subtasks`, { text });
      return response.data.data;
    } catch (error) {
      console.error('Add subtask failed:', error);
      throw error;
    }
  }

  async toggleSubtask(taskId: string, subtaskId: string): Promise<Task> {
    try {
      const response = await this.api.patch(`/api/tasks/${taskId}/subtasks/${subtaskId}/toggle`);
      return response.data.data;
    } catch (error) {
      console.error('Toggle subtask failed:', error);
      throw error;
    }
  }

  async bulkUpdateTasks(taskIds: string[], updates: Partial<Task>): Promise<{ matched: number; modified: number }> {
    try {
      const response = await this.api.patch('/api/tasks/bulk', { taskIds, updates });
      return response.data.data;
    } catch (error) {
      console.error('Bulk update tasks failed:', error);
      throw error;
    }
  }

  /**
   * Extract structured task data from voice transcript using AI
   * Understands natural language, relative dates, priorities, people, locations, etc.
   */
  async extractTaskFromVoice(transcript: string, recordedAt?: Date): Promise<{
    title: string;
    description?: string;
    dueDate?: Date;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    category?: string;
    tags?: string[];
    people?: string[];
    location?: string;
  }> {
    try {
      console.log('🤖 Extracting task data from transcript using AI...');
      const response = await this.api.post('/api/tasks/extract-from-voice', {
        transcript,
        recordedAt: recordedAt?.toISOString() || new Date().toISOString()
      });

      if (response.data.success && response.data.data) {
        console.log('✅ AI extraction successful:', response.data.data);
        return response.data.data;
      }

      throw new Error('AI extraction failed');
    } catch (error) {
      console.error('Extract task from voice failed:', error);
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
    preferences?: {
      language?: string;
    };
  }): Promise<{ user: User; token: string; passwordGenerated: boolean }> {
    try {
      const response = await this.api.post('/api/auth/register-enhanced', data);
      const { user, token, passwordGenerated } = response.data.data;

      // Store token securely and user data
      await secureStorage.setItem('authToken', token);
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

  async updateUserProfile(profileData: {
    fullName?: string;
    preferredName?: string;
    title?: string;
  }): Promise<User> {
    try {
      const response = await this.api.put('/api/users/profile', profileData);
      return response.data.data.user;
    } catch (error) {
      console.error('Update user profile failed:', error);
      throw error;
    }
  }

  // Upload user profile image
  async uploadUserProfileImage(imageUri: string): Promise<{ imageUrl: string }> {
    try {
      const formData = new FormData();
      formData.append('profileImage', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'profile.jpg'
      } as any);

      const response = await this.api.post('/api/users/profile/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data.data;
    } catch (error) {
      console.error('Upload user profile image failed:', error);
      throw error;
    }
  }

  // Update assistant profile image (after onboarding)
  async updateAssistantProfileImage(imageUri: string): Promise<ApiResponse<{
    assistantProfileImage: string;
  }>> {
    try {
      const formData = new FormData();
      formData.append('profileImage', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'assistant.jpg'
      } as any);

      const response = await this.api.put('/api/assistant/profile-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Update assistant profile image failed:', error);
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

  // Voice Synthesis using OpenAI TTS
  async synthesizeSpeech(text: string, voice: string): Promise<string> {
    try {
      const token = await secureStorage.getItem('authToken');

      // Fetch audio from OpenAI TTS API
      const response = await fetch(`${this.baseURL}/api/voice/synthesize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ text, voice }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Get audio data as ArrayBuffer
      const arrayBuffer = await response.arrayBuffer();

      // Convert to base64
      const base64Audio = await this.arrayBufferToBase64(arrayBuffer);

      // Return data URI instead of file path (avoids deprecated file API)
      const dataUri = `data:audio/mp3;base64,${base64Audio}`;
      console.log('✅ Audio converted to data URI');
      return dataUri;
    } catch (error) {
      console.error('Speech synthesis failed:', error);
      throw error;
    }
  }

  // Helper to convert ArrayBuffer to Base64
  private async arrayBufferToBase64(buffer: ArrayBuffer): Promise<string> {
    const bytes = new Uint8Array(buffer);
    return fromByteArray(bytes);
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
    } catch (error: any) {
      // Don't log 401 errors - they're handled gracefully
      if (error.status !== 401) {
        console.error('Get AI Assistant settings failed:', error);
      }
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

  async updateIntelligenceLevel(levelType: 'creativity' | 'formality' | 'proactivity', value: number): Promise<any> {
    try {
      const response = await this.api.put('/api/agent-config/intelligence-level', {
        levelType,
        value
      });
      return response.data.data;
    } catch (error) {
      console.error('Update intelligence level failed:', error);
      throw error;
    }
  }

  async transcribeAudio(audioUri: string): Promise<{
    text: string;
    confidence: number;
    service: string;
  } | null> {
    try {
      console.log('🎤 Transcribing audio:', audioUri);

      // First, check if the endpoint is reachable
      try {
        console.log('🔍 Testing transcription endpoint health...');
        const healthResponse = await this.api.get('/api/transcription/health');
        console.log('✅ Transcription endpoint is reachable:', healthResponse.data);
      } catch (healthError: any) {
        console.error('❌ Transcription endpoint unreachable:', healthError.message);
      }

      const formData = new FormData();

      // React Native FormData requires specific format
      const file = {
        uri: audioUri,
        type: 'audio/m4a',
        name: 'recording.m4a',
      };

      console.log('📦 File object:', file);
      formData.append('audio', file as any);

      console.log('📤 Sending transcription request...');
      console.log('FormData created:', formData);

      // Use fetch instead of axios for file uploads in React Native
      const token = await secureStorage.getItem('authToken');

      const fetchResponse = await fetch(`${this.baseURL}/api/transcription/whisper`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type - let fetch handle it
        },
        body: formData,
      });

      console.log('📥 Response status:', fetchResponse.status);
      const responseText = await fetchResponse.text();
      console.log('📥 Response text:', responseText);

      const responseData = JSON.parse(responseText);
      console.log('✅ Transcription response:', responseData);

      if (responseData.success && responseData.data) {
        return {
          text: responseData.data.text,
          confidence: responseData.data.confidence,
          service: responseData.data.service
        };
      }

      return null;
    } catch (error: any) {
      console.error('❌ Transcription API error:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        data: error.response?.data,
        stack: error.stack,
      });
      return null;
    }
  }

  /**
   * Generate a smart title from transcript using AI
   */
  async generateTitle(transcript: string): Promise<string | null> {
    try {
      console.log('🤖 Generating smart title from transcript...');

      const response = await this.api.post('/api/transcription/generate-title', {
        transcript
      });

      if (response.data.success && response.data.data) {
        console.log('✅ Title generated:', response.data.data.title);
        return response.data.data.title;
      }

      return null;
    } catch (error: any) {
      console.error('❌ Title generation error:', error);
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

  async getReminders(params?: { status?: string; isUrgent?: boolean }): Promise<any> {
    try {
      const response = await this.api.get('/api/reminders', { params });
      return response.data.data;
    } catch (error) {
      console.error('Get reminders failed:', error);
      throw error;
    }
  }

  async getUpcomingReminders(hours: number = 24): Promise<any> {
    try {
      const response = await this.api.get('/api/reminders/upcoming', {
        params: { hours }
      });
      return response.data.data;
    } catch (error) {
      console.error('Get upcoming reminders failed:', error);
      throw error;
    }
  }

  async getOverdueReminders(): Promise<any> {
    try {
      const response = await this.api.get('/api/reminders/overdue');
      return response.data.data;
    } catch (error) {
      console.error('Get overdue reminders failed:', error);
      throw error;
    }
  }

  async updateReminder(id: string, updates: any): Promise<any> {
    try {
      const response = await this.api.put(`/api/reminders/${id}`, updates);
      return response.data.data;
    } catch (error) {
      console.error('Update reminder failed:', error);
      throw error;
    }
  }

  async deleteReminder(id: string): Promise<any> {
    try {
      const response = await this.api.delete(`/api/reminders/${id}`);
      return response.data;
    } catch (error) {
      console.error('Delete reminder failed:', error);
      throw error;
    }
  }

  async snoozeReminder(id: string, minutes: number = 10): Promise<any> {
    try {
      const response = await this.api.post(`/api/reminders/${id}/snooze`, { minutes });
      return response.data.data;
    } catch (error) {
      console.error('Snooze reminder failed:', error);
      throw error;
    }
  }

  async toggleReminderStatus(id: string, status: 'active' | 'completed' | 'cancelled'): Promise<any> {
    try {
      const response = await this.api.post(`/api/reminders/${id}/toggle-status`, { status });
      return response.data.data;
    } catch (error) {
      console.error('Toggle reminder status failed:', error);
      throw error;
    }
  }

  /**
   * Extract structured reminder data from voice transcript using AI
   * Understands natural language, relative dates, urgency, repeat patterns, etc.
   */
  async extractReminderFromVoice(transcript: string, recordedAt?: Date): Promise<{
    title: string;
    notes?: string;
    reminderTime: string;
    isUrgent: boolean;
    repeatType: 'none' | 'daily' | 'weekly' | 'monthly';
    location?: string;
  }> {
    try {
      console.log('🤖 Extracting reminder data from transcript using AI...');
      const response = await this.api.post('/api/reminders/extract-from-voice', {
        transcript,
        recordedAt: recordedAt?.toISOString() || new Date().toISOString()
      });

      if (response.data.success && response.data.data) {
        console.log('✅ AI extraction successful:', response.data.data);
        return response.data.data;
      }

      throw new Error('AI extraction failed');
    } catch (error) {
      console.error('Extract reminder from voice failed:', error);
      throw error;
    }
  }

  // AI methods
  async getDailyBriefing(): Promise<any> {
    try {
      const response = await this.api.get('/api/ai/daily-briefing');
      return response.data.data;
    } catch (error) {
      console.error('Get daily briefing failed:', error);
      throw error;
    }
  }

  async getAISuggestions(): Promise<any> {
    try {
      const response = await this.api.get('/api/ai/suggestions');
      return response.data.data;
    } catch (error) {
      console.error('Get AI suggestions failed:', error);
      throw error;
    }
  }

  // Notification methods
  async getNotifications(params?: { read?: boolean; type?: string; priority?: string; limit?: number }): Promise<any> {
    try {
      const response = await this.api.get('/api/notifications', { params });
      return response.data.data;
    } catch (error) {
      console.error('Get notifications failed:', error);
      throw error;
    }
  }

  async getNotificationCount(): Promise<number> {
    try {
      const response = await this.api.get('/api/notifications/count');
      return response.data.count;
    } catch (error) {
      console.error('Get notification count failed:', error);
      return 0; // Return 0 on error instead of throwing
    }
  }

  async getRecentNotifications(limit: number = 10): Promise<any> {
    try {
      const response = await this.api.get('/api/notifications/recent', {
        params: { limit }
      });
      return response.data.data;
    } catch (error) {
      console.error('Get recent notifications failed:', error);
      throw error;
    }
  }

  async createNotification(notification: {
    type: string;
    title: string;
    message: string;
    priority?: string;
    relatedId?: string;
    relatedModel?: string;
    actionUrl?: string;
    metadata?: Record<string, any>;
  }): Promise<any> {
    try {
      const response = await this.api.post('/api/notifications', notification);
      return response.data.data;
    } catch (error) {
      console.error('Create notification failed:', error);
      throw error;
    }
  }

  async markNotificationAsRead(id: string): Promise<any> {
    try {
      const response = await this.api.post(`/api/notifications/${id}/read`);
      return response.data.data;
    } catch (error) {
      console.error('Mark notification as read failed:', error);
      throw error;
    }
  }

  async markAllNotificationsAsRead(): Promise<any> {
    try {
      const response = await this.api.post('/api/notifications/read-all');
      return response.data;
    } catch (error) {
      console.error('Mark all notifications as read failed:', error);
      throw error;
    }
  }

  async deleteNotification(id: string): Promise<any> {
    try {
      const response = await this.api.delete(`/api/notifications/${id}`);
      return response.data;
    } catch (error) {
      console.error('Delete notification failed:', error);
      throw error;
    }
  }

  async clearAllNotifications(): Promise<any> {
    try {
      const response = await this.api.delete('/api/notifications/read/clear');
      return response.data;
    } catch (error) {
      console.error('Clear all notifications failed:', error);
      throw error;
    }
  }

  // ===========================
  // Voice Command Processing
  // ===========================

  async processVoiceCommand(audioData: string, audioFormat: string = 'wav'): Promise<{
    transcription: string;
    action: string;
    entity?: any;
    confidence: number;
    message: string;
  }> {
    try {
      const response = await this.api.post('/api/voice/process-command', {
        audioData,
        audioFormat,
      });
      return response.data.data;
    } catch (error) {
      console.error('Process voice command failed:', error);
      throw error;
    }
  }

  // ===========================
  // Privacy & Security Settings
  // ===========================

  async getPrivacySettings(): Promise<any> {
    try {
      const response = await this.api.get('/api/users/privacy-settings');
      return response.data.data;
    } catch (error) {
      console.error('Get privacy settings failed:', error);
      throw error;
    }
  }

  async updatePrivacySettings(settings: {
    biometricLock?: boolean;
    dataEncryption?: boolean;
    analyticsSharing?: boolean;
    crashReporting?: boolean;
    locationAccess?: boolean;
  }): Promise<any> {
    try {
      const response = await this.api.put('/api/users/privacy-settings', settings);
      return response.data.data;
    } catch (error) {
      console.error('Update privacy settings failed:', error);
      throw error;
    }
  }

  // ===========================
  // Password Management
  // ===========================

  async changePassword(currentPassword: string, newPassword: string): Promise<any> {
    try {
      const response = await this.api.post('/api/auth/change-password', {
        currentPassword,
        newPassword,
      });
      return response.data;
    } catch (error) {
      console.error('Change password failed:', error);
      throw error;
    }
  }

  // ===========================
  // Two-Factor Authentication
  // ===========================

  async get2FAStatus(): Promise<{ enabled: boolean; method: string; verifiedAt?: Date }> {
    try {
      const response = await this.api.get('/api/auth/2fa/status');
      return response.data.data;
    } catch (error) {
      console.error('Get 2FA status failed:', error);
      throw error;
    }
  }

  async setup2FA(method?: 'email' | 'sms'): Promise<{ message: string; method?: string; otp?: string }> {
    try {
      const response = await this.api.post('/api/auth/2fa/setup', { method });
      return response.data;
    } catch (error) {
      console.error('Setup 2FA failed:', error);
      throw error;
    }
  }

  async sendPhoneVerificationOTP(phone: string): Promise<{ message: string; otp?: string }> {
    try {
      const response = await this.api.post('/api/auth/verify-phone/send', { phone });
      return response.data;
    } catch (error) {
      console.error('Send phone verification OTP failed:', error);
      throw error;
    }
  }

  async verifyPhoneOTP(phone: string, code: string): Promise<{ message: string; phone: string; phoneVerified: boolean }> {
    try {
      const response = await this.api.post('/api/auth/verify-phone/verify', { phone, code });
      return response.data;
    } catch (error) {
      console.error('Verify phone OTP failed:', error);
      throw error;
    }
  }

  async verify2FA(code: string): Promise<{ message: string }> {
    try {
      const response = await this.api.post('/api/auth/2fa/verify', { code });
      return response.data;
    } catch (error) {
      console.error('Verify 2FA failed:', error);
      throw error;
    }
  }

  async disable2FA(password: string): Promise<{ message: string }> {
    try {
      const response = await this.api.post('/api/auth/2fa/disable', { password });
      return response.data;
    } catch (error) {
      console.error('Disable 2FA failed:', error);
      throw error;
    }
  }

  async verifyLogin2FA(email: string, code: string): Promise<{ user: User; token: string }> {
    try {
      const response = await this.api.post('/api/auth/login-2fa-verify', { email, code });

      const { user, token } = response.data.data;

      // Store token securely and user data
      await secureStorage.setItem('authToken', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));

      console.log('✅ 2FA login verification successful');
      return { user, token };
    } catch (error: any) {
      console.error('Verify login 2FA failed:', error);
      throw error;
    }
  }

  // ================================
  // Session Management APIs
  // ================================

  /**
   * Get all active sessions for current user
   */
  async getActiveSessions(): Promise<any[]> {
    try {
      console.log('📡 Fetching active sessions...');
      const response = await this.api.get('/api/auth/sessions');
      console.log('✅ Active sessions fetched:', response.data.count);
      return response.data.data || [];
    } catch (error: any) {
      console.error('Get active sessions failed:', error);
      throw error;
    }
  }

  /**
   * Terminate a specific session
   */
  async terminateSession(sessionId: string): Promise<void> {
    try {
      console.log('🔌 Terminating session:', sessionId);
      await this.api.delete(`/api/auth/sessions/${sessionId}`);
      console.log('✅ Session terminated successfully');
    } catch (error: any) {
      console.error('Terminate session failed:', error);
      throw error;
    }
  }

  /**
   * Terminate all other sessions (keep current)
   */
  async terminateAllOtherSessions(): Promise<{ terminatedCount: number }> {
    try {
      console.log('🔌 Terminating all other sessions...');
      const response = await this.api.delete('/api/auth/sessions/others');
      console.log('✅ All other sessions terminated:', response.data.data.terminatedCount);
      return response.data.data;
    } catch (error: any) {
      console.error('Terminate all other sessions failed:', error);
      throw error;
    }
  }

  /**
   * Get session statistics
   */
  async getSessionStats(): Promise<any> {
    try {
      console.log('📊 Fetching session statistics...');
      const response = await this.api.get('/api/auth/sessions/stats');
      console.log('✅ Session stats fetched');
      return response.data.data;
    } catch (error: any) {
      console.error('Get session stats failed:', error);
      throw error;
    }
  }

  /**
   * Extend current session expiry
   */
  async extendSession(hours: number = 24): Promise<{ expiresAt: string }> {
    try {
      console.log(`⏰ Extending session by ${hours} hours...`);
      const response = await this.api.post('/api/auth/sessions/extend', { hours });
      console.log('✅ Session extended successfully');
      return response.data.data;
    } catch (error: any) {
      console.error('Extend session failed:', error);
      throw error;
    }
  }

  // ================================
  // Data Management APIs
  // ================================

  /**
   * Export all user data (JSON or ZIP format)
   */
  async exportUserData(format: 'json' | 'zip' = 'json'): Promise<any> {
    try {
      console.log(`📦 Exporting user data in ${format} format...`);
      const response = await this.api.post('/api/data-management/export', { format }, {
        responseType: format === 'zip' ? 'blob' : 'json',
      });
      console.log('✅ User data exported successfully');
      return response.data;
    } catch (error: any) {
      console.error('Export user data failed:', error);
      throw error;
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<any> {
    try {
      console.log('📊 Fetching cache statistics...');
      const response = await this.api.get('/api/data-management/cache/stats');
      console.log('✅ Cache stats fetched');
      return response.data.data;
    } catch (error: any) {
      console.error('Get cache stats failed:', error);
      throw error;
    }
  }

  /**
   * Clear app cache (sessions and temporary data)
   */
  async clearCache(): Promise<{ sessionsCleared: number }> {
    try {
      console.log('🧹 Clearing app cache...');
      const response = await this.api.post('/api/data-management/cache/clear');
      console.log('✅ Cache cleared successfully');
      return response.data.data;
    } catch (error: any) {
      console.error('Clear cache failed:', error);
      throw error;
    }
  }

  /**
   * Delete user account and all associated data
   */
  async deleteAccount(password: string, confirmDelete: string): Promise<void> {
    try {
      console.log('🗑️ Deleting user account...');
      await this.api.delete('/api/data-management/account', {
        data: { password, confirmDelete }
      });
      console.log('✅ Account deleted successfully');

      // Clear local storage after account deletion
      await secureStorage.deleteItem('authToken');
      await AsyncStorage.removeItem('user');
    } catch (error: any) {
      console.error('Delete account failed:', error);
      throw error;
    }
  }

  // ================================
  // Search & Research APIs
  // ================================

  /**
   * Search across all user data (tasks, events, notes, conversations, transcripts)
   */
  async search(query: string, filter: string = 'all'): Promise<{
    results: any[];
    totalResults: number;
    query: string;
    filter: string;
  }> {
    try {
      console.log(`🔍 Searching for: "${query}" with filter: ${filter}`);
      const response = await this.api.post('/api/search', { query, filter });
      console.log(`✅ Search completed: ${response.data.data.totalResults} results found`);
      return response.data.data;
    } catch (error: any) {
      console.error('Search failed:', error);
      throw error;
    }
  }

  /**
   * Get AI-generated summary for search results
   */
  async getAiSummary(query: string, results: any[]): Promise<{
    summary: string;
    suggestions: string[];
  }> {
    try {
      console.log(`🤖 Generating AI summary for: "${query}"`);
      const response = await this.api.post('/api/search/ai-summary', { query, results });
      console.log('✅ AI summary generated');
      return response.data.data;
    } catch (error: any) {
      console.error('Get AI summary failed:', error);
      throw error;
    }
  }

  /**
   * Get recent searches
   */
  async getRecentSearches(): Promise<string[]> {
    try {
      console.log('📜 Fetching recent searches...');
      const response = await this.api.get('/api/search/recent');
      console.log(`✅ Recent searches fetched: ${response.data.data.searches.length} searches`);
      return response.data.data.searches;
    } catch (error: any) {
      console.error('Get recent searches failed:', error);
      throw error;
    }
  }

  /**
   * Get AI-powered search suggestions
   */
  async getSuggestions(): Promise<string[]> {
    try {
      console.log('💡 Fetching search suggestions...');
      const response = await this.api.get('/api/search/suggestions');
      console.log(`✅ Suggestions fetched: ${response.data.data.suggestions.length} suggestions`);
      return response.data.data.suggestions;
    } catch (error: any) {
      console.error('Get suggestions failed:', error);
      throw error;
    }
  }

  /**
   * Clear recent searches
   */
  async clearRecentSearches(): Promise<void> {
    try {
      console.log('🧹 Clearing recent searches...');
      await this.api.delete('/api/search/recent');
      console.log('✅ Recent searches cleared');
    } catch (error: any) {
      console.error('Clear recent searches failed:', error);
      throw error;
    }
  }

  // ================================
  // Google OAuth APIs
  // ================================

  async getGoogleOAuthStatus(): Promise<any> {
    try {
      const response = await this.api.get('/api/oauth/google/status');
      return response.data.data;
    } catch (error) {
      console.error('Get Google OAuth status failed:', error);
      return { connected: false };
    }
  }

  async disconnectGoogleOAuth(): Promise<void> {
    try {
      await this.api.post('/api/oauth/google/disconnect');
      console.log('✅ Google OAuth disconnected');
    } catch (error) {
      console.error('Disconnect Google OAuth failed:', error);
      throw error;
    }
  }

  async refreshGoogleToken(): Promise<void> {
    try {
      await this.api.post('/api/oauth/google/refresh');
      console.log('✅ Google token refreshed');
    } catch (error) {
      console.error('Refresh Google token failed:', error);
      throw error;
    }
  }

  // ================================
  // Voice Notes/Recordings APIs
  // ================================

  /**
   * Save a voice note/recording with transcription
   */
  async saveVoiceNote(noteData: {
    title: string;
    transcript: string;
    audioUri?: string;
    duration: number;
    tags?: string[];
    location?: string;
  }): Promise<any> {
    try {
      console.log('💾 Saving voice note:', noteData.title);

      const formData = new FormData();
      formData.append('title', noteData.title);
      formData.append('transcript', noteData.transcript);
      formData.append('duration', noteData.duration.toString());

      if (noteData.tags && noteData.tags.length > 0) {
        formData.append('tags', JSON.stringify(noteData.tags));
      }

      if (noteData.location) {
        formData.append('location', noteData.location);
      }

      // Attach audio file if available
      if (noteData.audioUri) {
        const audioFile = {
          uri: noteData.audioUri,
          type: 'audio/m4a',
          name: 'recording.m4a',
        };
        console.log('📦 Audio file:', audioFile);
        formData.append('audio', audioFile as any);
      }

      console.log('📤 Sending voice note save request...');

      // Use fetch instead of axios for file uploads in React Native
      const token = await secureStorage.getItem('authToken');

      const fetchResponse = await fetch(`${this.baseURL}/api/notes/voice`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type - let fetch handle it
        },
        body: formData,
      });

      console.log('📥 Response status:', fetchResponse.status);
      const responseText = await fetchResponse.text();
      console.log('📥 Response text:', responseText);

      const responseData = JSON.parse(responseText);
      console.log('✅ Voice note saved successfully:', responseData);

      return responseData.data;
    } catch (error: any) {
      console.error('❌ Save voice note failed:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get all voice notes/recordings for the user
   */
  async getVoiceNotes(limit?: number): Promise<any[]> {
    try {
      console.log('📡 Fetching voice notes...');
      const params = limit ? { limit } : {};
      const response = await this.api.get('/api/notes/voice', { params });
      console.log(`✅ Voice notes fetched: ${response.data.data?.length || 0} notes`);
      return response.data.data || [];
    } catch (error: any) {
      console.error('Get voice notes failed:', error);
      throw error;
    }
  }

  /**
   * Get a specific voice note by ID
   */
  async getVoiceNote(noteId: string): Promise<any> {
    try {
      console.log('📡 Fetching voice note:', noteId);
      const response = await this.api.get(`/api/notes/voice/${noteId}`);
      console.log('✅ Voice note fetched');
      return response.data.data;
    } catch (error: any) {
      console.error('Get voice note failed:', error);
      throw error;
    }
  }

  /**
   * Update a voice note
   */
  async updateVoiceNote(noteId: string, updates: {
    title?: string;
    transcript?: string;
    tags?: string[];
  }): Promise<any> {
    try {
      console.log('📝 Updating voice note:', noteId);
      const response = await this.api.put(`/api/notes/voice/${noteId}`, updates);
      console.log('✅ Voice note updated');
      return response.data.data;
    } catch (error: any) {
      console.error('Update voice note failed:', error);
      throw error;
    }
  }

  /**
   * Delete a voice note
   */
  async deleteVoiceNote(noteId: string): Promise<void> {
    try {
      console.log('🗑️ Deleting voice note:', noteId);
      await this.api.delete(`/api/notes/voice/${noteId}`);
      console.log('✅ Voice note deleted');
    } catch (error: any) {
      console.error('Delete voice note failed:', error);
      throw error;
    }
  }
}

export default new ApiService();