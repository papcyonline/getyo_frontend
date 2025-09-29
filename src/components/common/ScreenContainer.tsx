import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ScreenContainerProps {
  children: React.ReactNode;
  backgroundColor?: string;
  statusBarStyle?: 'light-content' | 'dark-content';
  includeStatusBarPadding?: boolean;
  includeBottomPadding?: boolean;
  style?: any;
}

export const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  backgroundColor = '#000000',
  statusBarStyle = 'light-content',
  includeStatusBarPadding = true,
  includeBottomPadding = true,
  style,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor }, style]}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={backgroundColor} />
      <View
        style={[
          styles.content,
          includeStatusBarPadding && { paddingTop: insets.top },
          includeBottomPadding && { paddingBottom: insets.bottom },
        ]}
      >
        {children}
      </View>
    </View>
  );
};

export const ScrollScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  backgroundColor = '#000000',
  statusBarStyle = 'light-content',
  includeStatusBarPadding = true,
  includeBottomPadding = true,
  style,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor }, style]}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={backgroundColor} />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});

export default ScreenContainer;