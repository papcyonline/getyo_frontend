import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from './api';
import SocketService from './socket';
import secureStorage from './secureStorage';
import { User } from '../types';
import { store } from '../store';
import { setUser, clearUser, setUserLoading, setUserError } from '../store/slices/userSlice';

class AuthService {
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Check saved data from SecureStore (auth token) and AsyncStorage (user data)
      const savedToken = await secureStorage.getItem('authToken');
      const savedUser = await AsyncStorage.getItem('user');

      if (savedUser && savedToken) {
        const user = JSON.parse(savedUser) as User;
        store.dispatch(setUser(user));

        // Try to connect to socket with better error handling
        try {
          console.log('🔌 Attempting socket connection during auth initialization...');
          await SocketService.connect();
          console.log('✅ Socket connected successfully during initialization');
        } catch (error) {
          console.warn('⚠️ Failed to connect to socket during initialization:', error);
          // Don't throw here - user might be offline or server might be down
          // The app should still work without real-time features
        }
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize auth service:', error);
      // Clear potentially corrupted data
      await this.clearAuthData();
    }
  }

  async login(email: string, password: string): Promise<User> {
    try {
      store.dispatch(setUserLoading(true));
      store.dispatch(setUserError(null));

      // Login via backend API
      const { user, token } = await ApiService.login(email, password);

      // Store session token securely
      await secureStorage.setItem('authToken', token);

      // Store user data
      await AsyncStorage.setItem('user', JSON.stringify(user));

      // Update Redux store
      store.dispatch(setUser(user));

      // Connect to socket with retry logic
      try {
        console.log('🔌 Connecting to socket after successful login...');
        await SocketService.connect();
        console.log('✅ Socket connected successfully after login');
      } catch (socketError) {
        console.warn('⚠️ Failed to connect to socket after login:', socketError);
        // Don't fail login if socket connection fails - user can still use the app
        // Socket will retry connection automatically
      }

      return user;
    } catch (error: any) {
      console.error('Login failed:', error);
      const errorMessage = error.message || 'Login failed';
      store.dispatch(setUserError(errorMessage));
      throw error;
    } finally {
      store.dispatch(setUserLoading(false));
    }
  }

  async register(userData: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }): Promise<User> {
    try {
      store.dispatch(setUserLoading(true));
      store.dispatch(setUserError(null));

      // Register via backend API
      const { user, token } = await ApiService.register(userData);

      // Store session token securely
      await secureStorage.setItem('authToken', token);

      // Store user data
      await AsyncStorage.setItem('user', JSON.stringify(user));

      // Update Redux store
      store.dispatch(setUser(user));

      // Connect to socket with retry logic
      try {
        console.log('🔌 Connecting to socket after successful registration...');
        await SocketService.connect();
        console.log('✅ Socket connected successfully after registration');
      } catch (socketError) {
        console.warn('⚠️ Failed to connect to socket after registration:', socketError);
        // Don't fail registration if socket connection fails - user can still use the app
        // Socket will retry connection automatically
      }

      return user;
    } catch (error: any) {
      console.error('Registration failed:', error);
      const errorMessage = error.message || 'Registration failed';
      store.dispatch(setUserError(errorMessage));
      throw error;
    } finally {
      store.dispatch(setUserLoading(false));
    }
  }

  async logout(): Promise<void> {
    try {
      store.dispatch(setUserLoading(true));

      // Disconnect socket first
      await SocketService.disconnect();

      // No server-side logout needed for JWT tokens

      // Clear Redux store
      store.dispatch(clearUser());

      // Clear local storage
      await this.clearAuthData();
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout call fails, we should clear local data
      store.dispatch(clearUser());
      await this.clearAuthData();
    } finally {
      store.dispatch(setUserLoading(false));
    }
  }

  async refreshProfile(): Promise<User | null> {
    try {
      const user = await ApiService.getProfile();

      // Update stored user data
      await AsyncStorage.setItem('user', JSON.stringify(user));
      store.dispatch(setUser(user));

      return user;
    } catch (error) {
      console.error('Failed to refresh profile:', error);

      // If profile refresh fails due to auth error, logout
      if (error.response?.status === 401) {
        await this.logout();
      }

      return null;
    }
  }

  async updateProfile(updates: Partial<User>): Promise<User> {
    try {
      store.dispatch(setUserLoading(true));

      const updatedUser = await ApiService.updateProfile(updates);

      // Update stored user data
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      store.dispatch(setUser(updatedUser));

      return updatedUser;
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Profile update failed';
      store.dispatch(setUserError(errorMessage));
      throw error;
    } finally {
      store.dispatch(setUserLoading(false));
    }
  }

  async updatePreferences(preferences: any): Promise<any> {
    try {
      store.dispatch(setUserLoading(true));

      const updatedPreferences = await ApiService.updatePreferences(preferences);

      // Refresh user profile to get the updated preferences
      await this.refreshProfile();

      return updatedPreferences;
    } catch (error: any) {
      console.error('Failed to update preferences:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Preferences update failed';
      store.dispatch(setUserError(errorMessage));
      throw error;
    } finally {
      store.dispatch(setUserLoading(false));
    }
  }

  async checkConnectionStatus(): Promise<{
    apiConnected: boolean;
    socketConnected: boolean;
  }> {
    const apiConnected = await ApiService.checkConnection();
    const socketConnected = SocketService.isConnected();

    return { apiConnected, socketConnected };
  }

  async reconnectServices(): Promise<void> {
    try {
      // Check if we have valid auth data
      const token = await secureStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Try to reconnect socket if not connected
      if (!SocketService.isConnected()) {
        await SocketService.connect();
      }

      // Refresh user profile to ensure data is current
      await this.refreshProfile();
    } catch (error) {
      console.error('Failed to reconnect services:', error);
      throw error;
    }
  }

  async requestPasswordReset(email: string): Promise<void> {
    try {
      const response = await fetch(`${ApiService.getBaseURL()}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.toLowerCase() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reset code');
      }
    } catch (error: any) {
      console.error('Request password reset failed:', error);
      throw error;
    }
  }

  async verifyResetCode(email: string, code: string): Promise<boolean> {
    try {
      const response = await fetch(`${ApiService.getBaseURL()}/api/auth/verify-reset-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.toLowerCase(),
          code,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid code');
      }

      return true;
    } catch (error: any) {
      console.error('Verify reset code failed:', error);
      return false;
    }
  }

  async resetPassword(email: string, otp: string, newPassword: string): Promise<void> {
    try {
      const response = await fetch(`${ApiService.getBaseURL()}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.toLowerCase(),
          otp,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }
    } catch (error: any) {
      console.error('Reset password failed:', error);
      throw error;
    }
  }

  async loginWithGoogle(): Promise<User> {
    try {
      store.dispatch(setUserLoading(true));
      store.dispatch(setUserError(null));

      // TODO: Implement Google OAuth with backend API
      throw new Error('Google OAuth login not implemented yet');
    } catch (error: any) {
      console.error('Google login failed:', error);
      const errorMessage = error.message || 'Google login failed';
      store.dispatch(setUserError(errorMessage));
      throw error;
    } finally {
      store.dispatch(setUserLoading(false));
    }
  }

  async authenticateWithApple(appleData: {
    identityToken: string;
    email?: string;
    fullName?: { firstName?: string; lastName?: string };
  }): Promise<{ user: User; token: string }> {
    try {
      store.dispatch(setUserLoading(true));
      store.dispatch(setUserError(null));

      // Send Apple auth data to backend
      const { user, token } = await ApiService.authenticateWithApple(appleData);

      // Store session token securely
      await secureStorage.setItem('authToken', token);

      // Store user data
      await AsyncStorage.setItem('user', JSON.stringify(user));

      // Update Redux store
      store.dispatch(setUser(user));

      // Connect to socket
      try {
        console.log('🔌 Connecting to socket after Apple sign-in...');
        await SocketService.connect();
        console.log('✅ Socket connected successfully after Apple sign-in');
      } catch (socketError) {
        console.warn('⚠️ Failed to connect to socket after Apple sign-in:', socketError);
      }

      return { user, token };
    } catch (error: any) {
      console.error('Apple authentication failed:', error);
      const errorMessage = error.message || 'Apple authentication failed';
      store.dispatch(setUserError(errorMessage));
      throw error;
    } finally {
      store.dispatch(setUserLoading(false));
    }
  }

  async authenticateWithGoogle(googleData: {
    accessToken: string;
    email: string;
    name: string;
    photo?: string;
  }): Promise<{ user: User; token: string }> {
    try {
      store.dispatch(setUserLoading(true));
      store.dispatch(setUserError(null));

      // Send Google auth data to backend
      const { user, token } = await ApiService.authenticateWithGoogle(googleData);

      // Store session token securely
      await secureStorage.setItem('authToken', token);

      // Store user data
      await AsyncStorage.setItem('user', JSON.stringify(user));

      // Update Redux store
      store.dispatch(setUser(user));

      // Connect to socket
      try {
        console.log('🔌 Connecting to socket after Google sign-in...');
        await SocketService.connect();
        console.log('✅ Socket connected successfully after Google sign-in');
      } catch (socketError) {
        console.warn('⚠️ Failed to connect to socket after Google sign-in:', socketError);
      }

      return { user, token };
    } catch (error: any) {
      console.error('Google authentication failed:', error);
      const errorMessage = error.message || 'Google authentication failed';
      store.dispatch(setUserError(errorMessage));
      throw error;
    } finally {
      store.dispatch(setUserLoading(false));
    }
  }

  private async clearAuthData(): Promise<void> {
    try {
      // Clear secure storage (auth token)
      await secureStorage.deleteItem('authToken');
      // Clear regular storage (user data)
      await AsyncStorage.removeItem('user');
    } catch (error) {
      console.error('Failed to clear auth data:', error);
    }
  }

  // Utility methods
  async isLoggedIn(): Promise<boolean> {
    try {
      const token = await secureStorage.getItem('authToken');
      return token !== null;
    } catch (error) {
      return false;
    }
  }

  async getStoredUser(): Promise<User | null> {
    try {
      const savedUser = await AsyncStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (error) {
      return null;
    }
  }

  async getAuthToken(): Promise<string | null> {
    try {
      return await secureStorage.getItem('authToken');
    } catch (error) {
      return null;
    }
  }

  getCurrentUser(): User | null {
    const state = store.getState();
    return state.user.user;
  }

  isAuthenticated(): boolean {
    const state = store.getState();
    return state.user.user !== null;
  }

  // Auto-refresh token if needed (implement JWT token refresh logic)
  async refreshTokenIfNeeded(): Promise<boolean> {
    try {
      const token = await secureStorage.getItem('authToken');
      if (!token) return false;

      // Decode JWT to check expiration (simplified)
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) return false;

      const payload = JSON.parse(atob(tokenParts[1]));
      const currentTime = Math.floor(Date.now() / 1000);

      // If token expires in less than 5 minutes, try to refresh
      if (payload.exp && payload.exp - currentTime < 300) {
        // Implement token refresh logic here if your backend supports it
        console.log('Token will expire soon, should refresh');
        // For now, just return true as we don't have refresh token endpoint
        return true;
      }

      return true;
    } catch (error) {
      console.error('Failed to check token expiration:', error);
      return false;
    }
  }
}

export default new AuthService();