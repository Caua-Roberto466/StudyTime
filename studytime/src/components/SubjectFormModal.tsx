import { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';
import { DEFAULT_ICON, IconName, SUBJECT_COLORS } from '@/theme/icons';
import { Input } from './Input';
import { Button } from './Button';
import { IconPicker } from './IconPicker';

type Data = { name: string; icon: IconName; color: string };

type Props = {
  visible: boolean;
  onClose: () => void;
  // devolve true se salvou (aí o modal fecha)
  onSave: (data: Data) => Promise<boolean>;
};

export function SubjectFormModal({ visible, onClose, onSave }: Props) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState<IconName>(DEFAULT_ICON);
  const [color, setColor] = useState(SUBJECT_COLORS[0]);
  const [saving, setSaving] = useState(false);

  // limpa o formulário toda vez que o modal abre
  useEffect(() => {
    if (visible) {
      setName('');
      setIcon(DEFAULT_ICON);
      setColor(SUBJECT_COLORS[0]);
    }
  }, [visible]);

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert('Atenção', 'Dê um nome para a matéria.');
      return;
    }
    setSaving(true);
    try {
      const ok = await onSave({ name: name.trim(), icon, color });
      if (ok) onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        {/* toque fora do painel fecha o modal */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View style={styles.sheet}>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>Nova matéria</Text>

            <Input
              icon="bookmark-outline"
              placeholder="Ex: Matemática"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              maxLength={30}
            />

            <Text style={styles.label}>Ícone</Text>
            <IconPicker value={icon} onChange={setIcon} color={color} />

            <Text style={[styles.label, { marginTop: 18 }]}>Cor</Text>
            <View style={styles.colors}>
              {SUBJECT_COLORS.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setColor(c)}
                  style={[
                    styles.colorDot,
                    { backgroundColor: c },
                    color === c && styles.colorDotActive,
                  ]}
                />
              ))}
            </View>

            <Button label="Criar matéria" onPress={handleSave} loading={saving} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(39,33,58,0.45)' },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 28, maxHeight: '90%',
  },
  title: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 8 },
  colors: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  colorDot: { width: 36, height: 36, borderRadius: 18, borderWidth: 3, borderColor: 'transparent' },
  colorDotActive: { borderColor: colors.text },
});