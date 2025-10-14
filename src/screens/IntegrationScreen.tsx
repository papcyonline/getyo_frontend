import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
  Dimensions,
  Modal,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { RootState } from '../store';
import { Ionicons, FontAwesome, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import ApiService from '../services/api';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import * as Calendar from 'expo-calendar';

const { height, width } = Dimensions.get('window');

// Real Google OAuth Configuration
// Replace GOOGLE_CLIENT_ID with your actual Google Client ID from Google Cloud Console
const GOOGLE_OAUTH_CONFIG = {
  clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '1234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com',
  scopes: [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar.events',
  ],
  responseType: 'code',
  accessType: 'offline',
  includeGrantedScopes: true,
};

// Real Google OAuth flow implementation
const initiateGoogleOAuth = async (): Promise<{ success: boolean; authCode?: string; error?: string }> => {
  try {
    const redirectUrl = Linking.createURL('oauth-callback');

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${GOOGLE_OAUTH_CONFIG.clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUrl)}&` +
      `response_type=${GOOGLE_OAUTH_CONFIG.responseType}&` +
      `scope=${encodeURIComponent(GOOGLE_OAUTH_CONFIG.scopes.join(' '))}&` +
      `access_type=${GOOGLE_OAUTH_CONFIG.accessType}&` +
      `include_granted_scopes=${GOOGLE_OAUTH_CONFIG.includeGrantedScopes}`;

    console.log('🔐 Opening Google OAuth URL:', authUrl);
    console.log('🔗 Redirect URL:', redirectUrl);

    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);

    if (result.type === 'success' && result.url) {
      const url = new URL(result.url);
      const authCode = url.searchParams.get('code');

      if (authCode) {
        console.log('✅ Google OAuth successful, got auth code');
        // Exchange auth code for tokens via our backend
        const tokenResult = await ApiService.connectGoogleCalendar(authCode, redirectUrl);
        return tokenResult;
      } else {
        const error = url.searchParams.get('error');
        console.error('❌ Google OAuth failed:', error);
        return { success: false, error: error || 'Authorization failed' };
      }
    } else if (result.type === 'cancel') {
      console.log('🚫 Google OAuth cancelled by user');
      return { success: false, error: 'Authorization cancelled by user' };
    } else {
      console.error('❌ Google OAuth failed:', result);
      return { success: false, error: 'Authorization failed' };
    }
  } catch (error) {
    console.error('❌ Google OAuth error:', error);
    return { success: false, error: 'OAuth initialization failed' };
  }
};

// Real Apple Calendar integration using device permissions
const initiateAppleCalendar = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('🍎 Requesting Apple Calendar permissions...');

    // Request calendar permissions
    const { status } = await Calendar.requestCalendarPermissionsAsync();

    if (status !== 'granted') {
      console.log('❌ Apple Calendar permission denied');
      return {
        success: false,
        error: 'Calendar permission is required to connect Apple Calendar. Please enable it in Settings.'
      };
    }

    console.log('✅ Apple Calendar permission granted');

    // Get available calendars to verify access
    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    const defaultCalendar = calendars.find(cal => cal.source.name === 'Default' || cal.isPrimary);

    console.log(`📅 Found ${calendars.length} calendars`);

    // Connect via our backend API
    const result = await ApiService.connectAppleCalendar({
      hasPermission: true,
      calendarSource: defaultCalendar?.source.name || 'iCloud',
    });

    if (result.success) {
      console.log('✅ Apple Calendar connected successfully');
      return { success: true };
    } else {
      console.error('❌ Apple Calendar backend connection failed:', result.error);
      return { success: false, error: result.error || 'Failed to connect Apple Calendar' };
    }
  } catch (error) {
    console.error('❌ Apple Calendar connection error:', error);
    return { success: false, error: 'Failed to connect Apple Calendar' };
  }
};

const IntegrationScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const theme = useSelector((state: RootState) => state.theme.theme);
  const user = useSelector((state: RootState) => state.user.user);

  // Integration states - all start as disconnected, real status loaded from API
  const [connectedServices, setConnectedServices] = useState<{[key: string]: boolean}>({
    'Google Calendar': false,
    'Outlook Calendar': false,
    'Apple Calendar': false,
    'Gmail': false,
    'Outlook Email': false,
    'Slack': false,
    'Microsoft Teams': false,
    'Google Drive': false,
    'Dropbox': false,
    'OneDrive': false,
    'Notion': false,
    'Trello': false,
    'Asana': false,
    'Salesforce': false,
    'HubSpot': false,
    'Zapier': false,
    'IFTTT': false,
  });

  // OAuth and UI states
  const [showOAuthModal, setShowOAuthModal] = useState(false);
  const [currentService, setCurrentService] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionProgress, setConnectionProgress] = useState(new Animated.Value(0));
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  // Load real integration status
  useEffect(() => {
    const loadIntegrationStatus = async () => {
      try {
        const status = await ApiService.getIntegrationStatus();
        console.log('🔗 IntegrationScreen - Loaded integration status:', status);

        setConnectedServices(prev => ({
          ...prev,
          'Google Calendar': status.googleCalendar?.connected || false,
          'Apple Calendar': status.appleCalendar?.connected || false,
        }));
      } catch (error) {
        console.error('Failed to load integration status:', error);
        // Keep the default state if API fails
      }
    };

    loadIntegrationStatus();
  }, []);

  const handleBackPress = () => {
    navigation.goBack();
  };

  // Function to render the appropriate brand icon
  const renderServiceIcon = (serviceName: string, size: number = 24) => {
    const iconMap: { [key: string]: React.ReactElement } = {
      'Google Calendar': <FontAwesome name="google" size={size} color="#4285f4" />,
      'Gmail': <FontAwesome name="google" size={size} color="#EA4335" />,
      'Google Drive': <FontAwesome name="google" size={size} color="#4285f4" />,
      'Outlook Calendar': <FontAwesome name="windows" size={size} color="#0078D4" />,
      'Outlook Email': <FontAwesome name="windows" size={size} color="#0078D4" />,
      'OneDrive': <FontAwesome name="windows" size={size} color="#0078D4" />,
      'Microsoft Teams': <FontAwesome name="windows" size={size} color="#6264A7" />,
      'Apple Calendar': <FontAwesome name="apple" size={size} color="#000000" />,
      'Slack': <FontAwesome name="slack" size={size} color="#4A154B" />,
      'Dropbox': <FontAwesome name="dropbox" size={size} color="#0061FF" />,
      'Notion': <MaterialCommunityIcons name="note-text" size={size} color="#000000" />,
      'Trello': <FontAwesome name="trello" size={size} color="#0079BF" />,
      'Asana': <MaterialCommunityIcons name="check-circle" size={size} color="#F06A6A" />,
      'Salesforce': <FontAwesome name="building" size={size} color="#00A1E0" />,
      'HubSpot': <MaterialCommunityIcons name="chart-line" size={size} color="#FF7A59" />,
      'Zapier': <MaterialCommunityIcons name="lightning-bolt" size={size} color="#FF4A00" />,
      'IFTTT': <MaterialCommunityIcons name="link" size={size} color="#000000" />,
    };

    return iconMap[serviceName] || <Ionicons name="apps" size={size} color="#666666" />;
  };

  // OAuth Service Configuration
  const getServiceConfig = (serviceName: string) => {
    const configs: {[key: string]: {authUrl: string, scope: string[], description: string}} = {
      'Gmail': {
        authUrl: 'https://accounts.google.com/oauth/authorize',
        scope: ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/gmail.compose'],
        description: 'Read and compose emails on your behalf'
      },
      'Google Calendar': {
        authUrl: 'https://accounts.google.com/oauth/authorize',
        scope: ['https://www.googleapis.com/auth/calendar'],
        description: 'Manage your calendar events and meetings'
      },
      'Google Drive': {
        authUrl: 'https://accounts.google.com/oauth/authorize',
        scope: ['https://www.googleapis.com/auth/drive'],
        description: 'Access and organize your files'
      },
      'Slack': {
        authUrl: 'https://slack.com/oauth/v2/authorize',
        scope: ['channels:read', 'chat:write', 'users:read'],
        description: 'Send messages and read channel updates'
      },
      'Notion': {
        authUrl: 'https://api.notion.com/v1/oauth/authorize',
        scope: ['read_content', 'update_content'],
        description: 'Read and update your Notion pages'
      }
    };
    return configs[serviceName] || { authUrl: '', scope: [], description: 'Access and manage data' };
  };

  // Simulated OAuth Flow
  const handleOAuthFlow = async (serviceName: string) => {
    setCurrentService(serviceName);
    setShowOAuthModal(true);
    setIsConnecting(true);

    // Reset progress
    connectionProgress.setValue(0);

    try {
      // Animate connection progress
      Animated.timing(connectionProgress, { toValue: 0.3, duration: 800, useNativeDriver: false }).start();

      let result;

      // Call appropriate API based on service with real OAuth flows
      if (serviceName === 'Google Calendar') {
        // Initiate real Google OAuth flow
        result = await initiateGoogleOAuth();
      } else if (serviceName === 'Apple Calendar') {
        // For Apple Calendar, use real system integration with permissions
        result = await initiateAppleCalendar();
      } else {
        // For other services, show coming soon message
        Alert.alert(
          'Coming Soon',
          `${serviceName} integration is coming soon. We're working on adding support for this service.`,
          [{ text: 'OK' }]
        );
        setIsConnecting(false);
        setShowOAuthModal(false);
        return;
      }

      Animated.timing(connectionProgress, { toValue: 0.6, duration: 500, useNativeDriver: false }).start();

      if (result.success) {
        Animated.timing(connectionProgress, { toValue: 1, duration: 600, useNativeDriver: false }).start(() => {
          // Connection successful
          setConnectedServices(prev => ({ ...prev, [serviceName]: true }));
          setIsConnecting(false);
          setShowSuccessAnimation(true);

          setTimeout(() => {
            setShowOAuthModal(false);
            setShowSuccessAnimation(false);

            // Show success message
            Alert.alert(
              '🎉 Connection Successful!',
              `${user?.assistantName || 'Your assistant'} now has access to ${serviceName}. They can help you manage your data and perform tasks automatically.`,
              [{ text: 'Great!', style: 'default' }]
            );
          }, 2000);
        });
      } else {
        throw new Error(result.message || 'Connection failed');
      }
    } catch (error) {
      console.error(`${serviceName} connection failed:`, error);
      setIsConnecting(false);
      setShowOAuthModal(false);
      Alert.alert(
        'Connection Failed',
        `Failed to connect ${serviceName}. Please try again later.`,
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  const handleConnect = (serviceName: string) => {
    const isConnected = connectedServices[serviceName];

    if (isConnected) {
      // Disconnect service
      Alert.alert(
        `Disconnect ${serviceName}?`,
        `This will revoke ${user?.assistantName || 'your assistant'}'s access to ${serviceName}. You can reconnect anytime.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disconnect',
            style: 'destructive',
            onPress: async () => {
              try {
                let result;

                // Call appropriate disconnect API based on service
                if (serviceName === 'Google Calendar') {
                  result = await ApiService.disconnectGoogleCalendar();
                } else if (serviceName === 'Apple Calendar') {
                  result = await ApiService.disconnectAppleCalendar();
                } else {
                  // For other services, just update UI for now
                  result = { success: true };
                }

                if (result.success) {
                  setConnectedServices(prev => ({ ...prev, [serviceName]: false }));
                  Alert.alert('Disconnected', `${serviceName} has been disconnected successfully.`);
                } else {
                  throw new Error('Failed to disconnect');
                }
              } catch (error) {
                console.error(`Failed to disconnect ${serviceName}:`, error);
                Alert.alert('Error', `Failed to disconnect ${serviceName}. Please try again.`);
              }
            }
          }
        ]
      );
    } else {
      // Show OAuth permission dialog
      const config = getServiceConfig(serviceName);
      Alert.alert(
        `Connect to ${serviceName}`,
        `${user?.assistantName || 'Your assistant'} needs permission to ${config.description.toLowerCase()}.\n\n✓ Secure OAuth authentication\n✓ You control all permissions\n✓ Disconnect anytime`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Connect',
            onPress: () => handleOAuthFlow(serviceName),
            style: 'default'
          }
        ]
      );
    }
  };

  const integrationSections = [
    {
      title: 'CALENDAR & SCHEDULING',
      items: [
        {
          name: 'Google Calendar',
          description: 'Events, meetings, and availability',
          icon: 'calendar-outline',
          color: '#000000',
          connected: connectedServices['Google Calendar'],
          onToggle: () => handleConnect('Google Calendar'),
          features: ['Schedule meetings', 'Check availability', 'Create events', 'Send invites']
        },
        {
          name: 'Outlook Calendar',
          description: 'Microsoft calendar and meetings',
          icon: 'calendar',
          color: '#0078D4',
          connected: connectedServices['Outlook Calendar'],
          onToggle: () => handleConnect('Outlook Calendar'),
          features: ['Schedule meetings', 'Check availability', 'Create events']
        },
        {
          name: 'Apple Calendar',
          description: 'iCloud calendar integration',
          icon: 'calendar-outline',
          color: '#000000',
          connected: connectedServices['Apple Calendar'],
          onToggle: () => handleConnect('Apple Calendar'),
          features: ['Schedule meetings', 'Check availability', 'Create events']
        }
      ]
    },
    {
      title: 'EMAIL & COMMUNICATION',
      items: [
        {
          name: 'Gmail',
          description: 'Email management and drafting',
          icon: 'mail-outline',
          color: '#EA4335',
          connected: connectedServices['Gmail'],
          onToggle: () => handleConnect('Gmail'),
          features: ['Draft emails', 'Schedule sends', 'Manage inbox', 'Smart replies']
        },
        {
          name: 'Outlook Email',
          description: 'Microsoft email services',
          icon: 'mail',
          color: '#0078D4',
          connected: connectedServices['Outlook Email'],
          onToggle: () => handleConnect('Outlook Email'),
          features: ['Draft emails', 'Schedule sends', 'Manage inbox']
        },
        {
          name: 'Slack',
          description: 'Team communication and channels',
          icon: 'chatbubbles-outline',
          color: '#4A154B',
          connected: connectedServices['Slack'],
          onToggle: () => handleConnect('Slack'),
          features: ['Send messages', 'Schedule posts', 'Channel updates']
        },
        {
          name: 'Microsoft Teams',
          description: 'Corporate communication',
          icon: 'people-outline',
          color: '#6264A7',
          connected: connectedServices['Microsoft Teams'],
          onToggle: () => handleConnect('Microsoft Teams'),
          features: ['Send messages', 'Schedule meetings', 'Team updates']
        }
      ]
    },
    {
      title: 'CLOUD STORAGE',
      items: [
        {
          name: 'Google Drive',
          description: 'File storage and documents',
          icon: 'folder-outline',
          color: '#000000',
          connected: connectedServices['Google Drive'],
          onToggle: () => handleConnect('Google Drive'),
          features: ['Access files', 'Create docs', 'Share documents', 'Search content']
        },
        {
          name: 'Dropbox',
          description: 'File sync and sharing',
          icon: 'cloud-outline',
          color: '#0061FF',
          connected: connectedServices['Dropbox'],
          onToggle: () => handleConnect('Dropbox'),
          features: ['Access files', 'Share documents', 'Sync folders']
        },
        {
          name: 'OneDrive',
          description: 'Microsoft cloud storage',
          icon: 'cloud-upload-outline',
          color: '#0078D4',
          connected: connectedServices['OneDrive'],
          onToggle: () => handleConnect('OneDrive'),
          features: ['Access files', 'Share documents', 'Office integration']
        }
      ]
    },
    {
      title: 'PRODUCTIVITY & TASKS',
      items: [
        {
          name: 'Notion',
          description: 'Notes, databases, and wikis',
          icon: 'document-text-outline',
          color: '#000000',
          connected: connectedServices['Notion'],
          onToggle: () => handleConnect('Notion'),
          features: ['Create pages', 'Update databases', 'Search content', 'Add tasks']
        },
        {
          name: 'Trello',
          description: 'Project boards and tasks',
          icon: 'grid-outline',
          color: '#0079BF',
          connected: connectedServices['Trello'],
          onToggle: () => handleConnect('Trello'),
          features: ['Create cards', 'Move tasks', 'Update boards', 'Add comments']
        },
        {
          name: 'Asana',
          description: 'Team project management',
          icon: 'checkmark-circle-outline',
          color: '#F06A6A',
          connected: connectedServices['Asana'],
          onToggle: () => handleConnect('Asana'),
          features: ['Create tasks', 'Update projects', 'Assign work', 'Track progress']
        }
      ]
    },
    {
      title: 'BUSINESS & CRM',
      items: [
        {
          name: 'Salesforce',
          description: 'Customer relationship management',
          icon: 'business-outline',
          color: '#00A1E0',
          connected: connectedServices['Salesforce'],
          onToggle: () => handleConnect('Salesforce'),
          features: ['Manage leads', 'Update contacts', 'Track opportunities', 'Create reports']
        },
        {
          name: 'HubSpot',
          description: 'Marketing and sales platform',
          icon: 'trending-up-outline',
          color: '#FF7A59',
          connected: connectedServices['HubSpot'],
          onToggle: () => handleConnect('HubSpot'),
          features: ['Manage contacts', 'Track deals', 'Email campaigns', 'Analytics']
        }
      ]
    },
    {
      title: 'AUTOMATION',
      items: [
        {
          name: 'Zapier',
          description: 'Workflow automation',
          icon: 'flash-outline',
          color: '#FF4A00',
          connected: connectedServices['Zapier'],
          onToggle: () => handleConnect('Zapier'),
          features: ['Create workflows', 'Automate tasks', 'Connect apps', 'Trigger actions']
        },
        {
          name: 'IFTTT',
          description: 'If This Then That automation',
          icon: 'link-outline',
          color: '#000000',
          connected: connectedServices['IFTTT'],
          onToggle: () => handleConnect('IFTTT'),
          features: ['Create applets', 'Automate routines', 'Smart home integration']
        }
      ]
    }
  ];

  const connectedCount = integrationSections.reduce(
    (count, section) => count + section.items.filter(item => item.connected).length,
    0
  );
  const totalCount = integrationSections.reduce((count, section) => count + section.items.length, 0);

  // Dot pattern for background
  const renderDots = () => {
    const dots = [];
    const rows = 8;
    const dotsPerRow = 8;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < dotsPerRow; col++) {
        dots.push(
          <View
            key={`${row}-${col}`}
            style={[
              styles.dot,
              {
                left: (col * width) / dotsPerRow + (width / dotsPerRow) / 2,
                top: (row * height) / rows + (height / rows) / 2,
              }
            ]}
          />
        );
      }
    }
    return dots;
  };

  return (
    <View style={styles.container}>
      {/* Dot Pattern */}
      <View style={styles.dotContainer} pointerEvents="none">
        {renderDots()}
      </View>

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackPress}
        >
          <Ionicons name="chevron-back" size={28} color="#FFF7F5" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Integrations</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        {/* Overview Card */}
        <View style={styles.overviewCard}>
          <View style={styles.overviewHeader}>
            <View style={[styles.overviewIcon, { backgroundColor: '#FFF7F5' }]}>
              <Ionicons name="link" size={24} color="white" />
            </View>
            <View style={styles.overviewInfo}>
              <Text style={styles.overviewTitle}>
                Connected Services
              </Text>
              <Text style={styles.overviewSubtitle}>
                {connectedCount} of {totalCount} services connected
              </Text>
            </View>
          </View>
          <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
            <View
              style={[
                styles.progressFill,
                { width: `${(connectedCount / totalCount) * 100}%` }
              ]}
            />
          </View>
          <Text style={styles.overviewDescription}>
            🤖 {user?.assistantName || 'Your assistant'} can read emails, manage calendars, access files, and perform tasks across all connected services. Each integration gives your assistant new superpowers!
          </Text>
        </View>

        {/* Integration Sections */}
        {integrationSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>
              {section.title}
            </Text>

            {section.items.map((item, itemIndex) => (
              <View
                key={itemIndex}
                style={[
                  styles.integrationItem,
                  itemIndex === section.items.length - 1 && styles.lastItem
                ]}
              >
                <TouchableOpacity
                  style={styles.integrationInfo}
                  onPress={() => {
                    Alert.alert(
                      item.name,
                      `Features:\n• ${item.features.join('\n• ')}`,
                      [{ text: 'OK' }]
                    );
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.serviceIcon, { backgroundColor: `${item.color}15` }]}>
                    {renderServiceIcon(item.name, 24)}
                  </View>
                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceName}>
                      {item.name}
                    </Text>
                    <Text style={styles.serviceDescription}>
                      {item.description}
                    </Text>
                    {item.connected ? (
                      <View style={styles.connectedStatusContainer}>
                        <View style={styles.connectedBadge}>
                          <Text style={styles.connectedBadgeText}>✓ ACTIVE</Text>
                        </View>
                        <Text style={styles.connectedStatus}>
                          {user?.assistantName || 'Your assistant'} has access • {item.features.length} features
                        </Text>
                      </View>
                    ) : (
                      <Text style={styles.disconnectedStatus}>
                        Tap to connect • {item.features.length} features available
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>

                <Switch
                  value={item.connected}
                  onValueChange={item.onToggle}
                  trackColor={{ false: 'rgba(255, 247, 245, 0.2)', true: item.color }}
                  thumbColor={item.connected ? 'white' : 'white'}
                  ios_backgroundColor="rgba(255, 247, 245, 0.2)"
                />
              </View>
            ))}
          </View>
        ))}

      </ScrollView>

      {/* OAuth Connection Modal */}
      <Modal
        visible={showOAuthModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowOAuthModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.oauthModal}>
            <View style={styles.modalHeader}>
              <View style={[styles.serviceIconLarge, { backgroundColor: '#4285f415' }]}>
                {renderServiceIcon(currentService, 32)}
              </View>
              <Text style={styles.modalTitle}>
                Connecting to {currentService}
              </Text>
              <Text style={styles.modalSubtitle}>
                {user?.assistantName || 'Your assistant'} is requesting access
              </Text>
            </View>

            {isConnecting ? (
              <View style={styles.connectionProgress}>
                <Text style={styles.progressText}>
                  {showSuccessAnimation ? '🎉 Connection Successful!' : 'Authenticating...'}
                </Text>
                <View style={styles.progressBarContainer}>
                  <Animated.View
                    style={[
                      styles.progressBarFill,
                      {
                        width: connectionProgress.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', '100%'],
                        }),
                        backgroundColor: showSuccessAnimation ? '#00C851' : '#3396D3'
                      }
                    ]}
                  />
                </View>
                {!showSuccessAnimation && (
                  <ActivityIndicator
                    size="large"
                    color="#3396D3"
                    style={styles.loadingIndicator}
                  />
                )}
                {showSuccessAnimation && (
                  <Text style={styles.successText}>
                    ✓ {user?.assistantName || 'Your assistant'} can now access {currentService}
                  </Text>
                )}
              </View>
            ) : (
              <View style={styles.connectionProgress}>
                <Text style={styles.progressText}>Initializing...</Text>
              </View>
            )}

            {!isConnecting && !showSuccessAnimation && (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowOAuthModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  dotContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height,
    zIndex: 2,
  },
  dot: {
    position: 'absolute',
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(255, 247, 245, 0.1)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    zIndex: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(255, 247, 245, 0.1)',
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF7F5',
    textAlign: 'center',
    marginRight: 48,
  },
  headerRight: {
    width: 40,
    height: 40,
  },
  overviewCard: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 247, 245, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 247, 245, 0.2)',
    zIndex: 5,
  },
  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  overviewIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    backgroundColor: '#3396D3',
  },
  overviewInfo: {
    flex: 1,
  },
  overviewTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
    color: '#FFF7F5',
  },
  overviewSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 247, 245, 0.7)',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    marginVertical: 12,
    backgroundColor: 'rgba(255, 247, 245, 0.2)',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3396D3',
    borderRadius: 3,
  },
  overviewDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255, 247, 245, 0.7)',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    backgroundColor: 'rgba(255, 247, 245, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 247, 245, 0.1)',
    zIndex: 5,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 16,
    letterSpacing: 0.5,
    color: 'rgba(255, 247, 245, 0.6)',
  },
  integrationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 247, 245, 0.1)',
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  integrationInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
    color: '#FFF7F5',
  },
  serviceDescription: {
    fontSize: 14,
    marginBottom: 4,
    color: 'rgba(255, 247, 245, 0.7)',
  },
  connectedStatusContainer: {
    marginTop: 8,
  },
  connectedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#00C851',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  connectedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF7F5',
    letterSpacing: 0.5,
  },
  connectedStatus: {
    fontSize: 12,
    fontWeight: '500',
    color: '#00C851',
    lineHeight: 16,
  },
  disconnectedStatus: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 247, 245, 0.5)',
    marginTop: 4,
  },
  footerInfo: {
    margin: 16,
    padding: 20,
    alignItems: 'center',
  },
  footerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#FFF7F5',
  },
  footerText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 16,
    color: 'rgba(255, 247, 245, 0.7)',
  },
  footerButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3396D3',
    backgroundColor: 'rgba(51, 150, 211, 0.1)',
  },
  footerButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3396D3',
  },
  // OAuth Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  oauthModal: {
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    maxWidth: 320,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255, 247, 245, 0.2)',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  serviceIconLarge: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF7F5',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 247, 245, 0.7)',
    textAlign: 'center',
  },
  connectionProgress: {
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF7F5',
    marginBottom: 20,
    textAlign: 'center',
  },
  progressBarContainer: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 247, 245, 0.2)',
    borderRadius: 2,
    marginBottom: 20,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  loadingIndicator: {
    marginVertical: 10,
  },
  successText: {
    fontSize: 14,
    color: '#00C851',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 20,
  },
  cancelButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 247, 245, 0.3)',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 247, 245, 0.7)',
  },
});

export default IntegrationScreen;