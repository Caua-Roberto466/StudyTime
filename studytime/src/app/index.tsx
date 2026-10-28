import { Text, View } from 'react-native';
import { colors } from '@/theme/colors';

export default function Home() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Text style={{ fontSize: 20, color: colors.text }}>
        Bem-vindo ao StudyTime 📚
      </Text>
    </View>
  );
}