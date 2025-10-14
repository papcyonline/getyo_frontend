import apiService from './api';

export interface LegalContent {
  _id: string;
  type: 'terms' | 'privacy' | 'combined';
  version: string;
  language: string;
  title: string;
  content: {
    mainTitle?: string;
    subtitle?: string;
    sections: {
      title: string;
      content: string;
      subsections?: {
        title: string;
        content: string;
      }[];
    }[];
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  effectiveDate: string;
}

export interface UserLegalAcceptance {
  _id: string;
  userId: string;
  legalContentId: string;
  acceptedAt: string;
  ipAddress?: string;
  userAgent?: string;
  version: string;
  type: 'terms' | 'privacy' | 'combined';
}

export interface AcceptanceStatus {
  terms: boolean;
  privacy: boolean;
  combined: boolean;
}

class LegalService {
  // Get terms of service
  async getTerms(language: string = 'en'): Promise<LegalContent | null> {
    try {
      const response = await apiService['api'].get('/api/legal/terms', {
        params: { language }
      });
      return response.data.success ? response.data.data : null;
    } catch (error) {
      console.error('Failed to fetch terms:', error);
      return null;
    }
  }

  // Get privacy policy
  async getPrivacy(language: string = 'en'): Promise<LegalContent | null> {
    try {
      const response = await apiService['api'].get('/api/legal/privacy', {
        params: { language }
      });
      return response.data.success ? response.data.data : null;
    } catch (error) {
      console.error('Failed to fetch privacy policy:', error);
      return null;
    }
  }

  // Get combined terms and privacy
  async getCombined(language: string = 'en'): Promise<LegalContent | null> {
    try {
      // Try to fetch from API with short timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

      const response = await fetch(`${apiService.getBaseURL()}/api/legal/combined?language=${language}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.data : this.getFallbackContent(language);
    } catch (error) {
      console.warn('API unavailable, using fallback legal content:', error);
      // Return fallback content immediately
      return this.getFallbackContent(language);
    }
  }

  // Fallback legal content when API is unavailable
  private getFallbackContent(language: string = 'en'): LegalContent {
    return {
      _id: 'fallback',
      type: 'combined',
      version: '1.0',
      language,
      title: 'Terms of Service & Privacy Policy',
      content: {
        mainTitle: 'Yo! Personal Assistant - Terms & Privacy',
        sections: [
          {
            title: '1. Acceptance of Terms',
            content: 'By using Yo! Personal Assistant, you agree to these terms and our privacy policy.'
          },
          {
            title: '2. Privacy & Data',
            content: 'We collect and process your data to provide personalized assistant services. Your data is encrypted and secure.'
          },
          {
            title: '3. User Responsibilities',
            content: 'You are responsible for maintaining the confidentiality of your account credentials.'
          }
        ]
      },
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      effectiveDate: new Date().toISOString()
    };
  }

  // Get all legal content
  async getAllContent(language: string = 'en'): Promise<LegalContent[]> {
    try {
      const response = await apiService['api'].get('/api/legal/all', {
        params: { language }
      });
      return response.data.success ? response.data.data : [];
    } catch (error) {
      console.error('Failed to fetch all legal content:', error);
      return [];
    }
  }

  // Accept legal terms
  async acceptLegal(type: 'terms' | 'privacy' | 'combined'): Promise<UserLegalAcceptance | null> {
    try {
      // Generate a session ID for anonymous users (when no auth token exists)
      let sessionId: string | undefined;
      try {
        // Check if user is authenticated by checking for token
        const token = await require('@react-native-async-storage/async-storage').default.getItem('authToken');
        if (!token) {
          // Generate session ID for anonymous acceptance
          sessionId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          // Store session ID for potential future use
          await require('@react-native-async-storage/async-storage').default.setItem('legalSessionId', sessionId);
        }
      } catch (e) {
        // Generate session ID as fallback
        sessionId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }

      const payload: any = { type };
      if (sessionId) {
        payload.sessionId = sessionId;
      }

      const response = await apiService['api'].post('/api/legal/accept', payload);
      return response.data.success ? response.data.data : null;
    } catch (error) {
      console.error('Failed to accept legal terms:', error);
      throw error;
    }
  }

  // Check acceptance status for specific type
  async getAcceptanceStatus(type?: 'terms' | 'privacy' | 'combined'): Promise<AcceptanceStatus | { type: string; hasAccepted: boolean }> {
    try {
      const response = await apiService['api'].get('/api/legal/status', {
        params: type ? { type } : {}
      });
      return response.data.success ? response.data.data : (type ? { type, hasAccepted: false } : { terms: false, privacy: false, combined: false });
    } catch (error) {
      console.error('Failed to check acceptance status:', error);
      return type ? { type, hasAccepted: false } : { terms: false, privacy: false, combined: false };
    }
  }

  // Get user's acceptance history
  async getAcceptanceHistory(): Promise<UserLegalAcceptance[]> {
    try {
      const response = await apiService['api'].get('/api/legal/history');
      return response.data.success ? response.data.data : [];
    } catch (error) {
      console.error('Failed to fetch acceptance history:', error);
      return [];
    }
  }

  // Check if user needs to accept updated terms
  async needsAcceptance(): Promise<{ needsAcceptance: boolean; content?: LegalContent }> {
    try {
      const [content, status] = await Promise.all([
        this.getCombined(),
        this.getAcceptanceStatus('combined')
      ]);

      if (!content) {
        return { needsAcceptance: false };
      }

      const hasAccepted = typeof status === 'object' && 'hasAccepted' in status ? status.hasAccepted : false;

      return {
        needsAcceptance: !hasAccepted,
        content: !hasAccepted ? content : undefined
      };
    } catch (error) {
      console.error('Failed to check if acceptance needed:', error);
      return { needsAcceptance: false };
    }
  }

  // Helper method to check all legal requirements before critical actions
  async ensureComplianceForAction(): Promise<{ compliant: boolean; content?: LegalContent }> {
    try {
      const result = await this.needsAcceptance();
      return {
        compliant: !result.needsAcceptance,
        content: result.content
      };
    } catch (error) {
      console.error('Failed to ensure compliance:', error);
      return { compliant: false };
    }
  }
}

export default new LegalService();