import { Image, StyleSheet, View } from "react-native";
import { colors } from "@/theme/colors";

export function AppLogo({size = 72}: {size?: number}){
    return(
        <View style={[
            styles.box, {width: size, height: size, borderRadius: size * 0.25}
        ]}>
            <Image 
                source={require('../../assets/StudyTime-logo.jpeg')}
                style={{width: size, height: size, borderRadius: size * 0.25}}
                resizeMode="contain"
            />
        </View>
    )
}

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});