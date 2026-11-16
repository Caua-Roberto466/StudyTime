import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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

function groupByMonth(list: Activity[]) {
  const groups: { key: string; title: string; items: Activity[] }[] = [];
  for (const a of list) {
    const key = a.data_entrega.slice(0, 7);
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
      <Text style={[styles.statValue, { color }]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      <Text style={styles.statLabel} numberOfLines={1}>{label}</Text>
    </View>
  );
}

export default function Perfil() {
  const { user, loading, signOut } = useAuth();
  const userId = user?.id;
  const [all, setAll] = useState<Activity[]>([]);
  const [showAll, setShowAll] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (userId === undefined) return;
      let active = true;
      getAllActivities(userId)
        .then((list) => { if (active) setAll(list); })
        .catch(() => { if (active) setAll([]); });
      return () => { active = false; };
    }, [userId])
  );

  if (loading) return null;
  if (!user) return <Redirect href="/login" />;

  const initial = user.name.trim().charAt(0).toLocaleUpperCase('pt-BR') || '?';
  const completed = all.filter((a) => a.completed === 1).reverse();
  const pendingCount = all.length - completed.length;
  const rate = all.length > 0 ? Math.round((completed.length / all.length) * 100) : 0;
  const visible = showAll ? completed : completed.slice(0, PREVIEW_COUNT);
  const hiddenCount = Math.max(0, completed.length - PREVIEW_COUNT);

  function confirmSignOut() {
    Alert.alert('Sair da conta?', 'Você poderá entrar novamente quando quiser.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/login');
        },
      },
    ]);
  }

  const progressText = all.length === 0
    ? 'Comece adicionando sua primeira atividade.'
    : rate === 100
      ? 'Parabéns! Todas as atividades foram concluídas.'
      : `${pendingCount} ${pendingCount === 1 ? 'atividade pendente' : 'atividades pendentes'} para finalizar.`;

  return (
    <ScreenLayout>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        <ScreenHero style={styles.hero}>
          <Text style={styles.heroEyebrow}>SEU ESPAÇO</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Alterar foto de perfil"
            style={({ pressed }) => [styles.avatarTap, pressed && styles.pressed]}
            onPress={() => router.push('/configuracoes')}>
            <View style={styles.avatarRing}>
              {user.avatar ? (
                <Avatar name={user.name} avatar={user.avatar} size={92} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarInitial}>{initial}</Text>
                </View>
              )}
            </View>
            <View style={styles.editBadge}>
              <Ionicons name="camera" size={15} color={colors.primary} />
            </View>
          </Pressable>

          <Text style={styles.heroName} numberOfLines={2}>{user.name}</Text>
          <Text style={styles.heroEmail} numberOfLines={2}>{user.email}</Text>

          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}
            onPress={() => router.push('/configuracoes')}>
            <Ionicons name="create-outline" size={17} color={colors.primary} />
            <Text style={styles.editText}>Editar perfil</Text>
            <Ionicons name="arrow-forward" size={16} color={colors.primary} />
          </Pressable>
        </ScreenHero>

        <View style={styles.body}>
          <View style={styles.sectionIntro}>
            <Text style={styles.eyebrow}>SUA JORNADA</Text>
            <Text style={styles.sectionTitle}>Resumo dos estudos</Text>
            <Text style={styles.sectionDescription}>Cada atividade concluída é mais um passo.</Text>
          </View>

          <View style={[styles.statsCard, cardShadow]}>
            <View style={styles.statsRow}>
              <Stat value={String(completed.length)} label="Concluídas" color={colors.success} />
              <View style={styles.statDivider} />
              <Stat value={String(pendingCount)} label="Pendentes" color={colors.primary} />
              <View style={styles.statDivider} />
              <Stat value={`${rate}%`} label="Conclusão" color={colors.text} />
            </View>
            <View style={styles.statsDivider} />
            <View style={styles.rateRow}>
              <Text style={styles.rateLabel}>Progresso geral</Text>
              <Text style={styles.rateValue}>{rate}%</Text>
            </View>
            <View
              style={styles.track}
              accessibilityRole="progressbar"
              accessibilityLabel="Progresso de atividades concluídas"
              accessibilityValue={{ min: 0, max: 100, now: rate }}>
              <View style={[styles.trackFill, { width: `${rate}%` as `${number}%` }]} />
            </View>
            <Text style={styles.progressText}>{progressText}</Text>
          </View>

          <View style={styles.historyHeader}>
            <View>
              <Text style={styles.eyebrow}>SUAS CONQUISTAS</Text>
              <Text style={styles.sectionTitle}>Atividades concluídas</Text>
            </View>
            <View style={styles.countChip}>
              <Text style={styles.countText}>{completed.length}</Text>
            </View>
          </View>

          {completed.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons name="ribbon-outline" size={28} color={colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>Seu histórico começa aqui</Text>
              <Text style={styles.emptyText}>
                Quando concluir uma atividade, ela aparecerá aqui para você acompanhar suas conquistas.
              </Text>
              <Pressable
                accessibilityRole="button"
                style={({ pressed }) => [styles.emptyAction, pressed && styles.pressed]}
                onPress={() => router.push('/estudar')}>
                <Text style={styles.emptyActionText}>Ver minhas atividades</Text>
                <Ionicons name="arrow-forward" size={15} color={colors.primary} />
              </Pressable>
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
                  style={({ pressed }) => [styles.moreButton, pressed && styles.pressed]}
                  onPress={() => setShowAll((v) => !v)}>
                  <Text style={styles.moreText}>
                    {showAll ? 'Mostrar menos' : `Mostrar mais ${hiddenCount}`}
                  </Text>
                  <Ionicons
                    name={showAll ? 'chevron-up' : 'chevron-down'}
                    size={17}
                    color={colors.primary}
                  />
                </Pressable>
              )}
            </>
          )}

          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.logout, pressed && styles.pressed]}
            onPress={confirmSignOut}>
            <Ionicons name="log-out-outline" size={20} color="#DC2626" />
            <Text style={styles.logoutText}>Sair da conta</Text>
          </Pressable>
          <Text style={styles.version}>
            StudyTime v{Constants.expoConfig?.version ?? '1.0.0'}
          </Text>
        </View>
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 36 },
  pressed: { opacity: 0.75 },

  hero: { alignItems: 'center', paddingHorizontal: 22, paddingTop: 18, paddingBottom: 30 },
  heroEyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5, color: '#E8DCFF', marginBottom: 19 },
  avatarTap: { position: 'relative' },
  avatarRing: { padding: 4, borderRadius: 60, backgroundColor: '#FFFFFF' },
  avatarFallback: {
    width: 92, height: 92, borderRadius: 46,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.secondary,
  },
  avatarInitial: {
    fontSize: 39, fontWeight: '800', color: colors.primary,
  },
  editBadge: {
    position: 'absolute', right: -2, bottom: 2,
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFFFFF',
    borderWidth: 3, borderColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  heroName: { marginTop: 14, fontSize: 25, lineHeight: 30, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.6, textAlign: 'center' },
  heroEmail: { fontSize: 13, lineHeight: 19, color: '#EEE7FF', marginTop: 4, textAlign: 'center' },
  editButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9,
    marginTop: 18, paddingHorizontal: 18, minHeight: 43,
    borderRadius: 14, backgroundColor: '#FFFFFF',
  },
  editText: { color: colors.primary, fontSize: 13, fontWeight: '800' },

  body: { paddingHorizontal: 20, paddingTop: 27 },
  sectionIntro: { marginBottom: 17 },
  eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2, color: colors.primary, marginBottom: 5 },
  sectionTitle: { fontSize: 21, lineHeight: 27, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  sectionDescription: { fontSize: 13, fontWeight: '500', color: colors.muted, marginTop: 5 },

  statsCard: { backgroundColor: colors.card, borderRadius: 24, paddingTop: 22, paddingBottom: 20, paddingHorizontal: 18 },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  stat: { flex: 1, minWidth: 0, alignItems: 'center' },
  statValue: { fontSize: 26, fontWeight: '800', letterSpacing: -0.6 },
  statLabel: { fontSize: 11, fontWeight: '600', color: colors.muted, marginTop: 5 },
  statDivider: { width: 1, height: 40, backgroundColor: colors.border },
  statsDivider: { height: 1, backgroundColor: colors.border, marginTop: 22, marginBottom: 19 },
  rateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rateLabel: { fontSize: 13, fontWeight: '700', color: colors.text },
  rateValue: { fontSize: 13, fontWeight: '800', color: colors.primary },
  track: { height: 9, borderRadius: 5, backgroundColor: colors.surface, overflow: 'hidden', marginTop: 11 },
  trackFill: { height: '100%', borderRadius: 5, backgroundColor: colors.primary },
  progressText: { fontSize: 12, lineHeight: 18, fontWeight: '500', color: colors.muted, marginTop: 10 },

  historyHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginTop: 32, marginBottom: 15 },
  countChip: { backgroundColor: colors.surface, borderRadius: 11, paddingHorizontal: 10, paddingVertical: 5, minWidth: 30, alignItems: 'center', marginBottom: 2 },
  countText: { fontSize: 12, fontWeight: '800', color: colors.primary },
  month: { fontSize: 12, fontWeight: '800', color: colors.muted, marginTop: 12, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.6 },

  emptyCard: { alignItems: 'center', backgroundColor: colors.card, borderRadius: 22, borderWidth: 1, borderColor: colors.border, paddingVertical: 30, paddingHorizontal: 22 },
  emptyIcon: { width: 60, height: 60, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  emptyText: { fontSize: 13, lineHeight: 20, color: colors.muted, textAlign: 'center', marginTop: 6 },
  emptyAction: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 14, paddingHorizontal: 10, paddingVertical: 8 },
  emptyActionText: { color: colors.primary, fontSize: 13, fontWeight: '800' },

  moreButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    minHeight: 48, borderRadius: 15, marginTop: 6,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.secondary,
  },
  moreText: { fontSize: 13, fontWeight: '800', color: colors.primary },
  logout: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9,
    minHeight: 52, borderRadius: 16, borderWidth: 1, borderColor: '#FECACA',
    backgroundColor: '#FFF7F7', marginTop: 32,
  },
  logoutText: { color: '#DC2626', fontSize: 14, fontWeight: '800' },
  version: { textAlign: 'center', color: '#9B94AA', fontSize: 11, marginTop: 20 },
});
