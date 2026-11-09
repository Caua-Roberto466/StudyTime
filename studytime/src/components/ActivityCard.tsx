import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { Activity } from '@/database/db';
import { formatDue } from '@/utils/dates';
import { attachmentUri, parseAttachments } from '@/utils/attachments';

type Props = { activity: Activity; onToggle?: () => void };

export function ActivityCard({ activity, onToggle }: Props) {
  const p = colors.priority[activity.priority];
  const done = activity.completed === 1;
  const firstImage = parseAttachments(activity.url_image)[0];

  return (
    <View style={[styles.card, { borderLeftColor: p.fg }, done && styles.cardDone]}>
      <View style={styles.icon}>
        {firstImage ? (
          <Image source={{ uri: attachmentUri(firstImage) }} style={styles.thumb} />
        ) : (
          <Ionicons name="book-outline" size={20} color={colors.primary} />
        )}
      </View>

      <View style={{ flex: 1 }}>
        <Text style={[styles.title, done && styles.titleDone]} numberOfLines={1}>
          {activity.name}
        </Text>
        <Text style={styles.subtitle}>{formatDue(activity.data_entrega)}</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 14, borderLeftWidth: 4,
    padding: 12, marginBottom: 10,
  },
  cardDone: { opacity: 0.6 },
  icon: {
    width: 44, height: 44, borderRadius: 10, overflow: 'hidden',
    backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center',
  },
  thumb: { width: 44, height: 44 },
  title: { fontSize: 14, fontWeight: '700', color: colors.text },
  titleDone: { textDecorationLine: 'line-through' },
  subtitle: { fontSize: 12, color: colors.muted, marginTop: 2 },
  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: '700' },
});