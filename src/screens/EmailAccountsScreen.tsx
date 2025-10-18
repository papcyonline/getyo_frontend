import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { EmailAccount } from '../types/email';
import emailService from '../services/emailService';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

type EmailAccountsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'EmailAccounts'>;

const EmailAccountsScreen: React.FC = () => {
  const navigation = useNavigation<EmailAccountsScreenNavigationProp>();
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [connecting, setConnecting] = useState<string | null>(null);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const data = await emailService.getAccounts();
      setAccounts(data);
    } catch (error: any) {
      console.error('Failed to load accounts:', error);
      Alert.alert('Error', 'Failed to load email accounts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadAccounts();
  };

  const handleConnectGmail = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setConnecting('gmail');
    try {
      const account = await emailService.connectAccount('gmail');
      setAccounts([...accounts, account]);
      Alert.alert('Success', 'Gmail account connected successfully');
    } catch (error: any) {
      console.error('Failed to connect Gmail:', error);
      Alert.alert('Error', error.message || 'Failed to connect Gmail account');
    } finally {
      setConnecting(null);
    }
  };

  const handleConnectOutlook = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setConnecting('outlook');
    try {
      const account = await emailService.connectAccount('outlook');
      setAccounts([...accounts, account]);
      Alert.alert('Success', 'Outlook account connected successfully');
    } catch (error: any) {
      console.error('Failed to connect Outlook:', error);
      Alert.alert('Error', error.message || 'Failed to connect Outlook account');
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = (account: EmailAccount) => {
    Alert.alert(
      'Disconnect Account',
      `Are you sure you want to disconnect ${account.email}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            try {
              await emailService.disconnectAccount(account.id);
              setAccounts(accounts.filter(a => a.id !== account.id));
              Alert.alert('Success', 'Account disconnected');
            } catch (error: any) {
              console.error('Failed to disconnect account:', error);
              Alert.alert('Error', 'Failed to disconnect account');
            }
          },
        },
      ]
    );
  };

  const handleSync = async (account: EmailAccount) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await emailService.syncAccount(account.id);
      Alert.alert('Success', 'Account synced successfully');
      loadAccounts();
    } catch (error: any) {
      console.error('Failed to sync account:', error);
      Alert.alert('Error', 'Failed to sync account');
    }
  };

  const getProviderIcon = (provider: 'gmail' | 'outlook' | 'imap') => {
    switch (provider) {
      case 'gmail':
        return 'logo-google';
      case 'outlook':
        return 'logo-microsoft';
      default:
        return 'mail';
    }
  };

  const getProviderColor = (provider: 'gmail' | 'outlook' | 'imap') => {
    switch (provider) {
      case 'gmail':
        return '#EA4335';
      case 'outlook':
        return '#0078D4';
      default:
        return '#667EEA';
    }
  };

  const renderAccount = (account: EmailAccount) => {
    return (
      <View key={account.id} style={styles.accountCard}>
        <View style={styles.accountHeader}>
          <View style={[styles.providerIcon, { backgroundColor: getProviderColor(account.provider) }]}>
            <Ionicons name={getProviderIcon(account.provider)} size={24} color="#FFFFFF" />
          </View>
          <View style={styles.accountInfo}>
            <Text style={styles.accountName}>{account.displayName}</Text>
            <Text style={styles.accountEmail}>{account.email}</Text>
            {account.lastSyncedAt && (
              <Text style={styles.lastSync}>
                Last synced: {new Date(account.lastSyncedAt).toLocaleString()}
              </Text>
            )}
          </View>
          {account.isDefault && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultBadgeText}>Default</Text>
            </View>
          )}
        </View>

        <View style={styles.accountActions}>
          <TouchableOpacity
            onPress={() => handleSync(account)}
            style={styles.accountActionButton}
          >
            <Ionicons name="sync-outline" size={18} color="#667EEA" />
            <Text style={styles.accountActionText}>Sync</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleDisconnect(account)}
            style={[styles.accountActionButton, styles.accountActionButtonDanger]}
          >
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
            <Text style={[styles.accountActionText, styles.accountActionTextDanger]}>
              Disconnect
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <LinearGradient colors={['#000000', '#0A0A0A']} style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Email Accounts</Text>
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
        <Text style={styles.headerTitle}>Email Accounts</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#667EEA"
          />
        }
      >
        <Text style={styles.sectionTitle}>Connected Accounts</Text>

        {accounts.length > 0 ? (
          accounts.map((account) => renderAccount(account))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="mail-outline" size={64} color="rgba(255, 255, 255, 0.2)" />
            <Text style={styles.emptyStateTitle}>No accounts connected</Text>
            <Text style={styles.emptyStateText}>
              Connect your email accounts to get started
            </Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Add Account</Text>

        <TouchableOpacity
          onPress={handleConnectGmail}
          style={styles.connectButton}
          disabled={connecting === 'gmail'}
        >
          <View style={styles.connectButtonContent}>
            <View style={[styles.connectIcon, { backgroundColor: '#EA4335' }]}>
              <Ionicons name="logo-google" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.connectInfo}>
              <Text style={styles.connectTitle}>Connect Gmail</Text>
              <Text style={styles.connectDescription}>
                Connect your Google account
              </Text>
            </View>
            {connecting === 'gmail' ? (
              <ActivityIndicator size="small" color="#667EEA" />
            ) : (
              <Ionicons name="chevron-forward" size={24} color="rgba(255, 255, 255, 0.3)" />
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleConnectOutlook}
          style={styles.connectButton}
          disabled={connecting === 'outlook'}
        >
          <View style={styles.connectButtonContent}>
            <View style={[styles.connectIcon, { backgroundColor: '#0078D4' }]}>
              <Ionicons name="logo-microsoft" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.connectInfo}>
              <Text style={styles.connectTitle}>Connect Outlook</Text>
              <Text style={styles.connectDescription}>
                Connect your Microsoft account
              </Text>
            </View>
            {connecting === 'outlook' ? (
              <ActivityIndicator size="small" color="#667EEA" />
            ) : (
              <Ionicons name="chevron-forward" size={24} color="rgba(255, 255, 255, 0.3)" />
            )}
          </View>
        </TouchableOpacity>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
    marginTop: 8,
  },
  accountCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  accountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  providerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  accountEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  lastSync: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  defaultBadge: {
    backgroundColor: '#667EEA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  defaultBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  accountActions: {
    flexDirection: 'row',
    gap: 12,
  },
  accountActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#667EEA',
    gap: 6,
  },
  accountActionButtonDanger: {
    borderColor: '#EF4444',
  },
  accountActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#667EEA',
  },
  accountActionTextDanger: {
    color: '#EF4444',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
  connectButton: {
    marginBottom: 16,
  },
  connectButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  connectIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  connectInfo: {
    flex: 1,
  },
  connectTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  connectDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default EmailAccountsScreen;
