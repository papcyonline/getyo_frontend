import axios from 'axios';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Calendar from 'expo-calendar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import ApiService from './api';

// Enable browser dismissal on Android
WebBrowser.maybeCompleteAuthSession();

type CalendarProvider = 'google-calendar' | 'outlook-calendar' | 'apple-calendar';

interface CalendarAccount {
  id: string;
  provider: CalendarProvider;
  email?: string;
  name?: string;
  connectedAt: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  attendees?: string[];
  status?: string;
  htmlLink?: string;
  webLink?: string;
  isOnline?: boolean;
  onlineMeetingUrl?: string;
}

interface CreateEventData {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  attendees?: string[];
}

interface OAuthConfig {
  provider: CalendarProvider;
  clientId: string;
  redirectUri: string;
  scopes: string[];
}

class CalendarService {
  private readonly STORAGE_KEY = 'calendar_accounts';
  private readonly baseURL = ApiService.getBaseURL();

  // OAuth Configuration
  private getOAuthConfig(provider: CalendarProvider): OAuthConfig {
    const redirectUri = AuthSession.makeRedirectUri({
      scheme: 'yo-app',
      path: `auth/${provider}/callback`,
    });

    switch (provider) {
      case 'google-calendar':
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

      case 'outlook-calendar':
        return {
          provider,
          clientId: process.env.EXPO_PUBLIC_OUTLOOK_CLIENT_ID || '',
          redirectUri,
          scopes: [
            'https://graph.microsoft.com/Calendars.ReadWrite',
            'https://graph.microsoft.com/User.Read',
            'offline_access',
          ],
        };

      case 'apple-calendar':
        // Apple Calendar uses device-level permissions via EventKit
        return {
          provider,
          clientId: '',
          redirectUri: '',
          scopes: [],
        };
    }
  }

  /**
   * Connect calendar provider using OAuth or device permissions
   */
  async connectCalendar(provider: CalendarProvider): Promise<CalendarAccount> {
    try {
      // Apple Calendar uses device-level permissions
      if (provider === 'apple-calendar') {
        return await this.connectAppleCalendar();
      }

      const config = this.getOAuthConfig(provider);

      // Build authorization URL
      let authUrl: string;

      switch (provider) {
        case 'google-calendar':
          authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${config.clientId}&redirect_uri=${config.redirectUri}&response_type=code&scope=${encodeURIComponent(config.scopes.join(' '))}&access_type=offline&prompt=consent`;
          break;

        case 'outlook-calendar':
          authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${config.clientId}&redirect_uri=${config.redirectUri}&response_type=code&scope=${encodeURIComponent(config.scopes.join(' '))}&response_mode=query&prompt=consent`;
          break;

        default:
          throw new Error('Unsupported calendar provider');
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
        `${this.baseURL}/integrations/${provider}/connect`,
        { code, authCode: code, redirectUri: config.redirectUri },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to connect calendar');
      }

      const accountData = response.data.data;
      const account: CalendarAccount = {
        id: `${provider}-${Date.now()}`,
        provider,
        email: accountData.email,
        name: accountData.name,
        connectedAt: accountData.connectedAt || new Date().toISOString(),
      };

      console.log('Calendar provider connected successfully:', account.email);

      // Store account locally
      await this.saveAccountLocally(account);

      return account;
    } catch (error: any) {
      console.error('Failed to connect calendar provider:', error);
      throw new Error(error.message || 'Failed to connect calendar provider');
    }
  }

  /**
   * Connect Apple Calendar using device permissions
   */
  private async connectAppleCalendar(): Promise<CalendarAccount> {
    try {
      // Request calendar permissions
      const { status } = await Calendar.requestCalendarPermissionsAsync();

      if (status !== 'granted') {
        throw new Error('Calendar permission denied');
      }

      // Get default calendar source
      const defaultCalendarSource =
        Platform.OS === 'ios'
          ? await Calendar.getDefaultCalendarAsync()
          : await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);

      const calendarSource = Platform.OS === 'ios'
        ? defaultCalendarSource.source
        : defaultCalendarSource[0]?.source || 'default';

      // Notify backend of connection
      const token = await ApiService.getAuthToken();
      const response = await axios.post(
        `${this.baseURL}/integrations/apple-calendar/connect`,
        {
          hasPermission: true,
          calendarSource: calendarSource,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to connect Apple Calendar');
      }

      const account: CalendarAccount = {
        id: `apple-calendar-${Date.now()}`,
        provider: 'apple-calendar',
        name: 'Apple Calendar',
        connectedAt: new Date().toISOString(),
      };

      console.log('Apple Calendar connected successfully');

      // Store account locally
      await this.saveAccountLocally(account);

      return account;
    } catch (error: any) {
      console.error('Failed to connect Apple Calendar:', error);
      throw new Error(error.message || 'Failed to connect Apple Calendar');
    }
  }

  /**
   * Get all connected calendar accounts
   */
  async getAccounts(): Promise<CalendarAccount[]> {
    try {
      const token = await ApiService.getAuthToken();
      const response = await axios.get(`${this.baseURL}/integrations/status`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        const status = response.data.data;
        const accounts: CalendarAccount[] = [];

        if (status.googleCalendar?.connected) {
          accounts.push({
            id: 'google-calendar',
            provider: 'google-calendar',
            connectedAt: status.googleCalendar.connectedAt,
          });
        }

        if (status.outlookCalendar?.connected) {
          accounts.push({
            id: 'outlook-calendar',
            provider: 'outlook-calendar',
            connectedAt: status.outlookCalendar.connectedAt,
          });
        }

        if (status.appleCalendar?.connected) {
          accounts.push({
            id: 'apple-calendar',
            provider: 'apple-calendar',
            connectedAt: status.appleCalendar.connectedAt,
          });
        }

        // Save to local storage
        await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(accounts));
        return accounts;
      }

      return [];
    } catch (error: any) {
      console.error('Failed to get calendar accounts:', error);
      // Fallback to local storage
      return await this.getAccountsFromStorage();
    }
  }

  /**
   * Disconnect calendar provider
   */
  async disconnectCalendar(provider: CalendarProvider): Promise<void> {
    try {
      const token = await ApiService.getAuthToken();
      await axios.post(
        `${this.baseURL}/integrations/${provider}/disconnect`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      await this.removeAccountFromStorage(provider);
    } catch (error: any) {
      console.error('Failed to disconnect calendar:', error);
      throw error;
    }
  }

  /**
   * Get calendar events
   */
  async getEvents(
    provider: CalendarProvider,
    startDate?: string,
    endDate?: string,
    maxResults?: number
  ): Promise<CalendarEvent[]> {
    try {
      // For Apple Calendar, fetch events from device
      if (provider === 'apple-calendar') {
        return await this.getAppleCalendarEvents(startDate, endDate);
      }

      const token = await ApiService.getAuthToken();
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (maxResults) params.maxResults = maxResults;

      const response = await axios.get(
        `${this.baseURL}/integrations/${provider}/events`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params,
        }
      );

      if (response.data.success) {
        return response.data.data.events || [];
      }

      return [];
    } catch (error: any) {
      console.error('Failed to get calendar events:', error);
      throw error;
    }
  }

  /**
   * Get Apple Calendar events from device
   */
  private async getAppleCalendarEvents(
    startDate?: string,
    endDate?: string
  ): Promise<CalendarEvent[]> {
    try {
      const { status } = await Calendar.getCalendarPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Calendar permission not granted');
      }

      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);

      if (calendars.length === 0) {
        return [];
      }

      const start = startDate ? new Date(startDate) : new Date();
      const end = endDate ? new Date(endDate) : new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

      const events = await Calendar.getEventsAsync(
        calendars.map(cal => cal.id),
        start,
        end
      );

      return events.map(event => ({
        id: event.id,
        title: event.title,
        description: event.notes,
        startTime: event.startDate,
        endTime: event.endDate,
        location: event.location,
        status: event.status,
      }));
    } catch (error: any) {
      console.error('Failed to get Apple Calendar events:', error);
      throw error;
    }
  }

  /**
   * Create a calendar event
   */
  async createEvent(
    provider: CalendarProvider,
    eventData: CreateEventData
  ): Promise<{ id: string; title: string }> {
    try {
      // For Apple Calendar, create event on device
      if (provider === 'apple-calendar') {
        return await this.createAppleCalendarEvent(eventData);
      }

      const token = await ApiService.getAuthToken();
      const response = await axios.post(
        `${this.baseURL}/integrations/${provider}/create-event`,
        eventData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        return response.data.data;
      }

      throw new Error('Failed to create event');
    } catch (error: any) {
      console.error('Failed to create calendar event:', error);
      throw error;
    }
  }

  /**
   * Create Apple Calendar event on device
   */
  private async createAppleCalendarEvent(
    eventData: CreateEventData
  ): Promise<{ id: string; title: string }> {
    try {
      const { status } = await Calendar.getCalendarPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Calendar permission not granted');
      }

      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const defaultCalendar = calendars.find(cal => cal.allowsModifications) || calendars[0];

      if (!defaultCalendar) {
        throw new Error('No calendar available for creating events');
      }

      const eventId = await Calendar.createEventAsync(defaultCalendar.id, {
        title: eventData.title,
        notes: eventData.description,
        startDate: new Date(eventData.startTime),
        endDate: new Date(eventData.endTime),
        location: eventData.location,
        timeZone: 'UTC',
      });

      // Notify backend
      const token = await ApiService.getAuthToken();
      await axios.post(
        `${this.baseURL}/integrations/apple-calendar/create-event`,
        { eventId, title: eventData.title },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return { id: eventId, title: eventData.title };
    } catch (error: any) {
      console.error('Failed to create Apple Calendar event:', error);
      throw error;
    }
  }

  /**
   * Update a calendar event
   */
  async updateEvent(
    provider: CalendarProvider,
    eventId: string,
    eventData: Partial<CreateEventData>
  ): Promise<void> {
    try {
      // For Apple Calendar, update event on device
      if (provider === 'apple-calendar') {
        return await this.updateAppleCalendarEvent(eventId, eventData);
      }

      const token = await ApiService.getAuthToken();
      await axios.put(
        `${this.baseURL}/integrations/${provider}/update-event/${eventId}`,
        eventData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (error: any) {
      console.error('Failed to update calendar event:', error);
      throw error;
    }
  }

  /**
   * Update Apple Calendar event on device
   */
  private async updateAppleCalendarEvent(
    eventId: string,
    eventData: Partial<CreateEventData>
  ): Promise<void> {
    try {
      const { status } = await Calendar.getCalendarPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Calendar permission not granted');
      }

      const updateData: any = {};
      if (eventData.title) updateData.title = eventData.title;
      if (eventData.description !== undefined) updateData.notes = eventData.description;
      if (eventData.location !== undefined) updateData.location = eventData.location;
      if (eventData.startTime) updateData.startDate = new Date(eventData.startTime);
      if (eventData.endTime) updateData.endDate = new Date(eventData.endTime);

      await Calendar.updateEventAsync(eventId, updateData);

      // Notify backend
      const token = await ApiService.getAuthToken();
      await axios.put(
        `${this.baseURL}/integrations/apple-calendar/update-event/${eventId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (error: any) {
      console.error('Failed to update Apple Calendar event:', error);
      throw error;
    }
  }

  /**
   * Delete a calendar event
   */
  async deleteEvent(provider: CalendarProvider, eventId: string): Promise<void> {
    try {
      // For Apple Calendar, delete event from device
      if (provider === 'apple-calendar') {
        return await this.deleteAppleCalendarEvent(eventId);
      }

      const token = await ApiService.getAuthToken();
      await axios.delete(
        `${this.baseURL}/integrations/${provider}/delete-event/${eventId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (error: any) {
      console.error('Failed to delete calendar event:', error);
      throw error;
    }
  }

  /**
   * Delete Apple Calendar event from device
   */
  private async deleteAppleCalendarEvent(eventId: string): Promise<void> {
    try {
      const { status } = await Calendar.getCalendarPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Calendar permission not granted');
      }

      await Calendar.deleteEventAsync(eventId);

      // Notify backend
      const token = await ApiService.getAuthToken();
      await axios.delete(
        `${this.baseURL}/integrations/apple-calendar/delete-event/${eventId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (error: any) {
      console.error('Failed to delete Apple Calendar event:', error);
      throw error;
    }
  }

  // Local storage helpers
  private async saveAccountLocally(account: CalendarAccount): Promise<void> {
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

  private async getAccountsFromStorage(): Promise<CalendarAccount[]> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to get accounts from storage:', error);
      return [];
    }
  }

  private async removeAccountFromStorage(provider: CalendarProvider): Promise<void> {
    try {
      const accounts = await this.getAccountsFromStorage();
      const filtered = accounts.filter((a) => a.provider !== provider);
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Failed to remove account from storage:', error);
    }
  }
}

export default new CalendarService();
