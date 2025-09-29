import NetworkService from './networkService';
import SocketService from './socket';
import ApiService from './api';
import AuthService from './auth';
import LocaleService from './localeService';

interface ConnectionStatus {
  network: boolean;
  api: boolean;
  socket: boolean;
  overall: 'connected' | 'partial' | 'disconnected';
  lastChecked: string;
}

class ConnectionManager {
  private status: ConnectionStatus = {
    network: false,
    api: false,
    socket: false,
    overall: 'disconnected',
    lastChecked: new Date().toISOString()
  };

  private listeners: ((status: ConnectionStatus) => void)[] = [];
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('🔄 Connection manager already initialized');
      return;
    }

    try {
      console.log('🚀 Initializing Connection Manager...');

      // Initialize locale service first
      await LocaleService.initialize();

      // Monitor network changes
      NetworkService.monitorConnectivity({
        onConnected: () => {
          console.log('🟢 Network connected - checking services...');
          this.checkAllConnections();
        },
        onDisconnected: () => {
          console.log('🔴 Network disconnected');
          this.updateStatus({ network: false, api: false, socket: false });
        },
        onReconnected: () => {
          console.log('🟡 Network reconnected - re-establishing connections...');
          this.reconnectServices();
        }
      });

      // Initial connection check
      await this.checkAllConnections();

      this.initialized = true;
      console.log('✅ Connection Manager initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Connection Manager:', error);
      throw error;
    }
  }

  private async checkAllConnections(): Promise<void> {
    try {
      console.log('🔍 Checking all connections...');

      // Check network connectivity
      const networkState = NetworkService.getCurrentState();
      const networkConnected = networkState.isConnected;

      let apiConnected = false;
      let socketConnected = false;

      if (networkConnected) {
        // Check API connectivity
        try {
          apiConnected = await ApiService.checkConnection();
          console.log(`📡 API connectivity: ${apiConnected ? '✅' : '❌'}`);
        } catch (error) {
          console.log('📡 API connectivity: ❌ (error)');
          apiConnected = false;
        }

        // Check socket connectivity
        socketConnected = SocketService.isConnected();
        console.log(`🔌 Socket connectivity: ${socketConnected ? '✅' : '❌'}`);

        // Try to connect socket if not connected and we have a token
        if (!socketConnected && AuthService.isAuthenticated()) {
          try {
            console.log('🔌 Attempting to connect socket...');
            await SocketService.connect();
            socketConnected = SocketService.isConnected();
          } catch (error) {
            console.log('🔌 Socket connection failed:', error);
          }
        }
      }

      this.updateStatus({
        network: networkConnected,
        api: apiConnected,
        socket: socketConnected
      });

    } catch (error) {
      console.error('Failed to check connections:', error);
      this.updateStatus({ network: false, api: false, socket: false });
    }
  }

  private updateStatus(updates: Partial<Omit<ConnectionStatus, 'overall' | 'lastChecked'>>): void {
    const newStatus = {
      ...this.status,
      ...updates,
      lastChecked: new Date().toISOString()
    };

    // Determine overall status
    if (newStatus.network && newStatus.api && newStatus.socket) {
      newStatus.overall = 'connected';
    } else if (newStatus.network && (newStatus.api || newStatus.socket)) {
      newStatus.overall = 'partial';
    } else {
      newStatus.overall = 'disconnected';
    }

    // Only update if status actually changed
    if (JSON.stringify(this.status) !== JSON.stringify(newStatus)) {
      const previousStatus = this.status.overall;
      this.status = newStatus;

      console.log(`📊 Connection status updated: ${previousStatus} → ${newStatus.overall}`, {
        network: newStatus.network,
        api: newStatus.api,
        socket: newStatus.socket
      });

      // Notify listeners
      this.notifyListeners();
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.status);
      } catch (error) {
        console.error('Error in connection status listener:', error);
      }
    });
  }

  private async reconnectServices(): Promise<void> {
    try {
      console.log('🔄 Reconnecting services...');

      // Wait a moment for network to stabilize
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check if we're authenticated before trying to connect socket
      if (AuthService.isAuthenticated()) {
        try {
          await SocketService.connect();
          console.log('✅ Socket reconnected successfully');
        } catch (error) {
          console.log('❌ Failed to reconnect socket:', error);
        }
      }

      // Refresh connections
      await this.checkAllConnections();
    } catch (error) {
      console.error('Failed to reconnect services:', error);
    }
  }

  // Public methods
  getStatus(): ConnectionStatus {
    return { ...this.status };
  }

  isFullyConnected(): boolean {
    return this.status.overall === 'connected';
  }

  isPartiallyConnected(): boolean {
    return this.status.overall === 'partial';
  }

  isDisconnected(): boolean {
    return this.status.overall === 'disconnected';
  }

  hasNetworkConnection(): boolean {
    return this.status.network;
  }

  hasApiConnection(): boolean {
    return this.status.api;
  }

  hasSocketConnection(): boolean {
    return this.status.socket;
  }

  // Force a connection check
  async refresh(): Promise<ConnectionStatus> {
    console.log('🔄 Manually refreshing connections...');
    await this.checkAllConnections();
    return this.getStatus();
  }

  // Add status change listener
  addStatusListener(listener: (status: ConnectionStatus) => void): () => void {
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

  // Get detailed diagnostic information
  async getDiagnostics(): Promise<{
    connection: ConnectionStatus;
    network: any;
    api: any;
    locale: any;
    auth: {
      isAuthenticated: boolean;
      hasToken: boolean;
    };
  }> {
    const networkReport = await NetworkService.getConnectivityReport();
    const apiDiagnostics = await ApiService.getConnectionDiagnostics();
    const locale = LocaleService.getCurrentLocale();
    const authToken = await AuthService.getAuthToken();

    return {
      connection: this.getStatus(),
      network: networkReport,
      api: apiDiagnostics,
      locale,
      auth: {
        isAuthenticated: AuthService.isAuthenticated(),
        hasToken: !!authToken
      }
    };
  }

  // Attempt to fix connection issues
  async attemptFix(): Promise<{
    success: boolean;
    message: string;
    actions: string[];
  }> {
    const actions: string[] = [];
    let success = false;

    try {
      console.log('🔧 Attempting to fix connection issues...');

      // Step 1: Check network
      const networkState = await NetworkService.refreshNetworkState();
      actions.push(`Network check: ${networkState.isConnected ? 'OK' : 'FAILED'}`);

      if (!networkState.isConnected) {
        return {
          success: false,
          message: 'No network connection available. Please check your internet connection.',
          actions
        };
      }

      // Step 2: Try API connection
      const apiConnected = await ApiService.checkConnection();
      actions.push(`API check: ${apiConnected ? 'OK' : 'FAILED'}`);

      if (!apiConnected) {
        return {
          success: false,
          message: 'Cannot reach server. Please check if the server is running.',
          actions
        };
      }

      // Step 3: Try socket connection if authenticated
      if (AuthService.isAuthenticated()) {
        try {
          await SocketService.connect();
          actions.push('Socket connection: OK');
          success = true;
        } catch (error) {
          actions.push(`Socket connection: FAILED (${error})`);
        }
      } else {
        actions.push('Socket connection: SKIPPED (not authenticated)');
      }

      // Final status check
      await this.checkAllConnections();

      return {
        success: this.isFullyConnected() || this.isPartiallyConnected(),
        message: success ? 'Connection issues resolved!' : 'Some connection issues remain.',
        actions
      };

    } catch (error) {
      actions.push(`Fix attempt failed: ${error}`);
      return {
        success: false,
        message: 'Failed to fix connection issues. Please try again.',
        actions
      };
    }
  }

  // Cleanup
  destroy(): void {
    console.log('🧹 Cleaning up Connection Manager...');
    this.removeAllListeners();
    NetworkService.removeAllListeners();
    this.initialized = false;
  }
}

export default new ConnectionManager();