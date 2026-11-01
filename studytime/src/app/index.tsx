import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { colors } from '@/theme/colors';
import { useAuth } from '@/contexts/auth';
import { ScreenLayout } from '@/components/ScreenLayout';

export default function Home() {
  const { user, loading, signOut } = useAuth();

  if (loading) return null;
  if (!user) return <Redirect href="/login" />;

  return (
    <ScreenLayout>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 20, color: colors.text }}>Olá, {user.name}!</Text>
        <Text style={{ color: colors.text }}>{user.email}</Text>
        <TouchableOpacity style={styles.button} onPress={signOut}>
          <Text style={styles.buttonText}>Sair (teste)</Text>
        </TouchableOpacity>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginTop: 32,
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});