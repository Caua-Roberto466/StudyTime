import { useEffect, useState } from 'react';
import {
  Alert, AlertButton, Pressable, ScrollView, StyleSheet, Switch, Text, View,
} from 'react-native';
import { Redirect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';

import { colors } from '@/theme/colors';
import { useAuth } from '@/contexts/auth';
import {
  changePassword, DEFAULT_SETTINGS, getSettings, saveSettings,
  setAvatar, Settings, updateProfile,
} from '@/database/db';
import { deleteAvatarFile, saveAvatar } from '@/utils/avatars';
import { ScreenLayout } from '@/components/ScreenLayout';
import { Avatar } from '@/components/Avatar';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type SettingRowProps = {
  title: string;
  subtitle: string;
  value: boolean;
  onChange: (value: boolean) => void;
};

function SettingRow({ title, subtitle, value, onChange }: SettingRowProps) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSub}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: colors.primary, false: '#D1D5DB' }}
        thumbColor="#fff"
      />
    </View>
  );
}

export default function Perfil() {
  const { user, loading, refreshUser, signOut } = useAuth();
  const userId = user?.id;
  const savedName = user?.name;
  const savedEmail = user?.email;

  const [name, setName] = useState(savedName ?? '');
  const [email, setEmail] = useState(savedEmail ?? '');
  const [savingProfile, setSavingProfile] = useState(false);

  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // mantém o formulário em sincronia com o que está salvo
  useEffect(() => {
    if (savedName !== undefined) setName(savedName);
    if (savedEmail !== undefined) setEmail(savedEmail);
  }, [savedName, savedEmail]);

  // carrega as preferências do usuário
  useEffect(() => {
    if (userId === undefined) return;
    let active = true;
    getSettings(userId).then((s) => {
      if (active) setSettings(s);
    });
    return () => { active = false; };
  }, [userId]);

  // hooks sempre ANTES dos returns condicionais
  if (loading) return null;
  if (!user) return <Redirect href="/login" />;

  const dirty =
    name.trim() !== user.name || email.trim().toLowerCase() !== user.email;

  /* ───── foto de perfil ───── */

  async function applyAvatar(uri: string) {
    if (!user) return;
    const previous = user.avatar;
    const file = await saveAvatar(uri);   // 1) copia para a pasta permanente
    await setAvatar(user.id, file);       // 2) grava o nome no banco
    await refreshUser();                  // 3) atualiza o app todo
    await deleteAvatarFile(previous);     // 4) só agora apaga a foto antiga
  }

  async function pickAvatar(source: 'camera' | 'gallery') {
    try {
      if (source === 'camera') {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('Permissão negada', 'Libere a câmera nas configurações do celular.');
          return;
        }
      }
      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync({
              mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8,
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8,
            });

      if (!result.canceled) await applyAvatar(result.assets[0].uri);
    } catch {
      Alert.alert('Erro', 'Não foi possível atualizar a foto.');
    }
  }

  async function removeAvatar() {
    if (!user) return;
    try {
      const previous = user.avatar;
      await setAvatar(user.id, null);
      await refreshUser();
      await deleteAvatarFile(previous);
    } catch {
      Alert.alert('Erro', 'Não foi possível remover a foto.');
    }
  }

  function openAvatarMenu() {
    if (!user) return;
    // o Android mostra no máximo 3 botões: quem tem foto troca "Cancelar" por "Remover"
    const buttons: AlertButton[] = [
      { text: 'Tirar foto', onPress: () => pickAvatar('camera') },
      { text: 'Escolher da galeria', onPress: () => pickAvatar('gallery') },
      user.avatar
        ? { text: 'Remover foto', style: 'destructive', onPress: removeAvatar }
        : { text: 'Cancelar', style: 'cancel' },
    ];
    Alert.alert('Foto de perfil', undefined, buttons, { cancelable: true });
  }

  /* ───── dados pessoais ───── */

  async function handleSaveProfile() {
    if (!user) return;
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName) {
      Alert.alert('Atenção', 'O nome não pode ficar vazio.');
      return;
    }
    if (!EMAIL_REGEX.test(cleanEmail)) {
      Alert.alert('Atenção', 'Digite um e-mail válido.');
      return;
    }

    setSavingProfile(true);
    try {
      await updateProfile(user.id, cleanName, cleanEmail);
      await refreshUser();
      Alert.alert('Pronto', 'Perfil atualizado.');
    } catch (e) {
      // o UNIQUE do e-mail faz o banco lançar erro se outra conta já usa
      const duplicate = String(e).includes('UNIQUE');
      Alert.alert(
        duplicate ? 'E-mail já cadastrado' : 'Erro',
        duplicate
          ? 'Já existe uma conta com esse e-mail.'
          : 'Não foi possível salvar o perfil.'
      );
    } finally {
      setSavingProfile(false);
    }
  }

  /* ───── preferências ───── */

  async function toggleSetting(key: keyof Settings, value: boolean) {
    if (!user) return;
    const previous = settings;
    const next = { ...settings, [key]: value ? 1 : 0 };
    setSettings(next); // a tela responde na hora
    try {
      await saveSettings(user.id, next);
    } catch {
      setSettings(previous); // não salvou: volta ao valor anterior
      Alert.alert('Erro', 'Não foi possível salvar a preferência.');
    }
  }

  /* ───── senha ───── */

  async function handleChangePassword() {
    if (!user) return;
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Atenção', 'Preencha os três campos.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Atenção', 'A nova senha precisa de ao menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Atenção', 'A confirmação não confere com a nova senha.');
      return;
    }
    if (newPassword === currentPassword) {
      Alert.alert('Atenção', 'A nova senha precisa ser diferente da atual.');
      return;
    }

    setSavingPassword(true);
    try {
      const ok = await changePassword(user.id, currentPassword, newPassword);
      if (!ok) {
        Alert.alert('Erro', 'A senha atual está incorreta.');
        return;
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      Alert.alert('Pronto', 'Senha alterada.');
    } catch {
      Alert.alert('Erro', 'Não foi possível alterar a senha.');
    } finally {
      setSavingPassword(false);
    }
  }

  /* ───── sair ───── */

  function confirmSignOut() {
    Alert.alert('Sair da conta', 'Deseja realmente sair?', [
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

  return (
    <ScreenLayout>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        {/* foto e identificação */}
        <View style={styles.hero}>
          <Pressable onPress={openAvatarMenu}>
            <Avatar name={user.name} avatar={user.avatar} size={104} />
            <View style={styles.cameraBadge}>
              <Ionicons name="camera" size={16} color="#fff" />
            </View>
          </Pressable>
          <Text style={styles.heroName}>{user.name}</Text>
          <Text style={styles.heroEmail}>{user.email}</Text>
        </View>

        {/* dados pessoais */}
        <Text style={styles.section}>Dados pessoais</Text>
        <Input
          icon="person-outline"
          placeholder="Nome completo"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />
        <Input
          icon="mail-outline"
          placeholder="E-mail"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
        {dirty && (
          <Button label="Salvar alterações" onPress={handleSaveProfile} loading={savingProfile} />
        )}

        {/* preferências */}
        <Text style={styles.section}>Preferências</Text>
        <View style={styles.card}>
          <SettingRow
            title="Alarme na agenda"
            subtitle="Atividades de prioridade alta entram na agenda do celular"
            value={settings.calendar_alarms === 1}
            onChange={(v) => toggleSetting('calendar_alarms', v)}
          />
          <View style={styles.divider} />
          <SettingRow
            title="Lembrete ligado por padrão"
            subtitle="Valor inicial do lembrete em novas atividades"
            value={settings.default_reminder === 1}
            onChange={(v) => toggleSetting('default_reminder', v)}
          />
        </View>

        {/* segurança */}
        <Text style={styles.section}>Segurança</Text>
        <View style={styles.card}>
          <Pressable style={styles.row} onPress={() => setShowPassword((s) => !s)}>
            <Ionicons name="lock-closed-outline" size={20} color={colors.primary} />
            <Text style={[styles.rowTitle, { flex: 1 }]}>Alterar senha</Text>
            <Ionicons
              name={showPassword ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={colors.muted}
            />
          </Pressable>

          {showPassword && (
            <View style={styles.passwordForm}>
              <Input
                icon="lock-closed-outline"
                placeholder="Senha atual"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                isPassword
              />
              <Input
                icon="key-outline"
                placeholder="Nova senha"
                value={newPassword}
                onChangeText={setNewPassword}
                isPassword
              />
              <Input
                icon="key-outline"
                placeholder="Confirmar nova senha"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                isPassword
              />
              <Button
                label="Salvar nova senha"
                onPress={handleChangePassword}
                loading={savingPassword}
              />
            </View>
          )}
        </View>

        {/* sair */}
        <Pressable style={styles.logout} onPress={confirmSignOut}>
          <Ionicons name="log-out-outline" size={20} color="#DC2626" />
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
  cameraBadge: {
    position: 'absolute', right: 0, bottom: 0,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.primary, borderWidth: 3, borderColor: colors.background,
    alignItems: 'center', justifyContent: 'center',
  },
  heroName: { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 14 },
  heroEmail: { fontSize: 14, color: colors.muted, marginTop: 2 },
  section: {
    fontSize: 13, fontWeight: '800', color: colors.muted,
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginTop: 24, marginBottom: 12,
  },
  card: { backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  rowTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  rowSub: { fontSize: 12, color: colors.muted, marginTop: 2 },
  divider: { height: 1, backgroundColor: colors.background },
  passwordForm: { paddingTop: 4, paddingBottom: 14 },
  logout: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 52, borderRadius: 14, borderWidth: 1.5, borderColor: '#FCA5A5',
    backgroundColor: '#fff', marginTop: 28,
  },
  logoutText: { color: '#DC2626', fontSize: 15, fontWeight: '700' },
  version: { textAlign: 'center', color: colors.muted, fontSize: 12, marginTop: 20 },
});