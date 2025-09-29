import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Event } from '../../types';

interface CalendarState {
  events: Event[];
  loading: boolean;
  error: string | null;
}

const initialState: CalendarState = {
  events: [],
  loading: false,
  error: null,
};

const calendarSlice = createSlice({
  name: 'calendar',
  initialState,
  reducers: {
    setEvents: (state, action: PayloadAction<Event[]>) => {
      state.events = action.payload;
    },
    addEvent: (state, action: PayloadAction<Event>) => {
      state.events.push(action.payload);
    },
    updateEvent: (state, action: PayloadAction<{ id: string; updates: Partial<Event> }>) => {
      const { id, updates } = action.payload;
      const event = state.events.find(e => e.id === id);
      if (event) {
        Object.assign(event, updates, { updatedAt: new Date().toISOString() });
      }
    },
    deleteEvent: (state, action: PayloadAction<string>) => {
      state.events = state.events.filter(e => e.id !== action.payload);
    },
    setCalendarLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setCalendarError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },
    clearCalendarError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setEvents,
  addEvent,
  updateEvent,
  deleteEvent,
  setCalendarLoading,
  setCalendarError,
  clearCalendarError,
} = calendarSlice.actions;

export default calendarSlice.reducer;