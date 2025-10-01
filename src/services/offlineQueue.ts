import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import apiService from './api';

interface QueuedRequest {
  id: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  data?: any;
  headers?: Record<string, string>;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  priority: 'high' | 'medium' | 'low';
  category: 'auth' | 'task' | 'event' | 'conversation' | 'other';
}

interface QueueStats {
  totalQueued: number;
  byCategory: Record<string, number>;
  oldestRequest?: Date;
  newestRequest?: Date;
}

class OfflineQueueService {
  private QUEUE_KEY = '@yo_offline_queue';
  private QUEUE_STATS_KEY = '@yo_queue_stats';
  private queue: QueuedRequest[] = [];
  private isProcessing: boolean = false;
  private listeners: Set<(stats: QueueStats) => void> = new Set();
  private MAX_QUEUE_SIZE = 100;
  private QUEUE_EXPIRY_DAYS = 7;

  async initialize(): Promise<void> {
    try {
      // Load queue from storage
      await this.loadQueue();

      // Clean up expired requests
      await this.cleanupExpiredRequests();

      // Listen for network changes
      NetInfo.addEventListener(state => {
        if (state.isConnected && this.queue.length > 0) {
          console.log('📡 Network restored, processing offline queue...');
          this.processQueue();
        }
      });

      console.log('✅ Offline queue initialized', {
        queueSize: this.queue.length
      });
    } catch (error) {
      console.error('❌ Failed to initialize offline queue:', error);
    }
  }

  private async loadQueue(): Promise<void> {
    try {
      const queueStr = await AsyncStorage.getItem(this.QUEUE_KEY);
      if (queueStr) {
        this.queue = JSON.parse(queueStr);
        console.log(`📦 Loaded ${this.queue.length} queued requests`);
      }
    } catch (error) {
      console.error('Error loading queue:', error);
      this.queue = [];
    }
  }

  private async saveQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.QUEUE_KEY, JSON.stringify(this.queue));
      await this.updateStats();
    } catch (error) {
      console.error('Error saving queue:', error);
    }
  }

  async addToQueue(request: Omit<QueuedRequest, 'id' | 'timestamp' | 'retryCount'>): Promise<string> {
    try {
      // Check if queue is full
      if (this.queue.length >= this.MAX_QUEUE_SIZE) {
        // Remove oldest low-priority request
        const lowPriorityIndex = this.queue.findIndex(req => req.priority === 'low');
        if (lowPriorityIndex !== -1) {
          this.queue.splice(lowPriorityIndex, 1);
          console.log('⚠️ Queue full, removed oldest low-priority request');
        } else {
          console.error('❌ Queue full and no low-priority requests to remove');
          throw new Error('Queue is full');
        }
      }

      const queuedRequest: QueuedRequest = {
        ...request,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        retryCount: 0,
      };

      // Insert based on priority
      if (queuedRequest.priority === 'high') {
        this.queue.unshift(queuedRequest);
      } else if (queuedRequest.priority === 'medium') {
        const lowPriorityIndex = this.queue.findIndex(req => req.priority === 'low');
        if (lowPriorityIndex === -1) {
          this.queue.push(queuedRequest);
        } else {
          this.queue.splice(lowPriorityIndex, 0, queuedRequest);
        }
      } else {
        this.queue.push(queuedRequest);
      }

      await this.saveQueue();
      this.notifyListeners();

      console.log('➕ Added request to queue', {
        id: queuedRequest.id,
        method: queuedRequest.method,
        url: queuedRequest.url,
        priority: queuedRequest.priority,
        queueSize: this.queue.length
      });

      // Try to process immediately if online
      const networkState = await NetInfo.fetch();
      if (networkState.isConnected) {
        this.processQueue();
      }

      return queuedRequest.id;
    } catch (error) {
      console.error('Error adding to queue:', error);
      throw error;
    }
  }

  async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    console.log(`🔄 Processing offline queue (${this.queue.length} requests)...`);

    const networkState = await NetInfo.fetch();
    if (!networkState.isConnected) {
      console.log('⚠️ No network connection, stopping queue processing');
      this.isProcessing = false;
      return;
    }

    let processed = 0;
    let failed = 0;

    while (this.queue.length > 0) {
      const request = this.queue[0];

      try {
        console.log(`📤 Processing request: ${request.method} ${request.url}`);

        // Execute the request
        await this.executeRequest(request);

        // Remove from queue
        this.queue.shift();
        processed++;

        console.log(`✅ Request successful: ${request.id}`);
      } catch (error: any) {
        console.error(`❌ Request failed: ${request.id}`, error.message);

        // Increment retry count
        request.retryCount++;

        if (request.retryCount >= request.maxRetries) {
          // Max retries reached, remove from queue
          console.log(`❌ Max retries reached for request: ${request.id}`);
          this.queue.shift();
          failed++;
        } else {
          // Move to end of queue for retry
          const failedRequest = this.queue.shift()!;
          this.queue.push(failedRequest);
          console.log(`🔄 Retry ${request.retryCount}/${request.maxRetries} for request: ${request.id}`);
        }

        // Check network again
        const currentNetworkState = await NetInfo.fetch();
        if (!currentNetworkState.isConnected) {
          console.log('⚠️ Network lost during processing, stopping');
          break;
        }
      }

      await this.saveQueue();
      this.notifyListeners();
    }

    this.isProcessing = false;

    console.log(`✅ Queue processing complete`, {
      processed,
      failed,
      remaining: this.queue.length
    });

    if (this.queue.length === 0) {
      console.log('🎉 All queued requests processed successfully!');
    }
  }

  private async executeRequest(request: QueuedRequest): Promise<any> {
    // Get the base API instance
    const api = (apiService as any).api;

    const config: any = {
      url: request.url,
      method: request.method.toLowerCase(),
      headers: request.headers || {},
    };

    if (request.data) {
      if (request.method === 'GET') {
        config.params = request.data;
      } else {
        config.data = request.data;
      }
    }

    const response = await api(config);
    return response.data;
  }

  async removeFromQueue(requestId: string): Promise<boolean> {
    const index = this.queue.findIndex(req => req.id === requestId);
    if (index === -1) {
      return false;
    }

    this.queue.splice(index, 1);
    await this.saveQueue();
    this.notifyListeners();

    console.log(`🗑️ Removed request from queue: ${requestId}`);
    return true;
  }

  async clearQueue(): Promise<void> {
    this.queue = [];
    await this.saveQueue();
    this.notifyListeners();
    console.log('🗑️ Queue cleared');
  }

  private async cleanupExpiredRequests(): Promise<void> {
    const expiryTime = Date.now() - (this.QUEUE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    const originalLength = this.queue.length;

    this.queue = this.queue.filter(req => req.timestamp > expiryTime);

    const removed = originalLength - this.queue.length;
    if (removed > 0) {
      await this.saveQueue();
      console.log(`🗑️ Removed ${removed} expired requests from queue`);
    }
  }

  getQueue(): QueuedRequest[] {
    return [...this.queue];
  }

  getQueueSize(): number {
    return this.queue.length;
  }

  async getStats(): Promise<QueueStats> {
    const byCategory: Record<string, number> = {};

    this.queue.forEach(req => {
      byCategory[req.category] = (byCategory[req.category] || 0) + 1;
    });

    const timestamps = this.queue.map(req => req.timestamp);
    const stats: QueueStats = {
      totalQueued: this.queue.length,
      byCategory,
      oldestRequest: timestamps.length > 0 ? new Date(Math.min(...timestamps)) : undefined,
      newestRequest: timestamps.length > 0 ? new Date(Math.max(...timestamps)) : undefined,
    };

    return stats;
  }

  private async updateStats(): Promise<void> {
    try {
      const stats = await this.getStats();
      await AsyncStorage.setItem(this.QUEUE_STATS_KEY, JSON.stringify(stats));
    } catch (error) {
      console.error('Error updating queue stats:', error);
    }
  }

  // Subscribe to queue changes
  subscribe(listener: (stats: QueueStats) => void): () => void {
    this.listeners.add(listener);
    // Immediately call with current stats
    this.getStats().then(stats => listener(stats));

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.getStats().then(stats => {
      this.listeners.forEach(listener => {
        try {
          listener(stats);
        } catch (error) {
          console.error('Error notifying queue listener:', error);
        }
      });
    });
  }

  // Helper methods for common operations
  async queueTaskCreation(taskData: any): Promise<string> {
    return this.addToQueue({
      url: '/api/v1/tasks',
      method: 'POST',
      data: taskData,
      priority: 'medium',
      category: 'task',
      maxRetries: 3,
    });
  }

  async queueTaskUpdate(taskId: string, updates: any): Promise<string> {
    return this.addToQueue({
      url: `/api/v1/tasks/${taskId}`,
      method: 'PUT',
      data: updates,
      priority: 'medium',
      category: 'task',
      maxRetries: 3,
    });
  }

  async queueEventCreation(eventData: any): Promise<string> {
    return this.addToQueue({
      url: '/api/v1/events',
      method: 'POST',
      data: eventData,
      priority: 'high',
      category: 'event',
      maxRetries: 5,
    });
  }

  async queueConversationMessage(message: string, conversationId?: string): Promise<string> {
    return this.addToQueue({
      url: '/api/v1/conversations/send-message',
      method: 'POST',
      data: { message, conversationId },
      priority: 'low',
      category: 'conversation',
      maxRetries: 2,
    });
  }
}

export default new OfflineQueueService();