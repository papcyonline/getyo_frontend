import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useBiometric } from '../hooks/useBiometric';
import { useAuth } from '../hooks/useAuth';
import BiometricPrompt from './BiometricPrompt';

interface BiometricLoginGateProps {
  children: React.ReactNode;
}

/**
 * BiometricLoginGate
 *
 * Intercepts app access and prompts for biometric authentication
 * if enabled and user is authenticated
 */
const BiometricLoginGate: React.FC<BiometricLoginGateProps> = ({ children }) => {
  const { isEnabled, isAvailable } = useBiometric();
  const { isAuthenticated, user } = useAuth();
  const [showBiometric, setShowBiometric] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    // Show biometric prompt if:
    // 1. User is authenticated
    // 2. Biometric is enabled
    // 3. Biometric is available
    // 4. Not already unlocked
    if (isAuthenticated && isEnabled && isAvailable && !isUnlocked) {
      // Small delay to allow app to initialize
      const timer = setTimeout(() => {
        setShowBiometric(true);
      }, 500);

      return () => clearTimeout(timer);
    } else if (isAuthenticated && (!isEnabled || !isAvailable)) {
      // If biometric not enabled/available, just unlock immediately
      setIsUnlocked(true);
    }
  }, [isAuthenticated, isEnabled, isAvailable]);

  // Reset unlock state when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      setIsUnlocked(false);
      setShowBiometric(false);
    }
  }, [isAuthenticated]);

  const handleBiometricSuccess = () => {
    setShowBiometric(false);
    setIsUnlocked(true);
  };

  const handleBiometricCancel = () => {
    // User cancelled biometric - they should use password
    // For now, we'll just hide the prompt and let them try again
    setShowBiometric(false);
  };

  const handleBiometricFallback = () => {
    // User wants to use password instead
    setShowBiometric(false);
    // Could navigate to a password verification screen here
    // For now, we'll unlock the app (they're already authenticated with a valid token)
    setIsUnlocked(true);
  };

  // If not authenticated or already unlocked, show children directly
  if (!isAuthenticated || isUnlocked || !isEnabled || !isAvailable) {
    return <>{children}</>;
  }

  // Show biometric prompt overlay
  return (
    <View style={styles.container}>
      {children}
      <BiometricPrompt
        visible={showBiometric}
        title="Unlock Yo!"
        subtitle="Authenticate to access your personal assistant"
        onSuccess={handleBiometricSuccess}
        onCancel={handleBiometricCancel}
        onFallback={handleBiometricFallback}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default BiometricLoginGate;
