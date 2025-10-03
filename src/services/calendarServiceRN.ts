import RNCalendarEvents, {
  Calendar,
  CalendarEventWritable,
  CalendarEvent,
} from 'react-native-calendar-events';
import { PermissionsAndroid, Platform } from 'react-native';

/**
 * Pure React Native Calendar Service
 * Replaces expo-calendar with react-native-calendar-events
 */

export interface CalendarPermissionResponse {
  granted: boolean;
  canAskAgain?: boolean;
  status: 'granted' | 'denied' | 'undetermined';
}

class CalendarServiceRN {
  /**
   * Request calendar permissions
   */
  async requestPermissions(): Promise<CalendarPermissionResponse> {
    try {
      const status = await RNCalendarEvents.requestPermissions();

      return {
        granted: status === 'authorized',
        status: status === 'authorized' ? 'granted' : status === 'denied' ? 'denied' : 'undetermined',
      };
    } catch (error) {
      console.error('❌ Failed to request calendar permissions:', error);
      return {
        granted: false,
        status: 'denied',
      };
    }
  }

  /**
   * Check calendar permissions
   */
  async getPermissions(): Promise<CalendarPermissionResponse> {
    try {
      const status = await RNCalendarEvents.checkPermissions();

      return {
        granted: status === 'authorized',
        status: status === 'authorized' ? 'granted' : status === 'denied' ? 'denied' : 'undetermined',
      };
    } catch (error) {
      console.error('❌ Failed to check calendar permissions:', error);
      return {
        granted: false,
        status: 'denied',
      };
    }
  }

  /**
   * Get all calendars
   */
  async getCalendarsAsync(): Promise<Calendar[]> {
    try {
      const permissions = await this.getPermissions();
      if (!permissions.granted) {
        const requested = await this.requestPermissions();
        if (!requested.granted) {
          console.warn('⚠️ Calendar permissions not granted');
          return [];
        }
      }

      const calendars = await RNCalendarEvents.findCalendars();
      return calendars;
    } catch (error) {
      console.error('❌ Failed to get calendars:', error);
      return [];
    }
  }

  /**
   * Get default calendar
   */
  async getDefaultCalendar(): Promise<Calendar | null> {
    try {
      const calendars = await this.getCalendarsAsync();

      // Find the primary calendar
      const primaryCalendar = calendars.find(
        cal => cal.isPrimary || cal.allowsModifications
      );

      return primaryCalendar || calendars[0] || null;
    } catch (error) {
      console.error('❌ Failed to get default calendar:', error);
      return null;
    }
  }

  /**
   * Create calendar event
   */
  async createEventAsync(
    calendarId: string,
    eventDetails: {
      title: string;
      startDate: Date | string;
      endDate: Date | string;
      location?: string;
      notes?: string;
      alarms?: Array<{ date: Date | string | number }>;
      recurrence?: string;
      url?: string;
    }
  ): Promise<string | null> {
    try {
      const permissions = await this.getPermissions();
      if (!permissions.granted) {
        await this.requestPermissions();
      }

      const event: CalendarEventWritable = {
        title: eventDetails.title,
        startDate: typeof eventDetails.startDate === 'string'
          ? eventDetails.startDate
          : eventDetails.startDate.toISOString(),
        endDate: typeof eventDetails.endDate === 'string'
          ? eventDetails.endDate
          : eventDetails.endDate.toISOString(),
        location: eventDetails.location,
        notes: eventDetails.notes,
        alarms: eventDetails.alarms?.map(alarm => ({
          date: typeof alarm.date === 'number'
            ? alarm.date
            : typeof alarm.date === 'string'
            ? new Date(alarm.date).getTime()
            : alarm.date.getTime(),
        })),
        url: eventDetails.url,
      };

      const eventId = await RNCalendarEvents.saveEvent(event.title, {
        ...event,
        calendarId,
      });

      console.log('✅ Event created:', eventId);
      return eventId;
    } catch (error) {
      console.error('❌ Failed to create event:', error);
      return null;
    }
  }

  /**
   * Get event by ID
   */
  async getEventAsync(eventId: string): Promise<CalendarEvent | null> {
    try {
      const event = await RNCalendarEvents.findEventById(eventId);
      return event;
    } catch (error) {
      console.error('❌ Failed to get event:', error);
      return null;
    }
  }

  /**
   * Get events in date range
   */
  async getEventsAsync(
    startDate: Date,
    endDate: Date,
    calendarIds?: string[]
  ): Promise<CalendarEvent[]> {
    try {
      const permissions = await this.getPermissions();
      if (!permissions.granted) {
        await this.requestPermissions();
      }

      const events = await RNCalendarEvents.fetchAllEvents(
        startDate.toISOString(),
        endDate.toISOString(),
        calendarIds
      );

      return events;
    } catch (error) {
      console.error('❌ Failed to get events:', error);
      return [];
    }
  }

  /**
   * Update event
   */
  async updateEventAsync(
    eventId: string,
    eventDetails: {
      title?: string;
      startDate?: Date | string;
      endDate?: Date | string;
      location?: string;
      notes?: string;
      alarms?: Array<{ date: Date | string | number }>;
    }
  ): Promise<boolean> {
    try {
      const event = await this.getEventAsync(eventId);
      if (!event) {
        console.error('❌ Event not found');
        return false;
      }

      const updates: any = {};

      if (eventDetails.title) updates.title = eventDetails.title;
      if (eventDetails.startDate) {
        updates.startDate = typeof eventDetails.startDate === 'string'
          ? eventDetails.startDate
          : eventDetails.startDate.toISOString();
      }
      if (eventDetails.endDate) {
        updates.endDate = typeof eventDetails.endDate === 'string'
          ? eventDetails.endDate
          : eventDetails.endDate.toISOString();
      }
      if (eventDetails.location) updates.location = eventDetails.location;
      if (eventDetails.notes) updates.notes = eventDetails.notes;
      if (eventDetails.alarms) {
        updates.alarms = eventDetails.alarms.map(alarm => ({
          date: typeof alarm.date === 'number'
            ? alarm.date
            : typeof alarm.date === 'string'
            ? new Date(alarm.date).getTime()
            : alarm.date.getTime(),
        }));
      }

      await RNCalendarEvents.saveEvent(event.title, {
        id: eventId,
        ...updates,
      });

      console.log('✅ Event updated:', eventId);
      return true;
    } catch (error) {
      console.error('❌ Failed to update event:', error);
      return false;
    }
  }

  /**
   * Delete event
   */
  async deleteEventAsync(eventId: string): Promise<boolean> {
    try {
      await RNCalendarEvents.removeEvent(eventId);
      console.log('✅ Event deleted:', eventId);
      return true;
    } catch (error) {
      console.error('❌ Failed to delete event:', error);
      return false;
    }
  }

  /**
   * Create calendar
   */
  async createCalendarAsync(details: {
    title: string;
    color?: string;
    entityType?: string;
    sourceId?: string;
    source?: { name: string; type: string };
    name?: string;
    accessLevel?: string;
    ownerAccount?: string;
  }): Promise<string | null> {
    try {
      // Note: react-native-calendar-events doesn't support creating calendars
      // This is a platform limitation
      console.warn('⚠️ Creating calendars is not supported on this platform');
      return null;
    } catch (error) {
      console.error('❌ Failed to create calendar:', error);
      return null;
    }
  }

  /**
   * Get calendar sources (iOS only)
   */
  async getCalendarSources(): Promise<any[]> {
    try {
      if (Platform.OS !== 'ios') {
        return [];
      }

      const calendars = await this.getCalendarsAsync();
      const sources = calendars
        .map(cal => cal.source)
        .filter((source, index, self) =>
          source && self.findIndex(s => s.id === source.id) === index
        );

      return sources;
    } catch (error) {
      console.error('❌ Failed to get calendar sources:', error);
      return [];
    }
  }
}

export const calendarServiceRN = new CalendarServiceRN();
export default calendarServiceRN;
