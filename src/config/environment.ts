import Constants from 'expo-constants';

interface EnvironmentConfig {
  API_BASE_URL: string;
  SOCKET_URL: string;
  DEBUG: boolean;
  API_TIMEOUT: number;
  VOICE_TIMEOUT: number;
  MAX_RECORDING_DURATION: number;
  SOCKET_RECONNECT_ATTEMPTS: number;
  SENTRY_DSN: string | null;
  ENABLE_ANALYTICS: boolean;
  ENVIRONMENT: string;
}

// Get config from app.config.js via Expo Constants
const expoConfig = Constants.expoConfig?.extra || {};

const development: EnvironmentConfig = {
  API_BASE_URL: expoConfig.apiUrl || 'http://192.168.1.232:3000',
  SOCKET_URL: expoConfig.socketUrl || 'http://192.168.1.232:3000',
  DEBUG: true,
  API_TIMEOUT: 30000, // Allow time for AI processing - 30 seconds
  VOICE_TIMEOUT: 30000,
  MAX_RECORDING_DURATION: 300000, // 5 minutes
  SOCKET_RECONNECT_ATTEMPTS: 5,
  SENTRY_DSN: expoConfig.sentryDsn || null,
  ENABLE_ANALYTICS: expoConfig.enableAnalytics || false,
  ENVIRONMENT: expoConfig.environment || 'development',
};

const production: EnvironmentConfig = {
  API_BASE_URL: expoConfig.apiUrl || 'https://api.yoapp.com',
  SOCKET_URL: expoConfig.socketUrl || 'https://api.yoapp.com',
  DEBUG: false,
  API_TIMEOUT: 30000, // Production network - 30 seconds
  VOICE_TIMEOUT: 30000,
  MAX_RECORDING_DURATION: 300000,
  SOCKET_RECONNECT_ATTEMPTS: 3,
  SENTRY_DSN: expoConfig.sentryDsn || null,
  ENABLE_ANALYTICS: expoConfig.enableAnalytics !== false,
  ENVIRONMENT: expoConfig.environment || 'production',
};

const config: EnvironmentConfig = __DEV__ ? development : production;

// Log configuration on startup (hide sensitive data in production)
if (__DEV__) {
  console.log('📱 Environment Configuration:', {
    ...config,
    SENTRY_DSN: config.SENTRY_DSN ? '***REDACTED***' : null,
  });
}

export default config;