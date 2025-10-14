import { Audio } from 'expo-av';
import ApiService from './api';

export interface TranscriptionSegment {
  id: string;
  text: string;
  speaker?: string;
  timestamp: number;
  confidence: number;
}

export interface TranscriptionResult {
  segments: TranscriptionSegment[];
  fullText: string;
  duration: number;
  language?: string;
}

interface TranscriptionCallback {
  onSegmentReceived: (segment: TranscriptionSegment) => void;
  onTranscriptionComplete: (result: TranscriptionResult) => void;
  onError: (error: string) => void;
}

class TranscriptionService {
  private recording: Audio.Recording | null = null;
  private isTranscribing: boolean = false;
  private segments: TranscriptionSegment[] = [];
  private callbacks: TranscriptionCallback[] = [];
  private startTime: number = 0;
  private transcriptionInterval: NodeJS.Timeout | null = null;

  /**
   * Start transcription
   */
  async startTranscription() {
    if (this.isTranscribing) {
      console.warn('Transcription already in progress');
      return;
    }

    try {
      // Request permissions
      const {status} = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        this.notifyError('Microphone permission required');
        return;
      }

      // Setup audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Start recording
      this.recording = new Audio.Recording();
      await this.recording.prepareToRecordAsync({
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
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      });

      await this.recording.startAsync();
      this.isTranscribing = true;
      this.startTime = Date.now();
      this.segments = [];

      // Start real-time processing
      this.startRealTimeProcessing();

      console.log('✅ Transcription started');
    } catch (error) {
      console.error('Failed to start transcription:', error);
      this.notifyError('Failed to start transcription');
    }
  }

  /**
   * Stop transcription
   */
  async stopTranscription(): Promise<TranscriptionResult | null> {
    if (!this.isTranscribing || !this.recording) {
      return null;
    }

    try {
      // Stop real-time processing
      if (this.transcriptionInterval) {
        clearInterval(this.transcriptionInterval);
        this.transcriptionInterval = null;
      }

      // Stop recording
      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();

      this.isTranscribing = false;

      // Process final audio
      if (uri) {
        await this.processFinalAudio(uri);
      }

      // Create result
      const result: TranscriptionResult = {
        segments: this.segments,
        fullText: this.segments.map(s => s.text).join(' '),
        duration: Date.now() - this.startTime,
      };

      this.notifyTranscriptionComplete(result);

      console.log('✅ Transcription stopped');
      return result;
    } catch (error) {
      console.error('Failed to stop transcription:', error);
      this.notifyError('Failed to stop transcription');
      return null;
    }
  }

  /**
   * Start real-time processing (send chunks for transcription)
   */
  private startRealTimeProcessing() {
    // Process audio every 5 seconds for real-time feedback
    this.transcriptionInterval = setInterval(async () => {
      await this.processCurrentAudio();
    }, 5000);
  }

  /**
   * Process current audio chunk
   */
  private async processCurrentAudio() {
    if (!this.recording) return;

    try {
      const status = await this.recording.getStatusAsync();

      if (status.isRecording && status.durationMillis > 3000) {
        // Get current audio URI (this is a simplified version)
        // In production, you'd need to implement chunk extraction
        console.log('🎤 Processing audio chunk...');

        // TODO: Send audio chunk to transcription API
        // This is a placeholder for the actual API call
        const transcription = await this.transcribeAudioChunk();

        if (transcription) {
          const segment: TranscriptionSegment = {
            id: `segment_${Date.now()}`,
            text: transcription.text,
            speaker: transcription.speaker,
            timestamp: Date.now() - this.startTime,
            confidence: transcription.confidence || 0.9,
          };

          this.segments.push(segment);
          this.notifySegmentReceived(segment);
        }
      }
    } catch (error) {
      console.error('Audio processing error:', error);
    }
  }

  /**
   * Process final audio file
   */
  private async processFinalAudio(uri: string) {
    try {
      console.log('🎤 Processing final audio...');

      // TODO: Send complete audio to transcription API for final processing
      // This would include speaker diarization and improved accuracy
      const finalTranscription = await this.transcribeFinalAudio(uri);

      if (finalTranscription && finalTranscription.segments) {
        // Replace segments with final, more accurate transcription
        this.segments = finalTranscription.segments;
      }
    } catch (error) {
      console.error('Final audio processing error:', error);
    }
  }

  /**
   * Transcribe audio chunk (real-time)
   * NOTE: This is a placeholder - integrate with your transcription API
   */
  private async transcribeAudioChunk(): Promise<any> {
    try {
      // TODO: Integrate with transcription API
      // Options:
      // 1. Google Cloud Speech-to-Text (Streaming API)
      // 2. AWS Transcribe (Streaming)
      // 3. Azure Speech Services (Real-time)
      // 4. AssemblyAI (Real-time transcription)
      // 5. Deepgram (Real-time + speaker diarization)
      // 6. Rev.ai (Real-time)

      // Example API call structure:
      /*
      const response = await fetch('YOUR_TRANSCRIPTION_API_ENDPOINT', {
        method: 'POST',
        headers: {
          'Content-Type': 'audio/wav',
          'Authorization': 'Bearer YOUR_API_KEY',
        },
        body: audioChunk,
      });

      const data = await response.json();
      return {
        text: data.transcript,
        speaker: data.speaker_label,
        confidence: data.confidence,
      };
      */

      // Placeholder return
      return {
        text: '[Real-time transcription would appear here]',
        speaker: 'Speaker 1',
        confidence: 0.9,
      };
    } catch (error) {
      console.error('Transcription API error:', error);
      return null;
    }
  }

  /**
   * Transcribe complete audio file
   */
  private async transcribeFinalAudio(uri: string): Promise<any> {
    try {
      // TODO: Send complete audio file to backend for transcription
      // Backend should handle:
      // 1. Audio format conversion if needed
      // 2. Call to transcription API
      // 3. Speaker diarization
      // 4. Punctuation and formatting
      // 5. Confidence scores

      /*
      const formData = new FormData();
      formData.append('audio', {
        uri,
        type: 'audio/m4a',
        name: 'meeting-recording.m4a',
      });

      const response = await ApiService.transcribeAudio(formData);
      return response;
      */

      // Placeholder return
      return {
        segments: this.segments,
        fullText: this.segments.map(s => s.text).join(' '),
      };
    } catch (error) {
      console.error('Final transcription error:', error);
      return null;
    }
  }

  /**
   * Get current transcription status
   */
  getStatus() {
    return {
      isTranscribing: this.isTranscribing,
      segmentCount: this.segments.length,
      duration: this.isTranscribing ? Date.now() - this.startTime : 0,
    };
  }

  /**
   * Get all segments
   */
  getSegments(): TranscriptionSegment[] {
    return this.segments;
  }

  /**
   * Get full text
   */
  getFullText(): string {
    return this.segments.map(s => s.text).join(' ');
  }

  /**
   * Clear segments
   */
  clearSegments() {
    this.segments = [];
  }

  /**
   * Register callback
   */
  registerCallback(callback: TranscriptionCallback) {
    this.callbacks.push(callback);
  }

  /**
   * Unregister callback
   */
  unregisterCallback(callback: TranscriptionCallback) {
    this.callbacks = this.callbacks.filter(cb => cb !== callback);
  }

  /**
   * Notify callbacks
   */
  private notifySegmentReceived(segment: TranscriptionSegment) {
    this.callbacks.forEach(callback => {
      callback.onSegmentReceived(segment);
    });
  }

  private notifyTranscriptionComplete(result: TranscriptionResult) {
    this.callbacks.forEach(callback => {
      callback.onTranscriptionComplete(result);
    });
  }

  private notifyError(error: string) {
    this.callbacks.forEach(callback => {
      callback.onError(error);
    });
  }
}

// Singleton instance
export const transcriptionService = new TranscriptionService();
export default transcriptionService;
