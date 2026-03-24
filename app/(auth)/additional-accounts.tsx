import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStyles, useTheme } from '../../src/hooks/useTheme';
import { Theme } from '../../src/types/theme';
import { getClientAssociatedUsers } from '../../src/services/additionalAccountsService';
import { AdditionalAccount } from '../../src/types/additionalAccounts';
import { useToast } from '../../src/contexts/ToastContext';

export default function AdditionalAccounts() {
  const styles = useStyles((theme: Theme) => createStyles(theme));
  const { showError } = useToast();
  const [accounts, setAccounts] = useState<AdditionalAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setIsLoading(true);
      const response = await getClientAssociatedUsers();
      setAccounts(response.clientsData);
    } catch (error) {
      console.error('Failed to load additional accounts:', error);
      showError('Failed to load additional accounts', 'Network Error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleAddAccount = () => {
    router.push('/(auth)/add-additional-account');
  };

  const getAccountStatus = (account: AdditionalAccount) => {
    return account.readOnly ? 'READ ONLY' : 'FULL ACCESS';
  };

  const getStatusColor = (account: AdditionalAccount) => {
    return account.readOnly ? '#00D4AA' : '#FF9500';
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={styles.title.color} />
        </TouchableOpacity>
        <Text style={styles.title}>ADDITIONAL ACCOUNTS</Text>
        <TouchableOpacity onPress={handleAddAccount} style={styles.addButton}>
          <Ionicons name="add" size={24} color={styles.title.color} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#00D4AA" />
            <Text style={styles.loadingText}>Loading accounts...</Text>
          </View>
        ) : accounts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color={styles.emptyText.color} />
            <Text style={styles.emptyText}>No additional accounts found</Text>
            <Text style={styles.emptySubtext}>
              Create additional accounts to share access with other users
            </Text>
          </View>
        ) : (
          accounts.map((account) => (
            <View key={account._id} style={styles.accountCard}>
              <View style={styles.accountInfo}>
                <View style={styles.avatar}>
                  <Ionicons name="person" size={24} color="#666666" />
                </View>
                <View style={styles.accountDetails}>
                  <View style={styles.statusContainer}>
                    <Text style={[styles.statusText, { color: getStatusColor(account) }]}>
                      {getAccountStatus(account)}
                    </Text>
                    <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(account) }]} />
                  </View>
                  <Text style={styles.accountEmail}>{account.clientEmail}</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    letterSpacing: 0.5,
  },
  addButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.textTertiary,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  accountCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  accountDetails: {
    flex: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  accountEmail: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '500',
  },
});