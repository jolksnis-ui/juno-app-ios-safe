import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import StatementListScreen from '@/screens/StatementListScreen';
import { useAuthContext } from '@/contexts/AuthContext';
import { StatementType } from '@/types/statement';

export default function Statements() {
  const { logout } = useAuthContext();
  const { tab } = useLocalSearchParams<{ tab: string }>();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      // Error handling is done in AuthContext
    }
  };

  const handleBack = () => {
    router.back();
  };

  // Parse the tab parameter, default to 'fiat' if not provided or invalid
  const initialTab: StatementType = (tab === 'crypto' || tab === 'fiat') ? tab : 'fiat';

  return (
    <StatementListScreen
      onBack={handleBack}
      onLogout={handleLogout}
      initialTab={initialTab}
    />
  );
}