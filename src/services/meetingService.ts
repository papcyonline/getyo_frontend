import axios from 'axios';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from './api';

// Enable browser dismissal on Android
WebBrowser.maybeCompleteAuthSession();

type MeetingProvider = 'google-meet' | 'zoom' | 'teams' | 'webex';

interface MeetingAccount {
  id: string;
  provider: MeetingProvider;
  email: string;
  name: string;
  connectedAt: string;
}

interface OAuthConfig {
  provider: MeetingProvider;
  clientId: string;
  redirectUri: string;
  scopes: string[];
}

class MeetingService {
  private readonly STORAGE_KEY = 'meeting_accounts';
  private readonly baseURL = ApiService.getBaseURL();

  // OAuth Configuration
  private getOAuthConfig(provider: MeetingProvider): OAuthConfig {
    const redirectUri = AuthSession.makeRedirectUri({
      scheme: 'yo-app',
      path: `auth/${provider}/callback`,
    });

    switch (provider) {
      case 'google-meet':
        return {
          provider,
          clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '',
          redirectUri,
          scopes: [
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/calendar.events',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile',
          ],
        };

      case 'zoom':
        return {
          provider,
          clientId: process.env.EXPO_PUBLIC_ZOOM_CLIENT_ID || '',
          redirectUri,
          scopes: [],
        };

      case 'teams':
        return {
          provider,
          clientId: process.env.EXPO_PUBLIC_TEAMS_CLIENT_ID || '',
          redirectUri,
          scopes: [
            'https://graph.microsoft.com/OnlineMeetings.ReadWrite',
            'https://graph.microsoft.com/Calendars.ReadWrite',
            'https://graph.microsoft.com/User.Read',
            'offline_access',
          ],
        };

      case 'webex':
        return {
          provider,
          clientId: process.env.EXPO_PUBLIC_WEBEX_CLIENT_ID || '',
          redirectUri,
          scopes: [
            'meeting:schedules_write',
            'meeting:schedules_read',
            'spark:people_read',
          ],
        };
    }
  }

  /**
   * Connect meeting provider using OAuth
   */
  async connectMeetingProvider(provider: MeetingProvider): Promise<MeetingAccount> {
    try {
      const config = this.getOAuthConfig(provider);

      // Build authorization URL
      let authUrl: string;

      switch (provider) {
        case 'google-meet':
          authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${config.clientId}&redirect_uri=${config.redirectUri}&response_type=code&scope=${encodeURIComponent(config.scopes.join(' '))}&access_type=offline&prompt=consent`;
          break;

        case 'zoom':
          authUrl = `https://zoom.us/oauth/authorize?client_id=${config.clientId}&response_type=code&redirect_uri=${config.redirectUri}`;
          break;

        case 'teams':
          authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${config.clientId}&redirect_uri=${config.redirectUri}&response_type=code&scope=${encodeURIComponent(config.scopes.join(' '))}&response_mode=query&prompt=consent`;
          break;

        case 'webex':
          authUrl = `https://webexapis.com/v1/authorize?client_id=${config.clientId}&response_type=code&redirect_uri=${config.redirectUri}&scope=${encodeURIComponent(config.scopes.join(' '))}`;
          break;
      }

      console.log('Opening OAuth flow for', provider);

      // Open OAuth flow
      const result = await WebBrowser.openAuthSessionAsync(authUrl, config.redirectUri);

      if (result.type !== 'success') {
        throw new Error('OAuth authentication cancelled or failed');
      }

      // Extract code from URL
      const url = new URL(result.url);
      const code = url.searchParams.get('code');

      if (!code) {
        throw new Error('No authorization code received');
      }

      console.log('OAuth code received, exchanging for tokens...');

      // Exchange code for tokens via backend
      const token = await ApiService.getAuthToken();
      const response = await axios.post(
        `${this.baseURL}/meetings/${provider}/connect`,
        { code },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to connect meeting provider');
      }

      const account: MeetingAccount = response.data.data;

      console.log('Meeting provider connected successfully:', account.email);

      // Store account locally
      await this.saveAccountLocally(account);

      return account;
    } catch (error: any) {
      console.error('Failed to connect meeting provider:', error);
      throw new Error(error.message || 'Failed to connect meeting provider');
    }
  }

  /**
   * Get all connected meeting accounts
   */
  async getAccounts(): Promise<MeetingAccount[]> {
    try {
      const token = await ApiService.getAuthToken();
      const response = await axios.get(`${this.baseURL}/meetings/accounts`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        const accounts = response.data.data || [];
        // Save to local storage
        await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(accounts));
        return accounts;
      }

      return [];
    } catch (error: any) {
      console.error('Failed to get meeting accounts:', error);
      // Fallback to local storage
      return await this.getAccountsFromStorage();
    }
  }

  /**
   * Disconnect meeting provider
   */
  async disconnectProvider(provider: MeetingProvider): Promise<void> {
    try {
      const token = await ApiService.getAuthToken();
      await axios.delete(`${this.baseURL}/meetings/${provider}/disconnect`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      await this.removeAccountFromStorage(provider);
    } catch (error: any) {
      console.error('Failed to disconnect provider:', error);
      throw error;
    }
  }

  /**
   * Create a meeting
   */
  async createMeeting(
    provider: MeetingProvider,
    meetingData: {
      title?: string;
      startTime: string;
      endTime?: string;
      duration?: number;
      description?: string;
      attendees?: string[];
    }
  ): Promise<{ meetingId: string; meetingLink: string }> {
    try {
      const token = await ApiService.getAuthToken();

      // Different providers have different payload structures
      let payload: any;

      switch (provider) {
        case 'google-meet':
          payload = {
            summary: meetingData.title,
            description: meetingData.description,
            startTime: meetingData.startTime,
            endTime: meetingData.endTime,
            attendees: meetingData.attendees,
          };
          break;

        case 'zoom':
          payload = {
            topic: meetingData.title,
            startTime: meetingData.startTime,
            duration: meetingData.duration || 60,
            agenda: meetingData.description,
          };
          break;

        case 'teams':
          payload = {
            subject: meetingData.title,
            startDateTime: meetingData.startTime,
            endDateTime: meetingData.endTime,
          };
          break;

        case 'webex':
          payload = {
            title: meetingData.title,
            start: meetingData.startTime,
            end: meetingData.endTime,
            agenda: meetingData.description,
          };
          break;
      }

      const response = await axios.post(
        `${this.baseURL}/meetings/${provider}/create`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        return response.data.data;
      }

      throw new Error('Failed to create meeting');
    } catch (error: any) {
      console.error('Failed to create meeting:', error);
      throw error;
    }
  }

  // Local storage helpers
  private async saveAccountLocally(account: MeetingAccount): Promise<void> {
    try {
      const accounts = await this.getAccountsFromStorage();
      const existingIndex = accounts.findIndex(
        (a) => a.provider === account.provider
      );

      if (existingIndex >= 0) {
        accounts[existingIndex] = account;
      } else {
        accounts.push(account);
      }

      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(accounts));
    } catch (error) {
      console.error('Failed to save account locally:', error);
    }
  }

  private async getAccountsFromStorage(): Promise<MeetingAccount[]> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to get accounts from storage:', error);
      return [];
    }
  }

  private async removeAccountFromStorage(provider: MeetingProvider): Promise<void> {
    try {
      const accounts = await this.getAccountsFromStorage();
      const filtered = accounts.filter((a) => a.provider !== provider);
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Failed to remove account from storage:', error);
    }
  }
}

export default new MeetingService();
