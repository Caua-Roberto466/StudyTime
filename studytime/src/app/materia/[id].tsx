import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Redirect, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '@/theme/colors';
import { toIcon } from '@/theme/icons';
import { useAuth } from '@/contexts/auth';
import {
  Activity, deleteSubject, getActivitiesBySubject, getSubject, Subject,
} from '@/database/db';
import { toggleActivityCompleted } from '@/utils/activityActions';
import { goBack } from '@/utils/navigation';
import { ScreenLayout } from '@/components/ScreenLayout';
import { ActivityCard } from '@/components/ActivityCard';
import { Button } from '@/components/Button';

export default function MateriaDetalhe() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const subjectId = Number(id);
  const { user, loading } = useAuth();
  const userId = user?.id;

  // undefined = ainda carregando, null = não existe
  const [subject, setSubject] = useState<Subject | null | undefined>(undefined);
  const [activities, setActivities] = useState<Activity[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (userId === undefined) return;
      let active = true;
      Promise.all([
        getSubject(userId, subjectId),
        getActivitiesBySubject(userId, subjectId),
      ]).then(([s, list]) => {
        if (active) {
          setSubject(s);
          setActivities(list);
        }
      });
      return () => { active = false; };
    }, [userId, subjectId])
  );

  async function toggle(a: Activity) {
    if (userId === undefined) return;
    const updated = await toggleActivityCompleted(a, userId);
    setActivities((prev) => prev.map((x) => (x.id === a.id ? updated : x)));
  }

  function confirmDelete() {
    Alert.alert(
      'Excluir matéria',
      'As atividades dela não serão apagadas, só ficarão sem matéria.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            if (userId === undefined) return;
            await deleteSubject(userId, subjectId);
            goBack('/materias');
          },
        },
      ]
    );
  }

  if (loading) return null;
  if (!user) return <Redirect href="/login" />;

  return (
    <ScreenLayout onBack={() => goBack('/materias')}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {subject === undefined ? null : subject === null ? (
          <Text style={styles.empty}>Matéria não encontrada.</Text>
        ) : (
          <>
            <View style={styles.hero}>
              <View style={[styles.heroIcon, { backgroundColor: subject.color + '1A' }]}>
                <Ionicons name={toIcon(subject.icon)} size={32} color={subject.color} />
              </View>
              <Text style={styles.name}>{subject.name}</Text>
              <Text style={styles.meta}>
                {activities.length} {activities.length === 1 ? 'atividade' : 'atividades'}
              </Text>
            </View>

            <Button
              label="Adicionar atividade nesta matéria"
              onPress={() =>
                router.push({
                  pathname: '/nova-atividade',
                  params: { subjectId: String(subject.id) },
                })
              }
            />

            <Text style={styles.section}>Atividades</Text>
            {activities.length === 0 ? (
              <Text style={styles.empty}>Nenhuma atividade nesta matéria ainda.</Text>
            ) : (
              activities.map((a) => (
                <ActivityCard
                  key={a.id}
                  activity={a}
                  onToggle={() => toggle(a)}
                  onPress={() => router.push({ pathname: '/atividade/[id]', params: { id: String(a.id) } })}
                />
              ))
            )}

            <Pressable style={styles.delete} onPress={confirmDelete}>
              <Ionicons name="trash-outline" size={18} color="#DC2626" />
              <Text style={styles.deleteText}>Excluir matéria</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 32 },
  hero: { alignItems: 'center', marginBottom: 20 },
  heroIcon: {
    width: 72, height: 72, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  name: { fontSize: 24, fontWeight: '800', color: colors.text },
  meta: { fontSize: 13, color: colors.muted, marginTop: 4 },
  section: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 24, marginBottom: 12 },
  empty: { color: colors.muted, textAlign: 'center', paddingVertical: 24 },
  delete: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginTop: 24, padding: 12,
  },
  deleteText: { color: '#DC2626', fontWeight: '700' },
});