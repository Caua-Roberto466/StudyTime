import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '@/theme/colors';
import { createUser } from '@/database/db';
import { useAuth } from '@/contexts/auth';
import { AuthScreen } from '@/components/AuthScreeen';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';

export default function Cadastro() {
  const { signIn } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleCadastro() {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert('Atenção', 'Preencha todos os campos.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Atenção', 'A senha precisa de ao menos 6 caracteres.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Atenção', 'As senhas não conferem.');
      return;
    }

    setLoading(true);
    try {
      const id = await createUser(name.trim(), email.trim().toLowerCase(), password);
      await signIn(id);
      router.replace('/');
    } catch {
      // o UNIQUE do e-mail faz o banco lançar erro se já existir
      Alert.alert('Erro', 'Esse e-mail já está cadastrado.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthScreen>
      <Pressable
        onPress={() => router.replace('/login')}
        hitSlop={12}
        style={styles.back}>
        <Ionicons name="arrow-back" size={26} color={colors.text} />
      </Pressable>

      <Text style={styles.title}>Criar conta</Text>
      <Text style={styles.subtitle}>Preencha os dados abaixo</Text>

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
      <Input
        icon="lock-closed-outline"
        placeholder="Senha"
        value={password}
        onChangeText={setPassword}
        isPassword
      />
      <Input
        icon="lock-closed-outline"
        placeholder="Confirmar senha"
        value={confirm}
        onChangeText={setConfirm}
        isPassword
      />

      <Button label="Cadastrar" onPress={handleCadastro} loading={loading} />

      <View style={styles.footer}>
        <Text style={styles.footerText}>Já possui uma conta? </Text>
        <Pressable onPress={() => router.replace('/login')}>
          <Text style={styles.link}>Entrar</Text>
        </Pressable>
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  back: { alignSelf: 'flex-start', marginBottom: 24 },
  title: { fontSize: 32, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 15, color: '#6B7280', marginTop: 4, marginBottom: 28 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { color: '#6B7280', fontSize: 14 },
  link: { color: colors.primary, fontWeight: '700', fontSize: 14, textDecorationLine: 'underline' },
});