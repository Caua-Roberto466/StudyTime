import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Redirect, router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '@/theme/colors';
import { cardShadow, floatingShadow } from '@/theme/shadows';
import { useAuth } from '@/contexts/auth';
import {
  Activity, deleteActivity, getAllActivities, getUpcomingActivities, getWeekProgress } from '@/database/db';
import { formatLongDate, getWeekRange, greeting, toDateKey, toLocalISO } from '@/utils/dates';
import { ScreenLayout } from '@/components/ScreenLayout';
import { ScreenHero } from '@/components/ScreenHero';
import { ProgressRing } from '@/components/ProgressingRing';
import { WeekStrip } from '@/components/WeekStrip';
import { NextActivityCard } from '@/components/NextActivityCard';
import { ActivityCard } from '@/components/ActivityCard';

// Frase curta do topo: o que importa hoje
function heroSummary(dueToday: number, overdue: number, hasUpcoming: boolean) {
  if (dueToday > 0) {
    return dueToday === 1
      ? '1 atividade para entregar hoje'
      : `${dueToday} atividades para entregar hoje`;
  }
  if (overdue > 0) {
    return overdue === 1
      ? '1 atividade atrasada para resolver'
      : `${overdue} atividades atrasadas para resolver`;
  }
  if (hasUpcoming) return 'Nada para entregar hoje. Bom momento para adiantar a próxima.';
  return 'Nenhuma atividade pendente. Que tal planejar a próxima?';
}

export default function Home() {
  const { user, loading } = useAuth();
  const [progress, setProgress] = useState({ total: 0, done: 0 });
  const [upcoming, setUpcoming] = useState<Activity[]>([]);
  const [all, setAll] = useState<Activity[]>([]);
  const userId = user?.id;

  const reload = useCallback(async () => {
    if (userId === undefined) return;
    const { start, end } = getWeekRange();
    const [p, list, everything] = await Promise.all([
      getWeekProgress(userId, start, end),
      getUpcomingActivities(userId, toLocalISO(new Date()), 3),
      getAllActivities(userId),
    ]);
    setProgress(p);
    setUpcoming(list);
    setAll(everything);
  }, [userId]);

  // Hooks SEMPRE antes de qualquer return condicional
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  if (loading) return null;
  if (!user) return <Redirect href="/login" />;

  const ratio = progress.total > 0 ? progress.done / progress.total : 0;
  const firstName = user.name.split(' ')[0];

  const nowISO = toLocalISO(new Date());
  const todayKey = toDateKey(new Date());
  const pending = all.filter((a) => a.completed === 0);
  const overdue = pending.filter((a) => a.data_entrega < nowISO).length;
  const dueToday = pending.filter((a) => a.data_entrega.startsWith(todayKey)).length;

  const [next, ...others] = upcoming;

  async function handleDelete(a: Activity) {
    if (userId === undefined) return;
    Alert.alert(
      'Excluir atividade',
      'Deseja realmente excluir esta atividade?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteActivity(a.id, userId);
              await reload();
            } catch {
              Alert.alert('Erro', 'Não foi possível excluir a atividade.');
            }
          },
        },
      ]
    );
  }

  function openActivity(a: Activity) {
    router.push({ pathname: '/atividade/[id]', params: { id: String(a.id) } });
  }

  return (
    <ScreenLayout>
      <View style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>
          {/* topo: data, saudação e resumo do dia */}
          <ScreenHero style={styles.hero}>
            <View style={styles.heroTop}>
              <View style={styles.heroText}>
                <Text style={styles.date}>{formatLongDate()}</Text>
                <Text style={styles.hello} numberOfLines={1}>
                  {greeting()}, {firstName}
                </Text>
              </View>
              <Pressable
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Notificações"
                style={({ pressed }) => [styles.bell, pressed && { opacity: 0.7 }]}
                onPress={() => router.push('/notificacoes')}>
                <Ionicons name="notifications-outline" size={22} color="#fff" />
              </Pressable>
            </View>
            <Text style={styles.summary}>{heroSummary(dueToday, overdue, upcoming.length > 0)}</Text>
          </ScreenHero>

          {/* progresso da semana: flutua sobre a borda do topo */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ver progresso da semana"
            style={({ pressed }) => [styles.progressCard, cardShadow, pressed && { opacity: 0.92 }]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Seu progresso da semana</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </View>

            <View style={styles.progressRow}>
              <ProgressRing progress={ratio} size={80} animated />
              <View style={{ flex: 1 }}>
                <Text style={styles.progressBig}>
                  {progress.done} de {progress.total}
                </Text>
                <Text style={styles.progressSmall}>atividades concluídas</Text>
                {overdue > 0 && (
                  <View style={styles.overdue}>
                    <Ionicons name="alert-circle" size={14} color={colors.priority.Alta.fg} />
                    <Text style={styles.overdueText}>
                      {overdue === 1 ? '1 atrasada' : `${overdue} atrasadas`}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.divider} />
            <WeekStrip activities={all} />
          </Pressable>

          {/* próximas atividades */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Próximas atividades</Text>
              <Pressable
                hitSlop={10}
                style={styles.linkRow}
                onPress={() => router.push('/estudar')}>
                <Text style={styles.link}>Ver todas</Text>
                <Ionicons name="chevron-forward" size={14} color={colors.primary} />
              </Pressable>
            </View>

            {!next ? (
              <View style={styles.emptyCard}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="checkmark-done" size={26} color={colors.primary} />
                </View>
                <Text style={styles.emptyTitle}>Nada pendente por aqui</Text>
                <Text style={styles.emptyText}>
                  Adicione uma atividade para organizar seus estudos.
                </Text>
              </View>
            ) : (
              <>
                <NextActivityCard
                  activity={next}
                  onPress={() => openActivity(next)}
                  onLongPress={() => handleDelete(next)}
                />
                {others.map((a) => (
                  <ActivityCard
                    key={a.id}
                    activity={a}
                    onPress={() => openActivity(a)}
                    onLongPress={() => handleDelete(a)}
                  />
                ))}
              </>
            )}
          </View>
        </ScrollView>

        {/* botão flutuante */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Adicionar atividade"
          style={({ pressed }) => [styles.fab, floatingShadow, pressed && { opacity: 0.88 }]}
          onPress={() => router.push('/nova-atividade')}>
          <Ionicons name="add" size={22} color="#fff" />
          <Text style={styles.fabText}>Adicionar atividade</Text>
        </Pressable>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingBottom: 104 },

  hero: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 72 },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  heroText: { flex: 1 },
  date: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.85)', marginBottom: 4 },
  hello: { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  bell: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center', justifyContent: 'center',
  },
  summary: { fontSize: 15, fontWeight: '500', color: 'rgba(255,255,255,0.9)', marginTop: 14, lineHeight: 21 },

  progressCard: {
    backgroundColor: colors.card, borderRadius: 24, padding: 18,
    marginTop: -48, marginHorizontal: 20,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  progressBig: { fontSize: 26, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  progressSmall: { fontSize: 13, color: colors.muted, marginTop: 2 },
  overdue: {
    flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start',
    backgroundColor: colors.priority.Alta.bg, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3, marginTop: 8,
  },
  overdueText: { fontSize: 12, fontWeight: '700', color: colors.priority.Alta.fg },
  divider: { height: 1, backgroundColor: colors.border, marginTop: 16, marginBottom: 14 },

  section: { paddingHorizontal: 20, marginTop: 28 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.text, letterSpacing: -0.2 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  link: { fontSize: 13, fontWeight: '700', color: colors.primary },

  emptyCard: {
    alignItems: 'center', backgroundColor: colors.card, borderRadius: 22,
    paddingVertical: 28, paddingHorizontal: 24,
  },
  emptyIcon: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  emptyText: { fontSize: 14, color: colors.muted, textAlign: 'center', marginTop: 4, lineHeight: 20 },

  fab: {
    position: 'absolute', right: 20, bottom: 16, height: 54, borderRadius: 27,
    paddingHorizontal: 20, backgroundColor: colors.primary,
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  fabText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});