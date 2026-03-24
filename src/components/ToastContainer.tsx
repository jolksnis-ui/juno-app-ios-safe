import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToast } from '../contexts/ToastContext';
import { Toast } from './Toast';

export const ToastContainer: React.FC = () => {
  const { toasts, hideToast } = useToast();
  const insets = useSafeAreaInsets();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]} pointerEvents="box-none">
      {toasts.map((toast, index) => (
        <Toast
          key={toast.id}
          toast={toast}
          onHide={hideToast}
          index={index}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
});