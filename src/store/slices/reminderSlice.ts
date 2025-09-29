import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Reminder {
  id: string;
  userId: string;
  title: string;
  notes?: string;
  reminderTime: string;
  repeatType: 'none' | 'daily' | 'weekly' | 'monthly';
  isUrgent: boolean;
  status: 'active' | 'completed' | 'snoozed';
  createdAt: string;
  updatedAt: string;
}

interface ReminderState {
  reminders: Reminder[];
  loading: boolean;
  error: string | null;
}

const initialState: ReminderState = {
  reminders: [],
  loading: false,
  error: null,
};

const reminderSlice = createSlice({
  name: 'reminder',
  initialState,
  reducers: {
    setReminders: (state, action: PayloadAction<Reminder[]>) => {
      state.reminders = action.payload;
    },
    addReminder: (state, action: PayloadAction<Reminder>) => {
      state.reminders.push(action.payload);
    },
    updateReminder: (state, action: PayloadAction<{ id: string; updates: Partial<Reminder> }>) => {
      const { id, updates } = action.payload;
      const reminder = state.reminders.find(r => r.id === id);
      if (reminder) {
        Object.assign(reminder, updates, { updatedAt: new Date().toISOString() });
      }
    },
    deleteReminder: (state, action: PayloadAction<string>) => {
      state.reminders = state.reminders.filter(r => r.id !== action.payload);
    },
    toggleReminderStatus: (state, action: PayloadAction<string>) => {
      const reminder = state.reminders.find(r => r.id === action.payload);
      if (reminder) {
        reminder.status = reminder.status === 'completed' ? 'active' : 'completed';
        reminder.updatedAt = new Date().toISOString();
      }
    },
    snoozeReminder: (state, action: PayloadAction<{ id: string; newTime: string }>) => {
      const { id, newTime } = action.payload;
      const reminder = state.reminders.find(r => r.id === id);
      if (reminder) {
        reminder.reminderTime = newTime;
        reminder.status = 'snoozed';
        reminder.updatedAt = new Date().toISOString();
      }
    },
    setReminderLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setReminderError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },
    clearReminderError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setReminders,
  addReminder,
  updateReminder,
  deleteReminder,
  toggleReminderStatus,
  snoozeReminder,
  setReminderLoading,
  setReminderError,
  clearReminderError,
} = reminderSlice.actions;

export default reminderSlice.reducer;