import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useNotification } from '@/contexts/NotificationContext';
import { NotificationStatus } from '@/types/notification';

interface NotificationSectionProps {
  style?: any;
}

export const NotificationSection: React.FC<NotificationSectionProps> = ({ style }) => {
  const { 
    notificationStatus, 
    isLoading, 
    error, 
    sendTestNotification,
    registerDevice,
    clearError 
  } = useNotification();

  const getStatusText = () => {
    switch (notificationStatus) {
      case NotificationStatus.REGISTERED:
        return '✅ Enabled on this device';
      case NotificationStatus.REGISTERING:
        return '⏳ Setting up notifications...';
      case NotificationStatus.FAILED:
        return '❌ Setup failed';
      case NotificationStatus.NOT_REGISTERED:
      default:
        return '⚪ Not enabled';
    }
  };

  const getStatusColor = () => {
    switch (notificationStatus) {
      case NotificationStatus.REGISTERED:
        return '#4CAF50';
      case NotificationStatus.REGISTERING:
        return '#FF9800';
      case NotificationStatus.FAILED:
        return '#F44336';
      case NotificationStatus.NOT_REGISTERED:
      default:
        return '#9E9E9E';
    }
  };

  const handleTestNotification = async () => {
    try {
      await sendTestNotification();
    } catch (error) {
      console.error('Test notification failed:', error);
    }
  };

  const handleRetryRegistration = async () => {
    clearError();
    try {
      await registerDevice();
    } catch (error) {
      console.error('Registration retry failed:', error);
    }
  };

  const handleNotificationSettings = () => {
    router.push('/notification-settings');
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.icon}>🔔</Text>
        <Text style={styles.title}>Transaction Notifications</Text>
      </View>
      
      <View style={styles.statusContainer}>
        <Text style={[styles.statusText, { color: getStatusColor() }]}>
          {getStatusText()}
        </Text>
        {isLoading && (
          <ActivityIndicator size="small" color="#007AFF" style={styles.loader} />
        )}
      </View>

      <Text style={styles.description}>
        Get notified when you make transactions from web platform
      </Text>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {error.message}
          </Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={handleRetryRegistration}
            disabled={isLoading}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.buttonContainer}>
        {notificationStatus === NotificationStatus.REGISTERED && (
          <TouchableOpacity 
            style={styles.testButton} 
            onPress={handleTestNotification}
            disabled={isLoading}
          >
            <Text style={styles.testButtonText}>Send Test Notification</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={styles.settingsButton} 
          onPress={handleNotificationSettings}
        >
          <Text style={styles.settingsButtonText}>Notification Settings →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    fontSize: 24,
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
  },
  loader: {
    marginLeft: 8,
  },
  description: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
    lineHeight: 20,
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: {
    color: '#C62828',
    fontSize: 14,
    flex: 1,
    marginRight: 12,
  },
  retryButton: {
    backgroundColor: '#F44336',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  buttonContainer: {
    gap: 12,
  },
  testButton: {
    backgroundColor: '#E3F2FD',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  testButtonText: {
    color: '#1976D2',
    fontSize: 14,
    fontWeight: '600',
  },
  settingsButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  settingsButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
});
