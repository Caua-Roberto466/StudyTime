// Área roxa das telas Início e Perfil.
// Fundo sólido, sem SVG ou camadas transparentes sobrepostas.
import { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { colors } from '@/theme/colors';

type Props = { children: ReactNode; style?: StyleProp<ViewStyle> };

export function ScreenHero({ children, style }: Props) {
  return <View style={[styles.hero, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.primary,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
});
