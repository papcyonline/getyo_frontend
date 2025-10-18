import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  color?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  currentStep,
  totalSteps,
  color
}) => {
  const theme = useSelector((state: RootState) => state.theme.theme);
  const progressColor = color || theme.accent;

  return (
    <View style={styles.container}>
      {Array.from({ length: totalSteps }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.step,
            { backgroundColor: `${theme.text}15` },
            index < currentStep && { backgroundColor: progressColor },
            index === currentStep - 1 && styles.activeStep,
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  step: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  activeStep: {
    height: 5,
  },
});

export default ProgressBar;
