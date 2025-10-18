import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import IntegrationManager from '../services/integrationManager';
import {
  Integration,
  IntegrationType,
  IntegrationStatus,
  PermissionType,
} from '../types/integrations';

type IntegrationsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Integration'>;

type IntegrationCategory = 'device' | 'google' | 'microsoft' | 'social' | 'communication' | 'productivity';

const IntegrationsScreen: React.FC = () => {
  const navigation = useNavigation<IntegrationsScreenNavigationProp>();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<IntegrationType | null>(null);
  const [expandedSections, setExpandedSections] = useState<IntegrationCategory[]>([
    'device',
    'google',
    'microsoft',
    'social',
    'communication',
    'productivity',
  ]);

  // Category mapping for organizing integrations
  const getCategoryForIntegrationType = (type: IntegrationType): IntegrationCategory => {
    switch (type) {
      case IntegrationType.CALENDAR:
      case IntegrationType.CONTACTS:
      case IntegrationType.LOCATION:
      case IntegrationType.PHOTOS:
        return 'device';

      case IntegrationType.GMAIL:
      case IntegrationType.GOOGLE_MAPS:
      case IntegrationType.GOOGLE_DRIVE:
      case IntegrationType.GOOGLE_MEET:
      case IntegrationType.GOOGLE_WORKSPACE:
        return 'google';

      case IntegrationType.OUTLOOK:
      case IntegrationType.MICROSOFT_TEAMS:
      case IntegrationType.ONEDRIVE:
        return 'microsoft';

      case IntegrationType.FACEBOOK:
      case IntegrationType.INSTAGRAM:
      case IntegrationType.TWITTER:
      case IntegrationType.LINKEDIN:
        return 'social';

      case IntegrationType.WHATSAPP:
      case IntegrationType.ZOOM:
        return 'communication';

      default:
        return 'productivity';
    }
  };

  useEffect(() => {
    loadIntegrations();

    // Subscribe to integration changes
    const unsubscribe = IntegrationManager.subscribe((updatedIntegrations) => {
      setIntegrations(updatedIntegrations);
    });

    return () => unsubscribe();
  }, []);

  const loadIntegrations = async () => {
    try {
      const allIntegrations = IntegrationManager.getAllIntegrations();
      setIntegrations(allIntegrations);
      console.log(`📋 Loaded ${allIntegrations.length} integrations`);
    } catch (error: any) {
      console.error('Failed to load integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (integration: Integration) => {
    // Check if already connected
    if (integration.status === IntegrationStatus.CONNECTED) {
      Alert.alert(
        'Already Connected',
        `${integration.name} is already connected. Would you like to disconnect?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disconnect',
            style: 'destructive',
            onPress: () => handleDisconnect(integration),
          },
        ]
      );
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setConnecting(integration.type);

    try {
      console.log(`🔌 Connecting ${integration.name}...`);
      const granted = await IntegrationManager.requestPermission(integration.type);

      if (granted) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          'Connected!',
          `${integration.name} has been connected successfully. ${
            integration.permissionType === PermissionType.NATIVE
              ? 'PA can now access this data to help you!'
              : 'OAuth setup in progress...'
          }`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Show capability list
                if (integration.capabilities && integration.capabilities.length > 0) {
                  const capList = integration.capabilities.map((c, i) => `${i + 1}. ${c}`).join('\n');
                  setTimeout(() => {
                    Alert.alert(
                      `${integration.name} Capabilities`,
                      `PA can now:\n\n${capList}`,
                      [{ text: 'Got it!' }]
                    );
                  }, 500);
                }
              },
            },
          ]
        );
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert(
          'Permission Denied',
          `Unable to connect ${integration.name}. Please check your device settings.`
        );
      }
    } catch (error: any) {
      console.error(`Failed to connect ${integration.name}:`, error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Connection Failed', error.message || `Failed to connect ${integration.name}`);
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = async (integration: Integration) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      await IntegrationManager.disconnect(integration.type);
      Alert.alert('Disconnected', `${integration.name} has been disconnected.`);
    } catch (error: any) {
      console.error(`Failed to disconnect ${integration.name}:`, error);
      Alert.alert('Error', 'Failed to disconnect integration');
    }
  };

  const toggleSection = (category: IntegrationCategory) => {
    if (expandedSections.includes(category)) {
      setExpandedSections(expandedSections.filter(s => s !== category));
    } else {
      setExpandedSections([...expandedSections, category]);
    }
  };

  const getIconColor = (integration: Integration): string => {
    // Color coding based on integration type
    if (integration.permissionType === PermissionType.NATIVE) {
      return '#10B981'; // Green for native device integrations
    }

    switch (getCategoryForIntegrationType(integration.type)) {
      case 'google':
        return '#4285F4'; // Google blue
      case 'microsoft':
        return '#0078D4'; // Microsoft blue
      case 'social':
        return '#E1306C'; // Social pink
      case 'communication':
        return '#2D8CFF'; // Communication blue
      default:
        return '#C9A96E'; // Gold for productivity
    }
  };

  const renderIntegrationCard = (integration: Integration, isLast: boolean) => {
    const connected = integration.status === IntegrationStatus.CONNECTED;
    const isConnecting = connecting === integration.type;

    return (
      <View key={integration.type}>
        <View style={styles.integrationCard}>
          <View style={styles.cardContent}>
            <View style={[styles.integrationIcon, { backgroundColor: getIconColor(integration) }]}>
              <Ionicons name={integration.icon as any} size={28} color="#FFFFFF" />
            </View>
            <View style={styles.integrationInfo}>
              <View style={styles.integrationNameRow}>
                <Text style={styles.integrationName}>{integration.name}</Text>
                {integration.permissionType === PermissionType.NATIVE && (
                  <View style={styles.nativeBadge}>
                    <Ionicons name="phone-portrait-outline" size={12} color="#10B981" />
                    <Text style={styles.nativeBadgeText}>Device</Text>
                  </View>
                )}
              </View>
              <Text style={styles.integrationDescription}>{integration.description}</Text>
              {connected && integration.connectedAt && (
                <Text style={styles.connectedDate}>
                  Connected {new Date(integration.connectedAt).toLocaleDateString()}
                </Text>
              )}
            </View>
          </View>
          <TouchableOpacity
            style={[
              styles.connectButtonWrapper,
              connected && styles.connectedButton,
            ]}
            onPress={() => handleConnect(integration)}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <View style={styles.connectButton}>
                <ActivityIndicator size="small" color="#FFFFFF" />
              </View>
            ) : connected ? (
              <View style={styles.connectedContent}>
                <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                <Text style={styles.connectedText}>Connected</Text>
              </View>
            ) : (
              <LinearGradient
                colors={['#C9A96E', '#E5C794']}
                style={styles.connectButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.connectButtonText}>Connect</Text>
              </LinearGradient>
            )}
          </TouchableOpacity>
        </View>
        {!isLast && <View style={styles.divider} />}
      </View>
    );
  };

  const renderSection = (category: IntegrationCategory, title: string, icon: string) => {
    const sectionIntegrations = integrations.filter(
      (i) => getCategoryForIntegrationType(i.type) === category
    );
    const connectedCount = sectionIntegrations.filter(
      (i) => i.status === IntegrationStatus.CONNECTED
    ).length;
    const isExpanded = expandedSections.includes(category);

    return (
      <View style={styles.section} key={category}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection(category)}
          activeOpacity={0.7}
        >
          <View style={styles.sectionTitleContainer}>
            <Ionicons name={icon as any} size={22} color="#FFFFFF" />
            <Text style={styles.sectionTitle}>{title}</Text>
            {connectedCount > 0 && (
              <View style={styles.connectedCountBadge}>
                <Text style={styles.connectedCountText}>{connectedCount}</Text>
              </View>
            )}
          </View>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="rgba(255, 255, 255, 0.6)"
          />
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.integrationsGrid}>
            {sectionIntegrations.map((integration, index) =>
              renderIntegrationCard(integration, index === sectionIntegrations.length - 1)
            )}
          </View>
        )}
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
          <Text style={styles.headerTitle}>Integrations</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#C9A96E" />
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
        <Text style={styles.headerTitle}>Integrations</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.introSection}>
          <Ionicons name="shield-checkmark" size={40} color="#C9A96E" />
          <Text style={styles.introTitle}>Connect Your Services</Text>
          <Text style={styles.introText}>
            Let PA access your information to help you better. Just tap Connect and grant permission.
            PA will automatically monitor and assist with your connected services.
          </Text>
        </View>

        {renderSection('device', 'Device', 'phone-portrait-outline')}
        {renderSection('google', 'Google Services', 'logo-google')}
        {renderSection('microsoft', 'Microsoft', 'logo-microsoft')}
        {renderSection('social', 'Social Media', 'people-circle-outline')}
        {renderSection('communication', 'Communication', 'chatbubbles-outline')}
        {renderSection('productivity', 'Productivity', 'rocket-outline')}
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
    paddingBottom: 40,
  },
  introSection: {
    backgroundColor: 'rgba(201, 169, 110, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 110, 0.3)',
    alignItems: 'center',
  },
  introTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 12,
    marginBottom: 8,
  },
  introText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    marginBottom: 20,
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  connectedCountBadge: {
    backgroundColor: '#10B981',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectedCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  integrationsGrid: {
    marginTop: 16,
  },
  integrationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  integrationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  integrationInfo: {
    flex: 1,
  },
  integrationNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  integrationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  nativeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
  },
  nativeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#10B981',
  },
  integrationDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 4,
  },
  connectedDate: {
    fontSize: 11,
    color: 'rgba(16, 185, 129, 0.8)',
    marginTop: 2,
  },
  connectButtonWrapper: {
    borderRadius: 8,
    overflow: 'hidden',
    minWidth: 100,
  },
  connectButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectedButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#10B981',
    borderRadius: 8,
  },
  connectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  connectedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  connectedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default IntegrationsScreen;
