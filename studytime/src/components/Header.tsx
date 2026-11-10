import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/theme/colors';
import { useAuth } from '@/contexts/auth';
import { Avatar } from './Avatar';

type Props = { onBack?: () => void };

export function Header({ onBack }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.brand}>
        {onBack && (
          <Pressable onPress={onBack} hitSlop={12}>
            <Ionicons name="arrow-back" size={24} color={colors.background} />
          </Pressable>
        )}
        <Image
          source={require('../../assets/StudyTime-splash.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>StudyTime</Text>
      </View>

      {user && <Avatar name={user.name} avatar={user.avatar} size={36} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 32, height: 32 },
  title: { color: colors.background, fontSize: 20, fontWeight: '700' },
});