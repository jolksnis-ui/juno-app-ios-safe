import { Stack } from 'expo-router';

export default function PublicLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#000000' },
        gestureEnabled: true,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="splash" />
      <Stack.Screen name="login" />
      <Stack.Screen name="login-password" />
      <Stack.Screen name="login-2fa" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="forgot-password-code" />
      <Stack.Screen name="forgot-password-new-password" />
      <Stack.Screen name="forgot-password-success" />
    </Stack>
  );
}
