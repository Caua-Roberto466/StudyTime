import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Redirect, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '@/theme/colors';
import { useAuth } from '@/contexts/auth';
import { getNotifications, Notification } from '@/database/db';
import { goBack } from '@/utils/navigation';
import { formatDue } from '@/utils/dates';
import { ScreenLayout } from '@/components/ScreenLayout';

export default function Notificacoes() {
  const { user, loading } = useAuth();
  const userId = user?.id;
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (userId === undefined) return;
      let active = true;
      getNotifications(userId).then((list) => {
        if (active) setNotifications(list);
      });
      return () => { active = false; };
    }, [userId])
  );

  if (loading) return null;
  if (!user) return <Redirect href="/login" />;

  return (
    <ScreenLayout footer={false} onBack={() => goBack('/')}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Notificações</Text>

        {notifications.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="notifications-off-outline" size={40} color={colors.muted} />
            <Text style={styles.empty}>Nenhuma notificação por enquanto.</Text>
          </View>
        ) : (
          notifications.map((n) => (
            <View key={n.id} style={styles.card}>
              <View style={styles.cardIcon}>
                <Ionicons name="notifications-outline" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle} numberOfLines={2}>{n.title}</Text>
                <Text style={styles.cardSub}>
                  {formatDue(n.scheduled_date)}
                  {n.sent ? ' · Enviada' : ' · Pendente'}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 32 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: 16 },
  emptyBox: { alignItems: 'center', paddingVertical: 48 },
  empty: { color: colors.muted, textAlign: 'center', marginTop: 12 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 14, borderLeftWidth: 4,
    borderLeftColor: colors.primary, padding: 12, marginBottom: 10,
  },
  cardIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  cardSub: { fontSize: 12, color: colors.muted, marginTop: 2 },
});
