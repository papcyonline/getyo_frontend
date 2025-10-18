import axios from 'axios';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Email,
  EmailThread,
  EmailDraft,
  EmailAccount,
  EmailFilter,
  EmailSyncStatus,
  SmartReply,
  EmailOAuthConfig,
} from '../types/email';
import ApiService from './api';

// Enable browser dismissal on Android
WebBrowser.maybeCompleteAuthSession();

class EmailService {
  private readonly STORAGE_KEY = 'email_accounts';
  private readonly baseURL = ApiService.getBaseURL();

  // OAuth Configuration
  private getOAuthConfig(provider: 'gmail' | 'outlook' | 'yahoo'): EmailOAuthConfig {
    if (provider === 'gmail') {
      return {
        provider: 'gmail',
        clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '',
        redirectUri: AuthSession.makeRedirectUri({
          scheme: 'yo-app',
          path: 'auth/gmail/callback',
        }),
        scopes: [
          'https://www.googleapis.com/auth/gmail.readonly',
          'https://www.googleapis.com/auth/gmail.send',
          'https://www.googleapis.com/auth/gmail.compose',
          'https://www.googleapis.com/auth/gmail.modify',
          'https://www.googleapis.com/auth/userinfo.email',
          'https://www.googleapis.com/auth/userinfo.profile',
        ],
      };
    } else if (provider === 'outlook') {
      return {
        provider: 'outlook',
        clientId: process.env.EXPO_PUBLIC_OUTLOOK_CLIENT_ID || '',
        redirectUri: AuthSession.makeRedirectUri({
          scheme: 'yo-app',
          path: 'auth/outlook/callback',
        }),
        scopes: [
          'https://graph.microsoft.com/Mail.Read',
          'https://graph.microsoft.com/Mail.Send',
          'https://graph.microsoft.com/Mail.ReadWrite',
          'https://graph.microsoft.com/User.Read',
          'offline_access',
        ],
      };
    } else {
      // Yahoo Mail
      return {
        provider: 'yahoo',
        clientId: process.env.EXPO_PUBLIC_YAHOO_CLIENT_ID || '',
        redirectUri: AuthSession.makeRedirectUri({
          scheme: 'yo-app',
          path: 'auth/yahoo/callback',
        }),
        scopes: [
          'mail-r',
          'mail-w',
        ],
      };
    }
  }

  /**
   * Connect email account using OAuth
   */
  async connectAccount(provider: 'gmail' | 'outlook' | 'yahoo'): Promise<EmailAccount> {
    try {
      const config = this.getOAuthConfig(provider);

      // Build authorization URL
      let authUrl: string;
      if (provider === 'gmail') {
        authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${config.clientId}&redirect_uri=${config.redirectUri}&response_type=code&scope=${encodeURIComponent(config.scopes.join(' '))}&access_type=offline&prompt=consent`;
      } else if (provider === 'outlook') {
        authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${config.clientId}&redirect_uri=${config.redirectUri}&response_type=code&scope=${encodeURIComponent(config.scopes.join(' '))}&response_mode=query&prompt=consent`;
      } else {
        // Yahoo
        authUrl = `https://api.login.yahoo.com/oauth2/request_auth?client_id=${config.clientId}&redirect_uri=${config.redirectUri}&response_type=code&scope=${encodeURIComponent(config.scopes.join(' '))}`;
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
        `${this.baseURL}/email/${provider}/connect`,
        { code },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to connect account');
      }

      const account: EmailAccount = response.data.data;

      console.log('Email account connected successfully:', account.email);

      // Store account locally
      await this.saveAccountLocally(account);

      return account;
    } catch (error: any) {
      console.error('Failed to connect email account:', error);
      throw new Error(error.message || 'Failed to connect email account');
    }
  }

  /**
   * Connect iCloud Mail account using App-Specific Password
   */
  async connectICloudAccount(email: string, appPassword: string, name?: string): Promise<EmailAccount> {
    try {
      console.log('Connecting iCloud Mail account...');

      // Exchange credentials via backend
      const token = await ApiService.getAuthToken();
      const response = await axios.post(
        `${this.baseURL}/email/icloud/connect`,
        { email, appPassword, name },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to connect iCloud account');
      }

      const account: EmailAccount = response.data.data;

      console.log('iCloud Mail account connected successfully:', account.email);

      // Store account locally
      await this.saveAccountLocally(account);

      return account;
    } catch (error: any) {
      console.error('Failed to connect iCloud account:', error);
      throw new Error(error.message || 'Failed to connect iCloud Mail account');
    }
  }

  /**
   * Get all connected email accounts
   */
  async getAccounts(): Promise<EmailAccount[]> {
    try {
      const token = await ApiService.getAuthToken();
      const response = await axios.get(`${this.baseURL}/email/accounts`, {
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
      console.error('Failed to get email accounts:', error);
      // Fallback to local storage
      return await this.getAccountsFromStorage();
    }
  }

  /**
   * Get emails with optional filters
   */
  async getEmails(
    accountId: string,
    filter?: EmailFilter,
    page: number = 1,
    limit: number = 50
  ): Promise<{ emails: Email[]; total: number; hasMore: boolean }> {
    try {
      const token = await ApiService.getAuthToken();

      // Build Gmail query string from filter
      let q = '';
      if (filter?.folder === 'inbox') q = 'in:inbox';
      if (filter?.folder === 'sent') q = 'in:sent';
      if (filter?.folder === 'drafts') q = 'in:drafts';
      if (filter?.isUnread !== undefined) q += ' is:unread';
      if (filter?.isStarred) q += ' is:starred';
      if (filter?.searchQuery) q += ` ${filter.searchQuery}`;

      const response = await axios.get(`${this.baseURL}/email/gmail/messages`, {
        params: {
          accountId,
          maxResults: limit,
          q: q.trim() || undefined,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        const messages = response.data.data.messages || [];
        return {
          emails: messages,
          total: response.data.data.resultSizeEstimate || messages.length,
          hasMore: !!response.data.data.nextPageToken,
        };
      }

      return { emails: [], total: 0, hasMore: false };
    } catch (error: any) {
      console.error('Failed to get emails:', error);
      throw error;
    }
  }

  /**
   * Get email threads (conversation view)
   */
  async getThreads(
    accountId: string,
    filter?: EmailFilter,
    page: number = 1,
    limit: number = 50
  ): Promise<{ threads: EmailThread[]; total: number; hasMore: boolean }> {
    try {
      const response = await axios.get(`${this.baseURL}/email/threads`, {
        params: {
          accountId,
          ...filter,
          page,
          limit,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('Failed to get email threads:', error);
      throw error;
    }
  }

  /**
   * Get single email by ID
   */
  async getEmail(accountId: string, emailId: string): Promise<Email> {
    try {
      const token = await ApiService.getAuthToken();
      const response = await axios.get(`${this.baseURL}/email/gmail/messages/${emailId}`, {
        params: { accountId },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        const messageData = response.data.data;

        // Transform Gmail API response to Email type
        const email: Email = {
          id: messageData.id,
          from: {
            name: this.extractName(messageData.from),
            email: this.extractEmail(messageData.from),
          },
          to: messageData.to ? messageData.to.split(',').map((addr: string) => ({
            name: this.extractName(addr.trim()),
            email: this.extractEmail(addr.trim()),
          })) : [],
          cc: messageData.cc ? messageData.cc.split(',').map((addr: string) => ({
            name: this.extractName(addr.trim()),
            email: this.extractEmail(addr.trim()),
          })) : [],
          subject: messageData.subject || '(No Subject)',
          body: messageData.body || messageData.snippet || '',
          date: messageData.date,
          isRead: messageData.isRead,
          isStarred: messageData.isStarred,
          hasAttachments: false,
          attachments: [],
        };

        return email;
      }

      throw new Error('Failed to get email');
    } catch (error: any) {
      console.error('Failed to get email:', error);
      throw error;
    }
  }

  // Helper methods to extract name and email from format "Name <email@example.com>"
  private extractName(address: string): string {
    const match = address.match(/^(.+?)\s*<.+>$/);
    return match ? match[1].trim() : '';
  }

  private extractEmail(address: string): string {
    const match = address.match(/<(.+?)>/);
    return match ? match[1].trim() : address.trim();
  }

  /**
   * Get email thread with all messages
   */
  async getThread(accountId: string, threadId: string): Promise<EmailThread> {
    try {
      // For now, get the message as a single-message thread
      // TODO: Implement proper thread fetching from Gmail API
      const email = await this.getEmail(accountId, threadId);

      const thread: EmailThread = {
        id: threadId,
        subject: email.subject,
        messages: [email],
        participants: [email.from, ...email.to, ...(email.cc || [])],
        isRead: email.isRead,
        isStarred: email.isStarred,
        hasAttachments: email.hasAttachments,
        lastMessageDate: email.date,
      };

      return thread;
    } catch (error: any) {
      console.error('Failed to get email thread:', error);
      throw error;
    }
  }

  /**
   * Send email
   */
  async sendEmail(accountId: string, draft: EmailDraft): Promise<Email> {
    try {
      const token = await ApiService.getAuthToken();

      // Convert EmailDraft to Gmail send format
      const payload = {
        accountId,
        to: draft.to.map(addr => addr.email).join(','),
        cc: draft.cc?.map(addr => addr.email).join(','),
        bcc: draft.bcc?.map(addr => addr.email).join(','),
        subject: draft.subject,
        body: draft.body,
      };

      const response = await axios.post(
        `${this.baseURL}/email/gmail/send`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        // Return a basic Email object
        return {
          id: response.data.data.id,
          from: { name: '', email: '' }, // Will be filled by backend
          to: draft.to,
          cc: draft.cc,
          subject: draft.subject,
          body: draft.body,
          date: new Date().toISOString(),
          isRead: true,
          isStarred: false,
          hasAttachments: false,
          attachments: [],
        };
      }

      throw new Error('Failed to send email');
    } catch (error: any) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }

  /**
   * Save draft
   */
  async saveDraft(accountId: string, draft: EmailDraft): Promise<EmailDraft> {
    try {
      const response = await axios.post(`${this.baseURL}/email/drafts`, {
        accountId,
        ...draft,
      });

      return response.data.draft;
    } catch (error: any) {
      console.error('Failed to save draft:', error);
      throw error;
    }
  }

  /**
   * Get drafts
   */
  async getDrafts(accountId: string): Promise<EmailDraft[]> {
    try {
      const response = await axios.get(`${this.baseURL}/email/drafts`, {
        params: { accountId },
      });

      return response.data.drafts || [];
    } catch (error: any) {
      console.error('Failed to get drafts:', error);
      throw error;
    }
  }

  /**
   * Delete draft
   */
  async deleteDraft(accountId: string, draftId: string): Promise<void> {
    try {
      await axios.delete(`${this.baseURL}/email/drafts/${draftId}`, {
        params: { accountId },
      });
    } catch (error: any) {
      console.error('Failed to delete draft:', error);
      throw error;
    }
  }

  /**
   * Mark email as read/unread
   */
  async markAsRead(accountId: string, emailId: string, isRead: boolean): Promise<void> {
    try {
      await axios.patch(`${this.baseURL}/email/messages/${emailId}/read`, {
        accountId,
        isRead,
      });
    } catch (error: any) {
      console.error('Failed to mark email as read:', error);
      throw error;
    }
  }

  /**
   * Star/unstar email
   */
  async toggleStar(accountId: string, emailId: string, isStarred: boolean): Promise<void> {
    try {
      await axios.patch(`${this.baseURL}/email/messages/${emailId}/star`, {
        accountId,
        isStarred,
      });
    } catch (error: any) {
      console.error('Failed to toggle star:', error);
      throw error;
    }
  }

  /**
   * Move email to folder
   */
  async moveToFolder(
    accountId: string,
    emailId: string,
    folder: 'inbox' | 'trash' | 'spam' | 'archive'
  ): Promise<void> {
    try {
      await axios.patch(`${this.baseURL}/email/messages/${emailId}/move`, {
        accountId,
        folder,
      });
    } catch (error: any) {
      console.error('Failed to move email:', error);
      throw error;
    }
  }

  /**
   * Delete email permanently
   */
  async deleteEmail(accountId: string, emailId: string): Promise<void> {
    try {
      await axios.delete(`${this.baseURL}/email/messages/${emailId}`, {
        params: { accountId },
      });
    } catch (error: any) {
      console.error('Failed to delete email:', error);
      throw error;
    }
  }

  /**
   * Search emails
   */
  async searchEmails(
    accountId: string,
    query: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{ emails: Email[]; total: number; hasMore: boolean }> {
    try {
      const response = await axios.get(`${this.baseURL}/email/search`, {
        params: {
          accountId,
          q: query,
          page,
          limit,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('Failed to search emails:', error);
      throw error;
    }
  }

  /**
   * Get smart reply suggestions
   */
  async getSmartReplies(accountId: string, emailId: string): Promise<SmartReply[]> {
    try {
      const response = await axios.get(`${this.baseURL}/email/messages/${emailId}/smart-replies`, {
        params: { accountId },
      });

      return response.data.replies || [];
    } catch (error: any) {
      console.error('Failed to get smart replies:', error);
      return [];
    }
  }

  /**
   * Sync email account
   */
  async syncAccount(accountId: string): Promise<EmailSyncStatus> {
    try {
      const response = await axios.post(`${this.baseURL}/email/sync`, {
        accountId,
      });

      return response.data.status;
    } catch (error: any) {
      console.error('Failed to sync account:', error);
      throw error;
    }
  }

  /**
   * Get sync status
   */
  async getSyncStatus(accountId: string): Promise<EmailSyncStatus> {
    try {
      const response = await axios.get(`${this.baseURL}/email/sync/status`, {
        params: { accountId },
      });

      return response.data.status;
    } catch (error: any) {
      console.error('Failed to get sync status:', error);
      throw error;
    }
  }

  /**
   * Disconnect email account
   */
  async disconnectAccount(accountId: string): Promise<void> {
    try {
      const token = await ApiService.getAuthToken();
      await axios.delete(`${this.baseURL}/email/accounts/${accountId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      await this.removeAccountFromStorage(accountId);
    } catch (error: any) {
      console.error('Failed to disconnect account:', error);
      throw error;
    }
  }

  // Local storage helpers
  private async saveAccountLocally(account: EmailAccount): Promise<void> {
    try {
      const accounts = await this.getAccountsFromStorage();
      const existingIndex = accounts.findIndex((a) => a.id === account.id);

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

  private async getAccountsFromStorage(): Promise<EmailAccount[]> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to get accounts from storage:', error);
      return [];
    }
  }

  private async removeAccountFromStorage(accountId: string): Promise<void> {
    try {
      const accounts = await this.getAccountsFromStorage();
      const filtered = accounts.filter((a) => a.id !== accountId);
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Failed to remove account from storage:', error);
    }
  }
}

export default new EmailService();
