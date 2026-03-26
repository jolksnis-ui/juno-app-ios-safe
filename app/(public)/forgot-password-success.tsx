import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Animated,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Theme, darkTheme } from '@/types/theme';
import { OnboardingColors } from '@/constants/guidelineColors';
import { LoginBackground } from '@/components/LoginBackground';

export default function ForgotPasswordSuccessScreen() {
  const styles = createStyles(darkTheme);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }),
    ]).start();
  }, []);

  const handleSignIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace('/(public)/login');
  };

  return (
    <LoginBackground>
      <StatusBar barStyle="light-content" backgroundColor={OnboardingColors.statusBarBackground} />
      <SafeAreaView style={styles.container}>
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.iconContainer}>
            <Ionicons
              name="checkmark-circle"
              size={80}
              color={OnboardingColors.checkboxChecked}
            />
          </View>

          <View style={styles.textSection}>
            <Text style={styles.titleText}>Password reset</Text>
            <Text style={styles.subtitleText}>
              You can now sign in with your new password.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.signInButton}
            onPress={handleSignIn}
            activeOpacity={0.8}
          >
            <Text style={styles.signInText}>Sign in</Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </LoginBackground>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },
    content: {
      width: '100%',
      maxWidth: 400,
      alignItems: 'center',
    },
    iconContainer: {
      marginBottom: 32,
    },
    textSection: {
      alignItems: 'center',
      marginBottom: 32,
      gap: 12,
    },
    titleText: {
      fontFamily: 'Inter',
      fontSize: 28,
      fontWeight: '600',
      color: OnboardingColors.title,
      letterSpacing: 0.5,
      textAlign: 'center',
    },
    subtitleText: {
      fontSize: 16,
      color: OnboardingColors.subtitle,
      fontWeight: '500',
      lineHeight: 24,
      textAlign: 'center',
    },
    signInButton: {
      width: '100%',
      height: 56,
      paddingHorizontal: 32,
      borderRadius: 8,
      backgroundColor: OnboardingColors.buttonPrimaryBackground,
      alignItems: 'center',
      justifyContent: 'center',
    },
    signInText: {
      fontSize: 16,
      fontWeight: '600',
      color: OnboardingColors.buttonPrimaryText,
      letterSpacing: 0.5,
    },
  });
