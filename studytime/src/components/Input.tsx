import { useState } from "react";
import { Pressable, StyleSheet, TextInput, TextInputProps, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/theme/colors";

type Props = TextInputProps & {
    icon: keyof typeof Ionicons.glyphMap;
    isPassword?: boolean
}

export function Input({icon, isPassword = false, ...rest}: Props){
    const [hidden, setHidden] = useState(true)
    const [focused, setFocused] = useState(false)

    return(
        <View style={[styles.box, focused && styles.boxFocused]}>
            <Ionicons name={icon} size={20} color={colors.primary} />

            <TextInput
                style={styles.input}
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                secureTextEntry={isPassword && hidden}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                {...rest}
            />

            {isPassword && (
                <Pressable onPress={() => setHidden((h) => (!h))} hitSlop={10}>
                    <Ionicons
                        name={hidden ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color="#9CA3AF"                    />
                </Pressable>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: colors.secondary,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 54,
    marginBottom: 14,
  },
  boxFocused: { borderColor: colors.primary },
  input: { flex: 1, fontSize: 16, color: colors.text },
});