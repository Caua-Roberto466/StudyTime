// App.tsx
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { AnimatedSplash } from './src/components/AnimatedSplash';
import { colors } from './src/theme/colors';

// Impede que a splash nativa suma sozinha
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appReady, setAppReady] = useState(false);
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Aqui entram fontes, dados salvos, login, etc.
        await new Promise((resolve) => setTimeout(resolve, 500));
      } finally {
        setAppReady(true);
      }
    }
    prepare();
  }, []);

  useEffect(() => {
    // Quando o app está pronto, some a splash nativa
    // (a animada já está por cima com o mesmo visual)
    if (appReady) SplashScreen.hideAsync();
  }, [appReady]);

  if (!appReady) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Bem-vindo ao StudyTime 📚</Text>
      {!splashDone && <AnimatedSplash onFinish={() => setSplashDone(true)} />}
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
  text: { fontSize: 20, color: colors.text },
});