import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AssetType } from '../types/portfolio';

interface TabSwitcherProps {
  activeTab: AssetType;
  onTabChange: (tab: AssetType) => void;
}

export default function TabSwitcher({ activeTab, onTabChange }: TabSwitcherProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.tab,
          activeTab === 'fiat' && styles.activeTab,
        ]}
        onPress={() => onTabChange('fiat')}
      >
        <Text style={[
          styles.tabText,
          activeTab === 'fiat' && styles.activeTabText,
        ]}>
          FIAT
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.tab,
          activeTab === 'crypto' && styles.activeTab,
        ]}
        onPress={() => onTabChange('crypto')}
      >
        <Text style={[
          styles.tabText,
          activeTab === 'crypto' && styles.activeTabText,
        ]}>
          CRYPTO
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    padding: 4,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888888',
  },
  activeTabText: {
    color: '#000000',
  },
});
