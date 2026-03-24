import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useStyles } from '@/hooks/useTheme';
import { Theme } from '@/types/theme';
import { useSignupContext } from '@/contexts/SignupContext';

interface SignupProgressProps {
  currentStep: number;
  totalSteps: number;
  stepTitle?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  showSkipButton?: boolean;
  onSkipPress?: () => void;
}

export const SignupProgress: React.FC<SignupProgressProps> = ({
  currentStep,
  totalSteps,
  stepTitle,
  showBackButton = false,
  onBackPress,
  showSkipButton = false,
  onSkipPress,
}) => {
  const styles = useStyles(createStyles);
  const { getStepTitle } = useSignupContext();
  
  // Animation values
  const progressAnim = useRef(new Animated.Value(0)).current;
  const titleFadeAnim = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    // Animate progress bar
    Animated.timing(progressAnim, {
      toValue: (currentStep - 1) / (totalSteps - 1),
      duration: 500,
      useNativeDriver: false,
    }).start();
    
    // Animate title change
    Animated.sequence([
      Animated.timing(titleFadeAnim, {
        toValue: 0.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(titleFadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentStep, totalSteps]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const displayTitle = stepTitle || getStepTitle(currentStep);

  const handleBackPress = () => {
    if (onBackPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onBackPress();
    }
  };

  const handleSkipPress = () => {
    if (onSkipPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onSkipPress();
    }
  };

  return (
    <View style={styles.container}>
      {/* Step Counter */}
      <View style={styles.stepCounter}>
        {showBackButton || showSkipButton ? (
          <View style={styles.stepCounterWithButtons}>
            {showBackButton ? (
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleBackPress}
                activeOpacity={0.7}
                hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
              >
                <Ionicons 
                  name="arrow-back" 
                  size={24} 
                  color={styles.backIcon.color} 
                />
              </TouchableOpacity>
            ) : (
              <View style={styles.buttonPlaceholder} />
            )}
            
            <Text style={styles.stepText}>
              Step {currentStep} of {totalSteps}
            </Text>
            
            {showSkipButton ? (
              <TouchableOpacity
                style={styles.skipButton}
                onPress={handleSkipPress}
                activeOpacity={0.7}
                hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
              >
                <Text style={styles.skipText}>Skip</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.buttonPlaceholder} />
            )}
          </View>
        ) : (
          <Text style={styles.stepText}>
            Step {currentStep} of {totalSteps}
          </Text>
        )}
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <Animated.View
            style={[
              styles.progressBarFill,
              {
                width: progressWidth,
              },
            ]}
          />
        </View>
        
        {/* Step Dots */}
        <View style={styles.dotsContainer}>
          {Array.from({ length: totalSteps }, (_, index) => {
            const stepNumber = index + 1;
            const isCompleted = stepNumber < currentStep;
            const isCurrent = stepNumber === currentStep;
            
            return (
              <View
                key={stepNumber}
                style={[
                  styles.stepDot,
                  isCompleted && styles.stepDotCompleted,
                  isCurrent && styles.stepDotCurrent,
                ]}
              >
                {isCompleted && (
                  <View style={styles.checkMark} />
                )}
                {isCurrent && (
                  <View style={styles.currentDotInner} />
                )}
              </View>
            );
          })}
        </View>
      </View>

      {/* Step Title */}
      {displayTitle && (
        <Animated.View
          style={[
            styles.titleContainer,
            { opacity: titleFadeAnim },
          ]}
        >
          <Text style={styles.stepTitle}>{displayTitle}</Text>
        </Animated.View>
      )}
    </View>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: theme.colors.background,
  },
  stepCounter: {
    alignItems: 'center',
    marginBottom: 16,
  },
  stepCounterWithButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 4,
  },
  backButton: {
    padding: 4,
  },
  backIcon: {
    color: theme.colors.text,
  },
  skipButton: {
    padding: 4,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  buttonPlaceholder: {
    width: 32,
    height: 32,
  },
  stepText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    letterSpacing: 0.5,
  },
  progressBarContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#00D4AA',
    borderRadius: 2,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'absolute',
    top: -6,
    left: 0,
    right: 0,
  },
  stepDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.border,
    borderWidth: 2,
    borderColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotCompleted: {
    backgroundColor: '#00D4AA',
    borderColor: theme.colors.background,
  },
  stepDotCurrent: {
    backgroundColor: theme.colors.background,
    borderColor: '#00D4AA',
    borderWidth: 3,
  },
  checkMark: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.background,
  },
  currentDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00D4AA',
  },
  titleContainer: {
    alignItems: 'center',
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});