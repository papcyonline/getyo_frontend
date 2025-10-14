import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useBiometric } from '../hooks/useBiometric';
import BiometricPrompt from '../components/BiometricPrompt';

interface BiometricSettingsScreenProps {
  navigation: any;
}

/**
 * BiometricSettingsScreen
 *
 * Allows users to configure biometric authentication settings
 */
const BiometricSettingsScreen: React.FC<BiometricSettingsScreenProps> = ({ navigation }) => {
  const { isAvailable, isEnabled, biometricType, enable, disable, error } = useBiometric();
  const [showTestPrompt, setShowTestPrompt] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const handleToggleBiometric = async () => {
    if (isToggling) return;

    setIsToggling(true);

    try {
      if (isEnabled) {
        // Disable biometric
        const success = await disable();
        if (success) {
          Alert.alert(
            'Biometric Disabled',
            'You will need to use your password to log in from now on.',
            [{ text: 'OK' }]
          );
        }
      } else {
        // Enable biometric
        const success = await enable();
        if (success) {
          Alert.alert(
            `${biometricType} Enabled`,
            'You can now use biometric authentication to log in quickly and securely.',
            [{ text: 'Great!' }]
          );
        } else if (error) {
          Alert.alert('Enable Failed', error, [{ text: 'OK' }]);
        }
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to toggle biometric authentication', [{ text: 'OK' }]);
    } finally {
      setIsToggling(false);
    }
  };

  const handleTestBiometric = () => {
    setShowTestPrompt(true);
  };

  const getBiometricIcon = (): keyof typeof Ionicons.glyphMap => {
    if (biometricType.includes('Face')) {
      return 'scan';
    }
    return 'finger-print';
  };

  if (!isAvailable) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.unavailableContainer}>
            <Ionicons name="close-circle-outline" size={64} color="rgba(255, 255, 255, 0.3)" />
            <Text style={styles.unavailableTitle}>Biometric Not Available</Text>
            <Text style={styles.unavailableText}>
              Your device doesn't support biometric authentication, or you haven't set it up in your device settings.
            </Text>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => Alert.alert('Settings', 'Go to Settings > Face ID & Passcode (or Touch ID & Passcode) to set up biometric authentication.')}
            >
              <Text style={styles.settingsButtonText}>Device Settings</Text>
              <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.7)" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <LinearGradient
            colors={['#3B82F6', '#2563EB']}
            style={styles.iconGradient}
          >
            <Ionicons name={getBiometricIcon()} size={48} color="#FFFFFF" />
          </LinearGradient>
          <Text style={styles.headerTitle}>{biometricType}</Text>
          <Text style={styles.headerSubtitle}>
            Secure and convenient authentication
          </Text>
        </View>

        {/* Enable/Disable Toggle */}
        <View style={styles.section}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Enable {biometricType}</Text>
              <Text style={styles.settingDescription}>
                Use {biometricType} to unlock the app and authenticate actions
              </Text>
            </View>
            <Switch
              value={isEnabled}
              onValueChange={handleToggleBiometric}
              disabled={isToggling}
              trackColor={{ false: 'rgba(255, 255, 255, 0.2)', true: '#3B82F6' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Test Biometric */}
        {isEnabled && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.testButton}
              onPress={handleTestBiometric}
            >
              <LinearGradient
                colors={['rgba(59, 130, 246, 0.1)', 'rgba(37, 99, 235, 0.1)']}
                style={styles.testButtonGradient}
              >
                <Ionicons name={getBiometricIcon()} size={24} color="#3B82F6" />
                <Text style={styles.testButtonText}>Test {biometricType}</Text>
                <Ionicons name="chevron-forward" size={20} color="#3B82F6" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How it works</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoItem}>
              <Ionicons name="lock-closed" size={20} color="#3B82F6" />
              <Text style={styles.infoText}>
                Your biometric data is stored securely on your device and never leaves it
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="flash" size={20} color="#3B82F6" />
              <Text style={styles.infoText}>
                Quick login without typing your password every time
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="shield-checkmark" size={20} color="#3B82F6" />
              <Text style={styles.infoText}>
                You can always use your password as a fallback
              </Text>
            </View>
          </View>
        </View>

        {/* Security Note */}
        <View style={styles.securityNote}>
          <Ionicons name="information-circle" size={20} color="rgba(255, 255, 255, 0.5)" />
          <Text style={styles.securityNoteText}>
            If you disable {biometricType} in your device settings, it will automatically be disabled in the app.
          </Text>
        </View>
      </ScrollView>

      {/* Test Biometric Prompt */}
      <BiometricPrompt
        visible={showTestPrompt}
        title="Test Biometric"
        subtitle="Authenticate to test your biometric setup"
        onSuccess={() => {
          setShowTestPrompt(false);
          Alert.alert('Success!', `${biometricType} is working correctly.`, [{ text: 'Great!' }]);
        }}
        onCancel={() => setShowTestPrompt(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 20,
  },
  iconGradient: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 18,
  },
  testButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  testButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    borderRadius: 12,
  },
  testButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
    marginLeft: 12,
  },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 12,
    lineHeight: 20,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  securityNoteText: {
    flex: 1,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginLeft: 8,
    lineHeight: 16,
  },
  unavailableContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  unavailableTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 24,
    marginBottom: 12,
  },
  unavailableText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  settingsButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    marginRight: 8,
  },
});

export default BiometricSettingsScreen;
