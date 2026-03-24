import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Toast as ToastType } from '../types/toast';
import { useStyles, useTheme } from '../hooks/useTheme';
import { Theme } from '../types/theme';

interface ToastProps {
  toast: ToastType;
  onHide: (id: string) => void;
  index: number;
}

const { width: screenWidth } = Dimensions.get('window');

export const Toast: React.FC<ToastProps> = ({ toast, onHide, index }) => {
  const { theme } = useTheme();
  const styles = useStyles((theme: Theme) => createStyles(theme));
  const slideAnim = useRef(new Animated.Value(screenWidth)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Slide in animation
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-dismiss
    if (!toast.persistent) {
      const timer = setTimeout(() => {
        handleHide();
      }, toast.duration || 3000);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleHide = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: screenWidth,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide(toast.id);
    });
  };

  const getToastColors = (type: ToastType['type'], theme: Theme) => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: '#D4F4DD',
          borderColor: '#4CAF50',
          iconColor: '#4CAF50',
          textColor: '#2E7D32',
        };
      case 'error':
        return {
          backgroundColor: '#FFEBEE',
          borderColor: '#F44336',
          iconColor: '#F44336',
          textColor: '#C62828',
        };
      case 'warning':
        return {
          backgroundColor: '#FFF3E0',
          borderColor: '#FF9800',
          iconColor: '#FF9800',
          textColor: '#E65100',
        };
      case 'info':
        return {
          backgroundColor: '#E3F2FD',
          borderColor: '#2196F3',
          iconColor: '#2196F3',
          textColor: '#1565C0',
        };
      default:
        return {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          iconColor: theme.colors.text,
          textColor: theme.colors.text,
        };
    }
  };

  const getToastIcon = (type: ToastType['type']): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'success':
        return 'checkmark-circle';
      case 'error':
        return 'close-circle';
      case 'warning':
        return 'warning';
      case 'info':
        return 'information-circle';
      default:
        return 'information-circle';
    }
  };

  const colors = getToastColors(toast.type, theme);
  const iconName = getToastIcon(toast.type);

  const stackOffset = index * 10; // Small stack offset

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { translateX: slideAnim },
            { translateY: stackOffset },
          ],
          opacity: opacityAnim,
          backgroundColor: colors.backgroundColor,
          borderLeftColor: colors.borderColor,
        },
      ]}
    >
      {/* Icon */}
      <View style={styles.iconContainer}>
        <Ionicons name={iconName} size={24} color={colors.iconColor} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {toast.title && (
          <Text style={[styles.title, { color: colors.textColor }]}>
            {toast.title}
          </Text>
        )}
        <Text style={[styles.message, { color: colors.textColor }]}>
          {toast.message}
        </Text>

        {/* Action button */}
        {toast.action && (
          <TouchableOpacity
            style={[styles.actionButton, { borderColor: colors.borderColor }]}
            onPress={() => {
              toast.action?.onPress();
              handleHide();
            }}
          >
            <Text style={[styles.actionText, { color: colors.iconColor }]}>
              {toast.action.label}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Close button */}
      <TouchableOpacity
        style={styles.closeButton}
        onPress={handleHide}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="close" size={20} color={colors.textColor} />
      </TouchableOpacity>
    </Animated.View>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    maxWidth: screenWidth - 32,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    borderLeftWidth: 4,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  iconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionButton: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 4,
  },
});