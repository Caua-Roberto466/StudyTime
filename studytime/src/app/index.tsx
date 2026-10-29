import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { colors } from '@/theme/colors';
import { useAuth } from '@/contexts/auth';

export default function Home() {
  const { user, loading, signOut } = useAuth();

  if (loading) return null;
  if (!user) return <Redirect href="/login" />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Olá, {user.name}!</Text>
      <Text style={styles.email}>{user.email}</Text>

      <TouchableOpacity style={styles.button} onPress={signOut}>
        <Text style={styles.buttonText}>Sair (teste)</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 20, color: colors.text },
  email: { color: colors.text, marginTop: 4 },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginTop: 32,
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});