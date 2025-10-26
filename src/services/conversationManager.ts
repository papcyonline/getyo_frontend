import Voice from '@react-native-voice/voice';
import { voiceService } from './voiceService';
import ApiService from './api';
import { Alert } from 'react-native';
import { wakeWordService } from './wakeWordService';
import { wakeWordNotificationService } from './wakeWordNotificationService';

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ExtractedData {
  tasks: Array<{
    title: string;
    description?: string;
    priority: 'low' | 'medium' | 'high';
    dueDate?: string;
  }>;
  events: Array<{
    title: string;
    startTime: string;
    endTime?: string;
    attendees?: string[];
  }>;
  reminders: Array<{
    message: string;
    time: string;
  }>;
}

class ConversationManager {
  private isActive: boolean = false;
  private transcript: ConversationMessage[] = [];
  private currentUserSpeech: string = '';
  private conversationId: string | null = null;
  private silenceTimeout: NodeJS.Timeout | null = null;
  private assistantName: string = '';

  constructor() {
    Voice.onSpeechResults = this.onUserSpeechResults;
    Voice.onSpeechEnd = this.onUserSpeechEnd;
  }

  /**
   * Start a new conversation
   */
  async startConversation(assistantName: string): Promise<boolean> {
    try {
      this.assistantName = assistantName;
      this.isActive = true;
      this.transcript = [];
      this.currentUserSpeech = '';

      console.log('💬 Starting conversation');

      // NO GREETING - Go straight to listening
      // User wants PA to just listen silently when activated

      // Start listening for user's response immediately
      await this.startListening();

      return true;
    } catch (error) {
      console.error('❌ Failed to start conversation:', error);
      return false;
    }
  }

  /**
   * Start listening for user speech
   */
  private async startListening() {
    try {
      await Voice.start('en-US');
      console.log('👂 Listening to user...');
    } catch (error) {
      console.error('❌ Failed to start listening:', error);
    }
  }

  /**
   * Handle user speech results
   */
  private onUserSpeechResults = (event: any) => {
    const results = event.value || [];
    if (results.length > 0) {
      this.currentUserSpeech = results[0];
      console.log('👤 User said:', this.currentUserSpeech);

      // Reset silence timeout
      if (this.silenceTimeout) {
        clearTimeout(this.silenceTimeout);
      }

      // Set new timeout for detecting end of speech
      this.silenceTimeout = setTimeout(() => {
        this.processUserSpeech();
      }, 1500); // 1.5 seconds of silence
    }
  };

  /**
   * Handle speech end
   */
  private onUserSpeechEnd = () => {
    console.log('👂 Speech ended');
  };

  /**
   * Process what the user said
   */
  private async processUserSpeech() {
    if (!this.currentUserSpeech.trim()) {
      // No speech detected, continue listening
      await this.startListening();
      return;
    }

    const userMessage = this.currentUserSpeech.trim();
    console.log('💬 Processing user message:', userMessage);

    // Add to transcript
    this.transcript.push({
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    });

    // Check if user wants to end conversation
    if (this.detectEndOfConversation(userMessage)) {
      await this.endConversation();
      return;
    }

    // Get AI response
    try {
      const response = await this.getAIResponse(userMessage);

      // Add AI response to transcript
      this.transcript.push({
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      });

      // Speak the response
      await this.speakResponse(response);

      // Clear current speech and continue listening
      this.currentUserSpeech = '';
      await this.startListening();

    } catch (error) {
      console.error('❌ Failed to get AI response:', error);

      // Fallback response
      const fallback = "Sorry, I'm having trouble processing that. Could you repeat?";
      await this.speakResponse(fallback);
      this.currentUserSpeech = '';
      await this.startListening();
    }
  }

  /**
   * Get AI response for user message
   */
  private async getAIResponse(message: string): Promise<string> {
    try {
      // Send to backend for AI processing
      // VOICE MODE - Get concise, conversational responses (1-3 sentences, no markdown)
      const response = await ApiService.sendMessage(message, this.conversationId, 'voice');

      if (response.success) {
        this.conversationId = response.data.conversationId;
        return response.data.aiResponse;
      }

      throw new Error('Failed to get AI response');
    } catch (error) {
      console.error('AI response error:', error);

      // Simple fallback responses based on keywords
      const lowercaseMessage = message.toLowerCase();

      if (lowercaseMessage.includes('schedule') || lowercaseMessage.includes('meeting')) {
        return "I'll schedule that for you. Is there anything else?";
      } else if (lowercaseMessage.includes('remind')) {
        return "I've set a reminder for that. What else can I help with?";
      } else if (lowercaseMessage.includes('task') || lowercaseMessage.includes('todo')) {
        return "I've added that to your tasks. Anything else?";
      } else {
        return "Got it! I'll take care of that. Is there anything else you need?";
      }
    }
  }

  /**
   * Speak AI response using TTS
   */
  private async speakResponse(text: string) {
    try {
      console.log('🗣️ PA speaking:', text);
      await voiceService.speak(text);
    } catch (error) {
      console.error('❌ Failed to speak response:', error);
    }
  }

  /**
   * Detect if user wants to end conversation
   */
  private detectEndOfConversation(message: string): boolean {
    const endPhrases = [
      "that's all",
      "that's it",
      "nothing else",
      "no thanks",
      "bye",
      "goodbye",
      "done",
      "finish",
      "stop",
      "end",
      "thank you",
      "thanks",
    ];

    const lowerMessage = message.toLowerCase();
    return endPhrases.some(phrase => lowerMessage.includes(phrase));
  }

  /**
   * End conversation and extract tasks
   */
  private async endConversation() {
    console.log('💬 Ending conversation');
    this.isActive = false;

    // Stop listening
    await Voice.stop();

    // Goodbye message
    const goodbye = "Perfect! I'll take care of everything. Have a great day!";
    await this.speakResponse(goodbye);

    // Extract tasks, events, and reminders from conversation
    try {
      const extractedData = await this.extractTasksAndEvents();

      // Save to database
      await this.saveConversationData(extractedData);

      // Show confirmation to user
      const summary = this.buildSummary(extractedData);
      if (summary) {
        Alert.alert('Conversation Summary', summary);
      }

    } catch (error) {
      console.error('❌ Failed to extract and save data:', error);
    }

    // Clear transcript
    this.transcript = [];
    this.conversationId = null;

    // Hide the activated notification before resuming wake word detection
    await wakeWordNotificationService.hideNotification();

    // Resume wake word detection (will show listening notification)
    await wakeWordService.resumeWakeWordDetection();
  }

  /**
   * Extract tasks and events from conversation transcript
   */
  private async extractTasksAndEvents(): Promise<ExtractedData> {
    try {
      // Build full conversation text
      const conversationText = this.transcript
        .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
        .join('\n');

      console.log('📝 Extracting data from conversation...');

      // Call backend API to extract structured data using AI
      const response = await ApiService.extractTasksFromConversation(conversationText);

      if (response.success) {
        return response.data;
      }

      throw new Error('Failed to extract tasks');
    } catch (error) {
      console.error('❌ Task extraction failed:', error);

      // Fallback: Basic keyword extraction
      return this.fallbackExtraction();
    }
  }

  /**
   * Fallback extraction using keywords
   */
  private fallbackExtraction(): ExtractedData {
    const tasks: any[] = [];
    const events: any[] = [];
    const reminders: any[] = [];

    this.transcript.forEach(msg => {
      if (msg.role !== 'user') return;

      const text = msg.content.toLowerCase();

      // Simple keyword detection
      if (text.includes('schedule') || text.includes('meeting')) {
        events.push({
          title: msg.content,
          startTime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        });
      } else if (text.includes('remind')) {
        reminders.push({
          message: msg.content,
          time: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
        });
      } else if (text.includes('task') || text.includes('todo') || text.includes('need to')) {
        tasks.push({
          title: msg.content,
          priority: 'medium' as const,
        });
      }
    });

    return { tasks, events, reminders };
  }

  /**
   * Save conversation data to backend
   */
  private async saveConversationData(extractedData: ExtractedData) {
    try {
      // Save conversation transcript
      await ApiService.saveVoiceConversation({
        transcript: this.transcript,
        extractedData,
      });

      // Create tasks
      for (const task of extractedData.tasks) {
        await ApiService.createTask(task);
      }

      // Create events
      for (const event of extractedData.events) {
        await ApiService.createEvent(event);
      }

      // Create reminders
      for (const reminder of extractedData.reminders) {
        await ApiService.createReminder(reminder);
      }

      console.log('✅ Conversation data saved successfully');
    } catch (error) {
      console.error('❌ Failed to save conversation data:', error);
    }
  }

  /**
   * Build summary message
   */
  private buildSummary(data: ExtractedData): string {
    const parts: string[] = [];

    if (data.tasks.length > 0) {
      parts.push(`📋 ${data.tasks.length} task(s) added`);
    }

    if (data.events.length > 0) {
      parts.push(`📅 ${data.events.length} event(s) scheduled`);
    }

    if (data.reminders.length > 0) {
      parts.push(`⏰ ${data.reminders.length} reminder(s) set`);
    }

    return parts.length > 0 ? parts.join('\n') : 'Conversation saved!';
  }

  /**
   * Cancel active conversation
   */
  async cancelConversation() {
    if (!this.isActive) return;

    this.isActive = false;
    await Voice.stop();

    const goodbye = "Okay, cancelled. Let me know if you need anything!";
    await this.speakResponse(goodbye);

    this.transcript = [];
    this.conversationId = null;
  }

  /**
   * Check if conversation is active
   */
  isConversationActive(): boolean {
    return this.isActive;
  }
}

// Export singleton instance
export const conversationManager = new ConversationManager();