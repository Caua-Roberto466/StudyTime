import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Redirect, router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '@/theme/colors';
import { useAuth } from '@/contexts/auth';
import {
  Activity, getUpcomingActivities, getWeekProgress, seedDemoActivities,
} from '@/database/db';
import { getWeekRange, toLocalISO } from '@/utils/dates';
import { ScreenLayout } from '@/components/ScreenLayout';
import { ProgressRing } from '@/components/ProgressingRing';
import { ActivityCard } from '@/components/ActivityCard';

export default function Home() {
  const { user, loading } = useAuth();
  const [progress, setProgress] = useState({ total: 0, done: 0 });
  const [upcoming, setUpcoming] = useState<Activity[]>([]);
  const userId = user?.id;

  // Hooks SEMPRE antes de qualquer return condicional
  useFocusEffect(
    useCallback(() => {
      if (userId === undefined) return;
      let active = true;

      async function load() {
        await seedDemoActivities(userId!); // TEMPORÁRIO: remover quando existir "Nova atividade"
        const { start, end } = getWeekRange();
        const [p, list] = await Promise.all([
          getWeekProgress(userId!, start, end),
          getUpcomingActivities(userId!, toLocalISO(new Date()), 3),
        ]);
        if (active) {
          setProgress(p);
          setUpcoming(list);
        }
      }

      load();
      return () => { active = false; };
    }, [userId])
  );

  if (loading) return null;
  if (!user) return <Redirect href="/login" />;

  const ratio = progress.total > 0 ? progress.done / progress.total : 0;
  const firstName = user.name.split(' ')[0];

  return (
    <ScreenLayout header={false}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* saudação */}
        <View style={styles.greeting}>
          <View>
            <Text style={styles.hello}>Olá, {firstName} 👋</Text>
            <Text style={styles.subtitle}>Vamos estudar hoje?</Text>
          </View>
          <Pressable hitSlop={10}>
            <Ionicons name="notifications-outline" size={26} color={colors.text} />
          </Pressable>
        </View>

        {/* progresso da semana */}
        <View style={styles.progressCard}>
          <Text style={styles.cardTitle}>Seu progresso da semana</Text>
          <View style={styles.progressRow}>
            <ProgressRing progress={ratio} />
            <View>
              <Text style={styles.progressBig}>
                {progress.done} de {progress.total}
              </Text>
              <Text style={styles.progressSmall}>atividades{'\n'}concluídas</Text>
            </View>
          </View>
        </View>

        {/* próximas atividades */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Próximas atividades</Text>
          <Pressable hitSlop={10}>
            <Text style={styles.link}>Ver todas →</Text>
          </Pressable>
        </View>

        {upcoming.length === 0 ? (
          <Text style={styles.empty}>Nenhuma atividade pendente 🎉</Text>
        ) : (
          upcoming.map((a) => <ActivityCard key={a.id} activity={a} />)
        )}

        <Pressable
          style={({ pressed }) => [styles.addButton, pressed && { opacity: 0.8 }]}
          onPress={() => router.push('/nova-atividade')}>
          <Ionicons name="add" size={22} color="#fff" />
          <Text style={styles.addText}>Adicionar atividade</Text>
        </Pressable>
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 32 },
  greeting: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  hello: { fontSize: 24, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 14, color: colors.muted, marginTop: 2 },
  progressCard: { backgroundColor: colors.surface, borderRadius: 18, padding: 16, marginBottom: 24 },
  cardTitle: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 12 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  progressBig: { fontSize: 20, fontWeight: '800', color: colors.text },
  progressSmall: { fontSize: 13, color: colors.muted, marginTop: 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  link: { fontSize: 13, fontWeight: '600', color: colors.primary },
  empty: { color: colors.muted, textAlign: 'center', paddingVertical: 24 },
  addButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: colors.primary, borderRadius: 14, height: 52, marginTop: 6,
  },
  addText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});