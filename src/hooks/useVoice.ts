import { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import VoiceService from '../services/voice/VoiceService';
import SocketService from '../services/socket';
import {
  startListening,
  stopListening,
  clearVoiceError,
  resetVoiceState,
} from '../store/slices/voiceSlice';

export const useVoice = () => {
  const dispatch = useDispatch<AppDispatch>();
  const voiceState = useSelector((state: RootState) => state.voice);

  const startVoiceRecording = useCallback(async () => {
    try {
      dispatch(clearVoiceError());

      // If socket is connected, start voice recording via socket
      if (SocketService.isConnected()) {
        await SocketService.startVoiceRecording();
      }

      // Also start local recording
      await VoiceService.startListening();
    } catch (error) {
      console.error('Failed to start voice recording:', error);
    }
  }, [dispatch]);

  const stopVoiceRecording = useCallback(async (): Promise<string | null> => {
    try {
      // Stop socket recording if connected
      if (SocketService.isConnected()) {
        await SocketService.stopVoiceRecording();
      }

      // Stop local recording and get audio URI
      const audioUri = await VoiceService.stopListening();
      return audioUri;
    } catch (error) {
      console.error('Failed to stop voice recording:', error);
      return null;
    }
  }, []);

  const processVoiceInput = useCallback(async (audioUri: string): Promise<string | null> => {
    try {
      const transcription = await VoiceService.processAudioFile(audioUri);
      return transcription;
    } catch (error) {
      console.error('Failed to process voice input:', error);
      return null;
    }
  }, []);

  const speakText = useCallback(async (text: string): Promise<void> => {
    try {
      await VoiceService.speak(text);
    } catch (error) {
      console.error('Failed to speak text:', error);
    }
  }, []);

  const stopSpeaking = useCallback(async (): Promise<void> => {
    try {
      await VoiceService.stopSpeaking();
    } catch (error) {
      console.error('Failed to stop speaking:', error);
    }
  }, []);

  const handleVoiceButtonPress = useCallback(async () => {
    if (voiceState.isListening) {
      // Stop listening and process the audio
      const audioUri = await stopVoiceRecording();
      if (audioUri) {
        const transcription = await processVoiceInput(audioUri);
        if (transcription) {
          // Handle the transcription (send to conversation, etc.)
          console.log('Transcription:', transcription);
          return transcription;
        }
      }
    } else if (voiceState.isSpeaking) {
      // Stop speaking
      await stopSpeaking();
    } else {
      // Start listening
      await startVoiceRecording();
    }
    return null;
  }, [
    voiceState.isListening,
    voiceState.isSpeaking,
    startVoiceRecording,
    stopVoiceRecording,
    processVoiceInput,
    stopSpeaking,
  ]);

  const clearError = useCallback(() => {
    dispatch(clearVoiceError());
  }, [dispatch]);

  const resetVoice = useCallback(() => {
    dispatch(resetVoiceState());
  }, [dispatch]);

  const initializeVoice = useCallback(async () => {
    try {
      await VoiceService.initialize();
    } catch (error) {
      console.error('Failed to initialize voice service:', error);
    }
  }, []);

  const cleanup = useCallback(async () => {
    try {
      await VoiceService.cleanup();
      dispatch(resetVoiceState());
    } catch (error) {
      console.error('Failed to cleanup voice service:', error);
    }
  }, [dispatch]);

  return {
    // State
    voiceState,

    // Actions
    startVoiceRecording,
    stopVoiceRecording,
    processVoiceInput,
    speakText,
    stopSpeaking,
    handleVoiceButtonPress,
    clearError,
    resetVoice,
    initializeVoice,
    cleanup,

    // Computed values
    isActive: voiceState.isListening || voiceState.isProcessing || voiceState.isSpeaking,
    canInteract: !voiceState.isProcessing,
  };
};