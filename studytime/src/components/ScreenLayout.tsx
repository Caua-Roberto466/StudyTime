import { ReactNode } from "react";
import { View } from "react-native";
import { StatusBar } from 'expo-status-bar'
import { colors } from "@/theme/colors";
import { Header } from "./Header";
import { Footer } from "./Footer";

export function ScreenLayout({children}: {children: ReactNode}){
    return(
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <StatusBar style="light"/>
            <Header />
            <View style={{flex: 1}}>{children}</View>
            <Footer />
        </View>
    )
}