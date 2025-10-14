export interface LegalAcceptance {
  termsOfService?: {
    accepted: boolean;
    version?: string;
    acceptedAt?: string;
    ipAddress?: string;
  };
  privacyPolicy?: {
    accepted: boolean;
    version?: string;
    acceptedAt?: string;
    ipAddress?: string;
  };
  acceptanceHistory?: Array<{
    documentType: 'terms' | 'privacy';
    version: string;
    acceptedAt: string;
    ipAddress: string;
  }>;
}

export interface User {
  id: string;
  fullName: string;
  preferredName: string;
  title?: string;
  name: string; // Legacy field for backward compatibility
  email: string;
  phone?: string;
  assistantName?: string;
  assistantGender?: 'male' | 'female' | 'non-binary';
  assistantVoice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  assistantProfileImage?: string;
  hasCompletedOnboarding?: boolean;
  agentConfiguration?: {
    setupCompleted?: boolean;
  };
  preferences: UserPreferences;
  integrations: UserIntegrations;
  legalAcceptance?: LegalAcceptance;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  voiceEnabled: boolean;
  reminderStyle: 'casual' | 'formal' | 'friendly';
  dailyBriefingTime: string;
  theme: 'dark' | 'light';
  wakeWord: string;
  conversationStyle: 'casual' | 'formal';
}

export interface UserIntegrations {
  googleCalendar?: {
    connected: boolean;
    refreshToken?: string;
  };
  appleCalendar?: {
    connected: boolean;
  };
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  dueDate?: string;
  reminders: string[];
  tags: string[];
  createdBy: 'user' | 'ai_suggestion';
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  id: string;
  userId: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  attendees: string[];
  reminders: string[];
  source: 'manual' | 'google_cal' | 'apple_cal';
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  audioUrl?: string;
  metadata?: {
    duration?: number;
    confidence?: number;
    actionItems?: string[];
  };
}

export interface Conversation {
  id: string;
  userId: string;
  messages: Message[];
  context: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Transcript {
  id: string;
  userId: string;
  title: string;
  content: string;
  actionItems: string[];
  participants: string[];
  duration: number;
  recordedAt: string;
  createdAt: string;
}

export interface VoiceState {
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  audioLevel: number;
  error?: string;
}

export interface AppTheme {
  background: string;
  surface: string;
  surfaceSecondary: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  accent: string;
  accentSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

export interface UserDetailsData {
  fullName: string;
  preferredName: string;
  title?: string;
  email?: string;
  password?: string;
}

export type RootStackParamList = {
  Splash: undefined;
  LanguageSelection: undefined;
  WelcomeAuth: undefined;
  SignIn: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  ResetPasswordOTP: { email: string };
  ResetPassword: { email: string; code: string };
  TermsPrivacy: undefined;
  UserDetails: undefined;
  PhoneInput: { userDetails?: UserDetailsData };
  OTPVerification: {
    phone?: string;
    email?: string;
    verificationType: 'phone' | 'email';
    userDetails?: UserDetailsData;
  };
  EmailInput: { phone: string; userDetails?: UserDetailsData };
  PasswordCreation: { phone: string; email: string; userDetails?: UserDetailsData };
  Congratulations: {
    phone: string;
    email: string;
    userDetails?: UserDetailsData;
    user?: User;
    token?: string;
    passwordGenerated?: boolean;
  };
  UserProfileSetup: {
    phone?: string;
    email?: string;
    userDetails?: UserDetailsData;
    user?: User;
    token?: string;
    passwordGenerated?: boolean;
  };
  AssistantNaming: {
    phone?: string;
    email?: string;
    userDetails?: UserDetailsData;
    user?: User;
    token?: string;
    passwordGenerated?: boolean;
  };
  AssistantGender: undefined;
  AssistantConversation: undefined;
  Chat: undefined;
  AssistantPersonalization: undefined;
  AgentPersonality: undefined;
  AgentAvailability: undefined;
  AgentTaskCategories: undefined;
  AgentLearning: undefined;
  AgentPrivacy: undefined;
  AssistantProfileImage: undefined;
  Dashboard: undefined;
  Main: undefined;
  Home: undefined;
  Conversation: { conversationId?: string };
  Tasks: undefined;
  Calendar: undefined;
  Settings: undefined;
  Profile: undefined;
  Integration: undefined;
  Analytics: undefined;
  NotificationFeed: undefined;
  EmailManagement: undefined;
  MeetingPrep: undefined;
  DailyBriefing: undefined;
  QuickCapture: undefined;
  SmartSearch: undefined;
  DocumentIntelligence: undefined;
  FinancialDashboard: undefined;
  TeamManagement: undefined;
  AddTask: undefined;
  AddReminder: undefined;
  AddEvent: undefined;
  QuickNote: undefined;
  TaskDetail: { taskId: string };
  EventDetail: { eventId: string };
  ReminderDetail: { reminderId: string };
  Subscription: undefined;
  EditProfile: undefined;
  AIAssistant: undefined;
  VoiceAssistant: undefined;
  Notifications: undefined;
  PrivacySecurity: undefined;
  HelpSupport: undefined;
  AgentCreativity: undefined;
  AgentCommunicationStyle: undefined;
  AgentProactivity: undefined;
  SpecializedCapability: { type: 'research' | 'deals' | 'travel' | 'documents' | 'financial' | 'events' };
  ChangePasscode: undefined;
  TwoFactorAuth: undefined;
  ActiveSessions: undefined;
};

export type TabParamList = {
  Home: undefined;
  Tasks: undefined;
  Calendar: undefined;
  Conversation: { conversationId?: string };
  Profile: undefined;
};

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface VoiceCommand {
  command: string;
  confidence: number;
  intent: 'create_task' | 'schedule_event' | 'ask_question' | 'get_summary' | 'other';
  entities?: {
    date?: string;
    time?: string;
    location?: string;
    person?: string;
    task?: string;
  };
}