// src/components/ProgressRing.tsx
import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '@/theme/colors';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// animated: o anel "enche" até o valor atual (por padrão fica parado, como antes)
type Props = { progress: number; size?: number; stroke?: number; animated?: boolean };

export function ProgressRing({ progress, size = 84, stroke = 9, animated = false }: Props) {
  const clamped = Math.min(Math.max(progress, 0), 1);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const [fill] = useState(() => new Animated.Value(animated ? 0 : clamped));

  useEffect(() => {
    if (!animated) {
      fill.setValue(clamped);
      return;
    }
    const anim = Animated.timing(fill, {
      toValue: clamped,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // strokeDashoffset não roda no driver nativo
    });
    anim.start();
    return () => anim.stop();
  }, [animated, clamped, fill]);

  const dashOffset = fill.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

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
          <AnimatedCircle
            cx={center} cy={center} r={radius}
            stroke={colors.primary} strokeWidth={stroke} fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
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