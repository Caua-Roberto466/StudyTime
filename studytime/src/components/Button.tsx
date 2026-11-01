import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import { colors } from "@/theme/colors";

type Props = {
    label: string,
    onPress: () => void,
    loading?: boolean
}

export function Button({ label, onPress, loading = false }: Props){
    return(
        <Pressable
            onPress={onPress}
            disabled={loading}
            style={({ pressed }) => [
                styles.button,
                (pressed || loading) && styles.dimmed
            ]}
        >
            {loading ? (
                <ActivityIndicator color="#fff" />
            ) : (
                <Text style={styles.label}>{label}</Text>
            )}
        </Pressable>
    )
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  dimmed: { opacity: 0.8 },
  label: { color: '#fff', fontSize: 16, fontWeight: '700' },
});