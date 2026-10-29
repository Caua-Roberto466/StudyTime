import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, initDb, getLoggedUser, startSession, endSession } from "@/database/db";

type AuthState = {
    user: User | null
    loading: boolean
    signIn: (userId: number) => Promise<void>
    signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({children}: {children: ReactNode}){
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function load(){
            try{
                await initDb()
                setUser(await getLoggedUser())
            } catch (e){
                console.log('Erro ao carregar sessão', e)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    async function signIn(userId: number) {
        await startSession(userId)
        setUser(await getLoggedUser())
    }

    async function signOut() {
        await endSession()
        setUser(null)
    }
    return (
        <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth(){
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>');
    return ctx
}