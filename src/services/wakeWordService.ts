import Voice from '@react-native-voice/voice';
import { Platform, Alert, AppState, AppStateStatus } from 'react-native';
import { voiceService } from './voiceService';
import ApiService from './api';

interface WakeWordConfig {
  wakeWord: string; // "Yo!"
  assistantName: string; // e.g., "Sora"
  enabled: boolean;
}

class WakeWordService {
  private isListening: boolean = false;
  private config: WakeWordConfig = {
    wakeWord: 'Yo',
    assistantName: '',
    enabled: false,
  };
  private onWakeWordDetectedCallback: (() => void) | null = null;
  private appState: AppStateStatus = 'active';
  private recognizedText: string = '';

  constructor() {
    // Setup voice event listeners
    Voice.onSpeechStart = this.onSpeechStart;
    Voice.onSpeechEnd = this.onSpeechEnd;
    Voice.onSpeechResults = this.onSpeechResults;
    Voice.onSpeechError = this.onSpeechError;

    // Monitor app state to restart listening when app comes to foreground
    AppState.addEventListener('change', this.handleAppStateChange);
  }

  /**
   * Initialize wake word detection with user's assistant name
   */
  async initialize(assistantName: string) {
    this.config.assistantName = assistantName;
    this.config.enabled = true;
    console.log(`🎤 Wake word service initialized: "Yo ${assistantName}"`);
  }

  /**
   * Start listening for wake word
   */
  async startListening(): Promise<boolean> {
    try {
      if (this.isListening) {
        console.log('🎤 Already listening for wake word');
        return true;
      }

      // Check if voice recognition is available
      const isAvailable = await Voice.isAvailable();
      if (!isAvailable) {
        console.error('❌ Voice recognition not available on this device');
        return false;
      }

      // Start continuous recognition
      await Voice.start('en-US');
      this.isListening = true;
      console.log(`🎤 Listening for wake word: "Yo ${this.config.assistantName}"`);
      return true;
    } catch (error) {
      console.error('❌ Failed to start wake word listening:', error);
      this.isListening = false;
      return false;
    }
  }

  /**
   * Stop listening for wake word
   */
  async stopListening() {
    try {
      if (!this.isListening) {
        return;
      }

      await Voice.stop();
      this.isListening = false;
      console.log('🛑 Stopped listening for wake word');
    } catch (error) {
      console.error('❌ Failed to stop wake word listening:', error);
    }
  }

  /**
   * Register callback for when wake word is detected
   */
  onWakeWordDetected(callback: () => void) {
    this.onWakeWordDetectedCallback = callback;
  }

  /**
   * Handle app state changes to manage background listening
   */
  private handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (this.appState.match(/inactive|background/) && nextAppState === 'active') {
      // App has come to the foreground - restart listening if enabled
      if (this.config.enabled && !this.isListening) {
        console.log('📱 App returned to foreground - restarting wake word detection');
        this.startListening();
      }
    } else if (nextAppState.match(/inactive|background/)) {
      // App going to background - keep listening (requires background permissions)
      console.log('📱 App going to background - wake word detection continues');
    }

    this.appState = nextAppState;
  };

  /**
   * Voice event handlers
   */
  private onSpeechStart = () => {
    console.log('🎤 Speech detected');
  };

  private onSpeechEnd = () => {
    console.log('🎤 Speech ended');

    // Restart listening immediately for continuous wake word detection
    if (this.config.enabled) {
      setTimeout(() => {
        this.startListening();
      }, 100);
    }
  };

  private onSpeechResults = (event: any) => {
    const results = event.value || [];
    if (results.length === 0) {
      return;
    }

    this.recognizedText = results[0].toLowerCase();
    console.log('🎤 Recognized:', this.recognizedText);

    // Check if wake word was detected
    if (this.checkWakeWord(this.recognizedText)) {
      console.log('✅ Wake word detected!');
      this.handleWakeWordDetected();
    }
  };

  private onSpeechError = (error: any) => {
    console.error('🎤 Speech recognition error:', error);

    // Restart listening on error (unless it's a permissions error)
    if (this.config.enabled && error.error?.code !== 'permissions') {
      setTimeout(() => {
        this.startListening();
      }, 1000);
    }
  };

  /**
   * Check if recognized text contains the wake word
   */
  private checkWakeWord(text: string): boolean {
    const wakePhrase = `${this.config.wakeWord} ${this.config.assistantName}`.toLowerCase();

    // Check exact match or close variations
    const variations = [
      wakePhrase,
      `yo ${this.config.assistantName}`,
      `hey ${this.config.assistantName}`,
      `hello ${this.config.assistantName}`,
      this.config.assistantName, // Just the name
    ];

    return variations.some(variation =>
      text.includes(variation) ||
      text.replace(/[^\w\s]/g, '').includes(variation.replace(/[^\w\s]/g, ''))
    );
  }

  /**
   * Handle wake word detection
   */
  private async handleWakeWordDetected() {
    // Stop listening for wake word
    await this.stopListening();

    // Play acknowledgment sound (optional)
    // await voiceService.playAcknowledgment();

    // Trigger callback to start conversation
    if (this.onWakeWordDetectedCallback) {
      this.onWakeWordDetectedCallback();
    }
  }

  /**
   * Request necessary permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'ios') {
        // iOS automatically requests permissions when Voice.start() is called
        return true;
      } else if (Platform.OS === 'android') {
        // Android requires RECORD_AUDIO permission
        const hasPermission = await Voice.isRecognizing();
        return hasPermission;
      }
      return true;
    } catch (error) {
      console.error('❌ Failed to request permissions:', error);
      Alert.alert(
        'Microphone Permission Required',
        'Please enable microphone access in Settings to use wake word detection.',
        [{ text: 'OK' }]
      );
      return false;
    }
  }

  /**
   * Resume wake word detection after conversation ends
   */
  async resumeWakeWordDetection() {
    console.log('🔄 Resuming wake word detection');
    if (this.config.enabled) {
      // Wait a bit before restarting
      setTimeout(() => {
        this.startListening();
      }, 500);
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): WakeWordConfig {
    return { ...this.config };
  }

  /**
   * Update wake word settings
   */
  async updateConfig(config: Partial<WakeWordConfig>) {
    this.config = { ...this.config, ...config };

    // Save to backend
    try {
      await ApiService.updateWakeWordSettings({
        wakeWord: this.config.wakeWord,
        enabled: this.config.enabled,
      });
    } catch (error) {
      console.error('Failed to save wake word settings:', error);
    }

    // Restart if enabled
    if (this.config.enabled && !this.isListening) {
      this.startListening();
    } else if (!this.config.enabled && this.isListening) {
      this.stopListening();
    }
  }

  /**
   * Cleanup
   */
  async destroy() {
    await this.stopListening();
    Voice.destroy();
  }
}

// Export singleton instance
export const wakeWordService = new WakeWordService();