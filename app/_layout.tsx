import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { ChatProvider } from '@/contexts/ChatContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { ToastContainer } from '@/components/ToastContainer';
import { getStatusBarStyle } from '@/utils/themeUtils';

function ThemedStack() {
  const { theme } = useTheme();
  
  return (
    <>
      <StatusBar style={getStatusBarStyle(theme)} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
          gestureEnabled: true,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(public)" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    StagnanLight: require('../assets/fonts/stagnan-light.otf'),
    StagnanMedium: require('../assets/fonts/stagnan-medium.otf'),
    StagnanRegular: require('../assets/fonts/stagnan-regular.otf'),
  });

  if (!fontsLoaded) return null;

  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <NotificationProvider>
            <ChatProvider>
              <ThemedStack />
              <ToastContainer />
            </ChatProvider>
          </NotificationProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
