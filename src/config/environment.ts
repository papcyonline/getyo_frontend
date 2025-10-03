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
  API_BASE_URL: 'https://getyo-backend.onrender.com',
  SOCKET_URL: 'https://getyo-backend.onrender.com',
  DEBUG: true,
  API_TIMEOUT: 60000, // Increased to 60 seconds for Render cold starts
  VOICE_TIMEOUT: 30000,
  MAX_RECORDING_DURATION: 300000, // 5 minutes
  SOCKET_RECONNECT_ATTEMPTS: 10, // Increased reconnection attempts
};

const production: EnvironmentConfig = {
  API_BASE_URL: 'https://getyo-backend.onrender.com',
  SOCKET_URL: 'https://getyo-backend.onrender.com',
  DEBUG: false,
  API_TIMEOUT: 60000, // Increased to 60 seconds for Render cold starts
  VOICE_TIMEOUT: 30000,
  MAX_RECORDING_DURATION: 300000,
  SOCKET_RECONNECT_ATTEMPTS: 5, // Increased reconnection attempts
};

const config: EnvironmentConfig = __DEV__ ? development : production;

export default config;