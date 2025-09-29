import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import * as FileSystem from 'expo-file-system';
import { store } from '../../store';
import {
  startListening,
  stopListening,
  startProcessing,
  stopProcessing,
  startSpeaking,
  stopSpeaking,
  setVoiceError,
  setAudioLevel,
} from '../../store/slices/voiceSlice';
import ApiService from '../api';
import SocketService from '../socket';

class VoiceService {
  private recording: Audio.Recording | null = null;
  private isInitialized = false;
  private wakeWordDetector: any = null;
  private audioContext: any = null;

  async initialize() {
    try {
      // Request audio permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Audio permissions not granted');
      }

      // Configure audio session
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: true,
      });

      this.isInitialized = true;
      console.log('Voice service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize voice service:', error);
      store.dispatch(setVoiceError('Failed to initialize voice service'));
      throw error;
    }
  }

  async startListening(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Stop any existing recording
      if (this.recording) {
        await this.stopListening();
      }

      store.dispatch(startListening());

      this.recording = new Audio.Recording();
      await this.recording.prepareToRecordAsync({
        android: {
          extension: '.wav',
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_DEFAULT,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_DEFAULT,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.wav',
          outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_LINEARPCM,
          audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
      });

      await this.recording.startAsync();

      // Set up audio level monitoring
      this.recording.setOnRecordingStatusUpdate((status) => {
        if (status.metering !== undefined) {
          // Normalize metering level (typically -160 to 0)
          const normalizedLevel = Math.max(0, (status.metering + 160) / 160);
          store.dispatch(setAudioLevel(normalizedLevel));
        }
      });

      console.log('Started listening for voice input');
    } catch (error) {
      console.error('Failed to start listening:', error);
      store.dispatch(setVoiceError('Failed to start listening'));
      throw error;
    }
  }

  async stopListening(): Promise<string | null> {
    try {
      if (!this.recording) {
        return null;
      }

      store.dispatch(stopListening());
      store.dispatch(startProcessing());

      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      this.recording = null;

      store.dispatch(setAudioLevel(0));

      console.log('Stopped listening, audio saved to:', uri);
      return uri;
    } catch (error) {
      console.error('Failed to stop listening:', error);
      store.dispatch(setVoiceError('Failed to stop listening'));
      throw error;
    }
  }

  async processAudioFile(audioUri: string): Promise<string> {
    try {
      // First try Socket.IO real-time processing (preferred method)
      if (SocketService.isConnected()) {
        return await this.processVoiceViaSocket(audioUri);
      }

      // Fallback to HTTP API if socket is not connected
      return await this.processVoiceViaAPI(audioUri);
    } catch (error) {
      console.error('Failed to process audio:', error);
      store.dispatch(setVoiceError('Failed to process audio'));
      store.dispatch(stopProcessing());
      throw error;
    }
  }

  private async processVoiceViaSocket(audioUri: string): Promise<string> {
    try {
      console.log('Processing voice via Socket.IO...');

      // Read audio file as base64
      const audioData = await FileSystem.readAsStringAsync(audioUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Convert base64 to buffer (this is simplified - you might need a proper conversion)
      const buffer = Buffer.from(audioData, 'base64');

      // Send audio data via socket
      await SocketService.sendVoiceData(buffer);

      // Return a promise that resolves when we get the transcription
      // The actual transcription will be handled by socket event listeners
      // For now, return a placeholder - the real transcription comes via socket events
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Voice processing timeout'));
        }, 30000); // 30 second timeout

        // Listen for transcription result
        const handleTranscription = (transcription: string) => {
          clearTimeout(timeout);
          store.dispatch(stopProcessing());
          resolve(transcription);
        };

        // Store the resolver for the socket service to call
        (this as any)._transcriptionResolver = handleTranscription;
      });
    } catch (error) {
      console.error('Socket voice processing failed:', error);
      throw error;
    }
  }

  private async processVoiceViaAPI(audioUri: string): Promise<string> {
    try {
      console.log('Processing voice via API...');

      // Create FormData for file upload
      const formData = new FormData();

      // Read audio file info
      const fileInfo = await FileSystem.getInfoAsync(audioUri);
      if (!fileInfo.exists) {
        throw new Error('Audio file does not exist');
      }

      // Append file to FormData
      const audioFile = {
        uri: audioUri,
        type: 'audio/wav',
        name: 'recording.wav',
      } as any;

      formData.append('audio', audioFile);

      // Send to backend for processing
      const result = await ApiService.processVoiceInput(formData);

      store.dispatch(stopProcessing());

      return result.transcription || 'No transcription available';
    } catch (error) {
      console.error('API voice processing failed:', error);
      throw error;
    }
  }

  // Method called by socket service when transcription is received
  handleTranscriptionResult(transcription: string): void {
    if ((this as any)._transcriptionResolver) {
      (this as any)._transcriptionResolver(transcription);
      (this as any)._transcriptionResolver = null;
    }
  }

  async speak(text: string): Promise<void> {
    try {
      store.dispatch(startSpeaking());

      // Check if speech is available
      const isAvailable = await Speech.isSpeakingAsync();
      if (isAvailable) {
        await Speech.stop();
      }

      await Speech.speak(text, {
        language: 'en-US',
        pitch: 1.0,
        rate: 0.9,
        quality: Speech.VoiceQuality.Enhanced,
        onDone: () => {
          store.dispatch(stopSpeaking());
        },
        onError: (error) => {
          console.error('Speech error:', error);
          store.dispatch(stopSpeaking());
          store.dispatch(setVoiceError('Failed to speak text'));
        },
      });

      console.log('Started speaking:', text.substring(0, 50) + '...');
    } catch (error) {
      console.error('Failed to speak:', error);
      store.dispatch(stopSpeaking());
      store.dispatch(setVoiceError('Failed to speak text'));
      throw error;
    }
  }

  async stopSpeaking(): Promise<void> {
    try {
      await Speech.stop();
      store.dispatch(stopSpeaking());
      console.log('Stopped speaking');
    } catch (error) {
      console.error('Failed to stop speaking:', error);
      throw error;
    }
  }

  // Wake word detection (simplified - in production use a proper wake word detection library)
  startWakeWordDetection(wakeWord: string = 'yo'): void {
    // This is a placeholder for wake word detection
    // In a real app, you'd use a library like Porcupine or similar
    console.log(`Started wake word detection for: "${wakeWord}"`);
  }

  stopWakeWordDetection(): void {
    console.log('Stopped wake word detection');
  }

  // Clean up resources
  async cleanup(): Promise<void> {
    try {
      if (this.recording) {
        await this.recording.stopAndUnloadAsync();
        this.recording = null;
      }

      await Speech.stop();
      this.stopWakeWordDetection();

      console.log('Voice service cleaned up');
    } catch (error) {
      console.error('Failed to cleanup voice service:', error);
    }
  }
}

export default new VoiceService();