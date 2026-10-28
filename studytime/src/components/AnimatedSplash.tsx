import { useEffect, useRef } from "react";
import { Animated, StyleSheet } from "react-native";
import { colors } from '../theme/colors'

type Props = {
    onFinish: () => void;
};

const HOLD_MS = 900
const FADE_MS = 500

export function AnimatedSplash({ onFinish }: Props){
    const logoOpacity = useRef(new Animated.Value(0)).current;
    const logoScale = useRef(new Animated.Value(0.8)).current;
    const titleOpacity = useRef(new Animated.Value(0)).current;
    const containerOpacity = useRef(new Animated.Value(1)).current; 

    useEffect(() => {
    Animated.sequence([
      // 1) logo aparece e "pula" para o tamanho final
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 6,
          useNativeDriver: true,
        }),
      ]),
      // 2) o nome do app aparece
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      // 3) segura um instante para dar tempo de ler
      Animated.delay(HOLD_MS),
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: FADE_MS,
        useNativeDriver: true
      })
    ]).start(({ finished }) => {
      if (finished) onFinish();
    });
  }, []);

    return(
        <Animated.View style={[styles.container, { opacity: containerOpacity }]}>
            <Animated.Image
            source={require('../../assets/StudyTime-splash.png')}
            resizeMode={'contain'}
            style={[
                styles.logo,
                { opacity: logoOpacity, transform: [{ scale: logoScale }] },
            ]}
            />
            <Animated.Text style={[styles.title, {opacity:titleOpacity}]}>
                StudyTime
            </Animated.Text>
        </Animated.View>
    )
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFill,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center'
    },
    logo: {
    width: 200,
    height: 200,
    },
    title: {
        marginTop: 16,
        fontSize: 28,
        fontWeight: '700',
        color: colors.background,
    },
})