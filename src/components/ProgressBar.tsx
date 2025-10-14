import React from 'react';
import { View, StyleSheet } from 'react-native';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  color?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  currentStep,
  totalSteps,
  color = '#3396D3'
}) => {
  return (
    <View style={styles.container}>
      {Array.from({ length: totalSteps }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.step,
            index < currentStep && { backgroundColor: color },
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
    backgroundColor: 'rgba(255, 247, 245, 0.15)',
    borderRadius: 2,
  },
  activeStep: {
    height: 5,
  },
});

export default ProgressBar;
