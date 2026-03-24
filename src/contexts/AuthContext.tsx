import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { router } from 'expo-router';
import { LoginFormData, User } from '../types/auth';
import { login, logout } from '../services/authService';
import { getUserData, getToken } from '../services/secureStorage';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginFormData) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { showError, showSuccess } = useToast();

  // Debug: Log state changes
  useEffect(() => {
    console.log('🔐 AuthProvider: State changed - isAuthenticated:', isAuthenticated, 'user:', user?.name || 'null', 'isLoading:', isLoading);
  }, [isAuthenticated, user, isLoading]);

  // Restore session on app startup
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const userData = await getUserData();
        const token = await getToken();
        
        // Both user data and token must be present for valid session
        if (userData && token) {
          setUser(userData);
          setIsAuthenticated(true);
        } else {
          // If either is missing, clear all auth data to ensure clean state
          if (userData || token) {
            console.log('Incomplete authentication data found, clearing storage');
            await logout(); // This will clear all auth data
          }
        }
      } catch (error) {
        console.error('Failed to restore session:', error);
        // On any error, ensure we're in logged out state
        try {
          await logout();
        } catch (logoutError) {
          console.error('Failed to clear auth data after session restore error:', logoutError);
        }
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const handleLogin = async (data: LoginFormData) => {
    try {
      console.log('🔐 AuthContext: Starting login process...');
      const userData = await login(data);
      console.log('🔐 AuthContext: Login successful, user data:', userData);
      
      // Update state first
      setUser(userData);
      setIsAuthenticated(true);
      
      console.log('🔐 AuthContext: State updated - isAuthenticated: true, user:', userData.name);
      
      // Navigate to 2FA step (success toast shown after 2FA verify)
      console.log('🔐 AuthContext: Navigating to 2FA step...');
      router.replace('/(public)/login-2fa');
      
    } catch (error) {
      console.error('🔐 AuthContext: Login error:', error);
      showError('Login failed. Please check your credentials and try again.', 'Authentication Error');
      throw error;
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setIsAuthenticated(false);
      showSuccess('You have been successfully logged out', 'Logged Out');
    } catch (error) {
      console.error('Logout error:', error);
      showError('Failed to logout properly', 'Error');
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login: handleLogin,
    logout: handleLogout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
