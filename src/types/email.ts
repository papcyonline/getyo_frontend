export interface EmailAccount {
  id: string;
  email: string;
  provider: 'gmail' | 'outlook' | 'yahoo' | 'icloud' | 'imap';
  displayName: string;
  profileImage?: string;
  isDefault: boolean;
  accessToken?: string;
  refreshToken?: string;
  lastSyncedAt?: string;
  name?: string;
}

export interface Email {
  id: string;
  accountId: string;
  threadId: string;
  messageId: string;
  subject: string;
  from: EmailAddress;
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  body: string;
  bodyHtml?: string;
  preview: string;
  date: string;
  isRead: boolean;
  isStarred: boolean;
  hasAttachments: boolean;
  attachments?: EmailAttachment[];
  labels?: string[];
  folder: EmailFolder;
  importance?: 'low' | 'normal' | 'high';
}

export interface EmailAddress {
  name?: string;
  email: string;
}

export interface EmailAttachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  url?: string;
  isInline?: boolean;
}

export interface EmailThread {
  id: string;
  subject: string;
  participants: EmailAddress[];
  preview: string;
  date: string;
  messageCount: number;
  isRead: boolean;
  isStarred: boolean;
  hasAttachments: boolean;
  labels?: string[];
  folder: EmailFolder;
  messages?: Email[];
}

export type EmailFolder = 'inbox' | 'sent' | 'drafts' | 'trash' | 'spam' | 'archive';

export interface EmailDraft {
  id?: string;
  accountId: string;
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  subject: string;
  body: string;
  bodyHtml?: string;
  attachments?: EmailAttachment[];
  inReplyTo?: string;
  isDraft: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface EmailFilter {
  folder?: EmailFolder;
  isRead?: boolean;
  isStarred?: boolean;
  hasAttachments?: boolean;
  from?: string;
  to?: string;
  subject?: string;
  dateFrom?: string;
  dateTo?: string;
  labels?: string[];
  searchQuery?: string;
}

export interface EmailSyncStatus {
  accountId: string;
  isSyncing: boolean;
  lastSyncedAt?: string;
  error?: string;
  newEmailCount: number;
}

export interface SmartReply {
  id: string;
  text: string;
  tone: 'professional' | 'casual' | 'friendly';
  confidence: number;
}

export interface EmailOAuthConfig {
  provider: 'gmail' | 'outlook' | 'yahoo';
  clientId: string;
  redirectUri: string;
  scopes: string[];
}
