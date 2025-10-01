interface EnvironmentConfig {
  API_BASE_URL: string;
  SOCKET_URL: string;
  DEBUG: boolean;
  API_TIMEOUT: number;
  VOICE_TIMEOUT: number;
  MAX_RECORDING_DURATION: number;
  SOCKET_RECONNECT_ATTEMPTS: number;
}

const development: EnvironmentConfig = {
  API_BASE_URL: 'http://192.168.1.206:3000',
  SOCKET_URL: 'http://192.168.1.206:3000',
  DEBUG: true,
  API_TIMEOUT: 30000, // Increased to 30 seconds
  VOICE_TIMEOUT: 30000,
  MAX_RECORDING_DURATION: 300000, // 5 minutes
  SOCKET_RECONNECT_ATTEMPTS: 10, // Increased reconnection attempts
};

const production: EnvironmentConfig = {
  API_BASE_URL: 'https://your-backend-url.com',
  SOCKET_URL: 'https://your-backend-url.com',
  DEBUG: false,
  API_TIMEOUT: 30000, // Increased to 30 seconds
  VOICE_TIMEOUT: 30000,
  MAX_RECORDING_DURATION: 300000,
  SOCKET_RECONNECT_ATTEMPTS: 5, // Increased reconnection attempts
};

const config: EnvironmentConfig = __DEV__ ? development : production;

export default config;