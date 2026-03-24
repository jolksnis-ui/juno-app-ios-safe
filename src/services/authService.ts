import { storeUserData, storeToken, clearAuthData } from './secureStorage';
import { extractTokenFromCookie } from '../utils/cookieParser';
import { LoginFormData, User, LoginResponse, GetLoggedInClientResponse, ChangePasswordRequest, ChangePasswordResponse } from '../types/auth';
import { APIClient } from '../utils/apiClient';

export const login = async (credentials: LoginFormData): Promise<User> => {
  // Note: Login doesn't require existing authentication, so we use requiresAuth: false
  const response = await APIClient.post<LoginResponse>('/client-login', {
    clientEmail: credentials.email,
    password: credentials.password
  }, { requiresAuth: false });

  // Extract token from Set-Cookie header
  const setCookieHeader = response.headers.get('set-cookie');
  const token = extractTokenFromCookie(setCookieHeader);
  
  if (!token) {
    throw new Error('No token received from server');
  }

  // Store only the required user data fields
  const userData: User = {
    name: response.data.name,
    clientEmail: response.data.clientEmail,
    clientId: response.data.clientId,
    accountNumber: response.data.accountNumber
  };
  
  await storeUserData(userData);
  await storeToken(token);
  
  // Fetch logged in client details to get the clientObjId
  try {
    const clientResponse = await getLoggedInClient();
    if (clientResponse._id) {
      userData.clientObjId = clientResponse._id;
      // Update stored user data with clientObjId
      await storeUserData(userData);
    }
  } catch (error) {
    console.error('Failed to fetch client details after login:', error);
    // Continue with login even if this fails
  }
  
  return userData;
};

export const getLoggedInClient = async (): Promise<GetLoggedInClientResponse> => {
  try {
    const response = await APIClient.post<GetLoggedInClientResponse>('/get-logedIn-client', {});
    return response.data;
  } catch (error) {
    console.error('Failed to get logged in client:', error);
    throw error;
  }
};

export const changePassword = async (passwordData: ChangePasswordRequest): Promise<void> => {
  try {
    const response = await APIClient.post<ChangePasswordResponse>('/changePassword-client', passwordData);
    
    if (response.data.success) {
      // Auto-logout user on successful password change as per API requirements
      await logout();
    } else {
      throw new Error(response.data.message || 'Failed to change password');
    }
  } catch (error) {
    console.error('Failed to change password:', error);
    throw error;
  }
};

export const logout = async (): Promise<void> => {
  await clearAuthData();
};

/** Request password reset - sends code to email */
export const requestPasswordReset = async (email: string): Promise<void> => {
  const response = await APIClient.post<{ success: boolean; message?: string }>(
    '/request-password-reset',
    { clientEmail: email },
    { requiresAuth: false }
  );
  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to send reset email');
  }
};

/** Set new password with verification code */
export const resetPassword = async (
  email: string,
  code: string,
  newPassword: string
): Promise<void> => {
  const response = await APIClient.post<{ success: boolean; message?: string }>(
    '/reset-password',
    { clientEmail: email, code, newPassword },
    { requiresAuth: false }
  );
  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to reset password');
  }
};

// For subsequent API calls, include token in headers
export const makeAuthenticatedRequest = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const { getToken } = await import('./secureStorage');
  const token = await getToken();
  
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
};
