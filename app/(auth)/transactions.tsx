import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import TransactionHistoryScreen from '@/screens/TransactionHistoryScreen';
import { useAuthContext } from '@/contexts/AuthContext';
import { AssetType } from '@/types/portfolio';

export default function Transactions() {
  const { logout } = useAuthContext();
  const { tab } = useLocalSearchParams<{ tab: string }>();

  const handleLogout = async () => {
    try {
      await logout();
      // Navigation will be handled automatically by the AuthContext and index.tsx
    } catch (error) {
      // Error handling is done in AuthContext
    }
  };

  const handleBack = () => {
    router.back();
  };

  // Parse the tab parameter, default to 'fiat' if not provided or invalid
  const initialTab: AssetType = (tab === 'crypto' || tab === 'fiat') ? tab : 'fiat';

  return (
    <TransactionHistoryScreen
      onBack={handleBack}
      onLogout={handleLogout}
      initialTab={initialTab}
    />
  );
}
