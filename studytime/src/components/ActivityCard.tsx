import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { toIcon } from '@/theme/icons';
import { Activity } from '@/database/db';
import { formatDue } from '@/utils/dates';
import { parseAttachments } from '@/utils/attachments';

type Props = {
  activity: Activity;
  onToggle?: () => void;
  onPress?: () => void;
  onLongPress?: () => void;
};

export function ActivityCard({ activity, onToggle, onPress, onLongPress }: Props) {
  const p = colors.priority[activity.priority];
  const done = activity.completed === 1;

  // ordem: ícone da atividade -> ícone da matéria -> livro padrão
  const iconName = toIcon(activity.icon ?? activity.subject_icon);
  const tint = activity.subject_color ?? colors.primary;
  const attachments = parseAttachments(activity.url_image).length;

  const due = formatDue(activity.data_entrega);
  const subtitle = activity.subject_name ? `${activity.subject_name} · ${due}` : due;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [
        styles.card,
        { borderLeftColor: p.fg },
        done && styles.cardDone,
        onPress && pressed && { opacity: 0.85 },
      ]}>
      <View style={[styles.icon, { backgroundColor: tint + '1A' }]}>
        <Ionicons name={iconName} size={22} color={tint} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={[styles.title, done && styles.titleDone]} numberOfLines={1}>
          {activity.name}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
          {attachments > 0 && (
            <View style={styles.clip}>
              <Ionicons name="attach" size={14} color={colors.muted} />
              <Text style={styles.subtitle}>{attachments}</Text>
            </View>
          )}
        </View>
      </View>

      {!done && (
        <View style={[styles.badge, { backgroundColor: p.bg }]}>
          <Text style={[styles.badgeText, { color: p.fg }]}>{activity.priority}</Text>
        </View>
      )}

      {onToggle && (
        <Pressable onPress={onToggle} hitSlop={10}>
          <Ionicons
            name={done ? 'checkmark-circle' : 'ellipse-outline'}
            size={26}
            color={done ? colors.primary : '#C4B5FD'}
          />
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 14, borderLeftWidth: 4,
    padding: 12, marginBottom: 10,
  },
  cardDone: { opacity: 0.6 },
  icon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 14, fontWeight: '700', color: colors.text },
  titleDone: { textDecorationLine: 'line-through' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  subtitle: { fontSize: 12, color: colors.muted, flexShrink: 1 },
  clip: { flexDirection: 'row', alignItems: 'center' },
  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: '700' },
});