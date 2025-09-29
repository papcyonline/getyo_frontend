import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { RootState } from '../store';
import { Ionicons } from '@expo/vector-icons';

const { height } = Dimensions.get('window');

const PrivacySecurityScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const theme = useSelector((state: RootState) => state.theme.theme);

  const [biometricLock, setBiometricLock] = useState(true);
  const [dataEncryption, setDataEncryption] = useState(true);
  const [analyticsSharing, setAnalyticsSharing] = useState(false);
  const [crashReporting, setCrashReporting] = useState(true);
  const [locationAccess, setLocationAccess] = useState(true);

  const handleBackPress = () => {
    navigation.goBack();
  };

  const privacySettings = [
    {
      title: 'Biometric Lock',
      subtitle: 'Use Face ID or Touch ID to secure app',
      value: biometricLock,
      onValueChange: setBiometricLock,
      icon: 'finger-print-outline'
    },
    {
      title: 'Data Encryption',
      subtitle: 'Encrypt all data stored locally',
      value: dataEncryption,
      onValueChange: setDataEncryption,
      icon: 'shield-checkmark-outline'
    },
    {
      title: 'Analytics Sharing',
      subtitle: 'Share anonymous usage data to improve app',
      value: analyticsSharing,
      onValueChange: setAnalyticsSharing,
      icon: 'analytics-outline'
    },
    {
      title: 'Crash Reporting',
      subtitle: 'Send crash reports to help fix issues',
      value: crashReporting,
      onValueChange: setCrashReporting,
      icon: 'bug-outline'
    },
    {
      title: 'Location Access',
      subtitle: 'Allow location-based features',
      value: locationAccess,
      onValueChange: setLocationAccess,
      icon: 'location-outline'
    },
  ];

  const securityOptions = [
    {
      title: 'Change Passcode',
      subtitle: 'Update your app passcode',
      icon: 'keypad-outline',
      action: () => {}
    },
    {
      title: 'Two-Factor Authentication',
      subtitle: 'Add extra security to your account',
      icon: 'shield-outline',
      action: () => {}
    },
    {
      title: 'Active Sessions',
      subtitle: 'Manage your active login sessions',
      icon: 'phone-portrait-outline',
      action: () => {}
    },
  ];

  const dataOptions = [
    {
      title: 'Data Export',
      subtitle: 'Download your data',
      icon: 'download-outline',
      action: () => {}
    },
    {
      title: 'Clear Cache',
      subtitle: 'Free up storage space',
      icon: 'trash-outline',
      action: () => {}
    },
    {
      title: 'Delete Account',
      subtitle: 'Permanently delete your account and data',
      icon: 'warning-outline',
      action: () => {},
      isDanger: true
    },
  ];

  return (
    <View style={styles.container}>
      {/* Blue-Black Gradient Background */}
      <LinearGradient
        colors={['rgba(51, 150, 211, 0.15)', 'rgba(51, 150, 211, 0.05)', 'transparent']}
        style={styles.gradientBackground}
        start={{ x: 0.5, y: 0.6 }}
        end={{ x: 0.5, y: 1 }}
        pointerEvents="none"
      />
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
                <View style={[styles.iconContainer, { backgroundColor: 'rgba(21, 183, 232, 0.1)' }]}>
                  <Ionicons name={setting.icon as any} size={20} color="#FFFFFF" />
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
                trackColor={{ false: 'rgba(255, 255, 255, 0.3)', true: '#3396D3' }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="rgba(255, 255, 255, 0.3)"
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
                <View style={[styles.iconContainer, { backgroundColor: 'rgba(21, 183, 232, 0.1)' }]}>
                  <Ionicons name={option.icon as any} size={20} color="#FFFFFF" />
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
                  { backgroundColor: option.isDanger ? 'rgba(239, 68, 68, 0.1)' : 'rgba(21, 183, 232, 0.1)' }
                ]}>
                  <Ionicons
                    name={option.icon as any}
                    size={20}
                    color={option.isDanger ? (theme.error || '#ef4444') : '#FFFFFF'}
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