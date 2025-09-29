import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SubscriptionTier = 'free' | 'starter' | 'executive' | 'enterprise';

export interface SubscriptionState {
  tier: SubscriptionTier;
  isActive: boolean;
  expiresAt?: Date;
  features: string[];
  limits: {
    aiConversations: number | 'unlimited';
    emailSummaries: number | 'unlimited';
    voiceMessages: number | 'unlimited';
    teamMembers: number | 'unlimited';
  };
}

export interface SubscriptionContextType {
  subscription: SubscriptionState;
  hasFeature: (feature: string) => boolean;
  checkLimit: (limitType: keyof SubscriptionState['limits']) => boolean;
  upgradeRequired: () => void;
  updateSubscription: (tier: SubscriptionTier) => void;
  isLoading: boolean;
}

const defaultSubscription: SubscriptionState = {
  tier: 'free',
  isActive: false,
  features: ['basic_chat', 'simple_tasks'],
  limits: {
    aiConversations: 10,
    emailSummaries: 0,
    voiceMessages: 5,
    teamMembers: 0,
  },
};

const subscriptionFeatures = {
  free: {
    features: ['basic_chat', 'simple_tasks'],
    limits: {
      aiConversations: 10,
      emailSummaries: 0,
      voiceMessages: 5,
      teamMembers: 0,
    },
  },
  starter: {
    features: [
      'basic_chat',
      'simple_tasks',
      'email_summaries',
      'calendar_integration',
      'basic_analytics'
    ],
    limits: {
      aiConversations: 100,
      emailSummaries: 10,
      voiceMessages: 50,
      teamMembers: 0,
    },
  },
  executive: {
    features: [
      'unlimited_chat',
      'advanced_tasks',
      'email_management',
      'meeting_prep',
      'document_intelligence',
      'financial_dashboard',
      'team_management',
      'advanced_analytics',
      'priority_support'
    ],
    limits: {
      aiConversations: 'unlimited' as const,
      emailSummaries: 'unlimited' as const,
      voiceMessages: 'unlimited' as const,
      teamMembers: 10,
    },
  },
  enterprise: {
    features: [
      'unlimited_chat',
      'advanced_tasks',
      'email_management',
      'meeting_prep',
      'document_intelligence',
      'financial_dashboard',
      'team_management',
      'advanced_analytics',
      'premium_support',
      'custom_integrations',
      'sso',
      'advanced_security'
    ],
    limits: {
      aiConversations: 'unlimited' as const,
      emailSummaries: 'unlimited' as const,
      voiceMessages: 'unlimited' as const,
      teamMembers: 'unlimited' as const,
    },
  },
};

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [subscription, setSubscription] = useState<SubscriptionState>(defaultSubscription);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      const stored = await AsyncStorage.getItem('subscription');
      if (stored) {
        const parsedSubscription = JSON.parse(stored);
        setSubscription({
          ...parsedSubscription,
          expiresAt: parsedSubscription.expiresAt ? new Date(parsedSubscription.expiresAt) : undefined,
        });
      }
    } catch (error) {
      console.error('Failed to load subscription:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSubscription = async (newSubscription: SubscriptionState) => {
    try {
      await AsyncStorage.setItem('subscription', JSON.stringify(newSubscription));
      setSubscription(newSubscription);
    } catch (error) {
      console.error('Failed to save subscription:', error);
    }
  };

  const updateSubscription = (tier: SubscriptionTier) => {
    const tierConfig = subscriptionFeatures[tier];
    const expiresAt = tier !== 'free' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : undefined; // 30 days from now

    const newSubscription: SubscriptionState = {
      tier,
      isActive: tier !== 'free',
      expiresAt,
      features: tierConfig.features,
      limits: tierConfig.limits,
    };

    saveSubscription(newSubscription);
  };

  const hasFeature = (feature: string): boolean => {
    return subscription.features.includes(feature) && subscription.isActive;
  };

  const checkLimit = (limitType: keyof SubscriptionState['limits']): boolean => {
    const limit = subscription.limits[limitType];
    if (limit === 'unlimited') return true;

    // In a real app, you'd track actual usage here
    // For demo purposes, we'll assume usage is within limits
    return true;
  };

  const upgradeRequired = () => {
    // In a real app, this would navigate to the subscription screen
    console.log('Upgrade required - navigate to subscription screen');
  };

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        hasFeature,
        checkLimit,
        upgradeRequired,
        updateSubscription,
        isLoading,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};