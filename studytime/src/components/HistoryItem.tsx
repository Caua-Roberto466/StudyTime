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
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.8 }]}>
      <View style={[styles.icon, { backgroundColor: tint + '1A' }]}>
        <Ionicons name={iconName} size={20} color={tint} />
        <View style={styles.check}>
          <Ionicons name="checkmark" size={10} color="#FFFFFF" />
        </View>
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{activity.name}</Text>
        <Text style={styles.meta} numberOfLines={1}>{activity.subject_name ?? 'Sem matéria'}</Text>
      </View>
      <Text style={styles.date}>{formatShortDate(activity.data_entrega)}</Text>
      <Ionicons name="chevron-forward" size={15} color="#A99FBA" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 11,
    backgroundColor: colors.card, borderRadius: 17, padding: 12,
    marginBottom: 9, borderWidth: 1, borderColor: colors.border,
  },
  icon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  check: {
    position: 'absolute', right: -4, bottom: -4,
    width: 19, height: 19, borderRadius: 10,
    backgroundColor: colors.success, borderWidth: 2, borderColor: colors.card,
    alignItems: 'center', justifyContent: 'center',
  },
  info: { flex: 1, minWidth: 0 },
  title: { fontSize: 14, fontWeight: '800', color: colors.text },
  meta: { fontSize: 12, color: colors.muted, marginTop: 3 },
  date: { fontSize: 11, fontWeight: '700', color: colors.muted },
});
