import * as Notifications from 'expo-notifications';
// import * as Device from 'expo-device'; // May require development build
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationData {
  title: string;
  body: string;
  data?: any;
  categoryId?: string;
  priority?: 'low' | 'normal' | 'high';
  sound?: string | boolean;
  badge?: number;
  scheduledTime?: Date;
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    time: Date;
  };
}

export interface ExecutiveNotificationTypes {
  meetingReminder: {
    meetingTitle: string;
    meetingTime: Date;
    attendees: string[];
    location?: string;
    prepScore?: number;
  };
  emailAlert: {
    from: string;
    subject: string;
    priority: 'high' | 'medium' | 'low';
    count?: number;
  };
  taskDeadline: {
    taskTitle: string;
    deadline: Date;
    priority: 'high' | 'medium' | 'low';
  };
  dailyBriefing: {
    briefingType: 'morning' | 'evening';
    keyMetrics: {
      emails: number;
      meetings: number;
      tasks: number;
    };
  };
  financialAlert: {
    alertType: 'market_change' | 'goal_achieved' | 'portfolio_update';
    value?: string;
    change?: string;
  };
  teamUpdate: {
    updateType: 'performance' | 'milestone' | 'issue';
    teamMember?: string;
    metric?: string;
  };
}

class NotificationService {
  private expoPushToken: string | null = null;
  private isInitialized = false;

  async initialize(): Promise<boolean> {
    try {
      // Check if running in Expo Go (push notifications not supported in SDK 53+)
      const isExpoGo = !__DEV__ || typeof (global as any).__expo !== 'undefined';

      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Notification permission not granted');
        return false;
      }

      // Get the token that uniquely identifies this device
      // Skip in Expo Go to avoid SDK 53+ warning
      if (!isExpoGo) {
        try {
          const token = await Notifications.getExpoPushTokenAsync();
          this.expoPushToken = token.data;
          await AsyncStorage.setItem('expo_push_token', token.data);
        } catch (error) {
          console.warn('Failed to get push token:', error);
        }
      } else {
        console.log('ℹ️ Running in Expo Go - push notifications require a development/production build');
      }

      // Configure notification categories for interactive notifications
      await this.setupNotificationCategories();

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Error initializing notifications:', error);
      return false;
    }
  }

  private async setupNotificationCategories() {
    await Notifications.setNotificationCategoryAsync('meeting_reminder', [
      {
        identifier: 'join_meeting',
        buttonTitle: 'Join Now',
        options: { foreground: true },
      },
      {
        identifier: 'snooze_5min',
        buttonTitle: 'Snooze 5min',
        options: { foreground: false },
      },
    ]);

    await Notifications.setNotificationCategoryAsync('email_alert', [
      {
        identifier: 'open_email',
        buttonTitle: 'Open Email',
        options: { foreground: true },
      },
      {
        identifier: 'mark_read',
        buttonTitle: 'Mark Read',
        options: { foreground: false },
      },
    ]);

    await Notifications.setNotificationCategoryAsync('task_deadline', [
      {
        identifier: 'complete_task',
        buttonTitle: 'Complete',
        options: { foreground: true },
      },
      {
        identifier: 'extend_deadline',
        buttonTitle: 'Extend',
        options: { foreground: false },
      },
    ]);
  }

  async scheduleLocalNotification(notification: NotificationData): Promise<string | null> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          categoryIdentifier: notification.categoryId,
          sound: notification.sound !== false,
          badge: notification.badge,
          priority: this.getPriorityLevel(notification.priority),
        },
        trigger: notification.scheduledTime
          ? { date: notification.scheduledTime }
          : null, // null means immediate
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  }

  private getPriorityLevel(priority?: 'low' | 'normal' | 'high'): Notifications.AndroidNotificationPriority {
    switch (priority) {
      case 'high':
        return Notifications.AndroidNotificationPriority.HIGH;
      case 'low':
        return Notifications.AndroidNotificationPriority.LOW;
      default:
        return Notifications.AndroidNotificationPriority.NORMAL;
    }
  }

  // Executive-specific notification methods
  async scheduleMeetingReminder(
    meetingData: ExecutiveNotificationTypes['meetingReminder'],
    reminderMinutes: number = 10
  ): Promise<string | null> {
    const reminderTime = new Date(meetingData.meetingTime.getTime() - reminderMinutes * 60 * 1000);

    const prepScoreText = meetingData.prepScore
      ? ` (Prep Score: ${meetingData.prepScore}%)`
      : '';

    return this.scheduleLocalNotification({
      title: `Meeting in ${reminderMinutes} minutes`,
      body: `${meetingData.meetingTitle}${prepScoreText}`,
      data: { type: 'meeting_reminder', ...meetingData },
      categoryId: 'meeting_reminder',
      priority: 'high',
      scheduledTime: reminderTime,
    });
  }

  async sendEmailAlert(emailData: ExecutiveNotificationTypes['emailAlert']): Promise<string | null> {
    const countText = emailData.count && emailData.count > 1 ? ` (+${emailData.count - 1} more)` : '';

    return this.scheduleLocalNotification({
      title: `${emailData.priority.toUpperCase()} Priority Email`,
      body: `From: ${emailData.from}\n${emailData.subject}${countText}`,
      data: { type: 'email_alert', ...emailData },
      categoryId: 'email_alert',
      priority: emailData.priority === 'high' ? 'high' : 'normal',
    });
  }

  async scheduleTaskDeadlineReminder(
    taskData: ExecutiveNotificationTypes['taskDeadline']
  ): Promise<string | null> {
    const timeUntilDeadline = taskData.deadline.getTime() - Date.now();
    const hoursUntil = Math.floor(timeUntilDeadline / (1000 * 60 * 60));

    let bodyText = '';
    if (hoursUntil <= 1) {
      bodyText = 'Due in less than 1 hour!';
    } else if (hoursUntil <= 24) {
      bodyText = `Due in ${hoursUntil} hours`;
    } else {
      const daysUntil = Math.floor(hoursUntil / 24);
      bodyText = `Due in ${daysUntil} day${daysUntil > 1 ? 's' : ''}`;
    }

    return this.scheduleLocalNotification({
      title: `Task Deadline: ${taskData.taskTitle}`,
      body: bodyText,
      data: { type: 'task_deadline', ...taskData },
      categoryId: 'task_deadline',
      priority: taskData.priority === 'high' ? 'high' : 'normal',
    });
  }

  async scheduleDailyBriefing(
    briefingData: ExecutiveNotificationTypes['dailyBriefing'],
    scheduledTime: Date
  ): Promise<string | null> {
    const timeLabel = briefingData.briefingType === 'morning' ? 'Morning' : 'Evening';
    const metrics = briefingData.keyMetrics;

    return this.scheduleLocalNotification({
      title: `${timeLabel} Executive Briefing`,
      body: `${metrics.emails} emails, ${metrics.meetings} meetings, ${metrics.tasks} tasks pending`,
      data: { type: 'daily_briefing', ...briefingData },
      priority: 'normal',
      scheduledTime,
      recurring: {
        frequency: 'daily',
        time: scheduledTime,
      },
    });
  }

  async sendFinancialAlert(
    financialData: ExecutiveNotificationTypes['financialAlert']
  ): Promise<string | null> {
    let title = '';
    let body = '';

    switch (financialData.alertType) {
      case 'market_change':
        title = 'Market Alert';
        body = `Significant change detected: ${financialData.change}`;
        break;
      case 'goal_achieved':
        title = 'Goal Achieved! 🎉';
        body = `Financial target reached: ${financialData.value}`;
        break;
      case 'portfolio_update':
        title = 'Portfolio Update';
        body = `Current value: ${financialData.value} (${financialData.change})`;
        break;
    }

    return this.scheduleLocalNotification({
      title,
      body,
      data: { type: 'financial_alert', ...financialData },
      priority: 'normal',
    });
  }

  async sendTeamUpdate(teamData: ExecutiveNotificationTypes['teamUpdate']): Promise<string | null> {
    let title = '';
    let body = '';

    switch (teamData.updateType) {
      case 'performance':
        title = 'Team Performance Update';
        body = teamData.teamMember
          ? `${teamData.teamMember}: ${teamData.metric}`
          : `Team metric update: ${teamData.metric}`;
        break;
      case 'milestone':
        title = 'Milestone Achieved!';
        body = teamData.teamMember
          ? `${teamData.teamMember} completed: ${teamData.metric}`
          : `Team milestone: ${teamData.metric}`;
        break;
      case 'issue':
        title = 'Team Issue Alert';
        body = teamData.teamMember
          ? `Issue with ${teamData.teamMember}: ${teamData.metric}`
          : `Team issue: ${teamData.metric}`;
        break;
    }

    return this.scheduleLocalNotification({
      title,
      body,
      data: { type: 'team_update', ...teamData },
      priority: teamData.updateType === 'issue' ? 'high' : 'normal',
    });
  }

  // Smart notification scheduling based on executive patterns
  async scheduleSmartNotifications() {
    // Morning briefing (8:00 AM)
    const morningTime = new Date();
    morningTime.setHours(8, 0, 0, 0);
    if (morningTime <= new Date()) {
      morningTime.setDate(morningTime.getDate() + 1);
    }

    await this.scheduleDailyBriefing(
      {
        briefingType: 'morning',
        keyMetrics: { emails: 12, meetings: 4, tasks: 8 },
      },
      morningTime
    );

    // Evening briefing (6:00 PM)
    const eveningTime = new Date();
    eveningTime.setHours(18, 0, 0, 0);
    if (eveningTime <= new Date()) {
      eveningTime.setDate(eveningTime.getDate() + 1);
    }

    await this.scheduleDailyBriefing(
      {
        briefingType: 'evening',
        keyMetrics: { emails: 5, meetings: 2, tasks: 3 },
      },
      eveningTime
    );
  }

  // Notification management
  async cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    return await Notifications.getAllScheduledNotificationsAsync();
  }

  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }

  async clearBadge(): Promise<void> {
    await Notifications.setBadgeCountAsync(0);
  }

  // Push token management for server integration
  getExpoPushToken(): string | null {
    return this.expoPushToken;
  }

  async refreshPushToken(): Promise<string | null> {
    try {
      const token = await Notifications.getExpoPushTokenAsync();
      this.expoPushToken = token.data;
      await AsyncStorage.setItem('expo_push_token', token.data);
      return token.data;
    } catch (error) {
      console.warn('Could not refresh push token in Expo Go:', error);
      return null;
    }
  }

  // Notification response handling
  addNotificationResponseListener(
    listener: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(listener);
  }

  addNotificationReceivedListener(
    listener: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(listener);
  }

  // Executive-specific convenience methods
  async enableQuietHours(startHour: number = 22, endHour: number = 7): Promise<void> {
    // This would integrate with device Do Not Disturb settings
    // For now, we'll store the preference
    await AsyncStorage.setItem('quiet_hours', JSON.stringify({ startHour, endHour }));
  }

  async isQuietHours(): Promise<boolean> {
    try {
      const quietHours = await AsyncStorage.getItem('quiet_hours');
      if (!quietHours) return false;

      const { startHour, endHour } = JSON.parse(quietHours);
      const currentHour = new Date().getHours();

      if (startHour > endHour) {
        // Quiet hours span midnight (e.g., 22:00 - 07:00)
        return currentHour >= startHour || currentHour < endHour;
      } else {
        // Quiet hours within same day
        return currentHour >= startHour && currentHour < endHour;
      }
    } catch (error) {
      console.error('Error checking quiet hours:', error);
      return false;
    }
  }
}

export const notificationService = new NotificationService();