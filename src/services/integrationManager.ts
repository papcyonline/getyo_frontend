// Integration Manager Service - Handles all PA integrations with user data sources

import * as Calendar from 'expo-calendar';
import * as Contacts from 'expo-contacts';
import * as Location from 'expo-location';
import * as MediaLibrary from 'expo-media-library';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Alert } from 'react-native';
import {
  Integration,
  IntegrationType,
  IntegrationStatus,
  PermissionType,
  IntegrationData,
  CalendarEvent,
  Contact as IntegrationContact,
} from '../types/integrations';
import ApiService from './api';
import config from '../config/environment';

// Initialize WebBrowser for OAuth
WebBrowser.maybeCompleteAuthSession();

const INTEGRATIONS_STORAGE_KEY = '@yo_integrations';

class IntegrationManager {
  private integrations: Map<IntegrationType, Integration> = new Map();
  private listeners: Set<(integrations: Integration[]) => void> = new Set();

  constructor() {
    this.initializeIntegrations();
  }

  /**
   * Initialize all available integrations
   */
  private initializeIntegrations() {
    const allIntegrations: Integration[] = [
      // Native Device Integrations
      {
        type: IntegrationType.CALENDAR,
        name: 'Calendar',
        description: 'Access your calendar events and create reminders',
        icon: 'calendar-outline',
        permissionType: PermissionType.NATIVE,
        status: IntegrationStatus.NOT_CONNECTED,
        capabilities: [
          'Read calendar events',
          'Create events and reminders',
          'Update existing events',
          'Get upcoming schedule',
        ],
      },
      {
        type: IntegrationType.CONTACTS,
        name: 'Contacts',
        description: 'Access your contacts for quick communication',
        icon: 'people-outline',
        permissionType: PermissionType.NATIVE,
        status: IntegrationStatus.NOT_CONNECTED,
        capabilities: [
          'Read contact information',
          'Find contacts by name',
          'Get contact details for calls/messages',
        ],
      },
      {
        type: IntegrationType.LOCATION,
        name: 'Location',
        description: 'Access your location for navigation and local recommendations',
        icon: 'location-outline',
        permissionType: PermissionType.NATIVE,
        status: IntegrationStatus.NOT_CONNECTED,
        capabilities: [
          'Get current location',
          'Track frequent places',
          'Provide location-based suggestions',
          'Navigate with Maps',
        ],
      },
      {
        type: IntegrationType.PHOTOS,
        name: 'Photos',
        description: 'Access your photo library',
        icon: 'images-outline',
        permissionType: PermissionType.NATIVE,
        status: IntegrationStatus.NOT_CONNECTED,
        capabilities: [
          'Access photo library',
          'Organize photos',
          'Create albums',
        ],
      },

      // Google Services
      {
        type: IntegrationType.GMAIL,
        name: 'Gmail',
        description: 'Read and manage your Gmail emails',
        icon: 'mail-outline',
        permissionType: PermissionType.OAUTH,
        status: IntegrationStatus.NOT_CONNECTED,
        capabilities: [
          'Read emails',
          'Send emails',
          'Organize inbox',
          'Smart email summaries',
        ],
        requiredScopes: [
          'https://www.googleapis.com/auth/gmail.readonly',
          'https://www.googleapis.com/auth/gmail.send',
        ],
      },
      {
        type: IntegrationType.GOOGLE_MAPS,
        name: 'Google Maps',
        description: 'Navigation, places, and location services',
        icon: 'map-outline',
        permissionType: PermissionType.OAUTH,
        status: IntegrationStatus.NOT_CONNECTED,
        capabilities: [
          'Navigate to destinations',
          'Find nearby places',
          'Get traffic updates',
          'Save favorite locations',
        ],
        requiredScopes: [
          'https://www.googleapis.com/auth/maps',
        ],
      },
      {
        type: IntegrationType.GOOGLE_DRIVE,
        name: 'Google Drive',
        description: 'Access your files and documents',
        icon: 'cloud-outline',
        permissionType: PermissionType.OAUTH,
        status: IntegrationStatus.NOT_CONNECTED,
        capabilities: [
          'Access files and folders',
          'Search documents',
          'Share files',
          'Organize storage',
        ],
        requiredScopes: [
          'https://www.googleapis.com/auth/drive.readonly',
        ],
      },

      // Video Conferencing
      {
        type: IntegrationType.ZOOM,
        name: 'Zoom',
        description: 'Manage your Zoom meetings',
        icon: 'videocam-outline',
        permissionType: PermissionType.OAUTH,
        status: IntegrationStatus.NOT_CONNECTED,
        capabilities: [
          'View upcoming meetings',
          'Create meetings',
          'Join meetings quickly',
          'Get meeting notifications',
        ],
      },
      {
        type: IntegrationType.GOOGLE_MEET,
        name: 'Google Meet',
        description: 'Manage Google Meet video calls',
        icon: 'videocam-outline',
        permissionType: PermissionType.OAUTH,
        status: IntegrationStatus.NOT_CONNECTED,
        capabilities: [
          'Schedule meetings',
          'Join calls',
          'Manage participants',
        ],
      },

      // Social Media
      {
        type: IntegrationType.FACEBOOK,
        name: 'Facebook',
        description: 'Connect with your Facebook account',
        icon: 'logo-facebook',
        permissionType: PermissionType.OAUTH,
        status: IntegrationStatus.NOT_CONNECTED,
        capabilities: [
          'Read posts and notifications',
          'Post updates',
          'Manage messages',
        ],
      },
      {
        type: IntegrationType.INSTAGRAM,
        name: 'Instagram',
        description: 'Connect with your Instagram account',
        icon: 'logo-instagram',
        permissionType: PermissionType.OAUTH,
        status: IntegrationStatus.NOT_CONNECTED,
        capabilities: [
          'View your posts',
          'Read comments',
          'Get notifications',
        ],
      },

      // Microsoft Services
      {
        type: IntegrationType.OUTLOOK,
        name: 'Outlook',
        description: 'Access your Outlook email and calendar',
        icon: 'mail-outline',
        permissionType: PermissionType.OAUTH,
        status: IntegrationStatus.NOT_CONNECTED,
        capabilities: [
          'Read emails',
          'Manage calendar',
          'Send messages',
        ],
      },
    ];

    allIntegrations.forEach(integration => {
      this.integrations.set(integration.type, integration);
    });

    // Load saved integration states
    this.loadIntegrationStates();
  }

  /**
   * Load integration states from storage
   */
  private async loadIntegrationStates() {
    try {
      const stored = await AsyncStorage.getItem(INTEGRATIONS_STORAGE_KEY);
      if (stored) {
        const savedStates: Record<string, IntegrationStatus> = JSON.parse(stored);

        Object.entries(savedStates).forEach(([type, status]) => {
          const integration = this.integrations.get(type as IntegrationType);
          if (integration) {
            integration.status = status;
          }
        });

        this.notifyListeners();
      }
    } catch (error) {
      console.error('Failed to load integration states:', error);
    }
  }

  /**
   * Save integration states to storage
   */
  private async saveIntegrationStates() {
    try {
      const states: Record<string, IntegrationStatus> = {};

      this.integrations.forEach((integration, type) => {
        states[type] = integration.status;
      });

      await AsyncStorage.setItem(INTEGRATIONS_STORAGE_KEY, JSON.stringify(states));
    } catch (error) {
      console.error('Failed to save integration states:', error);
    }
  }

  /**
   * Get all integrations
   */
  getAllIntegrations(): Integration[] {
    return Array.from(this.integrations.values());
  }

  /**
   * Get integration by type
   */
  getIntegration(type: IntegrationType): Integration | undefined {
    return this.integrations.get(type);
  }

  /**
   * Get connected integrations
   */
  getConnectedIntegrations(): Integration[] {
    return Array.from(this.integrations.values()).filter(
      i => i.status === IntegrationStatus.CONNECTED
    );
  }

  /**
   * Subscribe to integration changes
   */
  subscribe(callback: (integrations: Integration[]) => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all listeners
   */
  private notifyListeners() {
    const integrations = this.getAllIntegrations();
    this.listeners.forEach(callback => callback(integrations));
  }

  /**
   * Request permission for an integration
   */
  async requestPermission(type: IntegrationType): Promise<boolean> {
    const integration = this.integrations.get(type);
    if (!integration) {
      throw new Error(`Integration ${type} not found`);
    }

    console.log(`🔐 Requesting permission for ${integration.name}...`);

    try {
      let granted = false;

      switch (integration.permissionType) {
        case PermissionType.NATIVE:
          granted = await this.requestNativePermission(type);
          break;

        case PermissionType.OAUTH:
          granted = await this.requestOAuthPermission(type);
          break;

        default:
          console.warn(`Unknown permission type: ${integration.permissionType}`);
          return false;
      }

      if (granted) {
        integration.status = IntegrationStatus.CONNECTED;
        integration.connectedAt = new Date();
        console.log(`✅ ${integration.name} connected successfully`);
      } else {
        integration.status = IntegrationStatus.ERROR;
        console.log(`❌ ${integration.name} permission denied`);
      }

      await this.saveIntegrationStates();
      this.notifyListeners();

      // Sync with backend
      await this.syncWithBackend(type, granted);

      return granted;
    } catch (error) {
      console.error(`Failed to request permission for ${type}:`, error);
      integration.status = IntegrationStatus.ERROR;
      await this.saveIntegrationStates();
      this.notifyListeners();
      return false;
    }
  }

  /**
   * Request native device permission
   */
  private async requestNativePermission(type: IntegrationType): Promise<boolean> {
    switch (type) {
      case IntegrationType.CALENDAR: {
        const { status } = await Calendar.requestCalendarPermissionsAsync();
        return status === 'granted';
      }

      case IntegrationType.CONTACTS: {
        const { status } = await Contacts.requestPermissionsAsync();
        return status === 'granted';
      }

      case IntegrationType.LOCATION: {
        const { status } = await Location.requestForegroundPermissionsAsync();
        return status === 'granted';
      }

      case IntegrationType.PHOTOS: {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        return status === 'granted';
      }

      default:
        return false;
    }
  }

  /**
   * Request OAuth permission (with web auth flow)
   */
  private async requestOAuthPermission(type: IntegrationType): Promise<boolean> {
    try {
      // Map integration type to service name
      const serviceMap: Record<string, string[]> = {
        [IntegrationType.GMAIL]: ['gmail'],
        [IntegrationType.GOOGLE_MAPS]: ['contacts'],
        [IntegrationType.GOOGLE_DRIVE]: ['drive'],
        [IntegrationType.GOOGLE_MEET]: ['meet'],
        [IntegrationType.GOOGLE_WORKSPACE]: ['gmail', 'calendar', 'drive'],
      };

      const services = serviceMap[type] || [];

      // For now, handle Google services
      if (this.isGoogleService(type)) {
        return await this.authenticateWithGoogle(services);
      }

      // Other OAuth providers not yet implemented
      console.log(`📝 OAuth flow for ${type} not yet implemented`);
      return false;
    } catch (error: any) {
      console.error(`Failed to request OAuth permission for ${type}:`, error);
      return false;
    }
  }

  /**
   * Check if integration is a Google service
   */
  private isGoogleService(type: IntegrationType): boolean {
    return [
      IntegrationType.GMAIL,
      IntegrationType.GOOGLE_MAPS,
      IntegrationType.GOOGLE_DRIVE,
      IntegrationType.GOOGLE_MEET,
      IntegrationType.GOOGLE_WORKSPACE,
    ].includes(type);
  }

  /**
   * Authenticate with Google using OAuth web flow
   */
  private async authenticateWithGoogle(services: string[]): Promise<boolean> {
    try {
      console.log(`🔐 Starting Google OAuth flow for services:`, services);

      // Get authorization URL from backend
      const servicesParam = services.join(',');
      const response = await ApiService.api.get(
        `/api/oauth/google/auth-url?services=${servicesParam}`
      );

      if (!response.data.success || !response.data.data.authUrl) {
        throw new Error('Failed to get authorization URL');
      }

      const authUrl = response.data.data.authUrl;
      console.log(`🌐 Opening Google OAuth URL...`);

      // Open browser for authentication
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        `${config.API_BASE_URL}/api/oauth/google/callback`
      );

      if (result.type !== 'success') {
        console.log('❌ OAuth cancelled or failed:', result.type);
        return false;
      }

      // Extract authorization code from URL
      const url = result.url;
      const codeMatch = url.match(/[?&]code=([^&]+)/);

      if (!codeMatch) {
        throw new Error('No authorization code found in response');
      }

      const code = codeMatch[1];
      console.log(`✅ Got authorization code, exchanging for tokens...`);

      // Send code to backend to exchange for tokens
      const connectResponse = await ApiService.api.post('/api/oauth/google/connect', {
        code,
        services,
      });

      if (!connectResponse.data.success) {
        throw new Error('Failed to connect Google account');
      }

      console.log(`✅ Google account connected successfully`);
      return true;
    } catch (error: any) {
      console.error('❌ Google OAuth flow failed:', error);
      throw error;
    }
  }

  /**
   * Disconnect an integration
   */
  async disconnect(type: IntegrationType): Promise<void> {
    const integration = this.integrations.get(type);
    if (!integration) return;

    integration.status = IntegrationStatus.NOT_CONNECTED;
    integration.connectedAt = undefined;
    integration.lastSyncedAt = undefined;
    integration.accessToken = undefined;
    integration.refreshToken = undefined;

    await this.saveIntegrationStates();
    this.notifyListeners();

    // Notify backend
    await this.syncWithBackend(type, false);
  }

  /**
   * Sync integration status with backend
   */
  private async syncWithBackend(type: IntegrationType, connected: boolean): Promise<void> {
    try {
      // TODO: Call backend API to save integration status
      console.log(`🔄 Syncing ${type} status with backend: ${connected ? 'connected' : 'disconnected'}`);

      // Backend endpoint will be: POST /api/integrations/status
      // await ApiService.updateIntegrationStatus(type, connected);
    } catch (error) {
      console.error('Failed to sync with backend:', error);
    }
  }

  /**
   * Get data from connected integrations
   */
  async getIntegrationData(type: IntegrationType): Promise<IntegrationData> {
    const integration = this.integrations.get(type);
    if (!integration || integration.status !== IntegrationStatus.CONNECTED) {
      throw new Error(`Integration ${type} is not connected`);
    }

    const data: IntegrationData = {};

    try {
      switch (type) {
        case IntegrationType.CALENDAR:
          data.events = await this.getCalendarEvents();
          break;

        case IntegrationType.CONTACTS:
          data.contacts = await this.getContacts();
          break;

        case IntegrationType.LOCATION:
          data.currentLocation = await this.getCurrentLocation();
          break;

        // Add more cases as needed
      }

      integration.lastSyncedAt = new Date();
      await this.saveIntegrationStates();
      this.notifyListeners();

      return data;
    } catch (error) {
      console.error(`Failed to get data from ${type}:`, error);
      throw error;
    }
  }

  /**
   * Get calendar events
   */
  private async getCalendarEvents(): Promise<CalendarEvent[]> {
    try {
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      if (calendars.length === 0) return [];

      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30); // Next 30 days

      const events = await Calendar.getEventsAsync(
        calendars.map(c => c.id),
        now,
        futureDate
      );

      return events.map(event => ({
        id: event.id,
        title: event.title,
        description: event.notes,
        startDate: new Date(event.startDate),
        endDate: new Date(event.endDate),
        location: event.location,
        source: IntegrationType.CALENDAR,
      }));
    } catch (error) {
      console.error('Failed to get calendar events:', error);
      return [];
    }
  }

  /**
   * Get contacts
   */
  private async getContacts(): Promise<IntegrationContact[]> {
    try {
      const { data } = await Contacts.getContactsAsync({
        fields: [
          Contacts.Fields.Name,
          Contacts.Fields.PhoneNumbers,
          Contacts.Fields.Emails,
          Contacts.Fields.Image,
          Contacts.Fields.Company,
          Contacts.Fields.Birthday,
        ],
      });

      return data.map(contact => ({
        id: contact.id,
        name: contact.name || 'Unknown',
        phoneNumbers: contact.phoneNumbers?.map(p => p.number || '') || [],
        emails: contact.emails?.map(e => e.email || '') || [],
        photoUrl: contact.image?.uri,
        company: contact.company,
        source: IntegrationType.CONTACTS,
      }));
    } catch (error) {
      console.error('Failed to get contacts:', error);
      return [];
    }
  }

  /**
   * Get current location
   */
  private async getCurrentLocation() {
    try {
      const location = await Location.getCurrentPositionAsync({});
      const address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        address: address[0] ?
          `${address[0].street}, ${address[0].city}, ${address[0].region}` :
          undefined,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Failed to get location:', error);
      return undefined;
    }
  }
}

// Export singleton instance
export default new IntegrationManager();
