import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import CreateStatementScreen from '@/screens/CreateStatementScreen';
import { useAuthContext } from '@/contexts/AuthContext';
import { StatementType } from '@/types/statement';

export default function CreateStatement() {
  const { logout } = useAuthContext();
  const { type } = useLocalSearchParams<{ type: string }>();

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

  const handleSuccess = () => {
    router.back();
  };

  // Parse the type parameter, default to 'fiat' if not provided or invalid
  const statementType: StatementType = (type === 'crypto' || type === 'fiat') ? type : 'fiat';

  return (
    <CreateStatementScreen
      onBack={handleBack}
      onLogout={handleLogout}
      onSuccess={handleSuccess}
      initialType={statementType}
    />
  );
}