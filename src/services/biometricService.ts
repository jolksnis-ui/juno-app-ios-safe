import * as LocalAuthentication from 'expo-local-authentication';

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
}

/**
 * Check if biometric authentication is available on the device
 */
export const isBiometricAvailable = async (): Promise<boolean> => {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return hasHardware && isEnrolled;
  } catch (error) {
    console.error('Error checking biometric availability:', error);
    return false;
  }
};

/**
 * Get the available authentication types on the device
 */
export const getAvailableAuthTypes = async (): Promise<LocalAuthentication.AuthenticationType[]> => {
  try {
    return await LocalAuthentication.supportedAuthenticationTypesAsync();
  } catch (error) {
    console.error('Error getting auth types:', error);
    return [];
  }
};

/**
 * Authenticate user with biometric or device passcode
 * This function automatically uses whatever authentication method is available:
 * - Face ID (iPhone X+)
 * - Touch ID (iPhone with home button)
 * - Fingerprint (Android)
 * - Device Passcode/PIN (fallback)
 */
export const authenticateUser = async (
  promptMessage: string = 'Authenticate to continue'
): Promise<BiometricAuthResult> => {
  try {
    // Check if any authentication is available
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    
    if (!hasHardware) {
      return {
        success: false,
        error: 'No authentication hardware available on this device'
      };
    }
    
    if (!isEnrolled) {
      return {
        success: false,
        error: 'No authentication method is set up. Please set up Face ID, Touch ID, Fingerprint, or Passcode in device settings'
      };
    }
    
    // Attempt authentication
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      fallbackLabel: 'Use Passcode',
      disableDeviceFallback: false, // Allow passcode fallback
      cancelLabel: 'Cancel',
    });
    
    if (result.success) {
      return { success: true };
    } else {
      // Handle different error types
      let errorMessage = 'Authentication failed';
      
      if (result.error === 'app_cancel') {
        errorMessage = 'Authentication was cancelled';
      } else if (result.error === 'not_available') {
        errorMessage = 'Biometric authentication is not available';
      } else if (result.error === 'not_enrolled') {
        errorMessage = 'No biometric authentication methods are enrolled';
      } else if (result.error === 'lockout') {
        errorMessage = 'Authentication is temporarily locked. Please try again later';
      } else if (result.error === 'timeout') {
        errorMessage = 'Authentication timed out. Please try again';
      } else if (result.error === 'authentication_failed') {
        errorMessage = 'Authentication failed. Please try again';
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  } catch (error) {
    console.error('Biometric authentication error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred during authentication'
    };
  }
};

/**
 * Authenticate specifically for crypto transactions
 */
export const authenticateForCryptoTransaction = async (): Promise<BiometricAuthResult> => {
  return authenticateUser('Authenticate to continue with crypto purchase');
};

/**
 * Get a user-friendly description of available authentication methods
 */
export const getAuthenticationDescription = async (): Promise<string> => {
  try {
    const authTypes = await getAvailableAuthTypes();
    
    if (authTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return 'Face ID';
    } else if (authTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return 'Touch ID or Fingerprint';
    } else {
      return 'Device Passcode';
    }
  } catch (error) {
    return 'Device Authentication';
  }
};
