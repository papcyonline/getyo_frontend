import { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { setUser, clearUser } from '../store/slices/userSlice';
import AuthService from '../services/auth';
import { User } from '../types';
import { useBiometric } from './useBiometric';

/**
 * Hook for authentication operations
 * Provides simplified auth API with biometric support
 */
export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated, loading, error } = useSelector((state: RootState) => state.user);
  const biometric = useBiometric();

  /**
   * Login with email and password
   */
  const login = useCallback(async (email: string, password: string): Promise<User | null> => {
    try {
      const user = await AuthService.login(email, password);
      return user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }, []);

  /**
   * Login with biometric authentication
   */
  const loginWithBiometric = useCallback(async (): Promise<boolean> => {
    if (!biometric.isEnabled) {
      throw new Error('Biometric authentication is not enabled');
    }

    const authenticated = await biometric.authenticate('Login to Yo! Personal Assistant');

    if (authenticated) {
      // Biometric authentication successful
      // The user is already authenticated via secure token
      return true;
    }

    return false;
  }, [biometric]);

  /**
   * Register new user
   */
  const register = useCallback(async (userData: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }): Promise<User | null> => {
    try {
      const user = await AuthService.register(userData);
      return user;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }, []);

  /**
   * Logout
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      await AuthService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, []);

  /**
   * Update user profile
   */
  const updateProfile = useCallback(async (updates: Partial<User>): Promise<User | null> => {
    try {
      const updatedUser = await AuthService.updateProfile(updates);
      return updatedUser;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }, []);

  /**
   * Refresh user profile from server
   */
  const refreshProfile = useCallback(async (): Promise<User | null> => {
    try {
      return await AuthService.refreshProfile();
    } catch (error) {
      console.error('Refresh profile error:', error);
      return null;
    }
  }, []);

  /**
   * Check connection status
   */
  const checkConnection = useCallback(async () => {
    return await AuthService.checkConnectionStatus();
  }, []);

  return {
    // State
    user,
    isAuthenticated,
    loading,
    error,

    // Actions
    login,
    loginWithBiometric,
    register,
    logout,
    updateProfile,
    refreshProfile,
    checkConnection,

    // Biometric
    biometric,
  };
};
