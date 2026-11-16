import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Redirect, router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '@/theme/colors';
import { cardShadow, floatingShadow } from '@/theme/shadows';
import { useAuth } from '@/contexts/auth';
import { Activity, deleteActivity, getAllActivities, getWeekProgress } from '@/database/db';
import { formatLongDate, getWeekRange, greeting, toDateKey, toLocalISO } from '@/utils/dates';
import { ScreenLayout } from '@/components/ScreenLayout';
import { ScreenHero } from '@/components/ScreenHero';
import { ProgressRing } from '@/components/ProgressingRing';
import { WeekStrip } from '@/components/WeekStrip';
import { NextActivityCard } from '@/components/NextActivityCard';
import { ActivityCard } from '@/components/ActivityCard';

function heroSummary(dueToday: number, overdue: number, pendingCount: number) {
  if (overdue > 0) {
    return overdue === 1
      ? 'Você tem 1 atividade atrasada. Vamos colocar tudo em dia?'
      : `Você tem ${overdue} atividades atrasadas. Vamos colocar tudo em dia?`;
  }
  if (dueToday > 0) {
    return dueToday === 1
      ? 'Você tem 1 atividade para entregar hoje.'
      : `Você tem ${dueToday} atividades para entregar hoje.`;
  }
  if (pendingCount > 0) return 'Tudo em dia por aqui. Aproveite para adiantar seus estudos.';
  return 'Sua rotina começa aqui. Organize seus próximos estudos!';
}

function Metric({
  icon,
  label,
  value,
  tint,
  iconBackground,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number;
  tint: string;
  iconBackground: string;
}) {
  return (
    <View style={styles.metric}>
      <View style={[styles.metricIcon, { backgroundColor: iconBackground }]}>
        <Ionicons name={icon} size={19} color={tint} />
      </View>
      <View style={styles.metricCopy}>
        <Text style={styles.metricValue}>{value}</Text>
        <Text style={styles.metricLabel}>{label}</Text>
      </View>
    </View>
  );
}

export default function Home() {
  const { user, loading } = useAuth();
  const [progress, setProgress] = useState({ total: 0, done: 0 });
  const [all, setAll] = useState<Activity[]>([]);
  const userId = user?.id;

  const reload = useCallback(async () => {
    if (userId === undefined) return;
    const { start, end } = getWeekRange();
    const [week, activities] = await Promise.all([
      getWeekProgress(userId, start, end),
      getAllActivities(userId),
    ]);
    setProgress(week);
    setAll(activities);
  }, [userId]);

  useFocusEffect(useCallback(() => { void reload(); }, [reload]));

  if (loading) return null;
  if (!user) return <Redirect href="/login" />;

  const ratio = progress.total > 0 ? progress.done / progress.total : 0;
  const firstName = user.name.trim().split(/\s+/)[0] || 'estudante';
  const nowISO = toLocalISO(new Date());
  const todayKey = toDateKey(new Date());
  // Inclui atividades vencidas na lista, para que não desapareçam da tela inicial.
  const pending = all.filter((a) => a.completed === 0);
  const overdue = pending.filter((a) => a.data_entrega < nowISO).length;
  const dueToday = pending.filter((a) => a.data_entrega.startsWith(todayKey)).length;
  const [next, ...others] = pending.slice(0, 3);

  function handleDelete(a: Activity) {
    if (userId === undefined) return;
    Alert.alert('Excluir atividade', 'Deseja realmente excluir esta atividade?', [
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
    ]);
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
          <ScreenHero style={styles.hero}>
            <View style={styles.heroTop}>
              <View style={styles.heroText}>
                <Text style={styles.date}>{formatLongDate().toUpperCase()}</Text>
                <Text style={styles.hello} numberOfLines={2}>
                  {greeting()}, {firstName}!
                </Text>
              </View>
              <Pressable
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Abrir notificações"
                style={({ pressed }) => [styles.bell, pressed && styles.pressed]}
                onPress={() => router.push('/notificacoes')}>
                <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
              </Pressable>
            </View>
            <Text style={styles.summary}>
              {heroSummary(dueToday, overdue, pending.length)}
            </Text>
            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [styles.heroAction, pressed && styles.pressed]}
              onPress={() => router.push('/nova-atividade')}>
              <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
              <Text style={styles.heroActionText}>Planejar atividade</Text>
              <Ionicons name="arrow-forward" size={17} color={colors.primary} />
            </Pressable>
          </ScreenHero>

          <View style={styles.body}>
            <View style={styles.sectionIntro}>
              <View>
                <Text style={styles.eyebrow}>SEU DESEMPENHO</Text>
                <Text style={styles.sectionTitle}>Visão da semana</Text>
              </View>
              <View style={styles.weekTag}>
                <Ionicons name="calendar-clear-outline" size={14} color={colors.primary} />
                <Text style={styles.weekTagText}>Esta semana</Text>
              </View>
            </View>

            <View style={[styles.progressCard, cardShadow]}>
              <View style={styles.progressRow}>
                <View style={styles.progressCopy}>
                  <Text style={styles.progressKicker}>ATIVIDADES CONCLUÍDAS</Text>
                  <Text style={styles.progressBig}>
                    {progress.done}<Text style={styles.progressTotal}> / {progress.total}</Text>
                  </Text>
                  <Text style={styles.progressSmall}>
                    {progress.total === 0
                      ? 'Planeje atividades para esta semana'
                      : progress.done === progress.total
                        ? 'Você concluiu tudo nesta semana!'
                        : 'Continue assim, uma etapa de cada vez.'}
                  </Text>
                </View>
                <ProgressRing progress={ratio} size={92} stroke={9} animated />
              </View>
              <View style={styles.divider} />
              <Text style={styles.weekCaption}>SUA SEMANA</Text>
              <WeekStrip activities={all} />
            </View>

            <View style={styles.metricsRow}>
              <Metric
                icon="today-outline"
                label="Para hoje"
                value={dueToday}
                tint={colors.primary}
                iconBackground={colors.surface}
              />
              <Metric
                icon="alert-circle-outline"
                label="Atrasadas"
                value={overdue}
                tint="#D97706"
                iconBackground="#FEF3C7"
              />
            </View>

            <View style={styles.activitiesHeader}>
              <View>
                <Text style={styles.eyebrow}>ORGANIZE SUA ROTINA</Text>
                <Text style={styles.sectionTitle}>Próximas atividades</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                hitSlop={10}
                style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}
                onPress={() => router.push('/estudar')}>
                <Text style={styles.link}>Ver todas</Text>
                <Ionicons name="arrow-forward" size={15} color={colors.primary} />
              </Pressable>
            </View>

            {!next ? (
              <View style={styles.emptyCard}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="checkmark-done-outline" size={26} color={colors.primary} />
                </View>
                <Text style={styles.emptyTitle}>Tudo em ordem!</Text>
                <Text style={styles.emptyText}>
                  Você não tem atividades pendentes. Que tal planejar a próxima?
                </Text>
                <Pressable
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.emptyAction, pressed && styles.pressed]}
                  onPress={() => router.push('/nova-atividade')}>
                  <Text style={styles.emptyActionText}>Criar atividade</Text>
                  <Ionicons name="arrow-forward" size={15} color={colors.primary} />
                </Pressable>
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

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Adicionar atividade"
          style={({ pressed }) => [styles.fab, floatingShadow, pressed && styles.pressed]}
          onPress={() => router.push('/nova-atividade')}>
          <Ionicons name="add" size={22} color="#FFFFFF" />
          <Text style={styles.fabText}>Nova atividade</Text>
        </Pressable>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingBottom: 112 },
  pressed: { opacity: 0.75 },

  hero: { paddingHorizontal: 22, paddingTop: 20, paddingBottom: 28 },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  heroText: { flex: 1 },
  date: { fontSize: 11, fontWeight: '800', letterSpacing: 1.1, color: '#E8DCFF' },
  hello: { marginTop: 9, fontSize: 28, lineHeight: 34, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.7 },
  bell: {
    width: 44, height: 44, borderRadius: 22,
    borderColor: '#D9C5FF', borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  summary: { fontSize: 14, lineHeight: 21, fontWeight: '500', color: '#EEE7FF', marginTop: 12, maxWidth: 320 },
  heroAction: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    alignSelf: 'flex-start', minHeight: 44, paddingHorizontal: 16, marginTop: 23,
    borderRadius: 14, backgroundColor: '#FFFFFF',
  },
  heroActionText: { fontSize: 14, fontWeight: '800', color: colors.primary },

  body: { paddingHorizontal: 20, paddingTop: 27 },
  sectionIntro: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2, color: colors.primary, marginBottom: 5 },
  sectionTitle: { fontSize: 21, lineHeight: 27, fontWeight: '800', letterSpacing: -0.5, color: colors.text },
  weekTag: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.surface, borderRadius: 10,
    paddingHorizontal: 9, paddingVertical: 7, marginBottom: 2,
  },
  weekTagText: { color: colors.primary, fontSize: 11, fontWeight: '700' },

  progressCard: { borderRadius: 24, backgroundColor: colors.card, padding: 20 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressCopy: { flex: 1 },
  progressKicker: { color: colors.muted, fontSize: 10, letterSpacing: 0.8, fontWeight: '800' },
  progressBig: { color: colors.text, fontSize: 36, fontWeight: '800', letterSpacing: -1, marginTop: 6 },
  progressTotal: { fontSize: 20, fontWeight: '700', color: '#938AA7' },
  progressSmall: { fontSize: 12, lineHeight: 18, fontWeight: '500', color: colors.muted, marginTop: 3 },
  divider: { height: 1, backgroundColor: colors.border, marginTop: 21, marginBottom: 15 },
  weekCaption: { fontSize: 10, letterSpacing: 1, fontWeight: '800', color: colors.muted, marginBottom: 14 },

  metricsRow: { flexDirection: 'row', gap: 12, marginTop: 14 },
  metric: {
    flex: 1, minWidth: 0, backgroundColor: colors.card, borderRadius: 18,
    padding: 13, flexDirection: 'row', alignItems: 'center', gap: 10,
    borderColor: colors.border, borderWidth: 1,
  },
  metricIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  metricCopy: { flex: 1, minWidth: 0 },
  metricValue: { fontSize: 22, lineHeight: 24, fontWeight: '800', color: colors.text },
  metricLabel: { fontSize: 11, fontWeight: '600', color: colors.muted, marginTop: 3 },

  activitiesHeader: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
    flexWrap: 'wrap', gap: 8, marginTop: 32, marginBottom: 17,
  },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingBottom: 3 },
  link: { fontSize: 12, fontWeight: '800', color: colors.primary },

  emptyCard: {
    alignItems: 'center', backgroundColor: colors.card, borderRadius: 22,
    paddingVertical: 30, paddingHorizontal: 22, borderWidth: 1, borderColor: colors.border,
  },
  emptyIcon: {
    width: 58, height: 58, borderRadius: 19, backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center', marginBottom: 13,
  },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  emptyText: { fontSize: 13, lineHeight: 20, color: colors.muted, textAlign: 'center', marginTop: 6 },
  emptyAction: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 17, paddingVertical: 7, paddingHorizontal: 10 },
  emptyActionText: { fontSize: 13, fontWeight: '800', color: colors.primary },

  fab: {
    position: 'absolute', right: 20, bottom: 16,
    minHeight: 52, borderRadius: 18, paddingHorizontal: 18,
    backgroundColor: colors.primary,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  fabText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
});
