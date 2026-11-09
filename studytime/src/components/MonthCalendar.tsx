import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { MONTHS, pad, toDateKey } from '@/utils/dates';

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

type Props = {
  month: Date;                       // sempre o dia 1 do mês exibido
  onChangeMonth: (d: Date) => void;
  selected: string;                  // 'YYYY-MM-DD'
  onSelect: (key: string) => void;
  markedDays: Set<string>;           // dias com atividade
};

export function MonthCalendar({ month, onChangeMonth, selected, onSelect, markedDays }: Props) {
  const year = month.getFullYear();
  const m = month.getMonth();
  const todayKey = toDateKey(new Date());

  // 1) quantas células vazias antes do dia 1 (domingo = 0)
  const offset = new Date(year, m, 1).getDay();
  // 2) quantos dias o mês tem (dia 0 do mês seguinte = último dia deste)
  const daysInMonth = new Date(year, m + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array<null>(offset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null); // completa a última semana

  // 3) quebra a lista em semanas de 7
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const monthName = MONTHS[m].charAt(0).toUpperCase() + MONTHS[m].slice(1);

  return (
    <View style={styles.box}>
      <View style={styles.header}>
        <Pressable hitSlop={12} onPress={() => onChangeMonth(new Date(year, m - 1, 1))}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.monthTitle}>{monthName} de {year}</Text>
        <Pressable hitSlop={12} onPress={() => onChangeMonth(new Date(year, m + 1, 1))}>
          <Ionicons name="chevron-forward" size={22} color={colors.text} />
        </Pressable>
      </View>

      <View style={styles.row}>
        {WEEKDAYS.map((w, i) => (
          <Text key={i} style={styles.weekday}>{w}</Text>
        ))}
      </View>

      {weeks.map((week, wi) => (
        <View key={wi} style={styles.row}>
          {week.map((day, di) => {
            if (day === null) return <View key={di} style={styles.cell} />;

            const key = `${year}-${pad(m + 1)}-${pad(day)}`;
            const isSelected = key === selected;
            const isToday = key === todayKey;

            return (
              <Pressable key={di} style={styles.cell} onPress={() => onSelect(key)}>
                <View
                  style={[
                    styles.day,
                    isToday && styles.dayToday,
                    isSelected && styles.daySelected,
                  ]}>
                  <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>{day}</Text>
                </View>
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: markedDays.has(key) ? colors.primary : 'transparent' },
                  ]}
                />
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: '#fff', borderRadius: 18, padding: 12, marginBottom: 20 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 12, paddingHorizontal: 4,
  },
  monthTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  row: { flexDirection: 'row' },
  weekday: {
    width: '14.2857%', textAlign: 'center', fontSize: 12,
    fontWeight: '700', color: colors.muted, marginBottom: 6,
  },
  cell: { width: '14.2857%', height: 46, alignItems: 'center' },
  day: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
  },
  dayToday: { borderWidth: 1.5, borderColor: colors.primary },
  daySelected: { backgroundColor: colors.primary },
  dayText: { fontSize: 14, color: colors.text },
  dayTextSelected: { color: '#fff', fontWeight: '700' },
  dot: { width: 5, height: 5, borderRadius: 3, marginTop: 2 },
});