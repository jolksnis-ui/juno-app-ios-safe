import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Alert } from 'react-native';
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import TransactionHistoryScreen from './src/screens/TransactionHistoryScreen';
import { LoginFormData, User } from './src/types/auth';
import { login, logout } from './src/services/authService';
import { getUserData, getToken } from './src/services/secureStorage';
import { AssetType } from './src/types/portfolio';

type Screen = 'login' | 'dashboard' | 'transactions';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard');
  const [dashboardTab, setDashboardTab] = useState<AssetType>('fiat');

  // Restore session on app startup
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const userData = await getUserData();
        const token = await getToken();
        
        // Both user data and token must be present for valid session
        if (userData && token) {
          setUser(userData);
          setIsAuthenticated(true);
        } else {
          // If either is missing, clear all auth data to ensure clean state
          if (userData || token) {
            console.log('Incomplete authentication data found, clearing storage');
            await logout(); // This will clear all auth data
          }
        }
      } catch (error) {
        console.error('Failed to restore session:', error);
        // On any error, ensure we're in logged out state
        try {
          await logout();
        } catch (logoutError) {
          console.error('Failed to clear auth data after session restore error:', logoutError);
        }
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const handleLogin = async (data: LoginFormData) => {
    try {
      const userData = await login(data);
      setUser(userData);
      setIsAuthenticated(true);
      Alert.alert('Success', `Welcome back, ${userData.name}!`);
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Login failed. Please check your credentials and try again.');
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

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setIsAuthenticated(false);
      setCurrentScreen('dashboard'); // Reset to dashboard on logout
      Alert.alert('Logged Out', 'You have been successfully logged out');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to logout properly');
    }
  };

  // Navigation handlers
  const handleNavigateToTransactions = (activeTab: AssetType) => {
    setDashboardTab(activeTab);
    setCurrentScreen('transactions');
  };

  const handleBackToDashboard = () => {
    setCurrentScreen('dashboard');
  };

  // Show loading screen while restoring session
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        {/* You can add a loading spinner here */}
      </View>
    );
  }

  const renderScreen = () => {
    if (!isAuthenticated || !user) {
      return (
        <LoginScreen
          onLogin={handleLogin}
          onSignUp={handleSignUp}
          onForgotPassword={handleForgotPassword}
          onClose={handleClose}
        />
      );
    }

    switch (currentScreen) {
      case 'transactions':
        return (
          <TransactionHistoryScreen
            onBack={handleBackToDashboard}
            onLogout={handleLogout}
            initialTab={dashboardTab}
          />
        );
      case 'dashboard':
      default:
        return (
          <DashboardScreen 
            userEmail={user.clientEmail} 
            onLogout={handleLogout}
            onNavigateToTransactions={handleNavigateToTransactions}
          />
        );
    }
  };

  return (
    <View style={styles.container}>
      {renderScreen()}
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
