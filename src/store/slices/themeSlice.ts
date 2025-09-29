import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppTheme } from '../../types';
import { darkTheme, lightTheme } from '../../utils/theme';

interface ThemeState {
  isDark: boolean;
  theme: AppTheme;
}

const initialState: ThemeState = {
  isDark: true,
  theme: darkTheme,
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.isDark = !state.isDark;
      state.theme = state.isDark ? darkTheme : lightTheme;
    },
    setTheme: (state, action: PayloadAction<boolean>) => {
      state.isDark = action.payload;
      state.theme = state.isDark ? darkTheme : lightTheme;
    },
  },
});

export const { toggleTheme, setTheme } = themeSlice.actions;
export default themeSlice.reducer;