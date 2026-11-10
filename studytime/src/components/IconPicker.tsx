import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { ICON_OPTIONS, IconName } from '@/theme/icons';

type Props = {
  value: IconName | null;
  onChange: (icon: IconName) => void;
  color?: string;
};

export function IconPicker({ value, onChange, color = colors.primary }: Props) {
  return (
    <View style={styles.grid}>
      {ICON_OPTIONS.map((name) => {
        const active = value === name;
        return (
          <Pressable
            key={name}
            onPress={() => onChange(name)}
            style={[styles.cell, active && { backgroundColor: color, borderColor: color }]}>
            <Ionicons name={name} size={22} color={active ? '#fff' : color} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cell: {
    width: 48, height: 48, borderRadius: 12,
    borderWidth: 1.5, borderColor: colors.secondary, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
});