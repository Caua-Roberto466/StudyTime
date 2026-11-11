import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Redirect, router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '@/theme/colors';
import { useAuth } from '@/contexts/auth';
import {
  Activity,
  getAllActivities,
  setActivityCompleted,
  setCalendarEventId,
} from '@/database/db';
import { formatDayTitle, toDateKey } from '@/utils/dates';
import { removeDeadlineFromCalendar } from '@/utils/deviceCalendar';
import { ScreenLayout } from '@/components/ScreenLayout';
import { ActivityCard } from '@/components/ActivityCard';
import { MonthCalendar } from '@/components/MonthCalendar';
import { Input } from '@/components/Input';

import { toggleActivityCompleted } from '@/utils/activityActions';

type Mode = 'lista' | 'agenda';
type Filter = 'todas' | 'pendentes' | 'concluidas';

const MODES: { key: Mode; label: string }[] = [
  { key: 'lista', label: 'Atividades' },
  { key: 'agenda', label: 'Agenda' },
];
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'todas', label: 'Todas' },
  { key: 'pendentes', label: 'Pendentes' },
  { key: 'concluidas', label: 'Concluídas' },
];

export default function Estudar() {
  const { user, loading } = useAuth();
  const userId = user?.id;

  const [mode, setMode] = useState<Mode>('lista');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('todas');
  const [month, setMonth] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState(() => toDateKey(new Date()));

  // recarrega toda vez que a tela ganha foco
  useFocusEffect(
    useCallback(() => {
      if (userId === undefined) return;
      let active = true;
      getAllActivities(userId).then((list) => {
        if (active) setActivities(list);
      });
      return () => { active = false; };
    }, [userId])
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return activities.filter((a) => {
      if (filter === 'pendentes' && a.completed === 1) return false;
      if (filter === 'concluidas' && a.completed === 0) return false;
      return a.name.toLowerCase().includes(q);
    });
  }, [activities, filter, query]);

  const markedDays = useMemo(
    () => new Set(activities.map((a) => a.data_entrega.slice(0, 10))),
    [activities]
  );

  const dayActivities = useMemo(
    () => activities.filter((a) => a.data_entrega.startsWith(selectedDay)),
    [activities, selectedDay]
  );

  async function toggle(a: Activity) {
    if (userId === undefined) return;
    const updated = await toggleActivityCompleted(a, userId);
    setActivities((prev) => prev.map((x) => (x.id === a.id ? updated : x)));
  }

  // hooks sempre ANTES dos returns condicionais
  if (loading) return null;
  if (!user) return <Redirect href="/login" />;

  return (
    <ScreenLayout>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Estudar</Text>

        <View style={styles.segment}>
          {MODES.map((m) => (
            <Pressable
              key={m.key}
              style={[styles.segmentItem, mode === m.key && styles.segmentActive]}
              onPress={() => setMode(m.key)}>
              <Text style={[styles.segmentText, mode === m.key && styles.segmentTextActive]}>
                {m.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {mode === 'lista' ? (
          <>
            <Pressable
              style={styles.addRow}
              onPress={() => router.push('/nova-atividade')}>
              <Ionicons name="add" size={20} color={colors.primary} />
              <Text style={styles.addText}>Adicionar atividade</Text>
            </Pressable>

            <Input
              icon="search-outline"
              placeholder="Buscar atividades..."
              value={query}
              onChangeText={setQuery}
              autoCapitalize="none"
            />

            <View style={styles.chips}>
              {FILTERS.map((f) => (
                <Pressable
                  key={f.key}
                  style={[styles.chip, filter === f.key && styles.chipActive]}
                  onPress={() => setFilter(f.key)}>
                  <Text style={[styles.chipText, filter === f.key && styles.chipTextActive]}>
                    {f.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {visible.length === 0 ? (
              <Text style={styles.empty}>
                {activities.length === 0
                  ? 'Você ainda não tem atividades. Adicione a primeira pela tela Início.'
                  : 'Nenhuma atividade encontrada.'}
              </Text>
            ) : (
              visible.map((a) => (
                <ActivityCard
                  key={a.id}
                  activity={a}
                  onToggle={() => toggle(a)}
                  onPress={() => router.push({ pathname: '/atividade/[id]', params: { id: String(a.id) } })}
                />
              ))
            )}
          </>
        ) : (
          <>
            <MonthCalendar
              month={month}
              onChangeMonth={setMonth}
              selected={selectedDay}
              onSelect={setSelectedDay}
              markedDays={markedDays}
            />

            <Text style={styles.dayTitle}>{formatDayTitle(selectedDay)}</Text>

            {dayActivities.length === 0 ? (
              <Text style={styles.empty}>Nada marcado para este dia.</Text>
            ) : (
              dayActivities.map((a) => (
                <ActivityCard
                  key={a.id}
                  activity={a}
                  onToggle={() => toggle(a)}
                  onPress={() => router.push({ pathname: '/atividade/[id]', params: { id: String(a.id) } })}
                />
              ))
            )}
          </>
        )}
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 32 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: 16 },
  addRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: colors.surface, borderRadius: 14, height: 52, marginBottom: 16,
  },
  addText: { color: colors.primary, fontSize: 15, fontWeight: '700' },
  segment: {
    flexDirection: 'row', backgroundColor: colors.surface,
    borderRadius: 14, padding: 4, marginBottom: 18,
  },
  segmentItem: { flex: 1, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  segmentActive: { backgroundColor: '#fff' },
  segmentText: { fontSize: 14, fontWeight: '600', color: colors.muted },
  segmentTextActive: { color: colors.primary, fontWeight: '700' },
  chips: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  chip: { paddingHorizontal: 16, height: 36, borderRadius: 18, backgroundColor: colors.surface, justifyContent: 'center' },
  chipActive: { backgroundColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.primary },
  chipTextActive: { color: '#fff' },
  dayTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 12 },
  empty: { color: colors.muted, textAlign: 'center', paddingVertical: 24 },
});