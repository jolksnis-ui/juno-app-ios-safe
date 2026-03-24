import React from 'react';
import { Stack } from 'expo-router';
import { SignupProvider } from '@/contexts/SignupContext';

export default function SignupBusinessLayout() {
  return (
    <SignupProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="step-1" />
        <Stack.Screen name="step-2" />
        <Stack.Screen name="step-3" />
        <Stack.Screen name="step-4" />
        <Stack.Screen name="step-5" />
        <Stack.Screen name="step-6" />
      </Stack>
    </SignupProvider>
  );
}