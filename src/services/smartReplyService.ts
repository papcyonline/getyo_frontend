import { Email } from '../types/email';

export interface SmartReply {
  id: string;
  text: string;
  type: 'positive' | 'neutral' | 'question' | 'acknowledgment';
}

class SmartReplyService {
  private genericReplies: SmartReply[] = [
    { id: '1', text: 'Thanks!', type: 'positive' },
    { id: '2', text: 'Sounds good!', type: 'positive' },
    { id: '3', text: 'Got it, thanks!', type: 'acknowledgment' },
    { id: '4', text: "I'll check and get back to you", type: 'neutral' },
    { id: '5', text: "I'll look into this", type: 'neutral' },
    { id: '6', text: 'Thanks for letting me know', type: 'acknowledgment' },
  ];

  private meetingReplies: SmartReply[] = [
    { id: 'm1', text: 'Yes, that works for me', type: 'positive' },
    { id: 'm2', text: 'Let me check my calendar', type: 'neutral' },
    { id: 'm3', text: 'Can we reschedule?', type: 'question' },
    { id: 'm4', text: "I'll be there", type: 'positive' },
  ];

  private questionReplies: SmartReply[] = [
    { id: 'q1', text: 'Yes', type: 'positive' },
    { id: 'q2', text: 'No, thank you', type: 'neutral' },
    { id: 'q3', text: 'Let me think about it', type: 'neutral' },
    { id: 'q4', text: 'Can you provide more details?', type: 'question' },
  ];

  private thankYouReplies: SmartReply[] = [
    { id: 't1', text: "You're welcome!", type: 'positive' },
    { id: 't2', text: 'Happy to help!', type: 'positive' },
    { id: 't3', text: 'Anytime!', type: 'positive' },
  ];

  private urgentReplies: SmartReply[] = [
    { id: 'u1', text: "I'll prioritize this", type: 'acknowledgment' },
    { id: 'u2', text: 'Working on it now', type: 'acknowledgment' },
    { id: 'u3', text: 'Understood, will handle ASAP', type: 'acknowledgment' },
  ];

  generateSmartReplies(email: Email): SmartReply[] {
    const body = email.body.toLowerCase();
    const subject = email.subject.toLowerCase();
    const combinedText = `${subject} ${body}`;

    const suggestions: SmartReply[] = [];

    // Check for thank you emails
    if (this.containsAny(combinedText, ['thank you', 'thanks', 'appreciate'])) {
      suggestions.push(...this.thankYouReplies.slice(0, 2));
    }

    // Check for meeting/calendar related
    if (this.containsAny(combinedText, ['meeting', 'schedule', 'calendar', 'appointment', 'call'])) {
      suggestions.push(...this.meetingReplies.slice(0, 2));
    }

    // Check for questions
    if (this.containsAny(combinedText, ['?', 'could you', 'can you', 'would you', 'please'])) {
      suggestions.push(...this.questionReplies.slice(0, 2));
    }

    // Check for urgent
    if (this.containsAny(combinedText, ['urgent', 'asap', 'immediately', 'priority', 'important'])) {
      suggestions.push(...this.urgentReplies.slice(0, 2));
    }

    // Add generic replies if we don't have enough suggestions
    while (suggestions.length < 3) {
      const genericReply = this.genericReplies[suggestions.length];
      if (genericReply && !suggestions.find(s => s.id === genericReply.id)) {
        suggestions.push(genericReply);
      } else {
        break;
      }
    }

    // Return top 3 suggestions
    return suggestions.slice(0, 3);
  }

  private containsAny(text: string, keywords: string[]): boolean {
    return keywords.some(keyword => text.includes(keyword.toLowerCase()));
  }

  expandReplyToFullEmail(reply: SmartReply, originalEmail: Email): string {
    // Generate a more complete email from the smart reply
    const greeting = this.generateGreeting(originalEmail);
    const signature = this.generateSignature();

    let fullReply = '';

    if (greeting) {
      fullReply += `${greeting}\n\n`;
    }

    fullReply += reply.text;

    if (signature) {
      fullReply += `\n\n${signature}`;
    }

    // Add original email quote
    fullReply += `\n\n---\nOn ${new Date(originalEmail.date).toLocaleString()}, ${originalEmail.from.name || originalEmail.from.email} wrote:\n${originalEmail.body}`;

    return fullReply;
  }

  private generateGreeting(email: Email): string {
    const senderName = email.from.name?.split(' ')[0] || 'there';
    const hour = new Date().getHours();

    if (hour < 12) {
      return `Good morning ${senderName},`;
    } else if (hour < 18) {
      return `Good afternoon ${senderName},`;
    } else {
      return `Good evening ${senderName},`;
    }
  }

  private generateSignature(): string {
    return 'Best regards';
  }
}

const smartReplyService = new SmartReplyService();
export default smartReplyService;
