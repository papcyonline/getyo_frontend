import { Audio } from 'expo-av';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { Platform } from 'react-native';

const WAKE_WORD_TASK = 'wake-word-detection';
const WAKE_WORDS = ['hey yo', 'yo', 'hey assistant'];

interface WakeWordCallback {
  onWakeWordDetected: () => void;
  onError?: (error: string) => void;
}

class WakeWordDetectionService {
  private recording: Audio.Recording | null = null;
  private isListening: boolean = false;
  private callbacks: WakeWordCallback[] = [];
  private permissionGranted: boolean = false;
  private isEnabled: boolean = false;

  constructor() {
    this.setupBackgroundTask();
  }

  /**
   * Setup background task for wake word detection
   */
  private async setupBackgroundTask() {
    try {
      TaskManager.defineTask(WAKE_WORD_TASK, async () => {
        try {
          if (this.isEnabled && this.isListening) {
            await this.checkForWakeWord();
          }
          return BackgroundFetch.BackgroundFetchResult.NewData;
        } catch (error) {
          console.error('Wake word background task error:', error);
          return BackgroundFetch.BackgroundFetchResult.Failed;
        }
      });
    } catch (error) {
      console.error('Failed to setup background task:', error);
    }
  }

  /**
   * Request microphone permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      this.permissionGranted = status === 'granted';

      if (this.permissionGranted) {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      }

      return this.permissionGranted;
    } catch (error) {
      console.error('Permission request failed:', error);
      this.notifyError('Failed to get microphone permission');
      return false;
    }
  }

  /**
   * Enable wake word detection
   */
  async enable() {
    if (!this.permissionGranted) {
      const granted = await this.requestPermissions();
      if (!granted) {
        this.notifyError('Microphone permission required');
        return;
      }
    }

    this.isEnabled = true;
    await this.startListening();

    // Register background task
    if (Platform.OS !== 'web') {
      await BackgroundFetch.registerTaskAsync(WAKE_WORD_TASK, {
        minimumInterval: 1, // Check every second
        stopOnTerminate: false,
        startOnBoot: true,
      });
    }

    console.log('✅ Wake word detection enabled');
  }

  /**
   * Disable wake word detection
   */
  async disable() {
    this.isEnabled = false;
    await this.stopListening();

    // Unregister background task
    if (Platform.OS !== 'web') {
      await BackgroundFetch.unregisterTaskAsync(WAKE_WORD_TASK);
    }

    console.log('❌ Wake word detection disabled');
  }

  /**
   * Start listening for wake word
   */
  private async startListening() {
    if (this.isListening) return;

    try {
      this.recording = new Audio.Recording();
      await this.recording.prepareToRecordAsync({
        android: {
          extension: '.m4a',
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_MPEG4AAC,
          audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      });

      await this.recording.startAsync();
      this.isListening = true;

      // Start continuous checking
      this.startContinuousCheck();
    } catch (error) {
      console.error('Failed to start listening:', error);
      this.notifyError('Failed to start listening');
    }
  }

  /**
   * Stop listening
   */
  private async stopListening() {
    if (!this.isListening || !this.recording) return;

    try {
      await this.recording.stopAndUnloadAsync();
      this.recording = null;
      this.isListening = false;
    } catch (error) {
      console.error('Failed to stop listening:', error);
    }
  }

  /**
   * Continuously check for wake word
   */
  private startContinuousCheck() {
    const checkInterval = setInterval(async () => {
      if (!this.isEnabled || !this.isListening) {
        clearInterval(checkInterval);
        return;
      }
      await this.checkForWakeWord();
    }, 1000); // Check every second
  }

  /**
   * Check audio for wake word
   */
  private async checkForWakeWord() {
    if (!this.recording) return;

    try {
      const status = await this.recording.getStatusAsync();

      if (status.isRecording && status.durationMillis > 2000) {
        // Stop current recording
        const uri = await this.recording.stopAndUnloadAsync();

        // Process audio for wake word
        const hasWakeWord = await this.processAudioForWakeWord(uri);

        if (hasWakeWord) {
          this.notifyWakeWordDetected();
        }

        // Restart recording
        await this.startListening();
      }
    } catch (error) {
      console.error('Wake word check error:', error);
    }
  }

  /**
   * Process audio file for wake word detection
   * NOTE: This is a placeholder - you'll need to integrate with a speech recognition API
   */
  private async processAudioForWakeWord(uri: string): Promise<boolean> {
    try {
      // TODO: Integrate with speech recognition service
      // Options:
      // 1. Google Cloud Speech-to-Text
      // 2. AWS Transcribe
      // 3. Azure Speech Services
      // 4. On-device ML Kit (for offline)
      // 5. Picovoice Porcupine (specialized wake word detection)

      // For now, return false (placeholder)
      // In production, you would:
      // 1. Send audio to speech recognition API
      // 2. Get transcription text
      // 3. Check if text contains wake word
      // 4. Return true if detected

      console.log('🎤 Processing audio for wake word detection...');

      // Placeholder for API call
      // const transcription = await speechRecognitionAPI.transcribe(uri);
      // return WAKE_WORDS.some(wakeWord =>
      //   transcription.toLowerCase().includes(wakeWord)
      // );

      return false;
    } catch (error) {
      console.error('Wake word processing error:', error);
      return false;
    }
  }

  /**
   * Register callback for wake word detection
   */
  registerCallback(callback: WakeWordCallback) {
    this.callbacks.push(callback);
  }

  /**
   * Unregister callback
   */
  unregisterCallback(callback: WakeWordCallback) {
    this.callbacks = this.callbacks.filter(cb => cb !== callback);
  }

  /**
   * Notify all callbacks of wake word detection
   */
  private notifyWakeWordDetected() {
    console.log('🎯 Wake word detected!');
    this.callbacks.forEach(callback => {
      callback.onWakeWordDetected();
    });
  }

  /**
   * Notify error
   */
  private notifyError(error: string) {
    console.error('Wake word error:', error);
    this.callbacks.forEach(callback => {
      if (callback.onError) {
        callback.onError(error);
      }
    });
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      isEnabled: this.isEnabled,
      isListening: this.isListening,
      permissionGranted: this.permissionGranted,
    };
  }
}

// Singleton instance
export const wakeWordDetectionService = new WakeWordDetectionService();
export default wakeWordDetectionService;
