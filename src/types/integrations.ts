// Integration types for PA to access user information

export enum IntegrationType {
  // Native Device
  CALENDAR = 'calendar',
  CONTACTS = 'contacts',
  PHOTOS = 'photos',
  LOCATION = 'location',

  // Email
  GMAIL = 'gmail',
  OUTLOOK = 'outlook',

  // Maps & Navigation
  GOOGLE_MAPS = 'google_maps',

  // Messaging
  WHATSAPP = 'whatsapp',

  // Video Conferencing
  ZOOM = 'zoom',
  GOOGLE_MEET = 'google_meet',
  MICROSOFT_TEAMS = 'microsoft_teams',

  // Social Media
  FACEBOOK = 'facebook',
  INSTAGRAM = 'instagram',
  TWITTER = 'twitter',
  LINKEDIN = 'linkedin',

  // Cloud Storage
  GOOGLE_DRIVE = 'google_drive',
  DROPBOX = 'dropbox',
  ONEDRIVE = 'onedrive',

  // Productivity
  GOOGLE_WORKSPACE = 'google_workspace',
  NOTION = 'notion',
  TRELLO = 'trello',
  SLACK = 'slack',
}

export enum IntegrationStatus {
  NOT_CONNECTED = 'not_connected',
  PENDING = 'pending',
  CONNECTED = 'connected',
  ERROR = 'error',
  EXPIRED = 'expired',
}

export enum PermissionType {
  NATIVE = 'native', // Native device permissions
  OAUTH = 'oauth',   // OAuth 2.0 flow
  API_KEY = 'api_key', // API key based
}

export interface Integration {
  type: IntegrationType;
  name: string;
  description: string;
  icon: string; // Ionicons name
  permissionType: PermissionType;
  status: IntegrationStatus;
  capabilities: string[];
  requiredScopes?: string[]; // For OAuth
  connectedAt?: Date;
  lastSyncedAt?: Date;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

export interface IntegrationPermissionRequest {
  integration: IntegrationType;
  reason: string;
  capabilities: string[];
}

export interface IntegrationData {
  // Calendar
  events?: CalendarEvent[];

  // Contacts
  contacts?: Contact[];

  // Email
  emails?: Email[];

  // Location
  currentLocation?: Location;
  frequentPlaces?: Place[];

  // Photos
  recentPhotos?: Photo[];

  // Social
  posts?: SocialPost[];
  messages?: SocialMessage[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  attendees?: string[];
  reminder?: number;
  recurrence?: string;
  source: IntegrationType;
}

export interface Contact {
  id: string;
  name: string;
  phoneNumbers?: string[];
  emails?: string[];
  photoUrl?: string;
  company?: string;
  birthday?: Date;
  notes?: string;
  source: IntegrationType;
}

export interface Email {
  id: string;
  from: string;
  to: string[];
  cc?: string[];
  subject: string;
  body: string;
  timestamp: Date;
  isRead: boolean;
  hasAttachments: boolean;
  labels?: string[];
  source: IntegrationType;
}

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
  timestamp: Date;
}

export interface Place {
  id: string;
  name: string;
  address: string;
  location: Location;
  category?: string;
  visitCount?: number;
}

export interface Photo {
  id: string;
  uri: string;
  width: number;
  height: number;
  timestamp: Date;
  location?: Location;
  source: IntegrationType;
}

export interface SocialPost {
  id: string;
  platform: IntegrationType;
  content: string;
  author: string;
  timestamp: Date;
  likes?: number;
  comments?: number;
}

export interface SocialMessage {
  id: string;
  platform: IntegrationType;
  from: string;
  to: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
}

export interface IntegrationConfig {
  // OAuth credentials (stored securely in backend)
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
  scopes: string[];
  authEndpoint?: string;
  tokenEndpoint?: string;
}
