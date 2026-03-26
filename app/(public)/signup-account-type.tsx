import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useStyles } from '@/hooks/useTheme';
import { Theme } from '@/types/theme';
import { LoginBackground } from '@/components/LoginBackground';
import { GuidelineColors, OnboardingColors } from '@/constants/guidelineColors';

interface AccountTypeOption {
  type: 'personal' | 'business';
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const accountTypes: AccountTypeOption[] = [
  {
    type: 'personal',
    title: 'Personal account',
    description: 'Send, spend, and receive money anywhere in the world.',
    icon: 'wallet-outline',
  },
  {
    type: 'business',
    title: 'Business account',
    description: 'Do business or freelance work with clients worldwide.',
    icon: 'briefcase-outline',
  },
];

export default function SignupAccountTypeScreen() {
  const styles = useStyles(createStyles);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const cardAnimations = useRef(
    accountTypes.map(() => ({
      scale: new Animated.Value(1),
      opacity: new Animated.Value(1),
    }))
  ).current;

  useEffect(() => {
    // Entry animations
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleAccountTypeSelect = (type: 'personal' | 'business', index: number) => {
    // Card press animation
    Animated.sequence([
      Animated.timing(cardAnimations[index].scale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(cardAnimations[index].scale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Navigate to appropriate signup flow
    setTimeout(() => {
      router.push(`/(public)/signup-${type}/step-1`);
    }, 150);
  };

  const handleGoBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.dismissTo('/(public)/splash');
  };

  return (
    <LoginBackground>
      <StatusBar barStyle="light-content" backgroundColor={OnboardingColors.statusBarBackground} />
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View
              style={[
                styles.contentContainer,
                {
                  opacity: fadeAnim,
                  transform: [
                    { translateY: slideAnim },
                    { scale: scaleAnim },
                  ],
                },
              ]}
            >
              <View style={styles.mainContent}>
              {/* Back Button - same as Welcome Back */}
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleGoBack}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="arrow-back" size={24} color={OnboardingColors.title} />
              </TouchableOpacity>

              {/* Title Section - left aligned per Figma */}
              <View style={styles.titleSection}>
                <Text style={styles.titleText}>Account Type</Text>
                <Text style={styles.subtitleText}>
                  Choose the account type that best suits your needs.
                </Text>
              </View>

              {/* Account Type Cards */}
              <View style={styles.cardsContainer}>
                {accountTypes.map((accountType, index) => (
                  <Animated.View
                    key={accountType.type}
                    style={[
                      styles.cardWrapper,
                      {
                        transform: [{ scale: cardAnimations[index].scale }],
                        opacity: cardAnimations[index].opacity,
                      },
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.accountCard}
                      onPress={() => handleAccountTypeSelect(accountType.type, index)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.cardArrowTop}>
                        <Ionicons
                          name="arrow-forward"
                          size={24}
                          color="#E4E4E7"
                        />
                      </View>
                      <View style={styles.cardContent}>
                        <View style={styles.cardTopRow}>
                          <View style={styles.iconContainer}>
                            <Ionicons
                              name={accountType.icon}
                              size={24}
                              color={GuidelineColors.white}
                            />
                          </View>
                        </View>
                        <View style={styles.cardTextContainer}>
                          <Text style={styles.cardTitle}>{accountType.title}</Text>
                          <Text style={styles.cardDescription}>{accountType.description}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </View>
              </View>

              {/* Login Link */}
              <View style={styles.loginSection}>
                <Text style={styles.loginText}>Already have an account?</Text>
                <TouchableOpacity onPress={() => router.push('/(public)/login')}>
                  <Text style={styles.loginLink}>Log in</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LoginBackground>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 24,
    paddingBottom: 12,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    alignItems: 'stretch',
  },
  mainContent: {
    flexGrow: 1,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 24,
    padding: 4,
  },
  titleSection: {
    alignItems: 'flex-start',
    marginBottom: 32,
    gap: 12,
  },
  titleText: {
    fontFamily: 'Inter',
    fontSize: 28,
    fontWeight: '600',
    color: GuidelineColors.white,
    letterSpacing: 0.5,
  },
  subtitleText: {
    fontSize: 16,
    color: GuidelineColors.grayIron300,
    fontWeight: '500',
    textAlign: 'left',
    lineHeight: 20,
  },
  cardsContainer: {
    flex: 1,
    gap: 8,
    marginBottom: 32,
  },
  cardWrapper: {
    marginBottom: 0,
  },
  accountCard: {
    backgroundColor: GuidelineColors.grayIron700,
    borderRadius: 8,
    borderWidth: 0,
    padding: 12,
    minHeight: 140,
    position: 'relative',
  },
  cardArrowTop: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  cardContent: {
    flex: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 48,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: GuidelineColors.grayIron800,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: GuidelineColors.white,
    marginBottom: 4,
    letterSpacing: 0,
  },
  cardDescription: {
    fontSize: 14,
    color: GuidelineColors.grayIron300,
    fontWeight: '500',
    lineHeight: 16,
  },
  loginSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingBottom: 12,
  },
  loginText: {
    fontSize: 14,
    color: OnboardingColors.mutedText,
    fontWeight: '500',
  },
  loginLink: {
    fontSize: 14,
    color: OnboardingColors.primaryText,
    fontWeight: '600',
  },
});