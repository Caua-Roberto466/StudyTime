import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { Redirect, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

import { colors } from '@/theme/colors';
import { IconName, toIcon } from '@/theme/icons';
import { useAuth } from '@/contexts/auth';
import {
  Activity, deleteActivity, getActivity, getSubjects, Priority, SubjectWithCount, updateActivity,
} from '@/database/db';
import { goBack } from '@/utils/navigation';
import { formatDate, formatTime, toLocalISO } from '@/utils/dates';
import { ScreenLayout } from '@/components/ScreenLayout';
import { IconPicker } from '@/components/IconPicker';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';

const PRIORITIES: Priority[] = ['Alta', 'Média', 'Baixa'];

export default function AtividadeDetalhe() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const activityId = Number(id);
  const { user, loading } = useAuth();
  const userId = user?.id;

  const [activity, setActivity] = useState<Activity | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(() => new Date());
  const [priority, setPriority] = useState<Priority>('Média');
  const [reminder, setReminder] = useState(true);
  const [subjectId, setSubjectId] = useState<number | null>(null);
  const [icon, setIcon] = useState<IconName | null>(null);
  const [subjects, setSubjects] = useState<SubjectWithCount[]>([]);
  const [picker, setPicker] = useState<'date' | 'time' | null>(null);
  const [saving, setSaving] = useState(false);

  // recarrega a atividade (e as matérias) toda vez que a tela ganha foco
  useFocusEffect(
    useCallback(() => {
      if (userId === undefined) return;
      let active = true;
      Promise.all([getActivity(userId, activityId), getSubjects(userId)]).then(([a, subs]) => {
        if (!active) return;
        setSubjects(subs);
        if (!a) return;
        setActivity(a);
        setName(a.name);
        setDescription(a.description ?? '');
        setPriority(a.priority);
        setReminder(a.reminder === 1);
        setSubjectId(a.subject_id);
        setIcon(((a.icon ?? a.subject_icon) as IconName) ?? null);
        setDate(new Date(a.data_entrega));
      });
      return () => { active = false; };
    }, [userId, activityId])
  );

  if (loading) return null;
  if (!user) return <Redirect href="/login" />;

  async function handleSave() {
    if (!user) return;
    if (!name.trim()) {
      Alert.alert('Atenção', 'Dê um título para a atividade.');
      return;
    }

    setSaving(true);
    try {
      await updateActivity(activityId, user.id, {
        name: name.trim(),
        dueAt: toLocalISO(date),
        description: description.trim() || null,
        priority,
        reminder,
        subjectId,
        icon,
      });
      goBack();
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar a atividade.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!user) return;
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
              await deleteActivity(activityId, user.id);
              goBack();
            } catch {
              Alert.alert('Erro', 'Não foi possível excluir a atividade.');
            }
          },
        },
      ]
    );
  }

  if (!activity) {
    return (
      <ScreenLayout footer={false} onBack={() => goBack('/')}>
        <View style={styles.center}>
          <Text style={styles.empty}>Atividade não encontrada.</Text>
        </View>
      </ScreenLayout>
    );
  }

  const previewColor = subjects.find((s) => s.id === subjectId)?.color ?? colors.primary;

  return (
    <ScreenLayout footer={false} onBack={() => goBack('/')}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 32 }}>
        <Text style={styles.screenTitle}>Editar atividade</Text>

        <Text style={styles.label}>Título da atividade</Text>
        <Input
          icon="create-outline"
          placeholder="Ex: Lista de exercícios"
          value={name}
          onChangeText={setName}
          autoCapitalize="sentences"
        />

        <Text style={styles.label}>Matéria</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 14 }}
          contentContainerStyle={{ gap: 8 }}>
          <Pressable
            style={[styles.chip, subjectId === null && styles.chipActive]}
            onPress={() => setSubjectId(null)}>
            <Text style={[styles.chipText, subjectId === null && styles.chipTextActive]}>Sem matéria</Text>
          </Pressable>

          {subjects.map((s) => {
            const active = s.id === subjectId;
            return (
              <Pressable
                key={s.id}
                style={[styles.chip, { borderColor: s.color }, active && { backgroundColor: s.color }]}
                onPress={() => setSubjectId(s.id)}>
                <Ionicons name={toIcon(s.icon)} size={16} color={active ? '#fff' : s.color} />
                <Text style={[styles.chipText, { color: active ? '#fff' : s.color }]}>{s.name}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Text style={styles.label}>Ícone</Text>
        <Text style={styles.hint}>
          Aparece no card da atividade. Sem escolha, usa o ícone da matéria.
        </Text>
        <View style={{ marginBottom: 18 }}>
          <IconPicker value={icon} onChange={(i) => setIcon(i)} color={previewColor} />
        </View>

        <Text style={styles.label}>Descrição</Text>
        <TextInput
          style={styles.textarea}
          placeholder="Detalhes da atividade (opcional)"
          placeholderTextColor="#9CA3AF"
          value={description}
          onChangeText={setDescription}
          multiline
          textAlignVertical="top"
        />

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Data de entrega</Text>
            <Pressable style={styles.pickBox} onPress={() => setPicker('date')}>
              <Ionicons name="calendar-outline" size={20} color={colors.primary} />
              <Text style={styles.pickText}>{formatDate(date)}</Text>
            </Pressable>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Horário</Text>
            <Pressable style={styles.pickBox} onPress={() => setPicker('time')}>
              <Ionicons name="time-outline" size={20} color={colors.primary} />
              <Text style={styles.pickText}>{formatTime(date)}</Text>
            </Pressable>
          </View>
        </View>

        {picker && (
          <DateTimePicker
            value={date}
            mode={picker}
            is24Hour
            onChange={(event, selected) => {
              setPicker(null);
              if (event.type === 'set' && selected) setDate(selected);
            }}
          />
        )}

        <Text style={styles.label}>Prioridade</Text>
        <View style={styles.priorityRow}>
          {PRIORITIES.map((p) => {
            const c = colors.priority[p];
            const active = priority === p;
            return (
              <Pressable
                key={p}
                onPress={() => setPriority(p)}
                style={[styles.priorityPill, { backgroundColor: active ? c.fg : c.bg }]}>
                <Text style={[styles.priorityText, { color: active ? '#fff' : c.fg }]}>{p}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.reminderRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.reminderTitle}>Lembrete</Text>
            <Text style={styles.reminderSub}>Receber notificação antes da data</Text>
          </View>
          <Switch
            value={reminder}
            onValueChange={setReminder}
            trackColor={{ true: colors.primary, false: '#D1D5DB' }}
            thumbColor="#fff"
          />
        </View>

        <Button label="Salvar atividade" onPress={handleSave} loading={saving} />

        <Pressable style={styles.deleteRow} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={18} color="#DC2626" />
          <Text style={styles.deleteText}>Excluir atividade</Text>
        </Pressable>
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  screenTitle: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 8 },
  hint: { fontSize: 12, color: colors.muted, marginBottom: 10 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, height: 38, borderRadius: 19,
    borderWidth: 1.5, borderColor: colors.secondary, backgroundColor: '#fff',
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  chipTextActive: { color: '#fff' },
  textarea: {
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: colors.secondary,
    borderRadius: 14, padding: 14, minHeight: 96, fontSize: 16,
    color: colors.text, marginBottom: 14,
  },
  row: { flexDirection: 'row', gap: 12 },
  pickBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: colors.secondary,
    borderRadius: 14, height: 54, paddingHorizontal: 14, marginBottom: 14,
  },
  pickText: { fontSize: 16, color: colors.text },
  priorityRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  priorityPill: { flex: 1, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  priorityText: { fontSize: 14, fontWeight: '700' },
  reminderRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 18,
  },
  reminderTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  reminderSub: { fontSize: 12, color: colors.muted, marginTop: 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { color: colors.muted, textAlign: 'center', paddingVertical: 24 },
  deleteRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: '#FCA5A5',
    height: 52, marginTop: 12,
  },
  deleteText: { color: '#DC2626', fontSize: 15, fontWeight: '700' },
});
