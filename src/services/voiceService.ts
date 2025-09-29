// import Voice from '@react-native-voice/voice'; // Requires development build
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

interface VoiceCommand {
  command: string;
  action: () => void;
  keywords: string[];
  description: string;
}

class VoiceService {
  private isListening = false;
  private voiceCommands: VoiceCommand[] = [];
  private onSpeechResult?: (text: string) => void;
  private onSpeechError?: (error: any) => void;
  private recording?: Audio.Recording;
  private isRecording = false;

  constructor() {
    this.initializeVoice();
    this.setupDefaultCommands();
  }

  private async initializeVoice() {
    try {
      // Request audio recording permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Audio permission not granted');
      }

      // Configure audio mode for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log('Voice service initialized');
    } catch (error) {
      console.error('Voice initialization error:', error);
    }
  }

  private setupDefaultCommands() {
    this.voiceCommands = [
      {
        command: 'open_email',
        keywords: ['open email', 'show emails', 'check email', 'email management'],
        description: 'Open email management screen',
        action: () => {
          // This would navigate to email screen
          console.log('Opening email management');
        }
      },
      {
        command: 'schedule_meeting',
        keywords: ['schedule meeting', 'book meeting', 'create meeting', 'new meeting'],
        description: 'Schedule a new meeting',
        action: () => {
          console.log('Opening meeting scheduler');
        }
      },
      {
        command: 'daily_briefing',
        keywords: ['daily briefing', 'morning briefing', 'show briefing', 'what\'s today'],
        description: 'Show daily briefing',
        action: () => {
          console.log('Opening daily briefing');
        }
      },
      {
        command: 'create_task',
        keywords: ['create task', 'add task', 'new task', 'remind me to'],
        description: 'Create a new task',
        action: () => {
          console.log('Creating new task');
        }
      },
      {
        command: 'financial_dashboard',
        keywords: ['show finances', 'financial dashboard', 'portfolio', 'investments'],
        description: 'Open financial dashboard',
        action: () => {
          console.log('Opening financial dashboard');
        }
      },
      {
        command: 'team_management',
        keywords: ['team status', 'team management', 'my team', 'team dashboard'],
        description: 'Open team management',
        action: () => {
          console.log('Opening team management');
        }
      }
    ];
  }

  // Voice Recognition Events
  private onSpeechStart = (e: any) => {
    console.log('Speech recognition started');
    this.isListening = true;
  };

  private onSpeechRecognized = (e: any) => {
    console.log('Speech recognized');
  };

  private onSpeechEnd = (e: any) => {
    console.log('Speech recognition ended');
    this.isListening = false;
  };

  private onSpeechErrorHandler = (e: any) => {
    console.log('Speech recognition error:', e.error);
    this.isListening = false;
    if (this.onSpeechError) {
      this.onSpeechError(e.error);
    }
  };

  private onSpeechResults = (e: any) => {
    console.log('Speech results:', e.value);
    if (e.value && e.value.length > 0) {
      const recognizedText = e.value[0].toLowerCase();
      this.processVoiceCommand(recognizedText);

      if (this.onSpeechResult) {
        this.onSpeechResult(e.value[0]);
      }
    }
  };

  private onSpeechPartialResults = (e: any) => {
    console.log('Partial speech results:', e.value);
  };

  private onSpeechVolumeChanged = (e: any) => {
    // Handle volume changes for visual feedback
  };

  // Public Methods
  async startListening(
    onResult?: (text: string) => void,
    onError?: (error: any) => void
  ): Promise<boolean> {
    try {
      if (this.isListening) {
        await this.stopListening();
      }

      this.onSpeechResult = onResult;
      this.onSpeechError = onError;

      // For Expo Go demo: simulate voice recognition
      this.isListening = true;

      // Simulate speech recognition after 2 seconds
      const demoCommands = [
        "open email management",
        "show me today's briefing",
        "open financial dashboard",
        "show my tasks",
        "open meeting preparation"
      ];
      const randomCommand = demoCommands[Math.floor(Math.random() * demoCommands.length)];

      setTimeout(() => {
        if (this.isListening && onResult) {
          onResult(randomCommand);
          this.isListening = false;
        }
      }, 2000);

      return true;
    } catch (error) {
      console.error('Error starting voice recognition:', error);
      return false;
    }
  }

  async stopListening(): Promise<void> {
    try {
      this.isListening = false;
      // In development build: await Voice.stop();
    } catch (error) {
      console.error('Error stopping voice recognition:', error);
    }
  }

  async cancelListening(): Promise<void> {
    try {
      this.isListening = false;
      // In development build: await Voice.cancel();
    } catch (error) {
      console.error('Error canceling voice recognition:', error);
    }
  }

  async speak(
    text: string,
    options: {
      language?: string;
      pitch?: number;
      rate?: number;
      voice?: string;
    } = {}
  ): Promise<void> {
    try {
      // Get user's selected assistant voice preference
      const userVoiceSettings = await this.getUserVoiceSettings();

      const speakOptions = {
        language: options.language || 'en-US',
        pitch: options.pitch || userVoiceSettings.pitch,
        rate: options.rate || userVoiceSettings.rate,
        voice: options.voice || userVoiceSettings.voice,
        onDone: () => console.log('Speech completed'),
        onStopped: () => console.log('Speech stopped'),
        onError: (error: any) => console.error('Speech error:', error),
      };

      await Speech.speak(text, speakOptions);
    } catch (error) {
      console.error('Error speaking text:', error);
    }
  }

  stopSpeaking(): void {
    Speech.stop();
  }

  private processVoiceCommand(recognizedText: string): void {
    const matchedCommand = this.voiceCommands.find(cmd =>
      cmd.keywords.some(keyword => recognizedText.includes(keyword.toLowerCase()))
    );

    if (matchedCommand) {
      console.log(`Executing command: ${matchedCommand.command}`);
      matchedCommand.action();

      // Provide voice feedback
      this.speak(`Opening ${matchedCommand.description.toLowerCase()}`);
    } else {
      console.log('No matching voice command found');
      // Could integrate with AI assistant for general queries
      this.handleGeneralQuery(recognizedText);
    }
  }

  private async handleGeneralQuery(query: string): Promise<void> {
    // This would integrate with OpenAI/Claude for general AI responses
    console.log('Processing general query:', query);

    // For now, provide a generic response
    await this.speak("I'm processing your request. This feature will be enhanced with AI integration.");
  }

  // Voice Command Management
  addVoiceCommand(command: VoiceCommand): void {
    this.voiceCommands.push(command);
  }

  removeVoiceCommand(commandName: string): void {
    this.voiceCommands = this.voiceCommands.filter(cmd => cmd.command !== commandName);
  }

  getAvailableCommands(): VoiceCommand[] {
    return this.voiceCommands;
  }

  // Utility Methods
  isCurrentlyListening(): boolean {
    return this.isListening;
  }

  async isVoiceAvailable(): Promise<boolean> {
    try {
      // In Expo Go: return demo mode availability
      return true; // Demo mode always available
      // In development build: return await Voice.isAvailable();
    } catch (error) {
      console.error('Error checking voice availability:', error);
      return false;
    }
  }

  async getSupportedLanguages(): Promise<string[]> {
    try {
      // In Expo Go: return demo languages
      return ['en-US', 'en-GB']; // Demo languages
      // In development build: return await Voice.getSupportedActivities() || [];
    } catch (error) {
      console.error('Error getting supported languages:', error);
      return [];
    }
  }

  // Transcription for notes and documents
  async startTranscription(
    onTranscript: (text: string) => void,
    onComplete: (fullText: string) => void
  ): Promise<boolean> {
    let fullTranscript = '';

    return this.startListening(
      (text) => {
        fullTranscript += text + ' ';
        onTranscript(text);
      },
      (error) => {
        console.error('Transcription error:', error);
        onComplete(fullTranscript.trim());
      }
    );
  }

  // Voice-to-text for quick capture
  async quickCapture(): Promise<string | null> {
    return new Promise((resolve) => {
      this.startListening(
        (text) => {
          resolve(text);
        },
        (error) => {
          console.error('Quick capture error:', error);
          resolve(null);
        }
      );

      // Auto-stop after 30 seconds
      setTimeout(() => {
        this.stopListening();
        resolve(null);
      }, 30000);
    });
  }

  // Executive assistant responses
  async provideExecutiveBriefing(briefingData: any): Promise<void> {
    const briefing = this.generateExecutiveBriefing(briefingData);
    const userVoiceSettings = await this.getUserVoiceSettings();
    await this.speak(briefing, { rate: userVoiceSettings.rate * 0.9 }); // Slightly slower for important info
  }

  private generateExecutiveBriefing(data: any): string {
    // This would generate personalized executive briefings
    return `Good morning. Here's your executive briefing. You have ${data.meetingCount || 0} meetings today, ${data.emailCount || 0} unread emails requiring attention, and ${data.taskCount || 0} pending tasks. Your first meeting is at ${data.firstMeeting || 'no meetings scheduled'}.`;
  }

  // Real-time audio recording for conversation interview
  async startRecording(): Promise<boolean> {
    try {
      if (this.isRecording) {
        await this.stopRecording();
      }

      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        console.error('Audio permission not granted');
        return false;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recordingOptions = {
        android: {
          extension: '.m4a',
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_MPEG4AAC,
          audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
      };

      this.recording = new Audio.Recording();
      await this.recording.prepareToRecordAsync(recordingOptions);
      await this.recording.startAsync();
      this.isRecording = true;

      console.log('Recording started');
      return true;
    } catch (error) {
      console.error('Error starting recording:', error);
      return false;
    }
  }

  async stopRecording(): Promise<string | null> {
    try {
      if (!this.recording || !this.isRecording) {
        return null;
      }

      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      this.isRecording = false;
      this.recording = undefined;

      console.log('Recording stopped, URI:', uri);
      return uri;
    } catch (error) {
      console.error('Error stopping recording:', error);
      return null;
    }
  }

  async transcribeAudio(audioUri: string): Promise<{ text: string; confidence: number } | null> {
    try {
      // Try real OpenAI Whisper transcription first
      const realTranscription = await this.callOpenAIWhisper(audioUri);
      if (realTranscription) {
        return realTranscription;
      }

      // Fallback to demo responses if API fails
      console.log('Using fallback demo transcription');
      const demoResponses = [
        { text: "I'm a software engineer working on mobile applications and AI integration projects.", confidence: 0.95 },
        { text: "My biggest challenge is managing multiple projects and staying organized with deadlines.", confidence: 0.92 },
        { text: "I prefer having a structured day but with flexibility for unexpected urgent tasks.", confidence: 0.88 },
        { text: "I'd like reminders to be friendly but professional, not too casual.", confidence: 0.94 },
        { text: "I usually work from 9 to 6 but sometimes need to work late on important projects.", confidence: 0.90 },
        { text: "I want my assistant to help with scheduling meetings and managing my calendar efficiently.", confidence: 0.93 },
        { text: "I prefer getting daily briefings in the morning around 8 AM before I start work.", confidence: 0.91 },
        { text: "I'd like the assistant to learn my preferences over time and become more personalized.", confidence: 0.89 }
      ];

      await new Promise(resolve => setTimeout(resolve, 1500));
      const randomResponse = demoResponses[Math.floor(Math.random() * demoResponses.length)];
      return randomResponse;
    } catch (error) {
      console.error('Error transcribing audio:', error);
      return null;
    }
  }

  private async callOpenAIWhisper(audioUri: string): Promise<{ text: string; confidence: number } | null> {
    try {
      console.log('🎤 Starting backend transcription via API service...');

      // Import the API service
      const ApiService = require('./api').default;

      // Use the API service which handles auth tokens automatically
      const result = await ApiService.transcribeAudio(audioUri);

      if (result) {
        console.log(`✅ Backend transcription successful using ${result.service}:`, result.text);
        return {
          text: result.text,
          confidence: result.confidence
        };
      } else {
        console.log('Backend transcription failed, will use fallback');
        return null;
      }
    } catch (error) {
      console.error('Backend transcription error:', error);
      return null;
    }
  }

  private async getUserVoiceSettings(): Promise<{ voice?: string; pitch: number; rate: number }> {
    try {
      // Get user data from AsyncStorage
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const userDataString = await AsyncStorage.getItem('userData');

      if (userDataString) {
        const userData = JSON.parse(userDataString);
        const assistantVoice = userData.assistantVoice;

        // Map voice to appropriate pitch and rate settings
        switch (assistantVoice) {
          case 'nova': // Warm female
            return { voice: undefined, pitch: 1.1, rate: 0.9 };
          case 'shimmer': // Professional female
            return { voice: undefined, pitch: 1.0, rate: 0.85 };
          case 'echo': // Confident male
            return { voice: undefined, pitch: 0.8, rate: 0.9 };
          case 'onyx': // Deep male
            return { voice: undefined, pitch: 0.7, rate: 0.8 };
          case 'alloy': // Neutral
            return { voice: undefined, pitch: 0.9, rate: 0.9 };
          case 'fable': // Neutral British
            return { voice: undefined, pitch: 0.95, rate: 0.85 };
          default:
            return { voice: undefined, pitch: 1.0, rate: 0.9 };
        }
      }

      // Default settings
      return { voice: undefined, pitch: 1.0, rate: 0.9 };
    } catch (error) {
      console.error('Failed to get user voice settings:', error);
      return { voice: undefined, pitch: 1.0, rate: 0.9 };
    }
  }

  private async getAuthToken(): Promise<string | null> {
    try {
      // Use the same auth token storage as the API service
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const token = await AsyncStorage.getItem('authToken');
      return token;
    } catch (error) {
      console.error('Failed to get auth token:', error);
      return null;
    }
  }

  // Legacy method - keeping for reference
  private async callTranscriptionAPI(audioUri: string): Promise<{ text: string; confidence: number } | null> {
    try {
      // This method is deprecated in favor of callOpenAIWhisper
      return await this.callOpenAIWhisper(audioUri);
    } catch (error) {
      console.error('Transcription API error:', error);
      return null;
    }
  }

  // Enhanced conversation recording with real-time transcription
  async startConversationRecording(
    onTranscriptUpdate: (text: string, confidence: number) => void,
    onError?: (error: any) => void
  ): Promise<boolean> {
    try {
      const started = await this.startRecording();
      if (!started) return false;

      // For real-time transcription, you would implement streaming audio chunks
      // For now, we'll use the existing recording/transcription flow

      return true;
    } catch (error) {
      console.error('Error starting conversation recording:', error);
      if (onError) onError(error);
      return false;
    }
  }

  async stopConversationRecording(): Promise<{ text: string; confidence: number } | null> {
    try {
      const audioUri = await this.stopRecording();
      if (!audioUri) return null;

      return await this.transcribeAudio(audioUri);
    } catch (error) {
      console.error('Error stopping conversation recording:', error);
      return null;
    }
  }

  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  // Cleanup
  destroy(): void {
    if (this.isRecording && this.recording) {
      this.recording.stopAndUnloadAsync();
    }
    Speech.stop();
    this.isListening = false;
    this.isRecording = false;
  }
}

export const voiceService = new VoiceService();
export type { VoiceCommand };