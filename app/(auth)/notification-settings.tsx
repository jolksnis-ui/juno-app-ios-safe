import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Switch, 
  TouchableOpacity, 
  ScrollView,
  Alert,
  SafeAreaView
} from 'react-native';
import { router } from 'expo-router';
import { useNotification } from '@/contexts/NotificationContext';

export default function NotificationSettings() {
  const { preferences, updatePreferences, isLoading } = useNotification();
  const [localPreferences, setLocalPreferences] = useState(preferences);

  const handleToggle = (key: keyof typeof preferences) => {
    setLocalPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleAmountThresholdChange = (amount: number) => {
    setLocalPreferences(prev => ({
      ...prev,
      amountThreshold: amount
    }));
  };

  const handleSave = async () => {
    try {
      await updatePreferences(localPreferences);
      Alert.alert('Success', 'Notification preferences updated successfully');
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to update preferences. Please try again.');
    }
  };

  const amountOptions = [50, 100, 250, 500, 1000];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Notification Settings</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alert Types</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Transaction Alerts</Text>
              <Text style={styles.settingDescription}>
                Get notified when transactions are made from web platform
              </Text>
            </View>
            <Switch
              value={localPreferences.transactionAlerts}
              onValueChange={() => handleToggle('transactionAlerts')}
              trackColor={{ false: '#E0E0E0', true: '#4CAF50' }}
              thumbColor={localPreferences.transactionAlerts ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Security Alerts</Text>
              <Text style={styles.settingDescription}>
                Get notified about login attempts and security changes
              </Text>
            </View>
            <Switch
              value={localPreferences.securityAlerts}
              onValueChange={() => handleToggle('securityAlerts')}
              trackColor={{ false: '#E0E0E0', true: '#4CAF50' }}
              thumbColor={localPreferences.securityAlerts ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Amount Threshold</Text>
          <Text style={styles.sectionDescription}>
            Only notify for transactions above this amount
          </Text>
          
          <View style={styles.amountOptions}>
            {amountOptions.map((amount) => (
              <TouchableOpacity
                key={amount}
                style={[
                  styles.amountOption,
                  localPreferences.amountThreshold === amount && styles.amountOptionSelected
                ]}
                onPress={() => handleAmountThresholdChange(amount)}
              >
                <Text style={[
                  styles.amountOptionText,
                  localPreferences.amountThreshold === amount && styles.amountOptionTextSelected
                ]}>
                  ${amount}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Settings Summary</Text>
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryText}>
              • Transaction alerts: {localPreferences.transactionAlerts ? 'Enabled' : 'Disabled'}
            </Text>
            <Text style={styles.summaryText}>
              • Security alerts: {localPreferences.securityAlerts ? 'Enabled' : 'Disabled'}
            </Text>
            <Text style={styles.summaryText}>
              • Minimum amount: ${localPreferences.amountThreshold}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.saveButton} 
          onPress={handleSave}
          disabled={isLoading}
        >
          <Text style={styles.saveButtonText}>
            {isLoading ? 'Saving...' : 'Save Settings'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  amountOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  amountOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  amountOptionSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  amountOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
  },
  amountOptionTextSelected: {
    color: '#FFFFFF',
  },
  summaryContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
  },
  summaryText: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 4,
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
