import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import Tts from 'react-native-tts';
import RNFS from 'react-native-fs';
import { PermissionsAndroid, Platform } from 'react-native';

/**
 * Pure React Native Voice Service
 * Replaces expo-av and expo-speech with react-native-audio-recorder-player and react-native-tts
 */

class VoiceServiceRN {
  private audioRecorderPlayer: AudioRecorderPlayer;
  private recording: any = null;
  private isRecording: boolean = false;
  private isPlaying: boolean = false;
  private isSpeaking: boolean = false;

  constructor() {
    this.audioRecorderPlayer = new AudioRecorderPlayer();
    this.initializeTts();
  }

  /**
   * Initialize Text-to-Speech
   */
  private async initializeTts(): Promise<void> {
    try {
      // Initialize TTS
      await Tts.getInitStatus();

      // Set default TTS settings
      Tts.setDefaultLanguage('en-US');
      Tts.setDefaultRate(0.5);
      Tts.setDefaultPitch(1.0);

      // TTS event listeners
      Tts.addEventListener('tts-start', () => {
        this.isSpeaking = true;
        console.log('🗣️ TTS started');
      });

      Tts.addEventListener('tts-finish', () => {
        this.isSpeaking = false;
        console.log('✅ TTS finished');
      });

      Tts.addEventListener('tts-cancel', () => {
        this.isSpeaking = false;
        console.log('❌ TTS cancelled');
      });

      console.log('✅ TTS initialized');
    } catch (error) {
      console.error('❌ Failed to initialize TTS:', error);
    }
  }

  /**
   * Request microphone permission
   */
  async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'This app needs access to your microphone to record audio',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
      return true; // iOS handles permissions in Info.plist
    } catch (error) {
      console.error('❌ Failed to request permissions:', error);
      return false;
    }
  }

  /**
   * Start audio recording
   */
  async startRecording(): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.error('❌ Microphone permission not granted');
        return null;
      }

      // Recording path
      const path = Platform.select({
        ios: `${RNFS.DocumentDirectoryPath}/recording.m4a`,
        android: `${RNFS.CachesDirectoryPath}/recording.mp4`,
      }) || '';

      console.log('🎤 Starting recording at:', path);

      const uri = await this.audioRecorderPlayer.startRecorder(path);
      this.isRecording = true;

      // Set up recording meter (optional)
      this.audioRecorderPlayer.addRecordBackListener((e: any) => {
        // console.log('Recording metering:', e.currentMetering);
        return;
      });

      console.log('✅ Recording started:', uri);
      return uri;
    } catch (error) {
      console.error('❌ Failed to start recording:', error);
      return null;
    }
  }

  /**
   * Stop audio recording
   */
  async stopRecording(): Promise<string | null> {
    try {
      if (!this.isRecording) {
        console.warn('⚠️ No active recording to stop');
        return null;
      }

      const result = await this.audioRecorderPlayer.stopRecorder();
      this.audioRecorderPlayer.removeRecordBackListener();
      this.isRecording = false;

      console.log('✅ Recording stopped:', result);
      return result;
    } catch (error) {
      console.error('❌ Failed to stop recording:', error);
      return null;
    }
  }

  /**
   * Play audio file
   */
  async playSound(uri: string): Promise<void> {
    try {
      console.log('▶️ Playing audio:', uri);

      await this.audioRecorderPlayer.startPlayer(uri);
      this.isPlaying = true;

      this.audioRecorderPlayer.addPlayBackListener((e: any) => {
        if (e.currentPosition === e.duration) {
          this.stopSound();
        }
        return;
      });

      console.log('✅ Audio playback started');
    } catch (error) {
      console.error('❌ Failed to play audio:', error);
    }
  }

  /**
   * Stop audio playback
   */
  async stopSound(): Promise<void> {
    try {
      await this.audioRecorderPlayer.stopPlayer();
      this.audioRecorderPlayer.removePlayBackListener();
      this.isPlaying = false;
      console.log('⏹️ Audio playback stopped');
    } catch (error) {
      console.error('❌ Failed to stop audio:', error);
    }
  }

  /**
   * Text-to-Speech: Speak text
   */
  async speak(text: string, options?: { voice?: string; rate?: number; pitch?: number }): Promise<void> {
    try {
      console.log('🗣️ Speaking:', text);

      if (options?.rate) {
        await Tts.setDefaultRate(options.rate);
      }

      if (options?.pitch) {
        await Tts.setDefaultPitch(options.pitch);
      }

      await Tts.speak(text);
    } catch (error) {
      console.error('❌ Failed to speak:', error);
    }
  }

  /**
   * Stop TTS
   */
  async stopSpeaking(): Promise<void> {
    try {
      await Tts.stop();
      this.isSpeaking = false;
      console.log('🔇 TTS stopped');
    } catch (error) {
      console.error('❌ Failed to stop TTS:', error);
    }
  }

  /**
   * Get available TTS voices
   */
  async getAvailableVoices(): Promise<any[]> {
    try {
      const voices = await Tts.voices();
      return voices;
    } catch (error) {
      console.error('❌ Failed to get voices:', error);
      return [];
    }
  }

  /**
   * Set TTS voice
   */
  async setVoice(voiceId: string): Promise<void> {
    try {
      await Tts.setDefaultVoice(voiceId);
      console.log('✅ Voice set to:', voiceId);
    } catch (error) {
      console.error('❌ Failed to set voice:', error);
    }
  }

  /**
   * Read file as base64
   */
  async readFileAsBase64(uri: string): Promise<string | null> {
    try {
      const base64 = await RNFS.readFile(uri, 'base64');
      return base64;
    } catch (error) {
      console.error('❌ Failed to read file:', error);
      return null;
    }
  }

  /**
   * Write base64 to file
   */
  async writeBase64ToFile(base64: string, filename: string): Promise<string | null> {
    try {
      const path = `${RNFS.DocumentDirectoryPath}/${filename}`;
      await RNFS.writeFile(path, base64, 'base64');
      return path;
    } catch (error) {
      console.error('❌ Failed to write file:', error);
      return null;
    }
  }

  /**
   * Delete file
   */
  async deleteFile(uri: string): Promise<boolean> {
    try {
      await RNFS.unlink(uri);
      console.log('✅ File deleted:', uri);
      return true;
    } catch (error) {
      console.error('❌ Failed to delete file:', error);
      return false;
    }
  }

  /**
   * Get recording status
   */
  getRecordingStatus(): boolean {
    return this.isRecording;
  }

  /**
   * Get playback status
   */
  getPlaybackStatus(): boolean {
    return this.isPlaying;
  }

  /**
   * Get speaking status
   */
  getSpeakingStatus(): boolean {
    return this.isSpeaking;
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    try {
      if (this.isRecording) {
        await this.stopRecording();
      }
      if (this.isPlaying) {
        await this.stopSound();
      }
      if (this.isSpeaking) {
        await this.stopSpeaking();
      }

      // Remove TTS listeners
      Tts.removeAllListeners();

      console.log('✅ Voice service cleaned up');
    } catch (error) {
      console.error('❌ Failed to cleanup:', error);
    }
  }
}

export const voiceServiceRN = new VoiceServiceRN();
export default voiceServiceRN;
