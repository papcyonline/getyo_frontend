import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

class WakeWordNotificationService {
  private notificationId: string | null = null;

  /**
   * Configure notification handler
   */
  constructor() {
    // Configure how notifications should be handled
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
  }

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('⚠️ Notification permission not granted');
        return false;
      }

      console.log('✅ Notification permissions granted');
      return true;
    } catch (error) {
      console.error('❌ Failed to request notification permissions:', error);
      return false;
    }
  }

  /**
   * Show persistent notification that wake word detection is active
   */
  async showListeningNotification(assistantName: string): Promise<void> {
    try {
      // Request permissions first
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.warn('⚠️ Cannot show notification - permission denied');
        return;
      }

      // Cancel any existing notification
      if (this.notificationId) {
        await this.hideNotification();
      }

      // Show persistent notification
      this.notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `👂 Listening for "Yo ${assistantName}"`,
          body: 'Say your wake word to activate your assistant',
          data: { type: 'wake_word_listening' },
          sticky: true, // Make it persistent on Android
          priority: Notifications.AndroidNotificationPriority.HIGH,
          categoryIdentifier: 'wake_word',
        },
        trigger: null, // Show immediately
      });

      console.log(`✅ Wake word notification shown: ${this.notificationId}`);
    } catch (error) {
      console.error('❌ Failed to show wake word notification:', error);
    }
  }

  /**
   * Update notification to show "Activated" state
   */
  async showActivatedNotification(assistantName: string): Promise<void> {
    try {
      if (this.notificationId) {
        await Notifications.dismissNotificationAsync(this.notificationId);
      }

      this.notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `🎤 ${assistantName} Activated`,
          body: 'I'm listening... What can I do for you?',
          data: { type: 'wake_word_activated' },
          sticky: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          categoryIdentifier: 'wake_word',
        },
        trigger: null,
      });

      console.log('✅ Activated notification shown');
    } catch (error) {
      console.error('❌ Failed to show activated notification:', error);
    }
  }

  /**
   * Hide/dismiss the notification
   */
  async hideNotification(): Promise<void> {
    try {
      if (this.notificationId) {
        await Notifications.dismissNotificationAsync(this.notificationId);
        this.notificationId = null;
        console.log('✅ Wake word notification hidden');
      }
    } catch (error) {
      console.error('❌ Failed to hide notification:', error);
    }
  }

  /**
   * Check if notification is currently shown
   */
  isNotificationActive(): boolean {
    return this.notificationId !== null;
  }
}

// Export singleton instance
export const wakeWordNotificationService = new WakeWordNotificationService();
export default wakeWordNotificationService;
