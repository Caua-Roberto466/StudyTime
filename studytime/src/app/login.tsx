import { useState } from "react";
import { Text, TextInput, TouchableOpacity, View, StyleSheet, Alert } from "react-native";
import { router } from "expo-router";
import { colors } from "@/theme/colors";
import { verifyLogin } from "@/database/db";
import { useAuth } from "@/contexts/auth";

export default function Login(){
    const { signIn } = useAuth()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    async function handleLogin(){
        const id = await verifyLogin(email.trim().toLowerCase(), password)
        if(id === null){
            Alert.alert("Erro! Email ou senha incorretos")
            return
        }
        await signIn(id)
        router.replace('/')
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Entrar</Text>

            <TextInput
                style={styles.input}
                placeholder="E-mail"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
            />
            <TextInput
                style={styles.input}
                placeholder="Senha"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />

            <TouchableOpacity style={styles.button} onPress={handleLogin}>
                <Text style={styles.buttonText}>Entrar</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.replace('/cadastro')}>
                <Text style={styles.link}>Criar uma conta</Text>
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 24, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '700', color: colors.text, marginBottom: 24 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.secondary,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    color: colors.text,
  },
  button: { backgroundColor: colors.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  link: { color: colors.primary, textAlign: 'center', marginTop: 16 },
});