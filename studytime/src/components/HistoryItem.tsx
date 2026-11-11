// Linha do histórico de atividades concluídas (Perfil).
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { toIcon } from '@/theme/icons';
import { Activity } from '@/database/db';
import { formatShortDate } from '@/utils/dates';

type Props = { activity: Activity; onPress?: () => void };

export function HistoryItem({ activity, onPress }: Props) {
  const tint = activity.subject_color ?? colors.primary;
  const iconName = toIcon(activity.icon ?? activity.subject_icon);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.85 }]}>
      <View style={[styles.icon, { backgroundColor: tint + '1A' }]}>
        <Ionicons name={iconName} size={20} color={tint} />
        <View style={styles.check}>
          <Ionicons name="checkmark" size={10} color="#fff" />
        </View>
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.title} numberOfLines={1}>{activity.name}</Text>
        <Text style={styles.meta} numberOfLines={1}>{activity.subject_name ?? 'Sem matéria'}</Text>
      </View>

      <Text style={styles.date}>{formatShortDate(activity.data_entrega)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.card, borderRadius: 14, padding: 12, marginBottom: 8,
  },
  icon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  check: {
    position: 'absolute', right: -4, bottom: -4,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: colors.success, borderWidth: 2, borderColor: colors.card,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 14, fontWeight: '700', color: colors.text },
  meta: { fontSize: 12, color: colors.muted, marginTop: 2 },
  date: { fontSize: 12, fontWeight: '600', color: colors.muted },
});