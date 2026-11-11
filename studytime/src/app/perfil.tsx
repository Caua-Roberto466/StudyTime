import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Redirect, router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

import { colors } from '@/theme/colors';
import { cardShadow } from '@/theme/shadows';
import { useAuth } from '@/contexts/auth';
import { Activity, getAllActivities } from '@/database/db';
import { formatMonthTitle } from '@/utils/dates';
import { ScreenLayout } from '@/components/ScreenLayout';
import { ScreenHero } from '@/components/ScreenHero';
import { Avatar } from '@/components/Avatar';
import { HistoryItem } from '@/components/HistoryItem';

const PREVIEW_COUNT = 6;

// Agrupa o histórico (já ordenado do mais recente ao mais antigo) por mês
function groupByMonth(list: Activity[]) {
  const groups: { key: string; title: string; items: Activity[] }[] = [];
  for (const a of list) {
    const key = a.data_entrega.slice(0, 7); // 'YYYY-MM'
    let group = groups[groups.length - 1];
    if (!group || group.key !== key) {
      group = { key, title: formatMonthTitle(key), items: [] };
      groups.push(group);
    }
    group.items.push(a);
  }
  return groups;
}

function Stat({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function Perfil() {
  const { user, loading, signOut } = useAuth();
  const userId = user?.id;
  const [all, setAll] = useState<Activity[]>([]);
  const [showAll, setShowAll] = useState(false);

  // carrega as atividades para o histórico e as estatísticas
  useFocusEffect(
    useCallback(() => {
      if (userId === undefined) return;
      let active = true;
      getAllActivities(userId).then((list) => {
        if (active) setAll(list);
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

  const completed = all.filter((a) => a.completed === 1).reverse();
  const pendingCount = all.length - completed.length;
  const rate = all.length > 0 ? Math.round((completed.length / all.length) * 100) : 0;

  const visible = showAll ? completed : completed.slice(0, PREVIEW_COUNT);
  const hiddenCount = completed.length - PREVIEW_COUNT;

  return (
    <ScreenLayout>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        {/* foto e identificação */}
        <ScreenHero style={styles.hero}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Editar foto de perfil"
            onPress={() => router.push('/configuracoes')}>
            <View style={styles.avatarRing}>
              <Avatar name={user.name} avatar={user.avatar} size={104} />
            </View>
            <View style={styles.editBadge}>
              <Ionicons name="camera" size={16} color={colors.primary} />
            </View>
          </Pressable>

          <Text style={styles.heroName} numberOfLines={1}>{user.name}</Text>
          <Text style={styles.heroEmail} numberOfLines={1}>{user.email}</Text>

          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.editButton, pressed && { opacity: 0.75 }]}
            onPress={() => router.push('/configuracoes')}>
            <Ionicons name="create-outline" size={16} color="#fff" />
            <Text style={styles.editText}>Editar perfil</Text>
          </Pressable>
        </ScreenHero>

        {/* estatísticas: flutuam sobre a borda do topo */}
        <View style={[styles.stats, cardShadow]}>
          <Stat value={String(completed.length)} label="Concluídas" color={colors.success} />
          <View style={styles.statDivider} />
          <Stat value={String(pendingCount)} label="Pendentes" color={colors.primary} />
          <View style={styles.statDivider} />
          <Stat value={`${rate}%`} label="Conclusão" color={colors.text} />
        </View>

        {/* histórico de atividades concluídas */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Atividades concluídas</Text>
            {completed.length > 0 && (
              <View style={styles.countChip}>
                <Text style={styles.countText}>{completed.length}</Text>
              </View>
            )}
          </View>

          {completed.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons name="ribbon-outline" size={26} color={colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>Seu histórico começa aqui</Text>
              <Text style={styles.emptyText}>
                As atividades que você concluir aparecem nesta lista.
              </Text>
            </View>
          ) : (
            <>
              {groupByMonth(visible).map((group) => (
                <View key={group.key}>
                  <Text style={styles.month}>{group.title}</Text>
                  {group.items.map((a) => (
                    <HistoryItem
                      key={a.id}
                      activity={a}
                      onPress={() => router.push({ pathname: '/atividade/[id]', params: { id: String(a.id) } })}
                    />
                  ))}
                </View>
              ))}

              {hiddenCount > 0 && (
                <Pressable
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.moreButton, pressed && { opacity: 0.8 }]}
                  onPress={() => setShowAll((v) => !v)}>
                  <Text style={styles.moreText}>
                    {showAll ? 'Mostrar menos' : `Mostrar mais ${hiddenCount}`}
                  </Text>
                  <Ionicons
                    name={showAll ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={colors.primary}
                  />
                </Pressable>
              )}
            </>
          )}
        </View>

        {/* sair */}
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [styles.logout, pressed && { opacity: 0.8 }]}
          onPress={confirmSignOut}>
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
  content: { paddingBottom: 32 },

  hero: { alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 68 },
  avatarRing: { padding: 4, borderRadius: 60, backgroundColor: '#fff' },
  editBadge: {
    position: 'absolute', right: 2, bottom: 2,
    width: 34, height: 34, borderRadius: 17, backgroundColor: '#fff',
    borderWidth: 3, borderColor: colors.primaryDark,
    alignItems: 'center', justifyContent: 'center',
  },
  heroName: { fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: -0.4, marginTop: 16 },
  heroEmail: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  editButton: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16,
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  editText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  stats: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.card, borderRadius: 24,
    paddingVertical: 18, marginTop: -40, marginHorizontal: 20,
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  statLabel: { fontSize: 12, fontWeight: '600', color: colors.muted, marginTop: 2 },
  statDivider: { width: 1, height: 34, backgroundColor: colors.border },

  section: { paddingHorizontal: 20, marginTop: 28 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.text, letterSpacing: -0.2 },
  countChip: {
    backgroundColor: colors.surface, borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 2, minWidth: 24, alignItems: 'center',
  },
  countText: { fontSize: 12, fontWeight: '800', color: colors.primaryDark },
  month: { fontSize: 13, fontWeight: '700', color: colors.muted, marginTop: 14, marginBottom: 8 },

  moreButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    height: 46, borderRadius: 14, marginTop: 6,
    backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.secondary,
  },
  moreText: { fontSize: 14, fontWeight: '700', color: colors.primary },

  emptyCard: {
    alignItems: 'center', backgroundColor: colors.card, borderRadius: 22,
    paddingVertical: 28, paddingHorizontal: 24, marginTop: 12,
  },
  emptyIcon: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  emptyText: { fontSize: 14, color: colors.muted, textAlign: 'center', marginTop: 4, lineHeight: 20 },

  logout: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, height: 52, borderRadius: 14, borderWidth: 1.5, borderColor: '#FECACA',
    backgroundColor: '#FEF2F2', marginTop: 28, marginHorizontal: 20,
  },
  logoutText: { color: '#DC2626', fontSize: 15, fontWeight: '700' },
  version: { textAlign: 'center', color: colors.muted, fontSize: 12, marginTop: 20 },
});