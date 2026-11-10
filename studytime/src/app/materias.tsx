import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Redirect, router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '@/theme/colors';
import { IconName, toIcon } from '@/theme/icons';
import { useAuth } from '@/contexts/auth';
import { createSubject, getSubjects, SubjectWithCount } from '@/database/db';
import { ScreenLayout } from '@/components/ScreenLayout';
import { SubjectFormModal } from '@/components/SubjectFormModal';

export default function Materias() {
  const { user, loading } = useAuth();
  const userId = user?.id;

  const [subjects, setSubjects] = useState<SubjectWithCount[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

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

  // devolve true se criou (o modal só fecha nesse caso)
  async function handleCreate(data: { name: string; icon: IconName; color: string }) {
    if (userId === undefined) return false;
    try {
      await createSubject({ userId, ...data });
      setSubjects(await getSubjects(userId));
      return true;
    } catch (e) {
      // o UNIQUE (user_id, name) faz o banco lançar erro se já existir
      const duplicate = String(e).includes('UNIQUE');
      Alert.alert(
        duplicate ? 'Matéria já existe' : 'Erro',
        duplicate
          ? 'Você já tem uma matéria com esse nome.'
          : 'Não foi possível criar a matéria.'
      );
      return false;
    }
  }

  if (loading) return null;
  if (!user) return <Redirect href="/login" />;

  return (
    <ScreenLayout>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Matérias</Text>
          <Pressable style={styles.addCircle} onPress={() => setModalVisible(true)}>
            <Ionicons name="add" size={24} color="#fff" />
          </Pressable>
        </View>
        <Text style={styles.subtitle}>Organize suas atividades por disciplina.</Text>

        {subjects.length === 0 ? (
          <Text style={styles.empty}>
            Você ainda não tem matérias. Toque no + para criar a primeira.
          </Text>
        ) : (
          subjects.map((s) => (
            <Pressable
              key={s.id}
              style={styles.card}
              onPress={() =>
                router.push({ pathname: '/materia/[id]', params: { id: String(s.id) } })
              }>
              <View style={[styles.icon, { backgroundColor: s.color + '1A' }]}>
                <Ionicons name={toIcon(s.icon)} size={24} color={s.color} />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.name} numberOfLines={1}>{s.name}</Text>
                <Text style={styles.meta}>
                  {s.total} {s.total === 1 ? 'atividade' : 'atividades'}
                  {s.pending > 0 ? ` · ${s.pending} pendente${s.pending === 1 ? '' : 's'}` : ''}
                </Text>
              </View>

              <Ionicons name="chevron-forward" size={20} color={colors.muted} />
            </Pressable>
          ))
        )}
      </ScrollView>

      <SubjectFormModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleCreate}
      />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 32 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 28, fontWeight: '800', color: colors.text },
  addCircle: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  subtitle: { fontSize: 14, color: colors.muted, marginTop: 4, marginBottom: 20 },
  empty: { color: colors.muted, textAlign: 'center', paddingVertical: 32 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 12,
  },
  icon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  meta: { fontSize: 12, color: colors.muted, marginTop: 2 },
});