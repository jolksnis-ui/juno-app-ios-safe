import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import * as Notifications from 'expo-notifications';
import { 
  registerForPushNotificationsAsync, 
  registerDeviceToken, 
  updateNotificationPreferences,
  sendLocalNotification,
  debugNotificationSetup,
  getNotificationPermissions
} from '@/services/notificationService';
import { NotificationPreferences, NotificationStatus } from '@/types/notification';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

interface NotificationContextType {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  notificationStatus: NotificationStatus;
  preferences: NotificationPreferences;
  error: Error | null;
  isLoading: boolean;
  registerDevice: () => Promise<void>;
  updatePreferences: (preferences: NotificationPreferences) => Promise<void>;
  sendTestNotification: () => Promise<void>;
  clearError: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuthContext();
  const { showError } = useToast();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [notificationStatus, setNotificationStatus] = useState<NotificationStatus>(NotificationStatus.NOT_REGISTERED);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    transactionAlerts: true,
    securityAlerts: true,
    amountThreshold: 100,
  });
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize notification listeners
  useEffect(() => {
    // Debug notification setup
    try {
      debugNotificationSetup();
    } catch (error) {
      console.log('Debug setup error:', error);
    }

    // Listen for notifications received while app is running
    const notificationSubscription = Notifications.addNotificationReceivedListener((notification) => {
      console.log('🔔 Notification Received:', notification);
      setNotification(notification);
    });

    // Listen for user interactions with notifications
    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('🔔 Notification Response:', JSON.stringify(response, null, 2));
      
      // Handle notification tap
      const data = response.notification.request.content.data;
      console.log('Notification Data:', data);
      
      // TODO: Add navigation logic based on notification type
      // Example: if (data.type === 'transaction_alert') { router.push('/transactions') }
    });

    return () => {
      // Cleanup listeners on unmount
      try {
        notificationSubscription.remove();
        responseSubscription.remove();
      } catch (error) {
        console.log('Error cleaning up notification listeners:', error);
      }
    };
  }, []);

  const registerDevice = useCallback(async () => {
    if (!user?.clientId) {
      console.warn('Cannot register device: User not authenticated');
      return;
    }

    setIsLoading(true);
    setNotificationStatus(NotificationStatus.REGISTERING);
    setError(null);

    try {
      console.log('🔔 Starting device registration...');
      
      // Get push token
      const token = await registerForPushNotificationsAsync((errorMessage) => {
        showError(errorMessage);
      });
      
      if (!token) {
        throw new Error('Failed to get push notification token');
      }

      setExpoPushToken(token);

      // Register with backend 
      await registerDeviceToken(token, user.clientId);

      setNotificationStatus(NotificationStatus.REGISTERED);
      console.log('✅ Device registered successfully');
      
    } catch (error) {
      console.error('❌ Device registration failed:', error);
      setError(error instanceof Error ? error : new Error('Registration failed'));
      setNotificationStatus(NotificationStatus.FAILED);
    } finally {
      setIsLoading(false);
    }
  }, [user?.clientId]);

  // Auto-register device when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user && !expoPushToken) {
      registerDevice();
    }
  }, [isAuthenticated, user, expoPushToken, registerDevice]);

  const updatePreferences = async (newPreferences: NotificationPreferences) => {
    if (!user?.clientId) {
      throw new Error('User not authenticated');
    }

    setIsLoading(true);
    setError(null);

    try {
      // Update preferences in backend (commented out for now)
      // await updateNotificationPreferences(user.clientId, newPreferences);
      
      setPreferences(newPreferences);
      console.log('✅ Notification preferences updated');
      
    } catch (error) {
      console.error('❌ Failed to update preferences:', error);
      setError(error instanceof Error ? error : new Error('Failed to update preferences'));
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const sendTestNotification = async () => {
    try {
      await sendLocalNotification(
        'Test Notification',
        'This is a test notification from Juno',
        { type: 'test', timestamp: new Date().toISOString() }
      );
      console.log('✅ Test notification sent');
    } catch (error) {
      console.error('❌ Failed to send test notification:', error);
      setError(error instanceof Error ? error : new Error('Failed to send test notification'));
      throw error;
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value: NotificationContextType = {
    expoPushToken,
    notification,
    notificationStatus,
    preferences,
    error,
    isLoading,
    registerDevice,
    updatePreferences,
    sendTestNotification,
    clearError,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
