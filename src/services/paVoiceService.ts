import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import voiceRecordingService from './voiceRecording';

export interface VoiceCommand {
  text: string;
  confidence: number;
  timestamp: Date;
}

export interface PAVoiceCallbacks {
  onWakeWordDetected?: () => void;
  onListeningStart?: () => void;
  onListeningStop?: () => void;
  onCommandReceived?: (command: VoiceCommand) => void;
  onSpeakingStart?: () => void;
  onSpeakingEnd?: () => void;
  onError?: (error: string) => void;
}

class PAVoiceService {
  private isActive: boolean = false;
  private isListening: boolean = false;
  private isSpeaking: boolean = false;
  private callbacks: PAVoiceCallbacks = {};
  private continuousListeningInterval: NodeJS.Timeout | null = null;

  // Wake word configuration
  private wakeWords: string[] = ['hey yo', 'yo', 'hey assistant'];
  private commandTimeout: number = 5000; // 5 seconds to give command after wake word
  private listeningForCommand: boolean = false;

  /**
   * Initialize the PA voice service
   */
  async initialize(callbacks: PAVoiceCallbacks): Promise<boolean> {
    try {
      this.callbacks = callbacks;

      // Request microphone permissions
      const hasPermission = await voiceRecordingService.requestPermissions();
      if (!hasPermission) {
        this.callbacks.onError?.('Microphone permission denied');
        return false;
      }

      console.log('✅ PA Voice Service initialized');
      return true;
    } catch (error: any) {
      console.error('Failed to initialize PA Voice Service:', error);
      this.callbacks.onError?.(error.message || 'Initialization failed');
      return false;
    }
  }

  /**
   * Start continuous wake word listening
   * PA will constantly listen for "Yo [name]" in the background
   */
  async startWakeWordListening(): Promise<void> {
    if (this.isActive) {
      console.log('Wake word listening already active');
      return;
    }

    try {
      this.isActive = true;
      console.log('👂 PA is now listening for wake word continuously...');

      // Greet the user
      await this.speak('I\'m listening boss. Just say my name and I\'ll respond.');

      // Start the continuous listening loop
      this.listenForWakeWordLoop();
    } catch (error: any) {
      console.error('Failed to start wake word listening:', error);
      this.callbacks.onError?.(error.message || 'Failed to start listening');
      this.isActive = false;
    }
  }

  /**
   * Continuous loop that listens for wake word
   */
  private async listenForWakeWordLoop(): Promise<void> {
    if (!this.isActive || this.listeningForCommand) {
      return;
    }

    try {
      console.log('🎤 Recording short clip for wake word detection...');

      // Record a short 2-second clip
      const started = await voiceRecordingService.startRecording();

      if (!started) {
        // Retry after a short delay
        setTimeout(() => this.listenForWakeWordLoop(), 500);
        return;
      }

      // Record for 2 seconds
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Stop and get audio
      const audioUri = await voiceRecordingService.stopRecording();

      if (audioUri) {
        // Transcribe the audio
        const result = await voiceRecordingService.transcribeAudio(audioUri);

        if (result && result.text) {
          const transcription = result.text.toLowerCase().trim();
          console.log('🎤 Heard:', transcription);

          // Check if wake word is detected
          const hasWakeWord = this.wakeWords.some(word =>
            transcription.includes(word)
          );

          if (hasWakeWord) {
            console.log('🔔 WAKE WORD DETECTED!');
            this.callbacks.onWakeWordDetected?.();

            // Start listening for the actual command
            await this.handleWakeWordDetected();
            return; // Exit loop, will resume after command
          }
        }
      }

      // Continue the loop - listen for next wake word
      if (this.isActive) {
        // Small delay before next recording to save battery
        setTimeout(() => this.listenForWakeWordLoop(), 100);
      }
    } catch (error: any) {
      console.error('Error in wake word loop:', error);

      // Retry after delay
      if (this.isActive) {
        setTimeout(() => this.listenForWakeWordLoop(), 1000);
      }
    }
  }

  /**
   * Handle wake word detected - listen for command
   */
  private async handleWakeWordDetected(): Promise<void> {
    try {
      this.listeningForCommand = true;
      this.callbacks.onListeningStart?.();

      // Respond to acknowledge
      await this.speak('Yes boss?');

      console.log('👂 Now listening for command...');

      // Record the command (5 seconds)
      const started = await voiceRecordingService.startRecording();

      if (!started) {
        await this.speak('Sorry boss, microphone issue.');
        this.listeningForCommand = false;
        this.resumeWakeWordListening();
        return;
      }

      // Listen for 5 seconds
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Stop recording
      const audioUri = await voiceRecordingService.stopRecording();
      this.callbacks.onListeningStop?.();

      if (audioUri) {
        // Transcribe the command
        const result = await voiceRecordingService.transcribeAudio(audioUri);

        if (result && result.text && result.text.trim().length > 0) {
          console.log('📝 Command received:', result.text);

          const command: VoiceCommand = {
            text: result.text,
            confidence: result.confidence,
            timestamp: new Date(),
          };

          // Pass command to callback
          this.callbacks.onCommandReceived?.(command);
        } else {
          await this.speak("Sorry boss, I didn't catch that.");
        }
      }

      // Done with command, resume wake word listening
      this.listeningForCommand = false;
      this.resumeWakeWordListening();

    } catch (error: any) {
      console.error('Error handling command:', error);
      this.callbacks.onError?.(error.message || 'Command failed');
      this.listeningForCommand = false;
      this.resumeWakeWordListening();
    }
  }

  /**
   * Resume wake word listening after command
   */
  private resumeWakeWordListening(): void {
    if (this.isActive && !this.listeningForCommand) {
      console.log('👂 Resuming wake word listening...');
      // Small delay before resuming
      setTimeout(() => this.listenForWakeWordLoop(), 500);
    }
  }

  /**
   * Stop wake word listening
   */
  async stopWakeWordListening(): Promise<void> {
    this.isActive = false;
    this.listeningForCommand = false;

    if (this.continuousListeningInterval) {
      clearTimeout(this.continuousListeningInterval);
      this.continuousListeningInterval = null;
    }

    if (voiceRecordingService.getIsRecording()) {
      await voiceRecordingService.cancelRecording();
    }

    await this.speak('Going offline boss. Tap the button when you need me.');
    console.log('🛑 PA stopped listening');
  }

  /**
   * Manually trigger command listening (for button press)
   */
  async listenForCommand(): Promise<VoiceCommand | null> {
    try {
      this.callbacks.onListeningStart?.();

      // Start recording
      const started = await voiceRecordingService.startRecording();
      if (!started) {
        this.callbacks.onError?.('Failed to start recording');
        this.callbacks.onListeningStop?.();
        return null;
      }

      // Wait for command
      await new Promise(resolve => setTimeout(resolve, this.commandTimeout));

      // Stop recording
      const audioUri = await voiceRecordingService.stopRecording();
      this.callbacks.onListeningStop?.();

      if (!audioUri) {
        this.callbacks.onError?.('No audio recorded');
        return null;
      }

      // Transcribe
      const result = await voiceRecordingService.transcribeAudio(audioUri);

      if (result && result.text) {
        const command: VoiceCommand = {
          text: result.text,
          confidence: result.confidence,
          timestamp: new Date(),
        };

        console.log('📝 Manual command received:', command.text);
        return command;
      }

      return null;
    } catch (error: any) {
      console.error('Error listening for command:', error);
      this.callbacks.onError?.(error.message || 'Failed to listen');
      this.callbacks.onListeningStop?.();
      return null;
    }
  }

  /**
   * Make PA speak using text-to-speech
   */
  async speak(text: string, options?: Speech.SpeechOptions): Promise<void> {
    try {
      if (this.isSpeaking) {
        // Stop current speech
        await Speech.stop();
      }

      this.isSpeaking = true;
      this.callbacks.onSpeakingStart?.();

      console.log('🗣️ PA speaking:', text);

      await Speech.speak(text, {
        language: 'en-US',
        pitch: 1.0,
        rate: 0.9, // Slightly slower for clarity
        voice: 'com.apple.ttsbundle.Samantha-compact', // Use a pleasant voice
        onDone: () => {
          this.isSpeaking = false;
          this.callbacks.onSpeakingEnd?.();
        },
        onError: (error) => {
          console.error('Speech error:', error);
          this.isSpeaking = false;
          this.callbacks.onSpeakingEnd?.();
        },
        ...options,
      });
    } catch (error: any) {
      console.error('Failed to speak:', error);
      this.isSpeaking = false;
      this.callbacks.onSpeakingEnd?.();
      this.callbacks.onError?.(error.message || 'Speech failed');
    }
  }

  /**
   * Stop current speech
   */
  async stopSpeaking(): Promise<void> {
    if (this.isSpeaking) {
      await Speech.stop();
      this.isSpeaking = false;
      this.callbacks.onSpeakingEnd?.();
    }
  }

  /**
   * Check if PA is currently listening
   */
  isCurrentlyListening(): boolean {
    return this.isListening || this.listeningForCommand;
  }

  /**
   * Check if PA is currently speaking
   */
  isCurrentlySpeaking(): boolean {
    return this.isSpeaking;
  }

  /**
   * Check if wake word listening is active
   */
  isWakeWordListeningActive(): boolean {
    return this.isActive;
  }

  /**
   * Update wake words
   */
  setWakeWords(wakeWords: string[]): void {
    this.wakeWords = wakeWords.map(word => word.toLowerCase());
    console.log('Wake words updated:', this.wakeWords);
  }

  /**
   * Set command timeout
   */
  setCommandTimeout(timeout: number): void {
    this.commandTimeout = timeout;
    console.log('Command timeout updated:', timeout, 'ms');
  }

  /**
   * Get available voices
   */
  async getAvailableVoices(): Promise<Speech.Voice[]> {
    try {
      const voices = await Speech.getAvailableVoicesAsync();
      return voices;
    } catch (error) {
      console.error('Failed to get available voices:', error);
      return [];
    }
  }
}

export const paVoiceService = new PAVoiceService();
export default paVoiceService;
