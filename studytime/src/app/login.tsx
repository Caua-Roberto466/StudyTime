import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '@/theme/colors';
import { verifyLogin } from '@/database/db';
import { useAuth } from '@/contexts/auth';
import { AuthScreen } from '@/components/AuthScreeen';
import { AppLogo } from '@/components/AppLogo';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';

export default function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert('Atenção', 'Preencha e-mail e senha.');
      return;
    }

    setLoading(true);
    try {
      const id = await verifyLogin(email.trim().toLowerCase(), password);
      if (id === null) {
        Alert.alert('Erro', 'E-mail ou senha incorretos.');
        return;
      }
      await signIn(id);
      router.replace('/');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthScreen>
      <View style={styles.header}>
        <AppLogo />
        <Text style={styles.title}>StudyTime</Text>
        <Text style={styles.subtitle}>Faça login para continuar</Text>
      </View>

      <Input
        icon="mail-outline"
        placeholder="E-mail"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      <Input
        icon="lock-closed-outline"
        placeholder="Senha"
        value={password}
        onChangeText={setPassword}
        isPassword
      />

      <Button label="Entrar" onPress={handleLogin} loading={loading} />

      <View style={styles.divider}>
        <View style={styles.line} />
        <Text style={styles.dividerText}>ou continue com</Text>
        <View style={styles.line} />
      </View>

      <View style={styles.social}>
        <Pressable
          style={styles.socialButton}
          onPress={() => Alert.alert('Em breve', 'Login com Google ainda não disponível.')}>
          <Ionicons name="logo-google" size={22} color={colors.text} />
        </Pressable>
        <Pressable
          style={styles.socialButton}
          onPress={() => Alert.alert('Em breve', 'Login com Apple ainda não disponível.')}>
          <Ionicons name="logo-apple" size={24} color={colors.text} />
        </Pressable>
      </View>

      <Pressable onPress={() => router.replace('/cadastro')}>
        <Text style={styles.link}>Criar uma conta</Text>
      </Pressable>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', marginBottom: 32 },
  title: { fontSize: 32, fontWeight: '800', color: colors.text, marginTop: 16 },
  subtitle: { fontSize: 15, color: '#6B7280', marginTop: 4 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 24 },
  line: { flex: 1, height: 1, backgroundColor: colors.secondary },
  dividerText: { color: '#6B7280', fontSize: 13 },
  social: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 24 },
  socialButton: {
    flex: 1,
    height: 52,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: colors.secondary,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  link: { color: colors.primary, fontWeight: '700', textAlign: 'center', fontSize: 15 },
});