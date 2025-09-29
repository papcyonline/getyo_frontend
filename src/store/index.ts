import { configureStore } from '@reduxjs/toolkit';
import userReducer from './slices/userSlice';
import voiceReducer from './slices/voiceSlice';
import conversationReducer from './slices/conversationSlice';
import taskReducer from './slices/taskSlice';
import calendarReducer from './slices/calendarSlice';
import themeReducer from './slices/themeSlice';
import reminderReducer from './slices/reminderSlice';
import noteReducer from './slices/noteSlice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    voice: voiceReducer,
    conversation: conversationReducer,
    task: taskReducer,
    calendar: calendarReducer,
    theme: themeReducer,
    reminder: reminderReducer,
    note: noteReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;