import { Text, View } from 'react-native';
import { Redirect } from 'expo-router';
import { colors } from '@/theme/colors';
import { useAuth } from '@/contexts/auth';

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) return null;                          // ainda lendo o banco
  if (!user) return <Redirect href="/login" />;      // ninguém logado

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 20, color: colors.text }}>Olá, {user.name}!</Text>
      <Text style={{ color: colors.text }}>{user.email}</Text>
    </View>
  );
}