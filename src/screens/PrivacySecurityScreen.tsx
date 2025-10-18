import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { RootState } from '../store';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';
import { useBiometric } from '../hooks/useBiometric';

const { height } = Dimensions.get('window');

const PrivacySecurityScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const theme = useSelector((state: RootState) => state.theme.theme);
  const { isEnabled: isBiometricEnabled, isAvailable: isBiometricAvailable, enable: enableBiometric, disable: disableBiometric, biometricType } = useBiometric();

  const [dataEncryption, setDataEncryption] = useState(true);
  const [analyticsSharing, setAnalyticsSharing] = useState(false);
  const [crashReporting, setCrashReporting] = useState(true);
  const [locationAccess, setLocationAccess] = useState(true);
  const [loading, setLoading] = useState(true);

  // Load privacy settings on mount
  useEffect(() => {
    const loadPrivacySettings = async () => {
      try {
        const settings = await ApiService.getPrivacySettings();
        setDataEncryption(settings.dataEncryption ?? true);
        setAnalyticsSharing(settings.analyticsSharing ?? false);
        setCrashReporting(settings.crashReporting ?? true);
        setLocationAccess(settings.locationAccess ?? true);
      } catch (error) {
        console.error('Failed to load privacy settings:', error);
        Alert.alert('Error', 'Failed to load privacy settings');
      } finally {
        setLoading(false);
      }
    };

    loadPrivacySettings();
  }, []);

  const handleBackPress = () => {
    navigation.goBack();
  };

  // Handle biometric toggle
  const handleBiometricToggle = async (value: boolean) => {
    if (!isBiometricAvailable) {
      Alert.alert(
        'Not Available',
        `${biometricType} is not available on this device or not set up. Please enable it in your device settings.`
      );
      return;
    }

    try {
      if (value) {
        // Enable biometric - this will prompt for authentication
        const success = await enableBiometric();
        if (!success) {
          Alert.alert('Failed', 'Could not enable biometric authentication');
        } else {
          // Also save to backend
          await ApiService.updatePrivacySettings({ biometricLock: true });
          Alert.alert('Enabled', `${biometricType} has been enabled successfully`);
        }
      } else {
        // Disable biometric
        const success = await disableBiometric();
        if (success) {
          // Also save to backend
          await ApiService.updatePrivacySettings({ biometricLock: false });
          Alert.alert('Disabled', `${biometricType} has been disabled`);
        }
      }
    } catch (error) {
      console.error('Failed to toggle biometric:', error);
      Alert.alert('Error', 'Failed to update biometric setting');
    }
  };

  // Update handlers to save changes to API
  const handleToggle = async (
    setting: 'dataEncryption' | 'analyticsSharing' | 'crashReporting' | 'locationAccess',
    value: boolean
  ) => {
    try {
      await ApiService.updatePrivacySettings({ [setting]: value });
    } catch (error) {
      console.error(`Failed to update ${setting}:`, error);
      Alert.alert('Error', 'Failed to save setting. Please try again.');
    }
  };

  const privacySettings = [
    {
      title: `${biometricType} Lock`,
      subtitle: `Use ${biometricType} to secure app`,
      value: isBiometricEnabled,
      onValueChange: handleBiometricToggle,
      icon: 'finger-print-outline',
      disabled: !isBiometricAvailable
    },
    {
      title: 'Data Encryption',
      subtitle: 'Encrypt all data stored locally',
      value: dataEncryption,
      onValueChange: (value: boolean) => {
        setDataEncryption(value);
        handleToggle('dataEncryption', value);
      },
      icon: 'shield-checkmark-outline'
    },
    {
      title: 'Analytics Sharing',
      subtitle: 'Share anonymous usage data to improve app',
      value: analyticsSharing,
      onValueChange: (value: boolean) => {
        setAnalyticsSharing(value);
        handleToggle('analyticsSharing', value);
      },
      icon: 'analytics-outline'
    },
    {
      title: 'Crash Reporting',
      subtitle: 'Send crash reports to help fix issues',
      value: crashReporting,
      onValueChange: (value: boolean) => {
        setCrashReporting(value);
        handleToggle('crashReporting', value);
      },
      icon: 'bug-outline'
    },
    {
      title: 'Location Access',
      subtitle: 'Allow location-based features',
      value: locationAccess,
      onValueChange: (value: boolean) => {
        setLocationAccess(value);
        handleToggle('locationAccess', value);
      },
      icon: 'location-outline'
    },
  ];

  const securityOptions = [
    {
      title: 'Change Passcode',
      subtitle: 'Update your app passcode',
      icon: 'keypad-outline',
      action: () => (navigation as any).navigate('ChangePasscode')
    },
    {
      title: 'Two-Factor Authentication',
      subtitle: 'Add extra security to your account',
      icon: 'shield-outline',
      action: () => (navigation as any).navigate('TwoFactorAuth')
    },
    {
      title: 'Active Sessions',
      subtitle: 'Manage your active login sessions',
      icon: 'phone-portrait-outline',
      action: () => (navigation as any).navigate('ActiveSessions')
    },
  ];

  const handleDataExport = () => {
    Alert.alert(
      'Export Your Data',
      'Your data will be exported in JSON format. This includes all your tasks, events, reminders, notes, and conversations.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: async () => {
            try {
              setLoading(true);
              await ApiService.exportUserData('json');
              Alert.alert(
                'Success',
                'Your data has been exported successfully. Check your downloads folder.',
                [{ text: 'OK' }]
              );
            } catch (error: any) {
              console.error('Export data failed:', error);
              const errorMessage = error?.response?.data?.error || 'Failed to export data';
              Alert.alert('Error', errorMessage);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will remove temporary data and sign you out from other devices. Your account data will remain safe.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const result = await ApiService.clearCache();
              Alert.alert(
                'Success',
                `Cache cleared successfully. ${result.sessionsCleared} session(s) removed.`,
                [{ text: 'OK' }]
              );
            } catch (error: any) {
              console.error('Clear cache failed:', error);
              const errorMessage = error?.response?.data?.error || 'Failed to clear cache';
              Alert.alert('Error', errorMessage);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.prompt(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.\n\nPlease type "DELETE MY ACCOUNT" to confirm:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: (confirmText) => {
            if (confirmText !== 'DELETE MY ACCOUNT') {
              Alert.alert('Error', 'Please type "DELETE MY ACCOUNT" exactly to confirm');
              return;
            }

            // Ask for password
            Alert.prompt(
              'Confirm Password',
              'Enter your password to confirm account deletion:',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete Account',
                  style: 'destructive',
                  onPress: async (password) => {
                    if (!password) {
                      Alert.alert('Error', 'Password is required');
                      return;
                    }

                    try {
                      setLoading(true);
                      await ApiService.deleteAccount(password, 'DELETE MY ACCOUNT');
                      Alert.alert(
                        'Account Deleted',
                        'Your account has been permanently deleted.',
                        [
                          {
                            text: 'OK',
                            onPress: () => {
                              // Navigation will be handled automatically by the auth interceptor
                              // when the token is cleared
                            }
                          }
                        ]
                      );
                    } catch (error: any) {
                      console.error('Delete account failed:', error);
                      const errorMessage = error?.response?.data?.error || 'Failed to delete account';
                      Alert.alert('Error', errorMessage);
                      setLoading(false);
                    }
                  }
                }
              ],
              'secure-text'
            );
          }
        }
      ],
      'plain-text'
    );
  };

  const dataOptions = [
    {
      title: 'Data Export',
      subtitle: 'Download your data',
      icon: 'download-outline',
      action: handleDataExport
    },
    {
      title: 'Clear Cache',
      subtitle: 'Free up storage space',
      icon: 'trash-outline',
      action: handleClearCache
    },
    {
      title: 'Delete Account',
      subtitle: 'Permanently delete your account and data',
      icon: 'warning-outline',
      action: handleDeleteAccount,
      isDanger: true
    },
  ];

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#C9A96E" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Blue-Black Gradient Background */}

      <ScrollView showsVerticalScrollIndicator={false}
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
          <Text style={[styles.headerTitle, { color: theme.text }]}>Privacy & Security</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Privacy Settings */}
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>PRIVACY SETTINGS</Text>
          {privacySettings.map((setting, index) => (
            <View
              key={index}
              style={[
                styles.settingItem,
                { borderBottomColor: theme.border },
                index === privacySettings.length - 1 && styles.lastItem
              ]}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: 'rgba(201, 169, 110, 0.1)' }]}>
                  <Ionicons name={setting.icon as any} size={20} color="#C9A96E" />
                </View>
                <View style={styles.textContainer}>
                  <Text style={[styles.settingTitle, { color: theme.text }]}>
                    {setting.title}
                  </Text>
                  <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>
                    {setting.subtitle}
                  </Text>
                </View>
              </View>
              <Switch
                value={setting.value}
                onValueChange={setting.onValueChange}
                disabled={setting.disabled}
                trackColor={{ false: 'rgba(201, 169, 110, 0.3)', true: '#C9A96E' }}
                thumbColor="#C9A96E"
                ios_backgroundColor="rgba(201, 169, 110, 0.3)"
              />
            </View>
          ))}
        </View>

        {/* Security Options */}
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>SECURITY</Text>
          {securityOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.settingItem,
                { borderBottomColor: theme.border },
                index === securityOptions.length - 1 && styles.lastItem
              ]}
              onPress={option.action}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: 'rgba(201, 169, 110, 0.1)' }]}>
                  <Ionicons name={option.icon as any} size={20} color="#C9A96E" />
                </View>
                <View style={styles.textContainer}>
                  <Text style={[styles.settingTitle, { color: theme.text }]}>
                    {option.title}
                  </Text>
                  <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>
                    {option.subtitle}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Data Management */}
        <View style={[styles.section, { backgroundColor: theme.surface, marginBottom: 20 }]}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>DATA MANAGEMENT</Text>
          {dataOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.settingItem,
                { borderBottomColor: theme.border },
                index === dataOptions.length - 1 && styles.lastItem
              ]}
              onPress={option.action}
            >
              <View style={styles.settingLeft}>
                <View style={[
                  styles.iconContainer,
                  { backgroundColor: option.isDanger ? 'rgba(239, 68, 68, 0.1)' : 'rgba(201, 169, 110, 0.1)' }
                ]}>
                  <Ionicons
                    name={option.icon as any}
                    size={20}
                    color={option.isDanger ? (theme.error || '#ef4444') : '#C9A96E'}
                  />
                </View>
                <View style={styles.textContainer}>
                  <Text style={[
                    styles.settingTitle,
                    { color: option.isDanger ? (theme.error || '#ef4444') : theme.text }
                  ]}>
                    {option.title}
                  </Text>
                  <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>
                    {option.subtitle}
                  </Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={option.isDanger ? (theme.error || '#ef4444') : theme.textSecondary}
              />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.6,
    zIndex: 1,
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
  section: {
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
});

export default PrivacySecurityScreen;