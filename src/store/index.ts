import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import userReducer from './slices/userSlice';
import voiceReducer from './slices/voiceSlice';
import conversationReducer from './slices/conversationSlice';
import taskReducer from './slices/taskSlice';
import calendarReducer from './slices/calendarSlice';
import themeReducer from './slices/themeSlice';
import reminderReducer from './slices/reminderSlice';
import noteReducer from './slices/noteSlice';

// Persist configuration
const persistConfig = {
  key: 'root',
  version: 1,
  storage: AsyncStorage,
  // Whitelist reducers to persist
  whitelist: ['user', 'theme', 'task', 'calendar', 'reminder', 'note'],
  // Blacklist reducers that shouldn't persist
  blacklist: ['voice'], // Don't persist voice state (transient)
};

// User-specific persist config (don't persist sensitive auth tokens in Redux)
const userPersistConfig = {
  key: 'user',
  storage: AsyncStorage,
  // Only persist non-sensitive user data
  blacklist: ['loading', 'error'], // Don't persist loading/error states
};

// Combine reducers
const rootReducer = combineReducers({
  user: persistReducer(userPersistConfig, userReducer),
  voice: voiceReducer,
  conversation: conversationReducer,
  task: taskReducer,
  calendar: calendarReducer,
  theme: themeReducer,
  reminder: reminderReducer,
  note: noteReducer,
});

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store with persisted reducer
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          FLUSH,
          REHYDRATE,
          PAUSE,
          PERSIST,
          PURGE,
          REGISTER,
          'persist/PERSIST',
        ],
      },
    }),
});

// Create persistor
export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;