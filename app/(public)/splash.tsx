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
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { SvgXml } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { OnboardingColors, GuidelineColors } from '@/constants/guidelineColors';

const { width, height } = Dimensions.get('window');

// Juno wordmark: one SVG for static use; letter paths for staggered preloader (J → U → N → O)
const JUNO_LOGO_SVG = `<svg width="125" height="57" viewBox="0 0 125 57" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12.8725 0H19.9025V6.96667H12.8725V0ZM13.0625 12.35H19.7125V44.84C19.7125 51.5533 17.2425 57 10.4658 57C7.17249 57 5.08249 55.48 3.56249 54.0233L5.96915 48.5133C6.98249 49.78 7.93249 50.7933 9.64249 50.7933C12.9358 50.7933 13.0625 47.1833 13.0625 42.4967V12.35Z" fill="white"/>
<path d="M52.5429 12.3183V43.7317H45.8929V35.7517C44.4996 41.325 40.5096 44.6817 35.0629 44.6817C28.3496 44.6817 25.2462 39.425 25.2462 31.7617V12.3183H31.8962V29.4817C31.8962 35.7517 33.9229 39.045 38.4829 39.045C42.6629 39.045 45.5762 36.2583 45.8929 31.8883V12.3183H52.5429Z" fill="white"/>
<path d="M57.8867 13.2367H64.5367V21.3433C65.8667 15.7067 69.8567 12.2867 75.3667 12.2867C82.1434 12.2867 85.1834 17.5433 85.1834 25.2067V44.7133H78.5334V27.4867C78.5334 21.28 76.5067 17.9233 71.9467 17.9233C67.64 17.9233 64.7267 20.9 64.5367 25.46V44.7133H57.8867V13.2367Z" fill="white"/>
<path d="M90.5271 28.5633C90.5271 18.6833 96.7971 11.78 106.107 11.78C115.164 11.78 121.37 18.4933 121.37 28.5C121.37 38.5067 115.164 45.22 106.044 45.22C96.9237 45.22 90.5271 38.5067 90.5271 28.5633ZM97.0504 28.5633C97.0504 34.96 100.787 39.0767 105.98 39.0767C111.237 39.0767 114.847 34.96 114.847 28.5C114.847 22.1033 111.364 17.86 106.107 17.86C100.85 17.86 97.0504 22.1033 97.0504 28.5633Z" fill="white"/>
</svg>`;

const JUNO_LETTER_PATHS = [
  'M12.8725 0H19.9025V6.96667H12.8725V0ZM13.0625 12.35H19.7125V44.84C19.7125 51.5533 17.2425 57 10.4658 57C7.17249 57 5.08249 55.48 3.56249 54.0233L5.96915 48.5133C6.98249 49.78 7.93249 50.7933 9.64249 50.7933C12.9358 50.7933 13.0625 47.1833 13.0625 42.4967V12.35Z',
  'M52.5429 12.3183V43.7317H45.8929V35.7517C44.4996 41.325 40.5096 44.6817 35.0629 44.6817C28.3496 44.6817 25.2462 39.425 25.2462 31.7617V12.3183H31.8962V29.4817C31.8962 35.7517 33.9229 39.045 38.4829 39.045C42.6629 39.045 45.5762 36.2583 45.8929 31.8883V12.3183H52.5429Z',
  'M57.8867 13.2367H64.5367V21.3433C65.8667 15.7067 69.8567 12.2867 75.3667 12.2867C82.1434 12.2867 85.1834 17.5433 85.1834 25.2067V44.7133H78.5334V27.4867C78.5334 21.28 76.5067 17.9233 71.9467 17.9233C67.64 17.9233 64.7267 20.9 64.5367 25.46V44.7133H57.8867V13.2367Z',
  'M90.5271 28.5633C90.5271 18.6833 96.7971 11.78 106.107 11.78C115.164 11.78 121.37 18.4933 121.37 28.5C121.37 38.5067 115.164 45.22 106.044 45.22C96.9237 45.22 90.5271 38.5067 90.5271 28.5633ZM97.0504 28.5633C97.0504 34.96 100.787 39.0767 105.98 39.0767C111.237 39.0767 114.847 34.96 114.847 28.5C114.847 22.1033 111.364 17.86 106.107 17.86C100.85 17.86 97.0504 22.1033 97.0504 28.5633Z',
] as const;

const buildJunoLetterSvg = (pathD: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="125" height="57" viewBox="0 0 125 57" fill="none"><path d="${pathD}" fill="white"/></svg>`;

// Wave in/out: starts are close together (small stagger); each letter’s move is shorter so
// J…O still finish aligned — one line, not a long staircase.
const LOGO_LETTER_STAGGER_IN_MS = 42;
const LOGO_LETTER_IN_ALL_LAND_MS = 920;
const LOGO_LETTER_STAGGER_OUT_MS = 38;
const LOGO_LETTER_OUT_ALL_GONE_MS = 1320;
const LOGO_LETTER_START_Y = 88;

// After logo exit: wait CURTAIN_REVEAL_START_MS, then curtain STARTS sliding up for CURTAIN_TRANSLATE_DURATION_MS.
const CURTAIN_REVEAL_START_MS = 680;
const CURTAIN_TRANSLATE_DURATION_MS = 900;

// Phase 3 UI is driven by curtain position (interpolate) so copy appears as the gradient reveals.

type SplashPhase = 'logo-appear' | 'logo-scale' | 'welcome';
const HERO_TEXT = 'The new standard for global payments.';

export default function SplashScreen() {
  const [phase, setPhase] = useState<SplashPhase>('logo-appear');
  const [frontLayerVisible, setFrontLayerVisible] = useState(true);
  const [frameVisible, setFrameVisible] = useState(true);

  // Shutter layer (gradient only) moves up — welcome copy tracks this value
  const curtainTranslateY = useRef(new Animated.Value(0)).current;
  const curtainTravelPx = height * 1.08;

  // RN: inputRange non-decreasing; curtain 0 → -T, so keys run -T → 0.
  // Headline / logo / buttons: same opacity ramp [1, 0.75, 0, 0]; fade starts ~24% / ~36% / ~48% of curtain travel.
  const headlineOpacityFromCurtain = curtainTranslateY.interpolate({
    inputRange: [
      -curtainTravelPx,
      -curtainTravelPx * 0.48,
      -curtainTravelPx * 0.24,
      0,
    ],
    outputRange: [1, 0.75, 0, 0],
    extrapolate: 'clamp',
  });
  const headlineTranslateFromCurtain = curtainTranslateY.interpolate({
    inputRange: [-curtainTravelPx, -curtainTravelPx * 0.24, 0],
    outputRange: [0, 22, 22],
    extrapolate: 'clamp',
  });
  const welcomeLogoOpacityFromCurtain = curtainTranslateY.interpolate({
    inputRange: [
      -curtainTravelPx,
      -curtainTravelPx * 0.58,
      -curtainTravelPx * 0.36,
      0,
    ],
    outputRange: [1, 0.75, 0, 0],
    extrapolate: 'clamp',
  });
  const welcomeLogoTranslateFromCurtain = curtainTranslateY.interpolate({
    inputRange: [-curtainTravelPx, -curtainTravelPx * 0.36, 0],
    outputRange: [0, 18, 18],
    extrapolate: 'clamp',
  });
  const buttonsOpacityFromCurtain = curtainTranslateY.interpolate({
    inputRange: [
      -curtainTravelPx,
      -curtainTravelPx * 0.68,
      -curtainTravelPx * 0.48,
      0,
    ],
    outputRange: [1, 0.75, 0, 0],
    extrapolate: 'clamp',
  });
  const buttonsTranslateFromCurtain = curtainTranslateY.interpolate({
    inputRange: [-curtainTravelPx, -curtainTravelPx * 0.48, 0],
    outputRange: [0, 24, 24],
    extrapolate: 'clamp',
  });
  const bgScaleFromCurtain = curtainTranslateY.interpolate({
    inputRange: [-curtainTravelPx, 0],
    outputRange: [1, 1.1],
    extrapolate: 'clamp',
  });

  // Logo: J → U → N → O each rise in with stagger, then exit up with stagger (fence / wave)
  const logoLetters = useRef(
    [...JUNO_LETTER_PATHS].map(() => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(LOGO_LETTER_START_Y),
    }))
  ).current;

  useEffect(() => {
    const runAnimation = () => {
      // Phase 1: J rises, then U, N, O with tight overlap; all settle on baseline together
      const letterInAnims = logoLetters.flatMap((L, i) => {
        const delay = i * LOGO_LETTER_STAGGER_IN_MS;
        const moveDuration = Math.max(
          220,
          LOGO_LETTER_IN_ALL_LAND_MS - delay
        );
        const opacityDuration = Math.round(moveDuration * 0.92);
        return [
          Animated.timing(L.translateY, {
            toValue: 0,
            duration: moveDuration,
            delay,
            useNativeDriver: true,
            easing: Easing.out(Easing.cubic),
          }),
          Animated.timing(L.opacity, {
            toValue: 1,
            duration: opacityDuration,
            delay,
            useNativeDriver: true,
            easing: Easing.out(Easing.cubic),
          }),
        ];
      });
      Animated.parallel(letterInAnims).start(() => {
        setPhase('logo-scale');
      });
    };
    runAnimation();
  }, []);

  useEffect(() => {
    if (phase !== 'logo-scale') return;

    // Logo exit: staggered wave, all letters finish at LOGO_LETTER_OUT_ALL_GONE_MS. Curtain at CURTAIN_REVEAL_START_MS.
    let welcomeTimer: ReturnType<typeof setTimeout> | undefined;

    const holdTimer = setTimeout(() => {
      Animated.sequence([Animated.delay(20)]).start(() => {
        // Curtain / welcome while letters still exit in wave
        welcomeTimer = setTimeout(() => {
          setPhase('welcome');
        }, CURTAIN_REVEAL_START_MS);

        const letterOutAnims = logoLetters.map((L, i) => {
          const delay = i * LOGO_LETTER_STAGGER_OUT_MS;
          const duration = Math.max(
            320,
            LOGO_LETTER_OUT_ALL_GONE_MS - delay
          );
          return Animated.timing(L.translateY, {
            toValue: -200,
            duration,
            delay,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.cubic),
          });
        });
        Animated.parallel(letterOutAnims).start(({ finished }) => {
          if (finished) setFrameVisible(false);
        });

        Animated.sequence([
          Animated.delay(CURTAIN_REVEAL_START_MS),
          Animated.timing(curtainTranslateY, {
            toValue: -curtainTravelPx,
            duration: CURTAIN_TRANSLATE_DURATION_MS,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.cubic),
          }),
        ]).start(({ finished }) => {
          if (finished) {
            setFrontLayerVisible(false);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
        });
      });
    }, 20);

    return () => {
      clearTimeout(holdTimer);
      if (welcomeTimer !== undefined) clearTimeout(welcomeTimer);
    };
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
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ scale: bgScaleFromCurtain }] }]}>
        <ImageBackground
          source={require('../../assets/splash/JunoSplash.webp')}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
        <View style={styles.welcomeImageDarkOverlay} />
      </Animated.View>

      {frontLayerVisible && (
        <Animated.View
          style={[styles.frontLayer, { transform: [{ translateY: curtainTranslateY }] }]}
          pointerEvents="none"
        >
          <LinearGradient
            colors={['#26272B', '#18181B']}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
          <View style={styles.content}>
            {/* gradient shutter layer only */}
          </View>
        </Animated.View>
      )}

      {/* Fixed centered frame; only logo moves inside it */}
      {(phase === 'logo-appear' || phase === 'logo-scale') && frameVisible && (
        <View style={styles.frameOuter} pointerEvents="none">
          <Animated.View style={styles.frameInner}>
            <View style={styles.frameClip}>
              <View style={styles.logoLettersStack}>
                {JUNO_LETTER_PATHS.map((pathD, i) => (
                  <Animated.View
                    key={`juno-letter-${i}`}
                    style={[
                      styles.logoLetterLayer,
                      {
                        opacity: logoLetters[i].opacity,
                        transform: [{ translateY: logoLetters[i].translateY }],
                      },
                    ]}
                  >
                    <SvgXml xml={buildJunoLetterSvg(pathD)} width={100} height={46} />
                  </Animated.View>
                ))}
              </View>
            </View>
          </Animated.View>
        </View>
      )}

      <View style={styles.content}>

        {/* Welcome screen - JunaSplash background, logo top left, headline/body/buttons pinned to bottom */}
        {showWelcome && (
          <View style={styles.welcomeBackground}>
            {/* Content - does not scale */}
            <SafeAreaView style={styles.welcomeScreen} edges={['top', 'bottom']}>
              <View style={styles.welcomeContent}>
                <Animated.View
                  style={[
                    styles.welcomeLogoTop,
                    {
                      opacity: welcomeLogoOpacityFromCurtain,
                      transform: [{ translateY: welcomeLogoTranslateFromCurtain }],
                    },
                  ]}
                >
                  <SvgXml xml={JUNO_LOGO_SVG} width={61} height={28} />
                </Animated.View>

                <View style={styles.welcomeBottomBlock}>
                  <Animated.View
                    style={{
                      opacity: headlineOpacityFromCurtain,
                      transform: [{ translateY: headlineTranslateFromCurtain }],
                    }}
                  >
                    <Text style={styles.welcomeHeadline}>{HERO_TEXT}</Text>
                  </Animated.View>

                  <Animated.View
                    style={[
                      styles.buttonsBlock,
                      {
                        opacity: buttonsOpacityFromCurtain,
                        transform: [{ translateY: buttonsTranslateFromCurtain }],
                      },
                    ]}
                  >
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
                  </Animated.View>
                </View>
              </View>
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
  frontLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
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
    zIndex: 3,
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
  logoLettersStack: {
    width: 100,
    height: 46,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetterLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  welcomeScreen: {
    flex: 1,
    paddingHorizontal: 16,
  },
  welcomeImageDarkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(24, 24, 27, 0.16)',
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
  buttonsBlock: {
    gap: 12,
    marginTop: 40,
  },
  welcomeHeadline: {
    fontFamily: 'Inter',
    fontSize: 36,
    fontWeight: '600',
    color: OnboardingColors.title,
    letterSpacing: 0.5,
    maxWidth: '100%',
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

    fontFamily: 'Inter',

  },
});
