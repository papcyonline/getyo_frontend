import notifee, { AuthorizationStatus, EventType } from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Pure React Native Notification Service
 * Replaces expo-notifications with @notifee/react-native and @react-native-firebase/messaging
 */

class NotificationServiceRN {
  private expoPushToken: string | null = null;
  private fcmToken: string | null = null;
  private initialized: boolean = false;

  /**
   * Initialize notification service
   * Request permissions and set up handlers
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('🔔 Initializing React Native notification service...');

      // Request notification permissions
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        console.log('❌ Notification permissions not granted');
        return false;
      }

      // Get FCM token
      this.fcmToken = await messaging().getToken();
      console.log('📱 FCM Token:', this.fcmToken);

      // Store token
      await AsyncStorage.setItem('fcmPushToken', this.fcmToken);

      // Set up foreground notification handler
      notifee.onForegroundEvent(({ type, detail }) => {
        switch (type) {
          case EventType.DISMISSED:
            console.log('User dismissed notification', detail.notification);
            break;
          case EventType.PRESS:
            console.log('User pressed notification', detail.notification);
            this.handleNotificationPress(detail.notification);
            break;
        }
      });

      // Set up background notification handler
      notifee.onBackgroundEvent(async ({ type, detail }) => {
        if (type === EventType.PRESS) {
          console.log('User pressed notification in background', detail.notification);
        }
      });

      // FCM message handlers
      messaging().onMessage(async remoteMessage => {
        console.log('📨 Foreground message received:', remoteMessage);
        await this.displayNotification(remoteMessage);
      });

      messaging().setBackgroundMessageHandler(async remoteMessage => {
        console.log('📨 Background message received:', remoteMessage);
      });

      this.initialized = true;
      console.log('✅ Notification service initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize notifications:', error);
      return false;
    }
  }

  /**
   * Display a local notification
   */
  async displayNotification(message: any): Promise<void> {
    try {
      const channelId = await notifee.createChannel({
        id: 'default',
        name: 'Default Channel',
        importance: 4, // High importance
      });

      await notifee.displayNotification({
        title: message.notification?.title || 'Yo! Assistant',
        body: message.notification?.body || '',
        data: message.data,
        android: {
          channelId,
          smallIcon: 'ic_notification',
          pressAction: {
            id: 'default',
          },
        },
        ios: {
          sound: 'default',
        },
      });
    } catch (error) {
      console.error('❌ Failed to display notification:', error);
    }
  }

  /**
   * Schedule a local notification
   */
  async scheduleNotification(
    title: string,
    body: string,
    trigger: Date,
    data?: any
  ): Promise<string | null> {
    try {
      const channelId = await notifee.createChannel({
        id: 'reminders',
        name: 'Reminders',
        importance: 4,
      });

      const notificationId = await notifee.createTriggerNotification(
        {
          title,
          body,
          data,
          android: {
            channelId,
            smallIcon: 'ic_notification',
            pressAction: {
              id: 'default',
            },
          },
          ios: {
            sound: 'default',
          },
        },
        {
          type: 0, // TimestampTrigger
          timestamp: trigger.getTime(),
        }
      );

      return notificationId;
    } catch (error) {
      console.error('❌ Failed to schedule notification:', error);
      return null;
    }
  }

  /**
   * Cancel a scheduled notification
   */
  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await notifee.cancelNotification(notificationId);
    } catch (error) {
      console.error('❌ Failed to cancel notification:', error);
    }
  }

  /**
   * Cancel all notifications
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await notifee.cancelAllNotifications();
    } catch (error) {
      console.error('❌ Failed to cancel all notifications:', error);
    }
  }

  /**
   * Get FCM/Expo push token
   */
  getExpoPushToken(): string | null {
    return this.fcmToken;
  }

  getFCMToken(): string | null {
    return this.fcmToken;
  }

  /**
   * Handle notification press
   */
  private handleNotificationPress(notification: any): void {
    // Navigate to appropriate screen based on notification data
    console.log('Handling notification press:', notification);
  }

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const authStatus = await messaging().requestPermission();
      return (
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL
      );
    } catch (error) {
      console.error('❌ Failed to request permissions:', error);
      return false;
    }
  }

  /**
   * Get notification settings/permissions
   */
  async getPermissions(): Promise<any> {
    try {
      const settings = await notifee.getNotificationSettings();
      return {
        status: settings.authorizationStatus,
        ios: settings.ios,
        android: settings.android,
      };
    } catch (error) {
      console.error('❌ Failed to get permissions:', error);
      return null;
    }
  }
}

export const notificationServiceRN = new NotificationServiceRN();
export default notificationServiceRN;
