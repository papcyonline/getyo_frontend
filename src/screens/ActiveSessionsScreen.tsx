import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { RootState } from '../store';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

interface Session {
  id: string;
  deviceName: string;
  deviceType: 'mobile' | 'desktop' | 'tablet' | 'web';
  location: string;
  ipAddress: string;
  lastActive: Date;
  isCurrent: boolean;
}

const ActiveSessionsScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const theme = useSelector((state: RootState) => state.theme.theme);

  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const data = await api.getActiveSessions();

      // Map backend response to frontend interface
      const mappedSessions: Session[] = data.map((session: any) => ({
        id: session._id,
        deviceName: session.deviceName,
        deviceType: session.deviceType,
        location: session.location,
        ipAddress: session.ipAddress,
        lastActive: new Date(session.lastActive),
        isCurrent: session.isCurrent,
      }));

      setSessions(mappedSessions);
    } catch (error: any) {
      console.error('Failed to load sessions:', error);
      const errorMessage = error?.response?.data?.error || 'Failed to load active sessions';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleTerminateSession = (sessionId: string, deviceName: string) => {
    Alert.alert(
      'Terminate Session',
      `Are you sure you want to sign out from ${deviceName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.terminateSession(sessionId);
              // Remove the terminated session from local state
              setSessions(sessions.filter(s => s.id !== sessionId));
              Alert.alert('Success', 'Session terminated successfully');
            } catch (error: any) {
              console.error('Failed to terminate session:', error);
              const errorMessage = error?.response?.data?.error || 'Failed to terminate session';
              Alert.alert('Error', errorMessage);
            }
          }
        }
      ]
    );
  };

  const handleTerminateAllSessions = () => {
    const otherSessions = sessions.filter(s => !s.isCurrent);
    if (otherSessions.length === 0) {
      Alert.alert('Info', 'No other sessions to terminate');
      return;
    }

    Alert.alert(
      'Terminate All Other Sessions',
      `This will sign you out from ${otherSessions.length} other device(s). Your current session will remain active.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out All',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await api.terminateAllOtherSessions();
              // Keep only the current session
              setSessions(sessions.filter(s => s.isCurrent));
              Alert.alert('Success', `${result.terminatedCount} session(s) terminated successfully`);
            } catch (error: any) {
              console.error('Failed to terminate all sessions:', error);
              const errorMessage = error?.response?.data?.error || 'Failed to terminate sessions';
              Alert.alert('Error', errorMessage);
            }
          }
        }
      ]
    );
  };

  const getDeviceIcon = (deviceType: string): any => {
    switch (deviceType) {
      case 'mobile':
        return 'phone-portrait';
      case 'tablet':
        return 'tablet-portrait';
      case 'desktop':
        return 'desktop';
      case 'web':
        return 'globe';
      default:
        return 'phone-portrait';
    }
  };

  const formatLastActive = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#C9A96E" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border, paddingTop: insets.top }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackPress}
          >
            <Ionicons name="chevron-back" size={28} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Active Sessions</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Info Section */}
        <View style={[styles.infoCard, { backgroundColor: theme.surface }]}>
          <View style={[styles.infoIconContainer, { backgroundColor: 'rgba(201, 169, 110, 0.1)' }]}>
            <Ionicons name="shield-checkmark" size={24} color="#C9A96E" />
          </View>
          <Text style={[styles.infoTitle, { color: theme.text }]}>
            Manage Your Devices
          </Text>
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>
            These are the devices currently signed in to your account. If you see a session you don't recognize, sign it out immediately.
          </Text>
        </View>

        {/* Current Session */}
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>CURRENT SESSION</Text>
          {sessions.filter(s => s.isCurrent).map((session) => (
            <View key={session.id} style={[styles.sessionCard, { borderBottomColor: theme.border }]}>
              <View style={[styles.deviceIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                <Ionicons name={getDeviceIcon(session.deviceType)} size={24} color="#10b981" />
              </View>
              <View style={styles.sessionInfo}>
                <View style={styles.sessionHeader}>
                  <Text style={[styles.deviceName, { color: theme.text }]}>
                    {session.deviceName}
                  </Text>
                  <View style={styles.currentBadge}>
                    <Text style={styles.currentBadgeText}>Current</Text>
                  </View>
                </View>
                <Text style={[styles.location, { color: theme.textSecondary }]}>
                  <Ionicons name="location" size={12} color={theme.textSecondary} /> {session.location}
                </Text>
                <Text style={[styles.details, { color: theme.textTertiary }]}>
                  {session.ipAddress} • {formatLastActive(session.lastActive)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Other Sessions */}
        {sessions.filter(s => !s.isCurrent).length > 0 && (
          <View style={[styles.section, { backgroundColor: theme.surface }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>OTHER SESSIONS</Text>
              <TouchableOpacity onPress={handleTerminateAllSessions}>
                <Text style={styles.terminateAllText}>Sign Out All</Text>
              </TouchableOpacity>
            </View>
            {sessions.filter(s => !s.isCurrent).map((session) => (
              <View key={session.id} style={[styles.sessionCard, { borderBottomColor: theme.border }]}>
                <View style={[styles.deviceIcon, { backgroundColor: 'rgba(201, 169, 110, 0.1)' }]}>
                  <Ionicons name={getDeviceIcon(session.deviceType)} size={24} color="#C9A96E" />
                </View>
                <View style={styles.sessionInfo}>
                  <Text style={[styles.deviceName, { color: theme.text }]}>
                    {session.deviceName}
                  </Text>
                  <Text style={[styles.location, { color: theme.textSecondary }]}>
                    <Ionicons name="location" size={12} color={theme.textSecondary} /> {session.location}
                  </Text>
                  <Text style={[styles.details, { color: theme.textTertiary }]}>
                    {session.ipAddress} • {formatLastActive(session.lastActive)}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.terminateButton}
                  onPress={() => handleTerminateSession(session.id, session.deviceName)}
                >
                  <Ionicons name="close-circle" size={24} color={theme.error || '#ef4444'} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Security Tips */}
        <View style={[styles.tipsCard, { backgroundColor: theme.surface }]}>
          <Text style={[styles.tipsTitle, { color: theme.text }]}>Security Tips</Text>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={18} color="#10b981" />
            <Text style={[styles.tipText, { color: theme.textSecondary }]}>
              Regularly review your active sessions
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={18} color="#10b981" />
            <Text style={[styles.tipText, { color: theme.textSecondary }]}>
              Sign out from devices you no longer use
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={18} color="#10b981" />
            <Text style={[styles.tipText, { color: theme.textSecondary }]}>
              Enable two-factor authentication for extra security
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 0.5,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginRight: 48,
  },
  headerRight: {
    width: 40,
    height: 40,
  },
  infoCard: {
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  infoIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 16,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  terminateAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  deviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  currentBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  currentBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  location: {
    fontSize: 13,
    marginBottom: 2,
  },
  details: {
    fontSize: 12,
  },
  terminateButton: {
    padding: 8,
  },
  tipsCard: {
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 16,
    padding: 16,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
  },
});

export default ActiveSessionsScreen;
