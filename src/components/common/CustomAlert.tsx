import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';

const { width, height } = Dimensions.get('window');

export interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
  primaryButton?: {
    text: string;
    onPress: () => void;
  };
  secondaryButton?: {
    text: string;
    onPress: () => void;
  };
}

const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  title,
  message,
  type = 'info',
  onClose,
  primaryButton,
  secondaryButton,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handlePrimaryAction = () => {
    if (primaryButton?.onPress) {
      primaryButton.onPress();
    } else {
      onClose();
    }
  };

  const handleSecondaryAction = () => {
    if (secondaryButton?.onPress) {
      secondaryButton.onPress();
    }
    onClose();
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View
        style={[styles.overlay, { opacity: opacityAnim }]}
      >
        <TouchableOpacity
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={onClose}
        >
          <Animated.View
            style={[
              styles.alertContainer,
              {
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <TouchableOpacity activeOpacity={1}>
              <View style={styles.alertBox}>
                {/* Title */}
                <Text style={styles.title}>{title}</Text>

                {/* Message */}
                <Text style={styles.message}>{message}</Text>

                {/* Buttons */}
                <View style={styles.buttonContainer}>
                  {secondaryButton && (
                    <TouchableOpacity
                      style={styles.secondaryButton}
                      onPress={handleSecondaryAction}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.secondaryButtonText}>
                        {secondaryButton.text}
                      </Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[
                      styles.primaryButton,
                      secondaryButton ? { flex: 1 } : { width: '100%' }
                    ]}
                    onPress={handlePrimaryAction}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.primaryButtonText}>
                      {primaryButton?.text || 'OK'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTouchable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  alertContainer: {
    width: width * 0.8,
    maxWidth: 320,
  },
  alertBox: {
    backgroundColor: '#000000',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  message: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    height: 44,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: 0.3,
  },
  secondaryButton: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});

export default CustomAlert;