import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../../types';

interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  user: null,
  isAuthenticated: false,
  hasCompletedOnboarding: false,
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.error = null;
    },
    updateUserPreferences: (state, action: PayloadAction<Partial<User['preferences']>>) => {
      if (state.user) {
        state.user.preferences = { ...state.user.preferences, ...action.payload };
      }
    },
    completeOnboarding: (state) => {
      state.hasCompletedOnboarding = true;
    },
    clearUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      // Keep hasCompletedOnboarding as is - users who completed onboarding should go to login, not onboarding
      state.error = null;
    },
    setUserLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setUserError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },
    clearUserError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setUser,
  updateUserPreferences,
  completeOnboarding,
  clearUser,
  setUserLoading,
  setUserError,
  clearUserError,
} = userSlice.actions;

export default userSlice.reducer;