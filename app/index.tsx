import { useEffect } from 'react';
import { router } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthContext } from '@/contexts/AuthContext';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuthContext();

  console.log('🏠 Index: Rendering with isLoading:', isLoading, 'isAuthenticated:', isAuthenticated);

  // Handle navigation when authentication state changes
  useEffect(() => {
    console.log('🏠 Index: Authentication state changed - isAuthenticated:', isAuthenticated, 'isLoading:', isLoading);
    
    if (!isLoading) {
      if (isAuthenticated) {
        console.log('🏠 Index: User is authenticated, navigating to dashboard');
        router.replace('/(auth)/dashboard');
      } else {
        console.log('🏠 Index: User not authenticated, navigating to login');
        router.replace('/(public)/splash');
      }
    }
  }, [isAuthenticated, isLoading]);

  // Show loading screen while checking authentication
  console.log('🏠 Index: Showing loading screen');
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#FFFFFF" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
