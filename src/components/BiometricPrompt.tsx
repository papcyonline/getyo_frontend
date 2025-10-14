import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useBiometric } from '../hooks/useBiometric';

interface BiometricPromptProps {
  visible: boolean;
  onSuccess: () => void;
  onCancel: () => void;
  onFallback?: () => void;
  title?: string;
  subtitle?: string;
}

/**
 * BiometricPrompt Component
 *
 * Displays a modal prompt for biometric authentication
 * Handles Face ID, Touch ID, and fingerprint authentication
 */
const BiometricPrompt: React.FC<BiometricPromptProps> = ({
  visible,
  onSuccess,
  onCancel,
  onFallback,
  title = 'Biometric Authentication',
  subtitle = 'Verify your identity to continue',
}) => {
  const { isAvailable, biometricType, authenticate, error } = useBiometric();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const pulseAnim = useState(new Animated.Value(1))[0];

  useEffect(() => {
    if (visible && isAvailable) {
      // Start pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Auto-trigger authentication when modal appears
      handleAuthenticate();
    }
  }, [visible, isAvailable]);

  const handleAuthenticate = async () => {
    setIsAuthenticating(true);

    const result = await authenticate(`Unlock with ${biometricType}`);

    setIsAuthenticating(false);

    if (result) {
      onSuccess();
    }
  };

  const getIconName = (): keyof typeof Ionicons.glyphMap => {
    if (biometricType.includes('Face')) {
      return 'scan-outline';
    }
    return 'finger-print-outline';
  };

  if (!isAvailable) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <LinearGradient
            colors={['rgba(20, 20, 20, 0.98)', 'rgba(10, 10, 10, 0.98)']}
            style={styles.content}
          >
            {/* Biometric Icon */}
            <Animated.View
              style={[
                styles.iconContainer,
                {
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            >
              <LinearGradient
                colors={['#3B82F6', '#2563EB']}
                style={styles.iconGradient}
              >
                <Ionicons name={getIconName()} size={48} color="#FFFFFF" />
              </LinearGradient>
            </Animated.View>

            {/* Title */}
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>

            {/* Biometric Type */}
            <View style={styles.biometricBadge}>
              <Ionicons name={getIconName()} size={16} color="#3B82F6" />
              <Text style={styles.biometricText}>{biometricType}</Text>
            </View>

            {/* Error Message */}
            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={16} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={handleAuthenticate}
                disabled={isAuthenticating}
              >
                <LinearGradient
                  colors={['#3B82F6', '#2563EB']}
                  style={styles.retryButtonGradient}
                >
                  <Text style={styles.retryButtonText}>
                    {isAuthenticating ? 'Authenticating...' : 'Try Again'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              {onFallback && (
                <TouchableOpacity
                  style={styles.fallbackButton}
                  onPress={onFallback}
                >
                  <Text style={styles.fallbackButtonText}>Use Password</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onCancel}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    overflow: 'hidden',
  },
  content: {
    padding: 32,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconGradient: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginBottom: 24,
  },
  biometricBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 24,
  },
  biometricText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
    marginLeft: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
  },
  errorText: {
    fontSize: 13,
    color: '#EF4444',
    marginLeft: 8,
    flex: 1,
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  retryButton: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  retryButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  fallbackButton: {
    width: '100%',
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
  },
  fallbackButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  cancelButton: {
    width: '100%',
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.5)',
  },
});

export default BiometricPrompt;
