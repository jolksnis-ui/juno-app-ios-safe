import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  ScrollView,
  Switch
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthContext } from '@/contexts/AuthContext';
import { NotificationSection } from '@/components/NotificationSection';
import { useStyles, useTheme } from '../../src/hooks/useTheme';
import { Theme } from '../../src/types/theme';

export default function Profile() {
  const { user, logout } = useAuthContext();
  const { theme, toggleTheme } = useTheme();
  const styles = useStyles((theme: Theme) => createStyles(theme));

  const handleBack = () => {
    router.back();
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleThemeToggle = () => {
    toggleTheme();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={styles.title.color} />
        </TouchableOpacity>
        <Text style={styles.title}>Profile</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* User Info Section */}
        <View style={styles.section}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={40} color="#666666" />
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{user?.name || 'User'}</Text>
              <Text style={styles.userEmail}>{user?.clientEmail}</Text>
              <Text style={styles.accountNumber}>Account: {user?.accountNumber}</Text>
            </View>
          </View>
        </View>

        {/* Notification Section */}
        <NotificationSection />

        {/* Theme Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons 
                name={theme.isDark ? "moon" : "sunny"} 
                size={20} 
                color={styles.settingLabel.color} 
              />
              <Text style={styles.settingLabel}>
                {theme.isDark ? 'Dark Mode' : 'Light Mode'}
              </Text>
            </View>
            <Switch
              value={theme.isDark}
              onValueChange={handleThemeToggle}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={theme.isDark ? '#f5dd4b' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Account Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => router.push('/(auth)/personal-info')}
          >
            <View style={styles.settingInfo}>
              <Ionicons name="person-outline" size={20} color={styles.settingLabel.color} />
              <Text style={styles.settingLabel}>Personal Information</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={styles.userEmail.color} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => router.push('/(auth)/additional-accounts')}
          >
            <View style={styles.settingInfo}>
              <Ionicons name="people-outline" size={20} color={styles.settingLabel.color} />
              <Text style={styles.settingLabel}>Additional Account</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={styles.userEmail.color} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => router.push('/(auth)/statements')}
          >
            <View style={styles.settingInfo}>
              <Ionicons name="document-outline" size={20} color={styles.settingLabel.color} />
              <Text style={styles.settingLabel}>Statements</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={styles.userEmail.color} />
          </TouchableOpacity>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="help-circle-outline" size={20} color={styles.settingLabel.color} />
              <Text style={styles.settingLabel}>Help Center</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={styles.userEmail.color} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="mail-outline" size={20} color={styles.settingLabel.color} />
              <Text style={styles.settingLabel}>Contact Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={styles.userEmail.color} />
          </TouchableOpacity>
        </View>

        {/* Logout Section */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#FF4444" />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
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
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
  },
  placeholder: {
    width: 32, // Same width as back button for centering
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  accountNumber: {
    fontSize: 12,
    color: theme.colors.textTertiary,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
    color: theme.colors.text,
    marginLeft: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.error,
    marginLeft: 8,
  },
});
