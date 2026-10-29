import { useState } from "react"
import { Text, TextInput, TouchableOpacity, View, StyleSheet, Alert } from "react-native"
import { router } from 'expo-router'
import { colors } from "@/theme/colors";
import { createUser } from "@/database/db";
import { useAuth } from '@/contexts/auth'

export default function Cadastro(){
    const { signIn } = useAuth()
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    async function handleCadastro(){
        if(!name.trim() || !email.trim() || !password.trim()){
            Alert.alert("Atenção, preencha todos os campos")
            return
        }else if(password.length < 6){
            Alert.alert("Atenção, a senha deve ter 6 caracteres ou mais")
            return
        }
        try{
            const id = await createUser(name.trim(), email.trim().toLowerCase(), password)
            await signIn(id)
            router.replace('/')
        }catch (e){
            Alert.alert("Email já cadastrado")
        }
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Criar Conta</Text>

            <TextInput style={styles.input} placeholder="Nome" value={name} onChangeText={setName} />
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

            <TouchableOpacity style={styles.button} onPress={handleCadastro}>
                <Text style={styles.buttonText}>Cadastrar</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.replace('/login')}>
                <Text style={styles.link}>Já tenho uma conta</Text>
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