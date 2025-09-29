import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { VoiceState } from '../../types';

const initialState: VoiceState = {
  isListening: false,
  isProcessing: false,
  isSpeaking: false,
  audioLevel: 0,
  error: undefined,
};

const voiceSlice = createSlice({
  name: 'voice',
  initialState,
  reducers: {
    startListening: (state) => {
      state.isListening = true;
      state.error = undefined;
    },
    stopListening: (state) => {
      state.isListening = false;
    },
    startProcessing: (state) => {
      state.isProcessing = true;
      state.isListening = false;
    },
    stopProcessing: (state) => {
      state.isProcessing = false;
    },
    startSpeaking: (state) => {
      state.isSpeaking = true;
    },
    stopSpeaking: (state) => {
      state.isSpeaking = false;
    },
    setAudioLevel: (state, action: PayloadAction<number>) => {
      state.audioLevel = action.payload;
    },
    setVoiceError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isListening = false;
      state.isProcessing = false;
      state.isSpeaking = false;
    },
    clearVoiceError: (state) => {
      state.error = undefined;
    },
    resetVoiceState: (state) => {
      return initialState;
    },
  },
});

export const {
  startListening,
  stopListening,
  startProcessing,
  stopProcessing,
  startSpeaking,
  stopSpeaking,
  setAudioLevel,
  setVoiceError,
  clearVoiceError,
  resetVoiceState,
} = voiceSlice.actions;

export default voiceSlice.reducer;