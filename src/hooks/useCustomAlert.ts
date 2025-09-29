import { useState, useCallback } from 'react';

export interface AlertConfig {
  title: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  primaryButton?: {
    text: string;
    onPress?: () => void;
  };
  secondaryButton?: {
    text: string;
    onPress?: () => void;
  };
}

export const useCustomAlert = () => {
  const [alertConfig, setAlertConfig] = useState<AlertConfig | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const showAlert = useCallback((config: AlertConfig) => {
    setAlertConfig(config);
    setIsVisible(true);
  }, []);

  const hideAlert = useCallback(() => {
    setIsVisible(false);
    // Clear config after animation completes
    setTimeout(() => setAlertConfig(null), 300);
  }, []);

  // Convenience methods for different alert types
  const showSuccess = useCallback((title: string, message: string, onPress?: () => void) => {
    showAlert({
      title,
      message,
      type: 'success',
      primaryButton: { text: 'Great!', onPress },
    });
  }, [showAlert]);

  const showError = useCallback((title: string, message: string, onPress?: () => void) => {
    showAlert({
      title,
      message,
      type: 'error',
      primaryButton: { text: 'Try Again', onPress },
    });
  }, [showAlert]);

  const showWarning = useCallback((title: string, message: string, onPress?: () => void) => {
    showAlert({
      title,
      message,
      type: 'warning',
      primaryButton: { text: 'Understood', onPress },
    });
  }, [showAlert]);

  const showInfo = useCallback((title: string, message: string, onPress?: () => void) => {
    showAlert({
      title,
      message,
      type: 'info',
      primaryButton: { text: 'OK', onPress },
    });
  }, [showAlert]);

  const showConfirm = useCallback((
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void
  ) => {
    showAlert({
      title,
      message,
      type: 'warning',
      primaryButton: { text: 'Confirm', onPress: onConfirm },
      secondaryButton: { text: 'Cancel', onPress: onCancel },
    });
  }, [showAlert]);

  return {
    alertConfig,
    isVisible,
    showAlert,
    hideAlert,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm,
  };
};