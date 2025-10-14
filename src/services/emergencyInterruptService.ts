import * as Notifications from 'expo-notifications';
import { Audio } from 'expo-av';
import { Vibration, Platform, Linking } from 'react-native';
import * as Haptics from 'expo-haptics';

export enum InterruptLevel {
  LOW = 'low',           // Silent notification
  MEDIUM = 'medium',     // Notification with sound
  HIGH = 'high',         // Full screen notification + vibration
  CRITICAL = 'critical', // Ring phone + max volume + persistent
}

export enum InterruptReason {
  MEETING_SOON = 'meeting_soon',
  MEETING_NOW = 'meeting_now',
  MEETING_NO_RESPONSE = 'meeting_no_response',
  HIGH_PRIORITY_TASK = 'high_priority_task',
  URGENT_EMAIL = 'urgent_email',
  TRAFFIC_ALERT = 'traffic_alert',
  WEATHER_ALERT = 'weather_alert',
  EMERGENCY = 'emergency',
  SECURITY_BREACH = 'security_breach',
  SYSTEM_FAILURE = 'system_failure',
}

interface InterruptConfig {
  level: InterruptLevel;
  reason: InterruptReason;
  title: string;
  message: string;
  actionRequired?: boolean;
  persistUntilResponse?: boolean;
  escalationTimeMinutes?: number;
}

interface InterruptCallback {
  onInterruptTriggered: (config: InterruptConfig) => void;
  onUserResponded: (config: InterruptConfig) => void;
  onEscalated: (config: InterruptConfig) => void;
}

class EmergencyInterruptService {
  private callbacks: InterruptCallback[] = [];
  private sound: Audio.Sound | null = null;
  private activeInterrupts: Map<string, InterruptConfig> = new Map();
  private escalationTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.setupNotifications();
  }

  /**
   * Setup notification handlers
   */
  private async setupNotifications() {
    // Set notification handler
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    // Request permissions
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      console.warn('Notification permissions not granted');
    }

    // Setup notification response listener
    Notifications.addNotificationResponseReceivedListener(response => {
      const interruptId = response.notification.request.identifier;
      const config = this.activeInterrupts.get(interruptId);

      if (config) {
        this.handleUserResponse(interruptId, config);
      }
    });
  }

  /**
   * Trigger an interrupt based on configuration
   */
  async triggerInterrupt(config: InterruptConfig): Promise<string> {
    const interruptId = `interrupt_${Date.now()}`;

    // Store active interrupt
    this.activeInterrupts.set(interruptId, config);

    // Notify callbacks
    this.notifyInterruptTriggered(config);

    // Execute interrupt based on level
    switch (config.level) {
      case InterruptLevel.LOW:
        await this.showNotification(interruptId, config);
        break;

      case InterruptLevel.MEDIUM:
        await this.showNotification(interruptId, config);
        await this.playAlertSound('medium');
        await this.vibrate('medium');
        break;

      case InterruptLevel.HIGH:
        await this.showFullScreenNotification(interruptId, config);
        await this.playAlertSound('high');
        await this.vibrate('high');
        break;

      case InterruptLevel.CRITICAL:
        await this.ringPhone(interruptId, config);
        await this.showFullScreenNotification(interruptId, config);
        await this.vibrate('critical');
        break;
    }

    // Setup escalation if required
    if (config.persistUntilResponse && config.escalationTimeMinutes) {
      this.setupEscalation(interruptId, config);
    }

    return interruptId;
  }

  /**
   * Show standard notification
   */
  private async showNotification(interruptId: string, config: InterruptConfig) {
    await Notifications.scheduleNotificationAsync({
      identifier: interruptId,
      content: {
        title: config.title,
        body: config.message,
        sound: config.level === InterruptLevel.MEDIUM ? 'default' : undefined,
        priority: Notifications.AndroidNotificationPriority.MAX,
        categoryIdentifier: config.actionRequired ? 'action_required' : 'info',
        data: {
          interruptId,
          level: config.level,
          reason: config.reason,
        },
      },
      trigger: null, // Show immediately
    });
  }

  /**
   * Show full screen notification (for critical interrupts)
   */
  private async showFullScreenNotification(interruptId: string, config: InterruptConfig) {
    if (Platform.OS === 'android') {
      await Notifications.scheduleNotificationAsync({
        identifier: interruptId,
        content: {
          title: config.title,
          body: config.message,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.MAX,
          categoryIdentifier: 'urgent_action',
          data: {
            interruptId,
            level: config.level,
            reason: config.reason,
            fullScreen: true,
          },
        },
        trigger: null,
      });
    } else {
      // iOS doesn't support true full-screen, use critical alert
      await Notifications.scheduleNotificationAsync({
        identifier: interruptId,
        content: {
          title: config.title,
          body: config.message,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.MAX,
          categoryIdentifier: 'urgent_action',
          data: {
            interruptId,
            level: config.level,
            reason: config.reason,
          },
        },
        trigger: null,
      });
    }
  }

  /**
   * Ring the phone (critical interrupts only)
   */
  private async ringPhone(interruptId: string, config: InterruptConfig) {
    try {
      // Load and play ringtone at max volume
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/sounds/urgent-ringtone.mp3'), // You'll need to add this
        {
          shouldPlay: true,
          isLooping: true,
          volume: 1.0,
        }
      );

      this.sound = sound;

      // Stop after 30 seconds if no response
      setTimeout(() => {
        if (this.sound) {
          this.sound.stopAsync();
          this.sound.unloadAsync();
          this.sound = null;
        }
      }, 30000);

    } catch (error) {
      console.error('Failed to play ringtone:', error);
      // Fallback to system sound
      await this.playAlertSound('critical');
    }
  }

  /**
   * Play alert sound
   */
  private async playAlertSound(intensity: 'medium' | 'high' | 'critical') {
    try {
      const soundFile = intensity === 'critical'
        ? require('../../assets/sounds/critical-alert.mp3')
        : intensity === 'high'
        ? require('../../assets/sounds/high-alert.mp3')
        : require('../../assets/sounds/medium-alert.mp3');

      const { sound } = await Audio.Sound.createAsync(soundFile, {
        shouldPlay: true,
        volume: intensity === 'critical' ? 1.0 : 0.7,
      });

      await sound.playAsync();

      // Unload after playing
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (error) {
      console.error('Failed to play alert sound:', error);
    }
  }

  /**
   * Vibrate device
   */
  private async vibrate(intensity: 'medium' | 'high' | 'critical') {
    try {
      if (Platform.OS === 'ios') {
        // Use haptics for iOS
        if (intensity === 'critical') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setTimeout(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error), 500);
          setTimeout(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error), 1000);
        } else if (intensity === 'high') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          setTimeout(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning), 500);
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } else {
        // Use vibration for Android
        if (intensity === 'critical') {
          Vibration.vibrate([0, 500, 200, 500, 200, 500], true); // Continuous
          setTimeout(() => Vibration.cancel(), 10000); // Stop after 10s
        } else if (intensity === 'high') {
          Vibration.vibrate([0, 300, 200, 300]);
        } else {
          Vibration.vibrate(200);
        }
      }
    } catch (error) {
      console.error('Vibration failed:', error);
    }
  }

  /**
   * Setup escalation timer
   */
  private setupEscalation(interruptId: string, config: InterruptConfig) {
    const escalationTime = (config.escalationTimeMinutes || 5) * 60 * 1000;

    const timer = setTimeout(() => {
      // User hasn't responded - escalate
      const escalatedConfig: InterruptConfig = {
        ...config,
        level: this.getEscalatedLevel(config.level),
        title: `URGENT: ${config.title}`,
        message: `No response received. ${config.message}`,
      };

      this.notifyEscalated(config);
      this.triggerInterrupt(escalatedConfig);
    }, escalationTime);

    this.escalationTimers.set(interruptId, timer);
  }

  /**
   * Get escalated interrupt level
   */
  private getEscalatedLevel(currentLevel: InterruptLevel): InterruptLevel {
    switch (currentLevel) {
      case InterruptLevel.LOW:
        return InterruptLevel.MEDIUM;
      case InterruptLevel.MEDIUM:
        return InterruptLevel.HIGH;
      case InterruptLevel.HIGH:
      case InterruptLevel.CRITICAL:
        return InterruptLevel.CRITICAL;
    }
  }

  /**
   * Handle user response to interrupt
   */
  private handleUserResponse(interruptId: string, config: InterruptConfig) {
    // Clear escalation timer
    const timer = this.escalationTimers.get(interruptId);
    if (timer) {
      clearTimeout(timer);
      this.escalationTimers.delete(interruptId);
    }

    // Stop sounds
    if (this.sound) {
      this.sound.stopAsync();
      this.sound.unloadAsync();
      this.sound = null;
    }

    // Stop vibration
    Vibration.cancel();

    // Remove from active interrupts
    this.activeInterrupts.delete(interruptId);

    // Notify callbacks
    this.notifyUserResponded(config);
  }

  /**
   * Dismiss interrupt
   */
  async dismissInterrupt(interruptId: string) {
    const config = this.activeInterrupts.get(interruptId);
    if (config) {
      this.handleUserResponse(interruptId, config);
    }

    await Notifications.dismissNotificationAsync(interruptId);
  }

  /**
   * Dismiss all active interrupts
   */
  async dismissAll() {
    this.activeInterrupts.forEach((config, interruptId) => {
      this.handleUserResponse(interruptId, config);
    });

    await Notifications.dismissAllNotificationsAsync();
  }

  /**
   * Get active interrupts
   */
  getActiveInterrupts(): Map<string, InterruptConfig> {
    return this.activeInterrupts;
  }

  /**
   * Register callback
   */
  registerCallback(callback: InterruptCallback) {
    this.callbacks.push(callback);
  }

  /**
   * Unregister callback
   */
  unregisterCallback(callback: InterruptCallback) {
    this.callbacks = this.callbacks.filter(cb => cb !== callback);
  }

  /**
   * Notify callbacks
   */
  private notifyInterruptTriggered(config: InterruptConfig) {
    this.callbacks.forEach(callback => {
      callback.onInterruptTriggered(config);
    });
  }

  private notifyUserResponded(config: InterruptConfig) {
    this.callbacks.forEach(callback => {
      callback.onUserResponded(config);
    });
  }

  private notifyEscalated(config: InterruptConfig) {
    this.callbacks.forEach(callback => {
      callback.onEscalated(config);
    });
  }
}

// Singleton instance
export const emergencyInterruptService = new EmergencyInterruptService();
export default emergencyInterruptService;
