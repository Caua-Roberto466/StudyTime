import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Redirect, router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

import { colors } from '@/theme/colors';
import { useAuth } from '@/contexts/auth';
import { Activity, getAllActivities } from '@/database/db';
import { ScreenLayout } from '@/components/ScreenLayout';
import { Avatar } from '@/components/Avatar';
import { ActivityCard } from '@/components/ActivityCard';

export default function Perfil() {
  const { user, loading, signOut } = useAuth();
  const userId = user?.id;
  const [completed, setCompleted] = useState<Activity[]>([]);

  // carrega o histórico de atividades concluídas
  useFocusEffect(
    useCallback(() => {
      if (userId === undefined) return;
      let active = true;
      getAllActivities(userId).then((list) => {
        if (!active) return;
        setCompleted(list.filter((a) => a.completed === 1).reverse());
      });
      return () => { active = false; };
    }, [userId])
  );

  if (loading) return null;
  if (!user) return <Redirect href="/login" />;

  async function confirmSignOut() {
    await signOut();
    router.replace('/login');
  }

  return (
    <ScreenLayout>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        {/* foto e identificação */}
        <View style={styles.hero}>
          <Pressable onPress={() => router.push('/configuracoes')}>
            <Avatar name={user.name} avatar={user.avatar} size={104} />
          </Pressable>
          <Text style={styles.heroName}>{user.name}</Text>
          <Text style={styles.heroEmail}>{user.email}</Text>
        </View>

        {/* histórico de atividades concluídas */}
        <Text style={styles.section}>Atividades concluídas</Text>
        {completed.length === 0 ? (
          <Text style={styles.empty}>Nenhuma atividade concluída ainda.</Text>
        ) : (
          completed.map((a) => (
            <ActivityCard
              key={a.id}
              activity={a}
              onPress={() => router.push({ pathname: '/atividade/[id]', params: { id: String(a.id) } })}
            />
          ))
        )}

        {/* sair */}
        <Pressable style={styles.logout} onPress={confirmSignOut}>
          <Ionicons name="log-out-outline" size={18} color="#DC2626" />
          <Text style={styles.logoutText}>Sair da conta</Text>
        </Pressable>

        <Text style={styles.version}>
          StudyTime v{Constants.expoConfig?.version ?? '1.0.0'}
        </Text>
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 32 },
  hero: { alignItems: 'center', marginBottom: 8 },
  heroName: { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 14 },
  heroEmail: { fontSize: 14, color: colors.muted, marginTop: 2 },
  section: {
    fontSize: 13, fontWeight: '800', color: colors.muted,
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginTop: 24, marginBottom: 12,
  },
  empty: { color: colors.muted, textAlign: 'center', paddingVertical: 24 },
  logout: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, height: 52, borderRadius: 14, borderWidth: 1.5, borderColor: '#FCA5A5',
    backgroundColor: '#fff', marginTop: 28,
  },
  logoutText: { color: '#DC2626', fontSize: 15, fontWeight: '700' },
  version: { textAlign: 'center', color: colors.muted, fontSize: 12, marginTop: 20 },
});
