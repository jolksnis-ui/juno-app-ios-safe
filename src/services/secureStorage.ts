import * as SecureStore from 'expo-secure-store';
import { User } from '../types/auth';

const STORAGE_KEYS = {
  USER_DATA: 'juno_user_data',
  AUTH_TOKEN: 'juno_auth_token',
};

export const storeUserData = async (userData: User): Promise<void> => {
  await SecureStore.setItemAsync(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
};

export const getUserData = async (): Promise<User | null> => {
  const userData = await SecureStore.getItemAsync(STORAGE_KEYS.USER_DATA);
  return userData ? JSON.parse(userData) : null;
};

export const storeToken = async (token: string): Promise<void> => {
  await SecureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKEN, token);
};

export const getToken = async (): Promise<string | null> => {
  return await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
};

export const clearAuthData = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(STORAGE_KEYS.USER_DATA);
  await SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN);
};
