import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { NotificationPreferences, DeviceRegistration } from '@/types/notification';
import { APIClient } from '../utils/apiClient';

// Configure how notifications are handled when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Register for push notifications and get the Expo push token
 */
export async function registerForPushNotificationsAsync(onError?: (message: string) => void): Promise<string | null> {
  let token = null;

  // Check if running on a physical device
  if (!Device.isDevice) {
    const errorMessage = 'Push notifications only work on physical devices';
    if (onError) {
      onError(errorMessage);
    }
    console.warn(errorMessage);
    return null;
  }

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request permissions if not already granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Permission not granted for push notifications');
    return null;
  }

  // Get the Expo push token
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
      throw new Error('Project ID not found in app config');
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    token = tokenData.data;
    console.log('📱 Expo Push Token:', token);
  } catch (error) {
    // alert(` expo error ${error}`)
    console.error('Error getting Expo push token:', error);
    return null;
  }

  // Configure notification channel for Android
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });

    // Create specific channel for transaction alerts
    await Notifications.setNotificationChannelAsync('transactions', {
      name: 'Transaction Alerts',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#00FF00',
      sound: 'default',
    });
  }

  return token;
}

/**
 * Get device information for registration
 */
export function getDeviceInfo() {
  return {
    deviceName: Device.deviceName || `${Device.brand} ${Device.modelName}`,
    osName: Platform.OS,
    osVersion: Platform.Version,
    modelName: Device.modelName,
    brand: Device.brand,
    isDevice: Device.isDevice,
  };
}

/**
 * Register device token with backend
 */
export async function registerDeviceToken(
  token: string,
  userId: string
): Promise<void> {
  const deviceInfo = getDeviceInfo();
  try {
    await APIClient.post('/mobile-device-register', {
      clientId: userId,
      deviceToken: token,
      deviceInfo,
      deviceName: deviceInfo.deviceName,
      registeredAt: new Date().toISOString(),
    });

    console.log('✅ Device registered successfully');
  } catch (error) {
    console.error('❌ Failed to register device:', error);
    throw error;
  }
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreferences(
  userId: string,
  preferences: NotificationPreferences
): Promise<void> {
  try {
    // TODO: Replace with your actual API endpoint
    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/users/${userId}/notification-preferences`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        // TODO: Add authorization header
      },
      body: JSON.stringify(preferences),
    });

    if (!response.ok) {
      throw new Error(`Failed to update preferences: ${response.statusText}`);
    }

    console.log('✅ Notification preferences updated');
  } catch (error) {
    console.error('❌ Failed to update notification preferences:', error);
    throw error;
  }
}

/**
 * Send a local notification (for testing)
 */
export async function sendLocalNotification(
  title: string,
  body: string,
  data: any = {}
): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
        badge: 1,
      },
      trigger: null, // Show immediately
    });
  } catch (error) {
    console.error('Error sending local notification:', error);
    throw error;
  }
}

/**
 * Clear all notifications
 */
export async function clearAllNotifications(): Promise<void> {
  await Notifications.dismissAllNotificationsAsync();
}

/**
 * Get notification permissions status
 */
export async function getNotificationPermissions() {
  return await Notifications.getPermissionsAsync();
}

/**
 * Debug notification setup
 */
export function debugNotificationSetup() {
  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const isDevice = Device.isDevice;
  const platform = Platform.OS;
  
  console.log('🔍 Notification Debug Info:');
  console.log('- Project ID:', projectId);
  console.log('- Is Device:', isDevice);
  console.log('- Platform:', platform);
  console.log('- Device Name:', Device.deviceName);
  
  return {
    projectId,
    isDevice,
    platform,
    deviceName: Device.deviceName,
  };
}
