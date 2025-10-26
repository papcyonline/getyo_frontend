import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { store } from '../store';
import config from '../config/environment';

interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string;
  details: any;
}

class NetworkService {
  private listeners: ((state: NetworkState) => void)[] = [];
  private currentState: NetworkState = {
    isConnected: false,
    isInternetReachable: null,
    type: 'unknown',
    details: null
  };

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    // Listen for network state changes
    NetInfo.addEventListener((state: NetInfoState) => {
      console.log('📶 Network state changed:', {
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
        details: state.details
      });

      this.currentState = {
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
        details: state.details
      };

      // Notify all listeners
      this.listeners.forEach(listener => {
        try {
          listener(this.currentState);
        } catch (error) {
          console.error('Error in network state listener:', error);
        }
      });
    });

    // Get initial network state
    this.refreshNetworkState();
  }

  async refreshNetworkState(): Promise<NetworkState> {
    try {
      const state = await NetInfo.fetch();

      this.currentState = {
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
        details: state.details
      };

      console.log('📶 Current network state:', this.currentState);
      return this.currentState;
    } catch (error) {
      console.error('Failed to fetch network state:', error);
      return this.currentState;
    }
  }

  getCurrentState(): NetworkState {
    return this.currentState;
  }

  isConnected(): boolean {
    return this.currentState.isConnected;
  }

  isInternetReachable(): boolean {
    return this.currentState.isInternetReachable === true;
  }

  getConnectionType(): string {
    return this.currentState.type;
  }

  // Add listener for network state changes
  addListener(listener: (state: NetworkState) => void): () => void {
    this.listeners.push(listener);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Remove all listeners
  removeAllListeners(): void {
    this.listeners = [];
  }

  // Check if we can reach a specific host
  async checkHostReachability(host: string, timeout: number = 5000): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(`${host}/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.log(`❌ Host ${host} is not reachable:`, error);
      return false;
    }
  }

  // Get detailed connectivity report
  async getConnectivityReport(): Promise<{
    network: NetworkState;
    apiReachable: boolean;
    timestamp: string;
  }> {
    const networkState = await this.refreshNetworkState();

    let apiReachable = false;
    if (networkState.isConnected) {
      // Check if our backend API is reachable
      apiReachable = await this.checkHostReachability(config.API_BASE_URL);
    }

    return {
      network: networkState,
      apiReachable,
      timestamp: new Date().toISOString()
    };
  }

  // Monitor connectivity and provide callbacks
  monitorConnectivity(callbacks: {
    onConnected?: () => void;
    onDisconnected?: () => void;
    onReconnected?: () => void;
  }): () => void {
    let wasConnected = this.currentState.isConnected;

    return this.addListener((state) => {
      const isConnected = state.isConnected;

      if (isConnected && !wasConnected) {
        // Reconnected
        console.log('🟢 Network reconnected');
        callbacks.onReconnected?.();
        callbacks.onConnected?.();
      } else if (!isConnected && wasConnected) {
        // Disconnected
        console.log('🔴 Network disconnected');
        callbacks.onDisconnected?.();
      } else if (isConnected && wasConnected) {
        // Still connected (might be different network)
        console.log('🟡 Network state changed while connected');
        callbacks.onConnected?.();
      }

      wasConnected = isConnected;
    });
  }
}

export default new NetworkService();