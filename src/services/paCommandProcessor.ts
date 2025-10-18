import emailService from './emailService';
import calendarService from './calendarService';
import meetingService from './meetingService';
import paVoiceService, { VoiceCommand } from './paVoiceService';

export interface CommandResult {
  success: boolean;
  response: string;
  data?: any;
  action?: string;
}

export interface EmailCheckResult {
  count: number;
  emails: Array<{
    from: string;
    subject: string;
    isUrgent: boolean;
  }>;
}

class PACommandProcessor {
  /**
   * Process a voice command and execute appropriate action
   */
  async processCommand(command: VoiceCommand): Promise<CommandResult> {
    try {
      const text = command.text.toLowerCase().trim();
      console.log('🤖 Processing command:', text);

      // Email commands
      if (this.isEmailCommand(text)) {
        return await this.handleEmailCommand(text);
      }

      // Calendar commands
      if (this.isCalendarCommand(text)) {
        return await this.handleCalendarCommand(text);
      }

      // Meeting commands
      if (this.isMeetingCommand(text)) {
        return await this.handleMeetingCommand(text);
      }

      // Task commands
      if (this.isTaskCommand(text)) {
        return await this.handleTaskCommand(text);
      }

      // Reminder commands
      if (this.isReminderCommand(text)) {
        return await this.handleReminderCommand(text);
      }

      // General queries
      if (this.isGeneralQuery(text)) {
        return await this.handleGeneralQuery(text);
      }

      // Unknown command
      return {
        success: false,
        response: "Sorry boss, I didn't understand that command. Can you rephrase?",
      };
    } catch (error: any) {
      console.error('Command processing error:', error);
      return {
        success: false,
        response: 'Sorry boss, something went wrong processing that command.',
      };
    }
  }

  // ============================================================================
  // EMAIL COMMANDS
  // ============================================================================

  private isEmailCommand(text: string): boolean {
    const emailKeywords = [
      'email', 'emails', 'mail', 'inbox', 'message', 'messages',
      'check my email', 'new emails', 'unread', 'who sent',
    ];
    return emailKeywords.some(keyword => text.includes(keyword));
  }

  private async handleEmailCommand(text: string): Promise<CommandResult> {
    try {
      // Check for new emails
      if (text.includes('check') || text.includes('new') || text.includes('unread')) {
        const accounts = await emailService.getAccounts();

        if (accounts.length === 0) {
          return {
            success: false,
            response: 'Boss, you haven\'t connected any email accounts yet.',
          };
        }

        // Get recent emails from all accounts
        let totalEmails = 0;
        let emailSummary: string[] = [];
        let urgentCount = 0;

        for (const account of accounts) {
          try {
            const messages = await emailService.getMessages(account.provider, 10);
            const unreadMessages = messages.filter(m => !m.read);

            totalEmails += unreadMessages.length;

            // Check for urgent emails (from specific senders, or with urgent keywords)
            const urgentEmails = unreadMessages.filter(m =>
              this.isEmailUrgent(m.from, m.subject)
            );

            urgentCount += urgentEmails.length;

            // Build summary
            if (unreadMessages.length > 0) {
              const senderNames = unreadMessages
                .slice(0, 3)
                .map(m => this.extractName(m.from));

              if (urgentEmails.length > 0) {
                emailSummary.push(
                  `${urgentEmails.length} urgent from ${account.provider}`
                );
              }

              if (unreadMessages.length <= 3) {
                emailSummary.push(
                  `${unreadMessages.length} from ${senderNames.join(', ')}`
                );
              } else {
                emailSummary.push(
                  `${unreadMessages.length} new emails in ${account.provider}`
                );
              }
            }
          } catch (error) {
            console.error(`Failed to check ${account.provider}:`, error);
          }
        }

        // Build response
        let response = '';
        if (totalEmails === 0) {
          response = 'Boss, your inbox is clear. No new emails.';
        } else if (urgentCount > 0) {
          response = `Boss, you have ${totalEmails} new email${totalEmails > 1 ? 's' : ''}, including ${urgentCount} urgent. ${emailSummary.join('. ')}.`;
        } else {
          response = `Boss, you have ${totalEmails} new email${totalEmails > 1 ? 's' : ''}. ${emailSummary.join('. ')}.`;
        }

        return {
          success: true,
          response,
          action: 'check_emails',
          data: { count: totalEmails, urgent: urgentCount },
        };
      }

      // Read specific email
      if (text.includes('read') || text.includes('open')) {
        return {
          success: true,
          response: 'Boss, I can read your emails. Which email would you like me to read?',
          action: 'read_email',
        };
      }

      // Send email
      if (text.includes('send') || text.includes('compose')) {
        return {
          success: true,
          response: 'Boss, I can send an email. Who should I send it to?',
          action: 'send_email',
        };
      }

      return {
        success: true,
        response: 'Boss, I can help with emails. Try saying "check my emails" or "send an email".',
      };
    } catch (error: any) {
      console.error('Email command error:', error);
      return {
        success: false,
        response: 'Sorry boss, I had trouble checking your emails.',
      };
    }
  }

  // ============================================================================
  // CALENDAR COMMANDS
  // ============================================================================

  private isCalendarCommand(text: string): boolean {
    const calendarKeywords = [
      'calendar', 'schedule', 'appointment', 'meeting today',
      'what\'s on my calendar', 'free time', 'busy', 'available',
    ];
    return calendarKeywords.some(keyword => text.includes(keyword));
  }

  private async handleCalendarCommand(text: string): Promise<CommandResult> {
    try {
      // Check today's schedule
      if (
        text.includes('today') ||
        text.includes('schedule') ||
        text.includes('what\'s on')
      ) {
        const accounts = await calendarService.getAccounts();

        if (accounts.length === 0) {
          return {
            success: false,
            response: 'Boss, you haven\'t connected any calendar accounts yet.',
          };
        }

        // Get today's events
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        let allEvents: any[] = [];

        for (const account of accounts) {
          try {
            const events = await calendarService.getEvents(
              account.provider,
              today.toISOString(),
              tomorrow.toISOString()
            );
            allEvents = [...allEvents, ...events];
          } catch (error) {
            console.error(`Failed to get events from ${account.provider}:`, error);
          }
        }

        // Sort events by start time
        allEvents.sort(
          (a, b) =>
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        );

        // Build response
        if (allEvents.length === 0) {
          return {
            success: true,
            response: 'Boss, your calendar is clear today. No scheduled events.',
            action: 'check_calendar',
            data: { events: [] },
          };
        }

        const eventSummary = allEvents
          .slice(0, 5)
          .map(event => {
            const time = new Date(event.startTime).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            });
            return `${event.title} at ${time}`;
          })
          .join(', ');

        const response =
          allEvents.length === 1
            ? `Boss, you have 1 event today: ${eventSummary}.`
            : `Boss, you have ${allEvents.length} events today: ${eventSummary}.`;

        return {
          success: true,
          response,
          action: 'check_calendar',
          data: { events: allEvents },
        };
      }

      // Create event
      if (text.includes('create') || text.includes('schedule') || text.includes('add')) {
        return {
          success: true,
          response: 'Boss, I can create a calendar event. What would you like to schedule?',
          action: 'create_event',
        };
      }

      return {
        success: true,
        response: 'Boss, I can help with your calendar. Try saying "what\'s on my calendar today?".',
      };
    } catch (error: any) {
      console.error('Calendar command error:', error);
      return {
        success: false,
        response: 'Sorry boss, I had trouble checking your calendar.',
      };
    }
  }

  // ============================================================================
  // MEETING COMMANDS
  // ============================================================================

  private isMeetingCommand(text: string): boolean {
    const meetingKeywords = [
      'meeting', 'meetings', 'zoom', 'teams', 'webex', 'google meet',
      'join meeting', 'next meeting', 'upcoming meeting',
    ];
    return meetingKeywords.some(keyword => text.includes(keyword));
  }

  private async handleMeetingCommand(text: string): Promise<CommandResult> {
    try {
      if (text.includes('next') || text.includes('upcoming')) {
        return {
          success: true,
          response: 'Boss, let me check your upcoming meetings.',
          action: 'check_meetings',
        };
      }

      if (text.includes('create') || text.includes('schedule')) {
        return {
          success: true,
          response: 'Boss, which platform should I use? Zoom, Teams, Google Meet, or Webex?',
          action: 'create_meeting',
        };
      }

      return {
        success: true,
        response: 'Boss, I can help with meetings. Try saying "what\'s my next meeting?".',
      };
    } catch (error: any) {
      console.error('Meeting command error:', error);
      return {
        success: false,
        response: 'Sorry boss, I had trouble with that meeting command.',
      };
    }
  }

  // ============================================================================
  // TASK COMMANDS
  // ============================================================================

  private isTaskCommand(text: string): boolean {
    const taskKeywords = [
      'task', 'tasks', 'to do', 'todo', 'to-do',
      'add task', 'create task', 'complete task',
    ];
    return taskKeywords.some(keyword => text.includes(keyword));
  }

  private async handleTaskCommand(text: string): Promise<CommandResult> {
    return {
      success: true,
      response: 'Boss, I can help with tasks. What would you like to do?',
      action: 'manage_tasks',
    };
  }

  // ============================================================================
  // REMINDER COMMANDS
  // ============================================================================

  private isReminderCommand(text: string): boolean {
    const reminderKeywords = [
      'remind', 'reminder', 'reminders', 'set reminder',
      'remind me', 'don\'t forget',
    ];
    return reminderKeywords.some(keyword => text.includes(keyword));
  }

  private async handleReminderCommand(text: string): Promise<CommandResult> {
    return {
      success: true,
      response: 'Boss, what would you like me to remind you about?',
      action: 'set_reminder',
    };
  }

  // ============================================================================
  // GENERAL QUERIES
  // ============================================================================

  private isGeneralQuery(text: string): boolean {
    const generalKeywords = [
      'hello', 'hi', 'hey', 'what can you do', 'help',
      'thank you', 'thanks', 'good morning', 'good afternoon',
    ];
    return generalKeywords.some(keyword => text.includes(keyword));
  }

  private async handleGeneralQuery(text: string): Promise<CommandResult> {
    if (text.includes('hello') || text.includes('hi') || text.includes('hey')) {
      return {
        success: true,
        response: 'Hello boss! How can I help you today?',
      };
    }

    if (text.includes('what can you do') || text.includes('help')) {
      return {
        success: true,
        response:
          'Boss, I can check your emails, manage your calendar, schedule meetings, handle tasks, and set reminders. Just ask!',
        action: 'show_help',
      };
    }

    if (text.includes('thank') || text.includes('thanks')) {
      return {
        success: true,
        response: 'You\'re welcome, boss! Always happy to help.',
      };
    }

    if (text.includes('good morning')) {
      return {
        success: true,
        response: 'Good morning, boss! Ready to tackle the day?',
      };
    }

    if (text.includes('good afternoon')) {
      return {
        success: true,
        response: 'Good afternoon, boss! How can I assist you?',
      };
    }

    return {
      success: true,
      response: 'Boss, I\'m here to help. What do you need?',
    };
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private isEmailUrgent(from: string, subject: string): boolean {
    const urgentKeywords = [
      'urgent', 'asap', 'important', 'critical', 'emergency',
      'immediately', 'action required', 'time sensitive',
    ];

    const subjectLower = subject.toLowerCase();
    return urgentKeywords.some(keyword => subjectLower.includes(keyword));
  }

  private extractName(emailAddress: string): string {
    // Extract name from "Name <email@example.com>" format
    const match = emailAddress.match(/^([^<]+)</);
    if (match) {
      return match[1].trim();
    }

    // Return email if no name found
    const atIndex = emailAddress.indexOf('@');
    if (atIndex > 0) {
      return emailAddress.substring(0, atIndex);
    }

    return emailAddress;
  }

  /**
   * Get a quick status update across all integrations
   */
  async getStatusUpdate(): Promise<string> {
    try {
      const updates: string[] = [];

      // Check emails
      const emailAccounts = await emailService.getAccounts();
      if (emailAccounts.length > 0) {
        let totalUnread = 0;
        for (const account of emailAccounts) {
          try {
            const messages = await emailService.getMessages(account.provider, 10);
            totalUnread += messages.filter(m => !m.read).length;
          } catch (error) {
            // Ignore errors
          }
        }
        if (totalUnread > 0) {
          updates.push(`${totalUnread} unread email${totalUnread > 1 ? 's' : ''}`);
        }
      }

      // Check calendar
      const calendarAccounts = await calendarService.getAccounts();
      if (calendarAccounts.length > 0) {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        let eventCount = 0;
        for (const account of calendarAccounts) {
          try {
            const events = await calendarService.getEvents(
              account.provider,
              today.toISOString(),
              tomorrow.toISOString()
            );
            eventCount += events.length;
          } catch (error) {
            // Ignore errors
          }
        }

        if (eventCount > 0) {
          updates.push(`${eventCount} event${eventCount > 1 ? 's' : ''} today`);
        }
      }

      if (updates.length === 0) {
        return 'Boss, everything is quiet. No urgent updates.';
      }

      return `Boss, you have ${updates.join(', ')}.`;
    } catch (error) {
      console.error('Status update error:', error);
      return 'Boss, I had trouble getting your status update.';
    }
  }
}

export const paCommandProcessor = new PACommandProcessor();
export default paCommandProcessor;
