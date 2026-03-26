// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Path aliases (merge so we don't drop Expo defaults)
config.resolver.alias = {
  ...(config.resolver.alias ?? {}),
  '@': path.resolve(__dirname, 'src'),
};

// Expo's default Metro config only lists ios/android; web needs `web` for `.web.*` resolution
// and `expo export --platform web` (see react-native Platform resolution on web).
config.resolver.platforms = ['ios', 'android', 'web'];

module.exports = config;
