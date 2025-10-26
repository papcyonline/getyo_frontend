// app.config.js - Expo configuration with environment variables
// This allows for dynamic configuration based on environment

export default ({ config }) => {
  // Determine environment from process.env or default to development
  const ENV = process.env.APP_ENV || 'development';

  // Environment-specific configuration
  const envConfig = {
    development: {
      apiUrl: process.env.API_URL || 'http://192.168.1.232:3000',
      socketUrl: process.env.SOCKET_URL || 'http://192.168.1.232:3000',
      sentryDsn: null, // Don't use Sentry in development
      enableAnalytics: false,
    },
    staging: {
      apiUrl: process.env.API_URL || 'https://staging-api.yoapp.com',
      socketUrl: process.env.SOCKET_URL || 'https://staging-api.yoapp.com',
      sentryDsn: process.env.SENTRY_DSN,
      enableAnalytics: true,
    },
    production: {
      apiUrl: process.env.API_URL || 'https://api.yoapp.com',
      socketUrl: process.env.SOCKET_URL || 'https://api.yoapp.com',
      sentryDsn: process.env.SENTRY_DSN,
      enableAnalytics: true,
    },
  };

  return {
    ...config,
    name: 'Yo!',
    slug: 'yo-assistant',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#0A0A0A',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.yoapp.assistant',
      infoPlist: {
        NSFaceIDUsageDescription: 'We use Face ID to securely authenticate you and protect your data.',
        NSMicrophoneUsageDescription: 'We need access to your microphone for voice commands and conversations.',
        NSCameraUsageDescription: 'We need access to your camera to upload profile pictures and documents.',
        NSCalendarsUsageDescription: 'We need access to your calendar to manage events and reminders.',
        NSRemindersUsageDescription: 'We need access to your reminders to help you stay organized.',
        NSLocationWhenInUseUsageDescription: 'We use your location to provide location-based reminders and suggestions.',
        NSSpeechRecognitionUsageDescription: 'We use speech recognition for voice commands and transcription.',
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#0A0A0A',
      },
      package: 'com.yoapp.assistant',
      permissions: [
        'CAMERA',
        'RECORD_AUDIO',
        'READ_CALENDAR',
        'WRITE_CALENDAR',
        'READ_EXTERNAL_STORAGE',
        'WRITE_EXTERNAL_STORAGE',
        'ACCESS_FINE_LOCATION',
        'ACCESS_COARSE_LOCATION',
        'USE_BIOMETRIC',
        'USE_FINGERPRINT',
      ],
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      'expo-secure-store',
      'expo-local-authentication',
      [
        'expo-notifications',
        {
          icon: './assets/icon.png',
          color: '#3B82F6',
        },
      ],
      [
        '@sentry/react-native',
        {
          organization: process.env.SENTRY_ORG,
          project: process.env.SENTRY_PROJECT,
        },
      ],
    ],
    extra: {
      ...envConfig[ENV],
      environment: ENV,
      eas: {
        projectId: '0968f9f3-377d-4ee2-a0d2-879e868d9124',
      },
    },
    hooks: {
      postPublish: [
        {
          file: 'sentry-expo/upload-sourcemaps',
          config: {
            organization: process.env.SENTRY_ORG,
            project: process.env.SENTRY_PROJECT,
            authToken: process.env.SENTRY_AUTH_TOKEN,
          },
        },
      ],
    },
  };
};
