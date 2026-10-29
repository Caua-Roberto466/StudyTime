import { Image, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/theme/colors";
import { useAuth } from "@/contexts/auth";

export function Header(){
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const initial: string = (user?.name ?? '?').charAt(0).toUpperCase();

    return (
        <View style={[styles.container, { padding: insets.top + 8 }]}>
            <View style={styles.brand}>
                <Image
                    source={require('../../assets/StudyTime-logo.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />
                <Text style={styles.title}>StudyTime</Text>
            </View>
            <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initial}</Text>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logo: { width: 32, height: 32 },
  title: { color: colors.background, fontSize: 20, fontWeight: '700' },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.primary, fontWeight: '700', fontSize: 16 },
});