import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/theme/colors';

const items = [
  { label: 'Início', icon: 'home-outline', href: '/', prefixes: ['/'] },
  { label: 'Estudar', icon: 'timer-outline', href: '/estudar', prefixes: ['/estudar'] },
  { label: 'Matérias', icon: 'library-outline', href: '/materias', prefixes: ['/materias', '/materia'] },
  { label: 'Perfil', icon: 'person-outline', href: '/perfil', prefixes: ['/perfil'] },
] as const;

// '/materia/3' deve acender a aba Matérias; '/' só vale para a Home
function isActive(pathname: string, prefixes: readonly string[]) {
  return prefixes.some((p) =>
    p === '/' ? pathname === '/' : pathname === p || pathname.startsWith(p + '/')
  );
}

export function Footer() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 8 }]}>
      {items.map((item) => {
        const active = isActive(pathname, item.prefixes);
        const color = active ? colors.primary : '#9CA3AF';

        return (
          <Pressable
            key={item.href}
            style={styles.item}
            onPress={() => router.replace(item.href)}>
            <Ionicons name={item.icon} size={24} color={color} />
            <Text style={[styles.label, { color }]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: colors.secondary,
    flexDirection: 'row',
    paddingTop: 8,
  },
  item: { flex: 1, alignItems: 'center', gap: 2 },
  label: { fontSize: 12, fontWeight: '600' },
});