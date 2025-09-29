import { AppTheme } from '../types';

export const darkTheme: AppTheme = {
  background: '#000000',
  surface: '#1A1A1A',
  surfaceSecondary: '#2D2D2D',
  text: '#FFFFFF',
  textSecondary: '#CCCCCC',
  textTertiary: '#999999',
  accent: '#C9A96E',
  accentSecondary: '#E5C794',
  border: '#333333',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#C9A96E',
};

export const lightTheme: AppTheme = {
  background: '#FFFFFF',
  surface: '#F5F5F5',
  surfaceSecondary: '#EEEEEE',
  text: '#000000',
  textSecondary: '#666666',
  textTertiary: '#999999',
  accent: '#C9A96E',
  accentSecondary: '#E5C794',
  border: '#E0E0E0',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#C9A96E',
};

export const getTheme = (isDark: boolean): AppTheme => {
  return isDark ? darkTheme : lightTheme;
};