import React from 'react';
import { router } from 'expo-router';
import DashboardScreen from '@/screens/DashboardScreen';
import { useAuthContext } from '@/contexts/AuthContext';
import { AssetType } from '@/types/portfolio';

export default function Dashboard() {
  const { user, logout } = useAuthContext();

  const handleLogout = async () => {
    try {
      await logout();
      // Navigation will be handled automatically by the AuthContext and index.tsx
    } catch (error) {
      // Error handling is done in AuthContext
    }
  };

  const handleNavigateToTransactions = (activeTab: AssetType) => {
    router.push({
      pathname: '/(auth)/transactions',
      params: { tab: activeTab }
    });
  };

  if (!user) {
    return null; // This shouldn't happen due to auth layout protection
  }

  return (
    <DashboardScreen
      userEmail={user.clientEmail}
      onLogout={handleLogout}
      onNavigateToTransactions={handleNavigateToTransactions}
    />
  );
}
