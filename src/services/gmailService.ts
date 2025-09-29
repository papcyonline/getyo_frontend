import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';

WebBrowser.maybeCompleteAuthSession();

interface GmailEmail {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string;
  body: string;
  snippet: string;
  date: Date;
  isRead: boolean;
  hasAttachment: boolean;
  priority: 'high' | 'medium' | 'low';
  labels: string[];
}

class GmailService {
  private clientId = 'your-google-client-id'; // Replace with actual client ID
  private redirectUri = AuthSession.makeRedirectUri({
    scheme: 'yo-assistant'
  });

  private discovery = {
    authorizationEndpoint: 'https://accounts.google.com/o/oauth2/auth',
    tokenEndpoint: 'https://oauth2.googleapis.com/token',
    revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
  };

  async authenticateWithGoogle(): Promise<string | null> {
    try {
      const request = new AuthSession.AuthRequest({
        clientId: this.clientId,
        scopes: [
          'https://www.googleapis.com/auth/gmail.readonly',
          'https://www.googleapis.com/auth/gmail.compose',
          'https://www.googleapis.com/auth/gmail.modify'
        ],
        responseType: AuthSession.ResponseType.Code,
        redirectUri: this.redirectUri,
        extraParams: {
          access_type: 'offline',
        },
      });

      const result = await request.promptAsync(this.discovery);

      if (result.type === 'success') {
        const { code } = result.params;
        const tokens = await this.exchangeCodeForTokens(code);

        if (tokens) {
          await AsyncStorage.setItem('gmail_access_token', tokens.access_token);
          await AsyncStorage.setItem('gmail_refresh_token', tokens.refresh_token);
          return tokens.access_token;
        }
      }
      return null;
    } catch (error) {
      console.error('Gmail authentication error:', error);
      return null;
    }
  }

  private async exchangeCodeForTokens(code: string) {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.clientId,
          code,
          grant_type: 'authorization_code',
          redirect_uri: this.redirectUri,
        }),
      });

      return await response.json();
    } catch (error) {
      console.error('Token exchange error:', error);
      return null;
    }
  }

  async getAccessToken(): Promise<string | null> {
    try {
      let accessToken = await AsyncStorage.getItem('gmail_access_token');

      if (!accessToken) {
        // Try to refresh token
        const refreshToken = await AsyncStorage.getItem('gmail_refresh_token');
        if (refreshToken) {
          accessToken = await this.refreshAccessToken(refreshToken);
        }
      }

      return accessToken;
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  }

  private async refreshAccessToken(refreshToken: string): Promise<string | null> {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.clientId,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      const tokens = await response.json();
      if (tokens.access_token) {
        await AsyncStorage.setItem('gmail_access_token', tokens.access_token);
        return tokens.access_token;
      }
      return null;
    } catch (error) {
      console.error('Token refresh error:', error);
      return null;
    }
  }

  async fetchEmails(maxResults: number = 50): Promise<GmailEmail[]> {
    const accessToken = await this.getAccessToken();
    if (!accessToken) {
      throw new Error('No access token available');
    }

    try {
      // First, get list of message IDs
      const listResponse = await fetch(
        `https://www.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const listData = await listResponse.json();

      if (!listData.messages) {
        return [];
      }

      // Fetch full email data for each message
      const emailPromises = listData.messages.map((message: any) =>
        this.fetchEmailDetails(message.id, accessToken)
      );

      const emails = await Promise.all(emailPromises);
      return emails.filter((email): email is GmailEmail => email !== null);
    } catch (error) {
      console.error('Error fetching emails:', error);
      return [];
    }
  }

  private async fetchEmailDetails(messageId: string, accessToken: string): Promise<GmailEmail | null> {
    try {
      const response = await fetch(
        `https://www.googleapis.com/gmail/v1/users/me/messages/${messageId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const messageData = await response.json();

      if (!messageData.payload) {
        return null;
      }

      const headers = messageData.payload.headers;
      const subject = headers.find((h: any) => h.name === 'Subject')?.value || '';
      const from = headers.find((h: any) => h.name === 'From')?.value || '';
      const to = headers.find((h: any) => h.name === 'To')?.value || '';
      const dateHeader = headers.find((h: any) => h.name === 'Date')?.value || '';

      // Extract body
      let body = '';
      if (messageData.payload.body?.data) {
        body = this.decodeBase64(messageData.payload.body.data);
      } else if (messageData.payload.parts) {
        const textPart = messageData.payload.parts.find(
          (part: any) => part.mimeType === 'text/plain' && part.body?.data
        );
        if (textPart) {
          body = this.decodeBase64(textPart.body.data);
        }
      }

      // Determine priority (basic logic)
      const priority = this.determinePriority(subject, from, messageData.labelIds || []);

      return {
        id: messageData.id,
        threadId: messageData.threadId,
        subject,
        from,
        to,
        body,
        snippet: messageData.snippet || '',
        date: new Date(dateHeader),
        isRead: !messageData.labelIds?.includes('UNREAD'),
        hasAttachment: messageData.payload.parts?.some((part: any) =>
          part.filename && part.filename.length > 0
        ) || false,
        priority,
        labels: messageData.labelIds || [],
      };
    } catch (error) {
      console.error('Error fetching email details:', error);
      return null;
    }
  }

  private decodeBase64(data: string): string {
    try {
      return atob(data.replace(/-/g, '+').replace(/_/g, '/'));
    } catch (error) {
      console.error('Base64 decode error:', error);
      return '';
    }
  }

  private determinePriority(subject: string, from: string, labels: string[]): 'high' | 'medium' | 'low' {
    const highPriorityKeywords = ['urgent', 'asap', 'important', 'critical', 'emergency'];
    const subjectLower = subject.toLowerCase();

    if (highPriorityKeywords.some(keyword => subjectLower.includes(keyword))) {
      return 'high';
    }

    if (labels.includes('IMPORTANT')) {
      return 'high';
    }

    // Check if from important domains or VIPs
    const importantDomains = ['ceo@', 'president@', 'board@', 'urgent@'];
    if (importantDomains.some(domain => from.toLowerCase().includes(domain))) {
      return 'high';
    }

    return 'medium';
  }

  async markAsRead(messageId: string): Promise<boolean> {
    const accessToken = await this.getAccessToken();
    if (!accessToken) return false;

    try {
      const response = await fetch(
        `https://www.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            removeLabelIds: ['UNREAD'],
          }),
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Error marking email as read:', error);
      return false;
    }
  }

  async sendEmail(to: string, subject: string, body: string): Promise<boolean> {
    const accessToken = await this.getAccessToken();
    if (!accessToken) return false;

    try {
      const email = [
        `To: ${to}`,
        `Subject: ${subject}`,
        '',
        body
      ].join('\n');

      const encodedEmail = btoa(email).replace(/\+/g, '-').replace(/\//g, '_');

      const response = await fetch(
        'https://www.googleapis.com/gmail/v1/users/me/messages/send',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            raw: encodedEmail,
          }),
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  async generateEmailSummary(emails: GmailEmail[]): Promise<string> {
    // This would integrate with OpenAI/Claude API for real AI summaries
    // For now, return a basic summary
    const unreadCount = emails.filter(email => !email.isRead).length;
    const highPriorityCount = emails.filter(email => email.priority === 'high').length;

    return `You have ${unreadCount} unread emails, including ${highPriorityCount} high-priority messages that need immediate attention.`;
  }

  async disconnectAccount(): Promise<void> {
    await AsyncStorage.removeItem('gmail_access_token');
    await AsyncStorage.removeItem('gmail_refresh_token');
  }
}

export const gmailService = new GmailService();
export type { GmailEmail };