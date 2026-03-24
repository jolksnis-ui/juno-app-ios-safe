import React from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import LoginScreen from '@/screens/LoginScreen';
import { useAuthContext } from '@/contexts/AuthContext';

export default function Login() {
  const { login } = useAuthContext();

  const handleLogin = async (data: { email: string; password: string }) => {
    try {
      console.log('📱 Login Screen: Calling login with data:', data.email);
      await login(data);
      console.log('📱 Login Screen: Login completed successfully');
      // Navigation will be handled automatically by the AuthContext and index.tsx
    } catch (error) {
      console.log('📱 Login Screen: Login failed:', error);
      // Error handling is done in AuthContext
    }
  };

  const handleSignUp = () => {
    console.log('Navigate to sign up');
    Alert.alert('Sign Up', 'Sign up functionality will be implemented next');
  };

  const handleForgotPassword = () => {
    console.log('Navigate to forgot password');
    Alert.alert('Forgot Password', 'Password reset functionality will be implemented next');
  };

  const handleClose = () => {
    console.log('Close login modal');
    // In a real app, this might navigate back to a landing page
  };

  return (
    <LoginScreen
      onLogin={handleLogin}
      onSignUp={handleSignUp}
      onForgotPassword={handleForgotPassword}
      onClose={handleClose}
    />
  );
}
