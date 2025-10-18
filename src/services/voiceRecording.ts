import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import apiService from './api';

class VoiceRecordingService {
  private recording: Audio.Recording | null = null;
  private isRecording: boolean = false;

  /**
   * Request microphone permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Permission request error:', error);
      return false;
    }
  }

  /**
   * Start recording audio
   */
  async startRecording(): Promise<boolean> {
    try {
      // Request permissions
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.error('Microphone permission not granted');
        return false;
      }

      // Set audio mode for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log('🎤 Starting recording...');
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      this.recording = recording;
      this.isRecording = true;
      console.log('🎤 Recording started');
      return true;
    } catch (error) {
      console.error('Failed to start recording:', error);
      this.isRecording = false;
      return false;
    }
  }

  /**
   * Stop recording and return the audio URI
   */
  async stopRecording(): Promise<string | null> {
    try {
      if (!this.recording) {
        console.error('No recording in progress');
        return null;
      }

      console.log('🛑 Stopping recording...');
      await this.recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      const uri = this.recording.getURI();
      this.recording = null;
      this.isRecording = false;

      console.log('✅ Recording stopped. URI:', uri);
      return uri;
    } catch (error) {
      console.error('Failed to stop recording:', error);
      this.recording = null;
      this.isRecording = false;
      return null;
    }
  }

  /**
   * Cancel the current recording without saving
   */
  async cancelRecording(): Promise<void> {
    try {
      if (this.recording) {
        await this.recording.stopAndUnloadAsync();
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
        });
        this.recording = null;
        this.isRecording = false;
        console.log('❌ Recording cancelled');
      }
    } catch (error) {
      console.error('Failed to cancel recording:', error);
    }
  }

  /**
   * Check if currently recording
   */
  getIsRecording(): boolean {
    return this.isRecording;
  }

  /**
   * Transcribe audio file using backend API
   */
  async transcribeAudio(audioUri: string): Promise<{ text: string; confidence: number } | null> {
    try {
      console.log('📤 Uploading audio for transcription...');

      // Use the existing transcribeAudio method from apiService
      const result = await apiService.transcribeAudio(audioUri);

      if (result && result.text) {
        console.log('✅ Transcription successful:', result.text);
        return {
          text: result.text,
          confidence: result.confidence || 0.9,
        };
      }

      console.error('Transcription failed: No text returned');
      return null;
    } catch (error) {
      console.error('Transcription error:', error);
      return null;
    }
  }

  /**
   * Record and transcribe in one operation
   * Returns the transcribed text
   */
  async recordAndTranscribe(onStart?: () => void, onStop?: () => void): Promise<string | null> {
    try {
      // Start recording
      onStart?.();
      const started = await this.startRecording();
      if (!started) {
        onStop?.();
        return null;
      }

      // Note: In real implementation, you'd stop recording after user action
      // For now, this is a placeholder that requires manual stop
      return null;
    } catch (error) {
      console.error('Record and transcribe error:', error);
      onStop?.();
      return null;
    }
  }
}

export const voiceRecordingService = new VoiceRecordingService();
export default voiceRecordingService;
