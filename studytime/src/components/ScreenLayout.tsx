// src/components/ScreenLayout.tsx
import { ReactNode } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/theme/colors';
import { Header } from './Header';
import { Footer } from './Footer';

type Props = {
  children: ReactNode;
  header?: boolean;
  footer?: boolean;
  onBack?: () => void;
};

export function ScreenLayout({ children, header = true, footer = true, onBack }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={header ? 'light' : 'dark'} />
      {header ? <Header onBack={onBack} /> : <View style={{ height: insets.top }} />}
      <View style={{ flex: 1 }}>{children}</View>
      {footer ? <Footer /> : <View style={{ height: insets.bottom }} />}
    </View>
  );
}