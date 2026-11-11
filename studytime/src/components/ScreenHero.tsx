// Topo roxo das telas Início e Perfil: continua a cor do Header, escurece
// para baixo e tem linhas finas de pauta de caderno ao fundo.
import { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { colors } from '@/theme/colors';

const RULE_COUNT = 12;
const RULE_GAP = 24;

type Props = { children: ReactNode; style?: StyleProp<ViewStyle> };

export function ScreenHero({ children, style }: Props) {
  return (
    <View style={[styles.hero, style]}>
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="heroGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.primary} />
            <Stop offset="1" stopColor={colors.primaryDark} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#heroGradient)" />
      </Svg>

      {Array.from({ length: RULE_COUNT }, (_, i) => (
        <View key={i} style={[styles.rule, { top: 18 + i * RULE_GAP }]} />
      ))}

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.primary,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  rule: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
});