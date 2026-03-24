import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useStyles } from '../hooks/useTheme';
import { Theme } from '../types/theme';

interface AssetData {
  id: string;
  name: string;
  symbol: string;
  value: number;
  usdValue: number;
  percentage: number;
  color: string;
  icon: string;
}

interface CircularProgressChartProps {
  totalValue: number;
  assets: AssetData[];
  size?: number;
}

export default function CircularProgressChart({ 
  totalValue, 
  assets, 
  size = 380 
}: CircularProgressChartProps) {
  const styles = useStyles((theme: Theme) => createStyles(theme));
  const center = size / 2;
  const radius = size * 0.38; // Adjust radius to leave space for stroke
  const strokeWidth = 13;
  const circumference = 2 * Math.PI * radius;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Create path for each asset segment
  const createArcPath = (startAngle: number, endAngle: number, radius: number) => {
    const start = polarToCartesian(center, center, radius, endAngle);
    const end = polarToCartesian(center, center, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    
    return [
      "M", start.x, start.y, 
      "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
    ].join(" ");
  };

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };

  // Filter assets with positive values and calculate segments
  const validAssets = assets.filter(asset => asset.usdValue > 0);
  const totalValidValue = validAssets.reduce((sum, asset) => sum + asset.usdValue, 0);
  
  let currentAngle = 0;
  const segments = validAssets.map(asset => {
    const percentage = totalValidValue > 0 ? (asset.usdValue / totalValidValue) * 100 : 0;
    const segmentAngle = (percentage / 100) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + segmentAngle;
    
    currentAngle += segmentAngle;
    
    return {
      ...asset,
      percentage,
      startAngle,
      endAngle,
      path: createArcPath(startAngle, endAngle, radius)
    };
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Background circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke="#2A2A2A"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        
        {/* Asset segments */}
        {segments.map((segment, index) => (
          <Path
            key={segment.id}
            d={segment.path}
            stroke={segment.color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeLinecap="round"
          />
        ))}
      </Svg>
      
      {/* Center content */}
      <View style={styles.centerContent}>
        <Text style={styles.totalValue}>
          {formatCurrency(totalValue)}
        </Text>
      </View>
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginVertical: 20,
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalValue: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
  },
});
