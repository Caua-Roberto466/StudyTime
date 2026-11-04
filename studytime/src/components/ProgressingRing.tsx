// src/components/ProgressRing.tsx
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '@/theme/colors';

type Props = { progress: number; size?: number; stroke?: number };

export function ProgressRing({ progress, size = 84, stroke = 9 }: Props) {
  const clamped = Math.min(Math.max(progress, 0), 1);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        {/* trilho */}
        <Circle
          cx={center} cy={center} r={radius}
          stroke={colors.secondary} strokeWidth={stroke} fill="none"
        />
        {/* parte preenchida */}
        {clamped > 0 && (
          <Circle
            cx={center} cy={center} r={radius}
            stroke={colors.primary} strokeWidth={stroke} fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - clamped)}
            rotation={-90}
            origin={`${center}, ${center}`}
          />
        )}
      </Svg>
      <Text style={styles.value}>{Math.round(clamped * 100)}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  value: { fontSize: 18, fontWeight: '800', color: colors.text },
});