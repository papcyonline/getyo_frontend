import * as Calendar from 'expo-calendar';
import * as Location from 'expo-location';
import { AppState, AppStateStatus } from 'react-native';
import ApiService from './api';

interface Meeting {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  attendees?: string[];
  isVirtual: boolean;
  meetingLink?: string;
}

interface MeetingCallback {
  onMeetingStarted: (meeting: Meeting) => void;
  onMeetingEnded: (meeting: Meeting) => void;
  onMeetingSoon: (meeting: Meeting, minutesUntil: number) => void;
  onError?: (error: string) => void;
}

class MeetingDetectionService {
  private callbacks: MeetingCallback[] = [];
  private checkInterval: NodeJS.Timeout | null = null;
  private currentMeeting: Meeting | null = null;
  private isMonitoring: boolean = false;
  private appState: AppStateStatus = 'active';

  constructor() {
    this.setupAppStateListener();
  }

  /**
   * Setup app state listener to detect when app goes to background
   */
  private setupAppStateListener() {
    AppState.addEventListener('change', (nextAppState) => {
      this.appState = nextAppState;

      if (nextAppState === 'active') {
        // App came to foreground - check for meetings
        this.checkForMeetings();
      }
    });
  }

  /**
   * Request necessary permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      // Request calendar permission
      const { status: calendarStatus } = await Calendar.requestCalendarPermissionsAsync();

      if (calendarStatus !== 'granted') {
        this.notifyError('Calendar permission required');
        return false;
      }

      // Request location permission (for detecting when user arrives at meeting location)
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();

      if (locationStatus !== 'granted') {
        console.warn('Location permission not granted - location-based detection disabled');
      }

      return true;
    } catch (error) {
      console.error('Permission request failed:', error);
      this.notifyError('Failed to get permissions');
      return false;
    }
  }

  /**
   * Start monitoring for meetings
   */
  async startMonitoring() {
    if (this.isMonitoring) return;

    const hasPermissions = await this.requestPermissions();
    if (!hasPermissions) return;

    this.isMonitoring = true;

    // Check immediately
    await this.checkForMeetings();

    // Then check every minute
    this.checkInterval = setInterval(() => {
      this.checkForMeetings();
    }, 60000); // Check every 60 seconds

    console.log('✅ Meeting detection started');
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    this.isMonitoring = false;
    this.currentMeeting = null;

    console.log('❌ Meeting detection stopped');
  }

  /**
   * Check for meetings and detect if one is starting/ongoing
   */
  private async checkForMeetings() {
    try {
      const now = new Date();

      // Get events from backend
      const events = await ApiService.getEvents();

      // Get calendar events from device
      const calendars = await Calendar.getCalendarsAsync();
      const deviceEvents: any[] = [];

      for (const calendar of calendars) {
        const calendarEvents = await Calendar.getEventsAsync(
          [calendar.id],
          new Date(now.getTime() - 30 * 60000), // 30 min ago
          new Date(now.getTime() + 60 * 60000)  // 1 hour ahead
        );
        deviceEvents.push(...calendarEvents);
      }

      // Combine and deduplicate events
      const allEvents = [...events, ...this.convertDeviceEvents(deviceEvents)];

      // Check for meetings starting soon (5-15 min warning)
      const upcomingMeetings = allEvents.filter(event => {
        const startTime = new Date(event.startTime);
        const minutesUntil = Math.floor((startTime.getTime() - now.getTime()) / 60000);
        return minutesUntil > 0 && minutesUntil <= 15;
      });

      // Check for meetings starting NOW (within 2 minutes)
      const startingMeetings = allEvents.filter(event => {
        const startTime = new Date(event.startTime);
        const minutesUntil = Math.floor((startTime.getTime() - now.getTime()) / 60000);
        return minutesUntil >= -2 && minutesUntil <= 2;
      });

      // Check for ongoing meetings
      const ongoingMeetings = allEvents.filter(event => {
        const startTime = new Date(event.startTime);
        const endTime = new Date(event.endTime);
        return now >= startTime && now <= endTime;
      });

      // Notify about upcoming meetings
      upcomingMeetings.forEach(meeting => {
        const startTime = new Date(meeting.startTime);
        const minutesUntil = Math.floor((startTime.getTime() - now.getTime()) / 60000);

        // Only notify for 5, 10, 15 minute marks
        if ([5, 10, 15].includes(minutesUntil)) {
          this.notifyMeetingSoon(this.convertToMeeting(meeting), minutesUntil);
        }
      });

      // Detect meeting start
      if (startingMeetings.length > 0 && !this.currentMeeting) {
        const meeting = this.convertToMeeting(startingMeetings[0]);
        this.currentMeeting = meeting;
        this.notifyMeetingStarted(meeting);
      }

      // Detect meeting end
      if (this.currentMeeting && ongoingMeetings.length === 0) {
        this.notifyMeetingEnded(this.currentMeeting);
        this.currentMeeting = null;
      }

      // Update current meeting if still ongoing
      if (ongoingMeetings.length > 0) {
        this.currentMeeting = this.convertToMeeting(ongoingMeetings[0]);
      }

    } catch (error) {
      console.error('Meeting check error:', error);
      this.notifyError('Failed to check for meetings');
    }
  }

  /**
   * Convert device calendar events to our format
   */
  private convertDeviceEvents(deviceEvents: any[]): any[] {
    return deviceEvents.map(event => ({
      id: event.id,
      title: event.title,
      startTime: event.startDate,
      endTime: event.endDate,
      location: event.location,
      attendees: [],
      source: 'device_calendar',
    }));
  }

  /**
   * Convert event to Meeting object
   */
  private convertToMeeting(event: any): Meeting {
    const isVirtual = this.detectVirtualMeeting(event);
    const meetingLink = this.extractMeetingLink(event);

    return {
      id: event.id,
      title: event.title,
      startTime: new Date(event.startTime),
      endTime: new Date(event.endTime),
      location: event.location,
      attendees: event.attendees || [],
      isVirtual,
      meetingLink,
    };
  }

  /**
   * Detect if meeting is virtual (Zoom, Teams, Meet, etc.)
   */
  private detectVirtualMeeting(event: any): boolean {
    const text = `${event.title} ${event.description || ''} ${event.location || ''}`.toLowerCase();

    const virtualKeywords = [
      'zoom', 'meet', 'teams', 'webex', 'skype',
      'google meet', 'microsoft teams', 'zoom.us',
      'virtual', 'online', 'video call', 'video conference',
    ];

    return virtualKeywords.some(keyword => text.includes(keyword));
  }

  /**
   * Extract meeting link from event description
   */
  private extractMeetingLink(event: any): string | undefined {
    const text = event.description || '';

    // Look for common meeting link patterns
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = text.match(urlRegex);

    if (urls && urls.length > 0) {
      // Return first URL that looks like a meeting link
      const meetingLink = urls.find((url: string) =>
        url.includes('zoom') ||
        url.includes('meet') ||
        url.includes('teams') ||
        url.includes('webex')
      );

      return meetingLink;
    }

    return undefined;
  }

  /**
   * Get current meeting status
   */
  getCurrentMeeting(): Meeting | null {
    return this.currentMeeting;
  }

  /**
   * Manually trigger meeting start (for testing)
   */
  async triggerMeetingStart(meetingId: string) {
    try {
      const events = await ApiService.getEvents();
      const event = events.find((e: any) => e.id === meetingId);

      if (event) {
        const meeting = this.convertToMeeting(event);
        this.currentMeeting = meeting;
        this.notifyMeetingStarted(meeting);
      }
    } catch (error) {
      console.error('Failed to trigger meeting start:', error);
    }
  }

  /**
   * Register callback
   */
  registerCallback(callback: MeetingCallback) {
    this.callbacks.push(callback);
  }

  /**
   * Unregister callback
   */
  unregisterCallback(callback: MeetingCallback) {
    this.callbacks = this.callbacks.filter(cb => cb !== callback);
  }

  /**
   * Notify callbacks of meeting start
   */
  private notifyMeetingStarted(meeting: Meeting) {
    console.log('🎯 Meeting started:', meeting.title);
    this.callbacks.forEach(callback => {
      callback.onMeetingStarted(meeting);
    });
  }

  /**
   * Notify callbacks of meeting end
   */
  private notifyMeetingEnded(meeting: Meeting) {
    console.log('✅ Meeting ended:', meeting.title);
    this.callbacks.forEach(callback => {
      callback.onMeetingEnded(meeting);
    });
  }

  /**
   * Notify callbacks of upcoming meeting
   */
  private notifyMeetingSoon(meeting: Meeting, minutesUntil: number) {
    console.log(`⏰ Meeting in ${minutesUntil} minutes:`, meeting.title);
    this.callbacks.forEach(callback => {
      callback.onMeetingSoon(meeting, minutesUntil);
    });
  }

  /**
   * Notify error
   */
  private notifyError(error: string) {
    console.error('Meeting detection error:', error);
    this.callbacks.forEach(callback => {
      if (callback.onError) {
        callback.onError(error);
      }
    });
  }

  /**
   * Get monitoring status
   */
  getStatus() {
    return {
      isMonitoring: this.isMonitoring,
      currentMeeting: this.currentMeeting,
    };
  }
}

// Singleton instance
export const meetingDetectionService = new MeetingDetectionService();
export default meetingDetectionService;
