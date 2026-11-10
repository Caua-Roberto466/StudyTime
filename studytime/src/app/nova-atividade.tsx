import { useCallback, useEffect, useState } from 'react';
import {
  Alert, Image, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View,
} from 'react-native';
import { Redirect, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';

import { colors } from '@/theme/colors';
import { IconName, toIcon } from '@/theme/icons';
import { useAuth } from '@/contexts/auth';
import {
  createActivity, DEFAULT_SETTINGS, getSettings, getSubjects, Priority,
  setCalendarEventId, Settings, SubjectWithCount,
} from '@/database/db';
import { saveAttachment } from '@/utils/attachments';
import { addDeadlineToCalendar } from '@/utils/deviceCalendar';
import { goBack } from '@/utils/navigation';
import { formatDate, formatTime, toLocalISO } from '@/utils/dates';
import { ScreenLayout } from '@/components/ScreenLayout';
import { IconPicker } from '@/components/IconPicker';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';

const MAX_IMAGES = 5;
const PRIORITIES: Priority[] = ['Alta', 'Média', 'Baixa'];

function defaultDue() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  return d;
}

export default function NovaAtividade() {
  const { user, loading } = useAuth();
  const userId = user?.id;
  // vem preenchido quando o usuário toca em "Adicionar atividade" dentro de uma matéria
  const params = useLocalSearchParams<{ subjectId?: string }>();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(defaultDue);
  const [priority, setPriority] = useState<Priority>('Média');
  const [reminder, setReminder] = useState(true);
  const [images, setImages] = useState<string[]>([]); // URIs temporárias
  const [picker, setPicker] = useState<'date' | 'time' | null>(null);
  const [saving, setSaving] = useState(false);
  const [subjects, setSubjects] = useState<SubjectWithCount[]>([]);
  const [subjectId, setSubjectId] = useState<number | null>(
    params.subjectId ? Number(params.subjectId) : null
  );
  const [icon, setIcon] = useState<IconName | null>(null);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  // preferências do Perfil: definem o valor inicial do lembrete e se haverá alarme na agenda
  useEffect(() => {
    if (userId === undefined) return;
    let active = true;
    getSettings(userId).then((s) => {
      if (!active) return;
      setSettings(s);
      setReminder(s.default_reminder === 1);
    });
    return () => { active = false; };
  }, [userId]);

  // recarrega as matérias ao voltar da tela Matérias (onde o usuário pode criar novas)
  useFocusEffect(
    useCallback(() => {
      if (userId === undefined) return;
      let active = true;
      getSubjects(userId).then((list) => {
        if (active) setSubjects(list);
      });
      return () => { active = false; };
    }, [userId])
  );

  // hooks sempre ANTES dos returns condicionais
  if (loading) return null;
  if (!user) return <Redirect href="/login" />;

  // se a matéria foi apagada, o id fica "órfão": tratamos como sem matéria
  const selectedSubject = subjects.find((s) => s.id === subjectId) ?? null;
  const previewColor = selectedSubject?.color ?? colors.primary;
  const alarmEnabled = settings.calendar_alarms === 1;
  const noSubject = selectedSubject === null;

  async function pickFromGallery() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: Math.max(1, MAX_IMAGES - images.length),
      quality: 0.8, // comprime o JPEG: arquivo bem menor, qualidade quase igual
    });
    if (!result.canceled) {
      setImages((prev) => [...prev, ...result.assets.map((a) => a.uri)].slice(0, MAX_IMAGES));
    }
  }

  async function takePhoto() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permissão negada', 'Libere a câmera nas configurações do celular.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!result.canceled) {
      setImages((prev) => [...prev, result.assets[0].uri].slice(0, MAX_IMAGES));
    }
  }

  function addAttachment() {
    Alert.alert('Adicionar anexo', undefined, [
      { text: 'Tirar foto', onPress: takePhoto },
      { text: 'Escolher da galeria', onPress: pickFromGallery },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }

  async function handleSave() {
    if (!user) return;
    if (!title.trim()) {
      Alert.alert('Atenção', 'Dê um título para a atividade.');
      return;
    }

    setSaving(true);
    try {
      // 1) copia cada imagem para a pasta permanente
      const saved = await Promise.all(images.map((uri) => saveAttachment(uri)));

      // 2) grava a atividade (com matéria e ícone)
      const id = await createActivity({
        userId: user.id,
        name: title.trim(),
        dueAt: toLocalISO(date),
        description: description.trim() || null,
        priority,
        reminder,
        images: saved,
        subjectId: selectedSubject?.id ?? null,
        icon,
      });

      // 3) prioridade alta (e preferência ligada): alarme na agenda do celular
      let calendarOk = true;
      if (priority === 'Alta' && alarmEnabled) {
        try {
          const eventId = await addDeadlineToCalendar({
            title: title.trim(),
            dueAt: date,
            notes: description.trim() || null,
          });
          if (eventId) await setCalendarEventId(id, user.id, eventId);
          else calendarOk = false;
        } catch {
          calendarOk = false;
        }
      }

      // 4) volta para a tela anterior (a Home atualiza sozinha)
      if (calendarOk) {
        goBack('/');
      } else {
        Alert.alert(
          'Atividade salva',
          'Não consegui criar o alarme na agenda do celular. Confira a permissão de calendário nas configurações do app.',
          [{ text: 'OK', onPress: () => goBack('/') }]
        );
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar a atividade.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScreenLayout footer={false} onBack={() => goBack('/')}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 32 }}>
        <Text style={styles.screenTitle}>Nova atividade</Text>

        <Text style={styles.label}>Título da atividade</Text>
        <Input
          icon="create-outline"
          placeholder="Ex: Lista de exercícios"
          value={title}
          onChangeText={setTitle}
          autoCapitalize="sentences"
        />

        <Text style={styles.label}>Matéria</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 14 }}
          contentContainerStyle={{ gap: 8 }}>
          <Pressable
            style={[styles.chip, noSubject && styles.chipActive]}
            onPress={() => setSubjectId(null)}>
            <Text style={[styles.chipText, noSubject && styles.chipTextActive]}>Sem matéria</Text>
          </Pressable>

          {subjects.map((s) => {
            const active = s.id === selectedSubject?.id;
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

          <Pressable style={[styles.chip, styles.chipNew]} onPress={() => router.push('/materias')}>
            <Ionicons name="add" size={16} color={colors.primary} />
            <Text style={styles.chipText}>Nova</Text>
          </Pressable>
        </ScrollView>

        <Text style={styles.label}>Ícone</Text>
        <Text style={styles.hint}>
          Aparece no card da atividade. Sem escolha, usa o ícone da matéria.
        </Text>
        <View style={{ marginBottom: 18 }}>
          <IconPicker
            value={icon}
            onChange={(i) => setIcon(i === icon ? null : i)}
            color={previewColor}
          />
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

        {priority === 'Alta' && alarmEnabled && (
          <Text style={[styles.hint, { marginTop: -8, marginBottom: 18 }]}>
            ⏰ Prioridade alta: a entrega entra na agenda do celular, com alarmes 1 dia antes,
            1 hora antes e na hora.
          </Text>
        )}

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

        <Text style={styles.label}>Anexos ({images.length}/{MAX_IMAGES})</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24 }}>
          {images.map((uri) => (
            <View key={uri} style={styles.thumbWrap}>
              <Image source={{ uri }} style={styles.thumb} />
              <Pressable
                style={styles.remove}
                hitSlop={8}
                onPress={() => setImages((prev) => prev.filter((u) => u !== uri))}>
                <Ionicons name="close" size={14} color="#fff" />
              </Pressable>
            </View>
          ))}
          {images.length < MAX_IMAGES && (
            <Pressable style={styles.addTile} onPress={addAttachment}>
              <Ionicons name="add" size={28} color={colors.primary} />
            </Pressable>
          )}
        </ScrollView>

        <Button label="Salvar atividade" onPress={handleSave} loading={saving} />
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
  chipNew: { borderStyle: 'dashed', borderColor: colors.primary },
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
  thumbWrap: { marginRight: 10 },
  thumb: { width: 84, height: 84, borderRadius: 12 },
  remove: {
    position: 'absolute', top: -6, right: -6, width: 22, height: 22,
    borderRadius: 11, backgroundColor: '#DC2626', alignItems: 'center', justifyContent: 'center',
  },
  addTile: {
    width: 84, height: 84, borderRadius: 12, backgroundColor: colors.secondary,
    alignItems: 'center', justifyContent: 'center',
  },
});