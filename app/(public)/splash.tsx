import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  StatusBar,
  Dimensions,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { SvgXml } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { OnboardingColors, GuidelineColors } from '@/constants/guidelineColors';

const { width, height } = Dimensions.get('window');
const SCREEN_DIAGONAL = Math.sqrt(width * width + height * height);

// Juno logo from Figma (node 1-1177) - white text, no dot in SVG (dot added separately)
const JUNO_LOGO_SVG = `<svg width="125" height="57" viewBox="0 0 125 57" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12.8725 0H19.9025V6.96667H12.8725V0ZM13.0625 12.35H19.7125V44.84C19.7125 51.5533 17.2425 57 10.4658 57C7.17249 57 5.08249 55.48 3.56249 54.0233L5.96915 48.5133C6.98249 49.78 7.93249 50.7933 9.64249 50.7933C12.9358 50.7933 13.0625 47.1833 13.0625 42.4967V12.35Z" fill="white"/>
<path d="M52.5429 12.3183V43.7317H45.8929V35.7517C44.4996 41.325 40.5096 44.6817 35.0629 44.6817C28.3496 44.6817 25.2462 39.425 25.2462 31.7617V12.3183H31.8962V29.4817C31.8962 35.7517 33.9229 39.045 38.4829 39.045C42.6629 39.045 45.5762 36.2583 45.8929 31.8883V12.3183H52.5429Z" fill="white"/>
<path d="M57.8867 13.2367H64.5367V21.3433C65.8667 15.7067 69.8567 12.2867 75.3667 12.2867C82.1434 12.2867 85.1834 17.5433 85.1834 25.2067V44.7133H78.5334V27.4867C78.5334 21.28 76.5067 17.9233 71.9467 17.9233C67.64 17.9233 64.7267 20.9 64.5367 25.46V44.7133H57.8867V13.2367Z" fill="white"/>
<path d="M90.5271 28.5633C90.5271 18.6833 96.7971 11.78 106.107 11.78C115.164 11.78 121.37 18.4933 121.37 28.5C121.37 38.5067 115.164 45.22 106.044 45.22C96.9237 45.22 90.5271 38.5067 90.5271 28.5633ZM97.0504 28.5633C97.0504 34.96 100.787 39.0767 105.98 39.0767C111.237 39.0767 114.847 34.96 114.847 28.5C114.847 22.1033 111.364 17.86 106.107 17.86C100.85 17.86 97.0504 22.1033 97.0504 28.5633Z" fill="white"/>
</svg>`;

type SplashPhase = 'logo-appear' | 'logo-scale' | 'welcome';

export default function SplashScreen() {
  const [phase, setPhase] = useState<SplashPhase>('logo-appear');

  // Logo animation: starts below frame (opacity 0), slides up into frame (opacity 1), then frame+logo scale and fade out
  const logoTranslateY = useRef(new Animated.Value(60)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const frameScale = useRef(new Animated.Value(1)).current;
  const frameOpacity = useRef(new Animated.Value(1)).current;

  // Point behind frame - #131316, starts 1px with opacity 0, expands when frame fades
  const pointScale = useRef(new Animated.Value(1 / 80)).current; // 1 pixel from 80px base
  const pointOpacity = useRef(new Animated.Value(0)).current;

  // Welcome screen - same as Welcome Back: fade + slide from right + slide up + scale
  const welcomeOpacity = useRef(new Animated.Value(0)).current;
  const welcomeSlideX = useRef(new Animated.Value(40)).current; // right to left
  const welcomeSlideY = useRef(new Animated.Value(30)).current; // bottom to top
  const welcomeScale = useRef(new Animated.Value(0.9)).current;

  // Background image - starts at 120%, zooms down to 100% (approach effect)
  const bgImageScale = useRef(new Animated.Value(1.2)).current;

  useEffect(() => {
    const runAnimation = () => {
      // Phase 1: Logo slides up from below frame into center, fades in (opacity 0 -> 1)
      Animated.parallel([
        Animated.timing(logoTranslateY, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setPhase('logo-scale');
      });
    };
    runAnimation();
  }, []);

  useEffect(() => {
    if (phase !== 'logo-scale') return;

    // Phase 2: Frame + logo scale up and fade out, WHILE black circle expands from center - all at the same time
    const dotSize = 80;
    const scaleToFillScreen = (SCREEN_DIAGONAL * 1.2) / dotSize;

    Animated.parallel([
      // Frame + logo scale up and lose opacity
      Animated.timing(frameScale, {
        toValue: 8,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(frameOpacity, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
      // Point expands from 1px and fades in at same time
      Animated.parallel([
        Animated.timing(pointScale, {
          toValue: scaleToFillScreen,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pointOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setPhase('welcome');
    });
  }, [phase]);

  useEffect(() => {
    if (phase !== 'welcome') return;

    // Phase 3: Content animates in + background zooms (approach effect)
    Animated.parallel([
      // Content: same as Welcome Back - fade + slide right-to-left + slide bottom-to-top + scale
      Animated.timing(welcomeOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(welcomeSlideX, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(welcomeSlideY, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(welcomeScale, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      // Background: scale from 120% down to 100% (creates approach/zoom-out effect)
      Animated.timing(bgImageScale, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [phase]);

  const handleGetStarted = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(public)/signup-account-type');
  };

  const handleLogIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(public)/login');
  };

  const showWelcome = phase === 'welcome';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={GuidelineColors.grayIron900} />
      {/* Splash zero background - dark gradient */}
      <LinearGradient
        colors={['#26272B', '#18181B']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      <View style={styles.content}>
        {/* Invisible point (#131316) behind frame - same center, expands when frame fades */}
        {(phase === 'logo-appear' || phase === 'logo-scale' || phase === 'welcome') && (
          <Animated.View
            style={[
              styles.pointBehindFrame,
              {
                opacity: pointOpacity,
                transform: [{ scale: pointScale }],
              },
            ]}
            pointerEvents="none"
          />
        )}

        {/* Frame with clip content - centered, logo slides up from below into it */}
        {(phase === 'logo-appear' || phase === 'logo-scale') && (
          <View style={styles.frameOuter} pointerEvents="none">
            <Animated.View
              style={[
                styles.frameInner,
                {
                  opacity: frameOpacity,
                  transform: [{ scale: frameScale }],
                },
              ]}
            >
              <View style={styles.frameClip}>
                <Animated.View
                  style={[
                    styles.logoInFrame,
                    {
                      opacity: logoOpacity,
                      transform: [{ translateY: logoTranslateY }],
                    },
                  ]}
                >
                  <SvgXml xml={JUNO_LOGO_SVG} width={100} height={46} />
                </Animated.View>
              </View>
            </Animated.View>
          </View>
        )}

        {/* Welcome screen - JunaSplash background, logo top left, headline/body/buttons pinned to bottom */}
        {showWelcome && (
          <View style={styles.welcomeBackground}>
            {/* Background image - scales from 120% to 100% (approach effect) */}
            <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ scale: bgImageScale }] }]}>
              <ImageBackground
                source={require('../../assets/splash/JunaSplash.png')}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
              />
            </Animated.View>
            {/* Content - does not scale */}
            <SafeAreaView style={styles.welcomeScreen} edges={['top', 'bottom']}>
              <Animated.View
                style={[
                  styles.welcomeContent,
                  {
                    opacity: welcomeOpacity,
                  transform: [
                    { translateX: welcomeSlideX },
                    { translateY: welcomeSlideY },
                    { scale: welcomeScale },
                  ],
                  },
                ]}
              >
                {/* Juno logo - top left, 28px height */}
                <View style={styles.welcomeLogoTop}>
                  <SvgXml xml={JUNO_LOGO_SVG} width={61} height={28} />
                </View>

                {/* Headline, body, buttons - pinned to bottom */}
                <View style={styles.welcomeBottomBlock}>
                  <View style={styles.welcomeTextSection}>
                    <Text style={styles.welcomeHeadline}>Juno for people and companies</Text>
                    <Text style={styles.welcomeBody}>The new standard of banking.</Text>
                  </View>

                  <View style={styles.buttonsBlock}>
                    <TouchableOpacity
                      style={styles.getStartedButton}
                      onPress={handleGetStarted}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.getStartedText}>Get started</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.loginButton}
                      onPress={handleLogIn}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.loginButtonText}>Log in</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Animated.View>
            </SafeAreaView>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GuidelineColors.grayIron900,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 72,
    paddingBottom: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  frameOuter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frameInner: {
    width: 160,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frameClip: {
    width: 160,
    height: 90,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoInFrame: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointBehindFrame: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#131316',
    top: height / 2 - 40,
    left: width / 2 - 40,
  },
  welcomeBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  welcomeScreen: {
    flex: 1,
    paddingHorizontal: 16,
  },
  welcomeContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  welcomeLogoTop: {
    alignSelf: 'flex-start',
    paddingTop: 24,
  },
  welcomeBottomBlock: {
    paddingBottom: 24,
  },
  welcomeTextSection: {
    gap: 12,
    marginBottom: 40,
  },
  buttonsBlock: {
    gap: 12,
  },
  welcomeHeadline: {
    fontFamily: 'StagnanRegular',
    fontSize: 48,
    fontWeight: '700',
    color: OnboardingColors.title,
    letterSpacing: 0.5,
  },
  welcomeBody: {
    fontSize: 18,
    color: GuidelineColors.grayIron300,
    fontWeight: '500',
    lineHeight: 24,
  },
  getStartedButton: {
    width: '100%',
    height: 56,
    paddingHorizontal: 32,
    borderRadius: 8,
    backgroundColor: OnboardingColors.buttonPrimaryBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  getStartedText: {
    fontSize: 16,
    fontWeight: '600',
    color: OnboardingColors.buttonPrimaryText,
    letterSpacing: 0.5,
  },
  loginButton: {
    width: '100%',
    height: 56,
    paddingHorizontal: 32,
    borderRadius: 8,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: GuidelineColors.grayIron600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: GuidelineColors.white,
    letterSpacing: 0.5,
  },
});
