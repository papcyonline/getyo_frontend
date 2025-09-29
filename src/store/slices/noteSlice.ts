import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  category: 'personal' | 'work' | 'idea' | 'urgent';
  wordCount: number;
  charCount: number;
  createdAt: string;
  updatedAt: string;
}

interface NoteState {
  notes: Note[];
  loading: boolean;
  error: string | null;
}

const initialState: NoteState = {
  notes: [],
  loading: false,
  error: null,
};

const noteSlice = createSlice({
  name: 'note',
  initialState,
  reducers: {
    setNotes: (state, action: PayloadAction<Note[]>) => {
      state.notes = action.payload;
    },
    addNote: (state, action: PayloadAction<Note>) => {
      state.notes.push(action.payload);
    },
    updateNote: (state, action: PayloadAction<{ id: string; updates: Partial<Note> }>) => {
      const { id, updates } = action.payload;
      const note = state.notes.find(n => n.id === id);
      if (note) {
        Object.assign(note, updates, { updatedAt: new Date().toISOString() });
      }
    },
    deleteNote: (state, action: PayloadAction<string>) => {
      state.notes = state.notes.filter(n => n.id !== action.payload);
    },
    setNoteLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setNoteError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },
    clearNoteError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setNotes,
  addNote,
  updateNote,
  deleteNote,
  setNoteLoading,
  setNoteError,
  clearNoteError,
} = noteSlice.actions;

export default noteSlice.reducer;