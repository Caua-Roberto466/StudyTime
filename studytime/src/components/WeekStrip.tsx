// Faixa seg–dom da semana atual. O ponto embaixo do dia mostra a situação:
// roxo = a fazer, verde = tudo concluído, vermelho = tem atividade atrasada.
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';
import { Activity } from '@/database/db';
import { getWeekDays, toLocalISO } from '@/utils/dates';

type DayState = 'none' | 'todo' | 'done' | 'late';

const DOT: Record<DayState, string> = {
  none: 'transparent',
  todo: colors.primary,
  done: colors.success,
  late: colors.priority.Alta.fg,
};

const SPOKEN: Record<DayState, string> = {
  none: 'sem atividades',
  todo: 'atividades a fazer',
  done: 'tudo concluído',
  late: 'atividades atrasadas',
};

export function WeekStrip({ activities }: { activities: Activity[] }) {
  const nowISO = toLocalISO(new Date());

  const byDay = new Map<string, Activity[]>();
  for (const a of activities) {
    const key = a.data_entrega.split('T')[0];
    byDay.set(key, [...(byDay.get(key) ?? []), a]);
  }

  return (
    <View style={styles.row}>
      {getWeekDays().map((d) => {
        const list = byDay.get(d.key) ?? [];
        const pending = list.filter((a) => a.completed === 0);

        let state: DayState = 'none';
        if (list.length > 0) {
          state = pending.length === 0 ? 'done'
            : pending.some((a) => a.data_entrega < nowISO) ? 'late'
            : 'todo';
        }

        return (
          <View
            key={d.key}
            style={styles.day}
            accessible
            accessibilityLabel={`${d.label} ${d.day}${d.isToday ? ', hoje' : ''}, ${SPOKEN[state]}`}>
            <Text style={[styles.label, d.isToday && styles.labelToday]}>{d.label}</Text>
            <View style={[styles.bubble, d.isToday && styles.bubbleToday]}>
              <Text style={[styles.number, d.isToday && styles.numberToday]}>{d.day}</Text>
            </View>
            <View style={[styles.dot, { backgroundColor: DOT[state] }]} />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  day: { flex: 1, alignItems: 'center', gap: 6 },
  label: { fontSize: 12, fontWeight: '600', color: colors.muted },
  labelToday: { color: colors.primary, fontWeight: '800' },
  bubble: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  bubbleToday: { backgroundColor: colors.primary },
  number: { fontSize: 15, fontWeight: '700', color: colors.text },
  numberToday: { color: '#fff', fontWeight: '800' },
  dot: { width: 6, height: 6, borderRadius: 3 },
});