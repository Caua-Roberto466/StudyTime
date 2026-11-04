// src/components/ActivityCard.tsx
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { Activity } from '@/database/db';
import { formatDue } from '@/utils/dates';

export function ActivityCard({ activity }: { activity: Activity }) {
  const p = colors.priority[activity.priority];

  return (
    <View style={[styles.card, { borderLeftColor: p.fg }]}>
      <View style={styles.icon}>
        <Ionicons name="book-outline" size={20} color={colors.primary} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.title} numberOfLines={1}>{activity.name}</Text>
        <Text style={styles.subtitle}>{formatDue(activity.data_entrega)}</Text>
      </View>

      <View style={[styles.badge, { backgroundColor: p.bg }]}>
        <Text style={[styles.badgeText, { color: p.fg }]}>{activity.priority}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderLeftWidth: 4,
    padding: 12,
    marginBottom: 10,
  },
  icon: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: colors.background,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 14, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 12, color: colors.muted, marginTop: 2 },
  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: '700' },
});