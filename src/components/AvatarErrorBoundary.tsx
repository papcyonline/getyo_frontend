import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
  children: ReactNode;
  onError?: () => void;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary specifically for ReadyPlayerMeAvatar component
 * Catches WebView crashes and React errors to prevent app crashes
 */
class AvatarErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error to console
    console.error('AvatarErrorBoundary caught an error:', error, errorInfo);

    // Call the onError callback if provided
    this.props.onError?.();
  }

  render() {
    if (this.state.hasError) {
      // Render custom fallback UI if provided, otherwise show default
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <View style={styles.errorContainer}>
          <LinearGradient
            colors={['#C9A96E', '#E5C794']}
            style={styles.errorGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="warning-outline" size={60} color="#FFFFFF" />
          </LinearGradient>
          <Text style={styles.errorTitle}>Avatar Unavailable</Text>
          <Text style={styles.errorMessage}>
            Unable to load 3D avatar
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  errorGradient: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#C9A96E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    fontWeight: '500',
    color: '#999999',
    textAlign: 'center',
    maxWidth: 250,
  },
});

export default AvatarErrorBoundary;
