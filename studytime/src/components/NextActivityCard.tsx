// Destaque da próxima atividade a vencer (a Início mostra as demais com ActivityCard).
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { cardShadow } from '@/theme/shadows';
import { toIcon } from '@/theme/icons';
import { Activity } from '@/database/db';
import { formatDue, timeLeft } from '@/utils/dates';

type Props = { activity: Activity; onPress?: () => void; onLongPress?: () => void };

export function NextActivityCard({ activity, onPress, onLongPress }: Props) {
  const p = colors.priority[activity.priority];
  const tint = activity.subject_color ?? colors.primary;
  const iconName = toIcon(activity.icon ?? activity.subject_icon);

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.card, cardShadow, pressed && { opacity: 0.88 }]}>
      <View style={[styles.spine, { backgroundColor: tint }]} />

      <View style={styles.body}>
        <View style={styles.top}>
          <View style={[styles.icon, { backgroundColor: tint + '1A' }]}>
            <Ionicons name={iconName} size={26} color={tint} />
          </View>

          <View style={{ flex: 1 }}>
            {activity.subject_name ? (
              <Text style={styles.subject} numberOfLines={1}>{activity.subject_name}</Text>
            ) : null}
            <Text style={styles.title} numberOfLines={2}>{activity.name}</Text>
          </View>

          <View style={[styles.badge, { backgroundColor: p.bg }]}>
            <Text style={[styles.badgeText, { color: p.fg }]}>{activity.priority}</Text>
          </View>
        </View>

        <View style={styles.bottom}>
          <View style={styles.when}>
            <Ionicons name="time-outline" size={16} color={colors.muted} />
            <Text style={styles.whenText}>{formatDue(activity.data_entrega)}</Text>
          </View>
          <View style={styles.chip}>
            <Text style={styles.chipText}>{timeLeft(activity.data_entrega)}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 22,
    marginBottom: 12,
  },
  // faixa na cor da matéria, "solta" dentro do card (sem overflow para não cortar a sombra)
  spine: { width: 4, borderRadius: 2, marginVertical: 16, marginLeft: 12 },
  body: { flex: 1, padding: 16, paddingLeft: 12, gap: 14 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  subject: { fontSize: 12, fontWeight: '600', color: colors.muted, marginBottom: 2 },
  title: { fontSize: 17, fontWeight: '800', color: colors.text, lineHeight: 22 },
  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  badgeText: { fontSize: 11, fontWeight: '700' },
  bottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  when: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  whenText: { fontSize: 13, fontWeight: '600', color: colors.muted },
  chip: { backgroundColor: colors.surface, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  chipText: { fontSize: 12, fontWeight: '700', color: colors.primaryDark },
});