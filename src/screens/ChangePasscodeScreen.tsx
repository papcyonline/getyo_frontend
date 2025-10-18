import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { RootState } from '../store';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';
import AuthService from '../services/auth';

const ChangePasscodeScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const theme = useSelector((state: RootState) => state.theme.theme);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleChangePassword = async () => {
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (newPassword === currentPassword) {
      Alert.alert('Error', 'New password must be different from current password');
      return;
    }

    try {
      setLoading(true);

      // Call API to change password
      await ApiService.changePassword(currentPassword, newPassword);

      // Clear form fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      Alert.alert(
        'Success',
        'Your password has been updated successfully. Please log in with your new password.',
        [
          {
            text: 'OK',
            onPress: async () => {
              // Log out user since password change invalidates current session
              await AuthService.logout();
            }
          }
        ]
      );
    } catch (error: any) {
      // Handle expired session by logging out (don't log - it's expected)
      if (error.code === 'AUTH_EXPIRED' || error.status === 401) {
        // Session already cleared by API error handler
        // User will be automatically redirected to login
        return;
      }

      // Log and show other errors
      console.error('Change password error:', error);
      const errorMessage = error.message || error.error || 'Failed to change password';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

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
          <Text style={[styles.headerTitle, { color: theme.text }]}>Change Passcode</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Info Section */}
        <View style={[styles.infoCard, { backgroundColor: theme.surface }]}>
          <View style={[styles.infoIconContainer, { backgroundColor: 'rgba(201, 169, 110, 0.1)' }]}>
            <Ionicons name="shield-checkmark" size={24} color="#C9A96E" />
          </View>
          <Text style={[styles.infoTitle, { color: theme.text }]}>
            Secure Your Account
          </Text>
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>
            Choose a strong password with at least 6 characters, including uppercase, lowercase, and numbers.
          </Text>
        </View>

        {/* Current Password */}
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>CURRENT PASSWORD</Text>
          <View style={[styles.inputContainer, { borderBottomColor: theme.border }]}>
            <Ionicons name="lock-closed-outline" size={20} color="#C9A96E" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Enter current password"
              placeholderTextColor={theme.textTertiary}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry={!showCurrentPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
              <Ionicons
                name={showCurrentPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color={theme.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* New Password */}
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>NEW PASSWORD</Text>
          <View style={[styles.inputContainer, { borderBottomColor: theme.border }]}>
            <Ionicons name="lock-closed-outline" size={20} color="#C9A96E" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Enter new password"
              placeholderTextColor={theme.textTertiary}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showNewPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
              <Ionicons
                name={showNewPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color={theme.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Confirm New Password */}
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>CONFIRM NEW PASSWORD</Text>
          <View style={[styles.inputContainer, { borderBottomColor: theme.border }]}>
            <Ionicons name="lock-closed-outline" size={20} color="#C9A96E" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Re-enter new password"
              placeholderTextColor={theme.textTertiary}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              <Ionicons
                name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color={theme.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Password Requirements */}
        <View style={[styles.requirementsCard, { backgroundColor: theme.surface }]}>
          <Text style={[styles.requirementsTitle, { color: theme.text }]}>
            Password Requirements:
          </Text>
          <View style={styles.requirement}>
            <Ionicons
              name={newPassword.length >= 6 ? "checkmark-circle" : "ellipse-outline"}
              size={18}
              color={newPassword.length >= 6 ? '#10b981' : theme.textTertiary}
            />
            <Text style={[styles.requirementText, { color: theme.textSecondary }]}>
              At least 6 characters
            </Text>
          </View>
          <View style={styles.requirement}>
            <Ionicons
              name={/[A-Z]/.test(newPassword) ? "checkmark-circle" : "ellipse-outline"}
              size={18}
              color={/[A-Z]/.test(newPassword) ? '#10b981' : theme.textTertiary}
            />
            <Text style={[styles.requirementText, { color: theme.textSecondary }]}>
              At least one uppercase letter
            </Text>
          </View>
          <View style={styles.requirement}>
            <Ionicons
              name={/[a-z]/.test(newPassword) ? "checkmark-circle" : "ellipse-outline"}
              size={18}
              color={/[a-z]/.test(newPassword) ? '#10b981' : theme.textTertiary}
            />
            <Text style={[styles.requirementText, { color: theme.textSecondary }]}>
              At least one lowercase letter
            </Text>
          </View>
          <View style={styles.requirement}>
            <Ionicons
              name={/[0-9]/.test(newPassword) ? "checkmark-circle" : "ellipse-outline"}
              size={18}
              color={/[0-9]/.test(newPassword) ? '#10b981' : theme.textTertiary}
            />
            <Text style={[styles.requirementText, { color: theme.textSecondary }]}>
              At least one number
            </Text>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: '#C9A96E' }]}
          onPress={handleChangePassword}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Updating...' : 'Update Password'}
          </Text>
        </TouchableOpacity>
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
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 0.5,
    paddingBottom: 12,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  requirementsCard: {
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 16,
    padding: 16,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  requirement: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  requirementText: {
    fontSize: 13,
    marginLeft: 8,
  },
  saveButton: {
    marginHorizontal: 16,
    marginTop: 30,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ChangePasscodeScreen;
