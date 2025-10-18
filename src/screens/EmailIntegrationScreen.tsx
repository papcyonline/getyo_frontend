import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { EmailAccount } from '../types/email';
import emailService from '../services/emailService';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

type EmailIntegrationScreenNavigationProp = StackNavigationProp<RootStackParamList, 'EmailIntegration'>;

interface EmailProvider {
  id: string;
  name: string;
  icon: any;
  color: string;
  type: 'gmail' | 'outlook';
  description: string;
}

const EmailIntegrationScreen: React.FC = () => {
  const navigation = useNavigation<EmailIntegrationScreenNavigationProp>();
  const [connectedAccounts, setConnectedAccounts] = useState<EmailAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);

  const emailProviders: EmailProvider[] = [
    {
      id: 'gmail',
      name: 'Gmail',
      icon: 'logo-google',
      color: '#EA4335',
      type: 'gmail',
      description: 'Connect your Google account',
    },
    {
      id: 'outlook',
      name: 'Outlook',
      icon: 'logo-microsoft',
      color: '#0078D4',
      type: 'outlook',
      description: 'Connect your Microsoft account',
    },
  ];

  useEffect(() => {
    loadConnectedAccounts();
  }, []);

  const loadConnectedAccounts = async () => {
    try {
      const accounts = await emailService.getAccounts();
      setConnectedAccounts(accounts);
    } catch (error: any) {
      console.error('Failed to load connected accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectProvider = async (provider: EmailProvider) => {
    // Check if already connected
    const alreadyConnected = connectedAccounts.some(
      (account) => account.provider === provider.type
    );

    if (alreadyConnected) {
      Alert.alert(
        'Already Connected',
        `You already have a ${provider.name} account connected. Would you like to manage it?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Manage',
            onPress: () => navigation.navigate('EmailAccounts'),
          },
        ]
      );
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setConnecting(provider.id);

    try {
      const account = await emailService.connectAccount(provider.type);
      setConnectedAccounts([...connectedAccounts, account]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', `${provider.name} account connected successfully!`);
    } catch (error: any) {
      console.error(`Failed to connect ${provider.name}:`, error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Connection Failed', error.message || `Failed to connect ${provider.name} account`);
    } finally {
      setConnecting(null);
    }
  };

  const isProviderConnected = (providerId: string) => {
    return connectedAccounts.some((account) => account.provider === providerId);
  };

  const getConnectedAccount = (providerId: string) => {
    return connectedAccounts.find((account) => account.provider === providerId);
  };

  const renderProviderCard = (provider: EmailProvider) => {
    const isConnected = isProviderConnected(provider.id);
    const account = getConnectedAccount(provider.id);
    const isConnecting = connecting === provider.id;

    return (
      <TouchableOpacity
        key={provider.id}
        style={styles.providerCard}
        onPress={() => handleConnectProvider(provider)}
        disabled={isConnecting}
        activeOpacity={0.7}
      >
        <View style={styles.providerContent}>
          <View style={[styles.providerIconContainer, { backgroundColor: provider.color }]}>
            <Ionicons name={provider.icon as any} size={40} color="#FFFFFF" />
          </View>

          <View style={styles.providerInfo}>
            <Text style={styles.providerName}>{provider.name}</Text>
            {isConnected && account ? (
              <Text style={styles.providerConnected}>
                Connected: {account.email}
              </Text>
            ) : (
              <Text style={styles.providerDescription}>{provider.description}</Text>
            )}
          </View>

          {isConnecting ? (
            <ActivityIndicator size="small" color={provider.color} />
          ) : isConnected ? (
            <View style={styles.connectedBadge}>
              <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            </View>
          ) : (
            <Ionicons name="chevron-forward" size={24} color="rgba(255, 255, 255, 0.3)" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <LinearGradient colors={['#000000', '#0A0A0A']} style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Email Integration</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#667EEA" />
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#000000', '#0A0A0A']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Email Integration</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('EmailAccounts')}
          style={styles.manageButton}
        >
          <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.introSection}>
          <View style={styles.iconCircle}>
            <Ionicons name="mail" size={40} color="#667EEA" />
          </View>
          <Text style={styles.introTitle}>Connect Your Email</Text>
          <Text style={styles.introDescription}>
            Connect your email accounts to manage all your emails in one place.
            Simply tap on your email provider below to get started.
          </Text>
        </View>

        <View style={styles.providersSection}>
          <Text style={styles.sectionTitle}>Available Providers</Text>
          {emailProviders.map((provider) => renderProviderCard(provider))}
        </View>

        {connectedAccounts.length > 0 && (
          <View style={styles.connectedSection}>
            <View style={styles.connectedHeader}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.connectedTitle}>
                {connectedAccounts.length} Account{connectedAccounts.length > 1 ? 's' : ''} Connected
              </Text>
            </View>
            <TouchableOpacity
              style={styles.manageAccountsButton}
              onPress={() => navigation.navigate('EmailAccounts')}
            >
              <LinearGradient
                colors={['#667EEA', '#764BA2']}
                style={styles.manageAccountsGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="settings-outline" size={20} color="#FFFFFF" />
                <Text style={styles.manageAccountsText}>Manage Connected Accounts</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Ionicons name="shield-checkmark" size={24} color="#10B981" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Secure Connection</Text>
              <Text style={styles.infoText}>
                Your email credentials are securely stored and encrypted
              </Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <Ionicons name="sync" size={24} color="#667EEA" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Auto-Sync</Text>
              <Text style={styles.infoText}>
                Your emails are automatically synced in the background
              </Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <Ionicons name="notifications" size={24} color="#F59E0B" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Smart Notifications</Text>
              <Text style={styles.infoText}>
                Get notified about important emails instantly
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 32,
  },
  manageButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  introSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  introTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  introDescription: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  providersSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  providerCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  providerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  providerIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  providerDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  providerConnected: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '500',
  },
  connectedBadge: {
    marginLeft: 8,
  },
  connectedSection: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  connectedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  connectedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
    marginLeft: 8,
  },
  manageAccountsButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  manageAccountsGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  manageAccountsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  infoSection: {
    gap: 16,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 18,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default EmailIntegrationScreen;
