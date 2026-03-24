import React, { useEffect, useRef, useState } from 'react';
import { Text, Animated, TextStyle } from 'react-native';

interface AnimatedValueCounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  decimals?: number;
  style?: TextStyle;
  onComplete?: () => void;
}

export const AnimatedValueCounter: React.FC<AnimatedValueCounterProps> = ({
  value,
  prefix = '',
  suffix = '',
  duration = 1500,
  decimals = 2,
  style,
  onComplete,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const listener = animatedValue.addListener(({ value: animatedVal }) => {
      setDisplayValue(animatedVal);
    });

    Animated.timing(animatedValue, {
      toValue: value,
      duration,
      useNativeDriver: false, // We need to use the JS thread for text updates
    }).start(onComplete);

    return () => {
      animatedValue.removeListener(listener);
    };
  }, [value, duration]);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    } else {
      return num.toFixed(decimals);
    }
  };

  return (
    <Text style={style}>
      {prefix}{formatNumber(displayValue)}{suffix}
    </Text>
  );
};