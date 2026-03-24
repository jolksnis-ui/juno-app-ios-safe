import { Stack } from 'expo-router';
import { Redirect } from 'expo-router';
import { useAuthContext } from '@/contexts/AuthContext';

export default function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuthContext();

  // Redirect to login if not authenticated
  if (!isLoading && !isAuthenticated) {
    return <Redirect href="/(public)/login" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#000000' },
        gestureEnabled: true,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="transactions" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="notification-settings" />
    </Stack>
  );
}
