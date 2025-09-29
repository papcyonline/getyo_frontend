import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  SafeAreaView,
  ScrollView,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';
import { RootStackParamList } from '../types';
import { MaterialIcons } from '@expo/vector-icons';
import { completeOnboarding } from '../store/slices/userSlice';
import ApiService from '../services/api';

const { height } = Dimensions.get('window');

type AgentPrivacyNavigationProp = StackNavigationProp<RootStackParamList, 'AgentPrivacy'>;

interface PrivacySetting {
  id: string;
  title: string;
  description: string;
  icon: string;
  enabled: boolean;
  critical: boolean;
  category: 'data' | 'permissions' | 'security';
}


const privacySettings: PrivacySetting[] = [
  {
    id: 'local_processing',
    title: 'Local Data Processing',
    description: 'Process all data locally on your device',
    icon: 'phone-android',
    enabled: true,
    critical: true,
    category: 'data'
  },
  {
    id: 'encrypted_storage',
    title: 'Encrypted Storage',
    description: 'Encrypt all stored data using device security',
    icon: 'enhanced-encryption',
    enabled: true,
    critical: true,
    category: 'security'
  },
  {
    id: 'data_minimization',
    title: 'Data Minimization',
    description: 'Only collect and store essential data',
    icon: 'data-usage',
    enabled: true,
    critical: false,
    category: 'data'
  },
  {
    id: 'conversation_history',
    title: 'Conversation History',
    description: 'Save conversation history for context',
    icon: 'history',
    enabled: true,
    critical: false,
    category: 'data'
  },
  {
    id: 'biometric_lock',
    title: 'Biometric Lock',
    description: 'Require biometric authentication for access',
    icon: 'fingerprint',
    enabled: false,
    critical: false,
    category: 'security'
  },
  {
    id: 'auto_delete',
    title: 'Auto-Delete Data',
    description: 'Automatically delete old data after 30 days',
    icon: 'auto-delete',
    enabled: false,
    critical: false,
    category: 'data'
  },
  {
    id: 'location_access',
    title: 'Location Access',
    description: 'Allow access to location for location-based features',
    icon: 'location-on',
    enabled: false,
    critical: false,
    category: 'permissions'
  },
  {
    id: 'contacts_access',
    title: 'Contacts Access',
    description: 'Access contacts for scheduling and communication',
    icon: 'contacts',
    enabled: false,
    critical: false,
    category: 'permissions'
  },
  {
    id: 'calendar_access',
    title: 'Calendar Access',
    description: 'Access calendar for scheduling and reminders',
    icon: 'event',
    enabled: true,
    critical: false,
    category: 'permissions'
  },
];


const AgentPrivacyScreen: React.FC = () => {
  const navigation = useNavigation<AgentPrivacyNavigationProp>();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(height)).current;
  const [settings, setSettings] = useState<PrivacySetting[]>(privacySettings);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();

    loadExistingConfiguration();
  }, []);

  const loadExistingConfiguration = async () => {
    try {
      setLoading(true);

      // Load existing configuration
      const existingConfig = await ApiService.getAgentConfiguration();
      if (existingConfig?.privacy) {
        const privacy = existingConfig.privacy;

        // Update settings based on existing config
        // Note: The frontend has many more settings than what the backend stores
        // We only update the ones that map to backend fields
        const updatedSettings = settings.map(setting => {
          // Map the few frontend settings that correspond to backend privacy fields
          // Most frontend settings are UI-only and don't map to backend
          return setting; // Keep original settings for now as mapping is complex
        });

        setSettings(updatedSettings);
      }
    } catch (error: any) {
      console.error('Failed to load existing privacy configuration:', error);
      // Don't show error for first-time users, just use defaults
    } finally {
      setLoading(false);
    }
  };

  const handleSettingToggle = (settingId: string) => {
    setSettings(prev =>
      prev.map(setting =>
        setting.id === settingId
          ? { ...setting, enabled: !setting.enabled }
          : setting
      )
    );
  };


  const handleContinue = async () => {
    try {
      setSaving(true);

      // Map privacy settings to backend format
      const privacyData = {
        dataRetentionDays: 90, // Default value
        shareAnalytics: settings.find(s => s.id === 'analytics_sharing')?.enabled || false,
        personalizeExperience: settings.find(s => s.id === 'personalization')?.enabled !== false,
        crossDeviceSync: settings.find(s => s.id === 'cloud_sync')?.enabled || false,
      };

      // Save privacy preferences to backend
      await ApiService.updateAgentPrivacy(privacyData);

      // Mark agent setup as complete
      await ApiService.completeAgentSetup();

      console.log('✅ Privacy preferences and agent setup completed successfully');

      // Complete the onboarding process
      dispatch(completeOnboarding());
      // Navigation to Dashboard happens automatically via conditional rendering in AppNavigator
    } catch (error: any) {
      console.error('❌ Failed to complete agent setup:', error);
      Alert.alert(
        'Setup Failed',
        'Unable to complete your agent setup. Please try again.',
        [
          { text: 'Retry', onPress: handleContinue },
          {
            text: 'Complete anyway',
            onPress: () => {
              dispatch(completeOnboarding());
            }
          },
        ]
      );
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const getSettingsByCategory = (category: string) => {
    return settings.filter(setting => setting.category === category);
  };

  const renderPrivacySetting = (setting: PrivacySetting, index: number, totalCount: number) => {
    const isLast = index === totalCount - 1;

    return (
      <View key={setting.id}>
        <View style={styles.settingItem}>
          <View style={styles.settingContent}>
            <View style={[styles.settingIcon, setting.critical && styles.criticalIcon]}>
              <MaterialIcons
                name={setting.icon as any}
                size={20}
                color={setting.critical ? '#FF6B6B' : '#FFFFFF'}
              />
            </View>
            <View style={styles.settingTextContainer}>
              <View style={styles.settingTitleRow}>
                <Text style={styles.settingTitle}>{setting.title}</Text>
                {setting.critical && (
                  <View style={styles.criticalBadge}>
                    <Text style={styles.criticalText}>Required</Text>
                  </View>
                )}
              </View>
              <Text style={styles.settingDescription}>{setting.description}</Text>
            </View>
            <Switch
              value={setting.enabled}
              onValueChange={(value) => !setting.critical && handleSettingToggle(setting.id)}
              disabled={setting.critical}
              trackColor={{ false: 'rgba(255, 255, 255, 0.1)', true: '#3396D3' }}
              thumbColor={setting.enabled ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)'}
              ios_backgroundColor="rgba(255, 255, 255, 0.1)"
            />
          </View>
        </View>
        {!isLast && <View style={styles.divider} />}
      </View>
    );
  };


  const renderCategory = (categoryKey: string, categoryName: string) => {
    const categorySettings = getSettingsByCategory(categoryKey);
    if (categorySettings.length === 0) return null;

    return (
      <View key={categoryKey} style={styles.category}>
        <Text style={styles.categoryTitle}>{categoryName}</Text>
        <View style={styles.settingsList}>
          {categorySettings.map((setting, index) => renderPrivacySetting(setting, index, categorySettings.length))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(51, 150, 211, 0.4)', 'rgba(51, 150, 211, 0.2)', 'transparent']}
        style={styles.gradientFlare}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.6 }}
        pointerEvents="none"
      />


      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>Privacy & Security</Text>
          <Text style={styles.subtitle}>
            Configure privacy settings and security features for your assistant
          </Text>
        </View>

        <Animated.View
          style={[
            styles.animatedContainer,
            {
              transform: [{ translateY: slideAnim }],
              paddingBottom: Math.max(insets.bottom, 20) + 20,
              marginBottom: -insets.bottom
            }
          ]}
        >
          <View style={styles.slidingContainer}>
            <View style={styles.topBar}>
              <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                <Text style={styles.backButtonText}>←</Text>
              </TouchableOpacity>
              <Text style={styles.step}>Privacy Setup</Text>
            </View>

            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#3396D3" />
                  <Text style={styles.loadingText}>Loading privacy settings...</Text>
                </View>
              ) : (
                <>
                  <View style={styles.selectionInfo}>
                    <Text style={styles.infoText}>
                      Privacy & Security Settings
                    </Text>
                    <Text style={styles.infoSubtext}>
                      Your privacy and security are our top priority
                    </Text>
                  </View>

                  {renderCategory('security', 'Security Features')}
                  {renderCategory('data', 'Data Management')}
                  {renderCategory('permissions', 'App Permissions')}
                </>
              )}
            </ScrollView>

            <View style={styles.footer}>
              <TouchableOpacity
                style={[
                  styles.continueButton,
                  saving && styles.disabledButton
                ]}
                onPress={handleContinue}
                disabled={saving}
                activeOpacity={0.7}
              >
                {saving ? (
                  <View style={styles.savingContainer}>
                    <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.continueButtonText}>Completing Setup...</Text>
                  </View>
                ) : (
                  <Text style={styles.continueButtonText}>Complete Setup</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  gradientFlare: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.4,
    zIndex: 1,
  },
  safeArea: {
    flex: 1,
    zIndex: 2,
  },
  header: {
    paddingHorizontal: 30,
    paddingTop: 20,
    paddingBottom: 15,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#F7F2ED',
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: 0.3,
    lineHeight: 22,
  },
  animatedContainer: {
    flex: 1,
  },
  slidingContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingTop: 15,
    paddingBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '600',
  },
  step: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 30,
    paddingTop: 20,
    paddingBottom: 100,
    flexGrow: 1,
  },
  selectionInfo: {
    backgroundColor: 'rgba(51, 150, 211, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(51, 150, 211, 0.3)',
  },
  infoText: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 4,
  },
  infoSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    fontWeight: '400',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  sectionDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 20,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 4,
  },
  category: {
    marginBottom: 32,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  settingsList: {
    paddingHorizontal: 10,
  },
  settingItem: {
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(51, 150, 211, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  criticalIcon: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  criticalBadge: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  criticalText: {
    fontSize: 10,
    color: '#FF6B6B',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  settingDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: 30,
    paddingVertical: 25,
  },
  continueButton: {
    height: 65,
    backgroundColor: '#3396D3',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  disabledButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  savingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 16,
    fontWeight: '500',
  },
});

export default AgentPrivacyScreen;