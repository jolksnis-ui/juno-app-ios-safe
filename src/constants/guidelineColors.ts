/**
 * Guideline Color System - Gray Iron palette
 * Used for onboarding screens (Enter Password, Welcome Back) and pages
 * that share the same Figma design system.
 *
 * Color values match the design guideline screenshot.
 */
export const GuidelineColors = {
  // Base palette
  white: '#FFFFFF',
  grayIron25: '#FCFCFC',
  grayIron50: '#FAFAFA',
  grayIron100: '#F4F4F5',
  grayIron200: '#E4E4E7',
  grayIron300: '#D1D1D6',
  grayIron400: '#A0A0AB',
  grayIron500: '#70707B',
  grayIron600: '#51525C',
  grayIron700: '#3F3F46',
  grayIron800: '#26272B',
  grayIron900: '#18181B',
} as const;

/** Semantic mapping for onboarding/dark screens - matches Figma styles */
export const OnboardingColors = {
  background: GuidelineColors.grayIron900,
  statusBarBackground: GuidelineColors.grayIron900,
  title: GuidelineColors.white,
  subtitle: GuidelineColors.grayIron300,
  primaryText: GuidelineColors.white,
  secondaryText: GuidelineColors.grayIron300,
  mutedText: GuidelineColors.grayIron400,
  border: GuidelineColors.grayIron600,
  inputBackground: GuidelineColors.grayIron800,
  surfaceSecondary: GuidelineColors.grayIron700,
  surfaceTertiary: GuidelineColors.grayIron800,
  buttonPrimaryBackground: GuidelineColors.white,
  buttonPrimaryText: GuidelineColors.grayIron900,
  checkboxBorder: GuidelineColors.grayIron600,
  checkboxBackground: GuidelineColors.grayIron800,
  checkboxChecked: GuidelineColors.white,
  divider: GuidelineColors.grayIron600,
} as const;
