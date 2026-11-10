import { Ionicons } from '@expo/vector-icons';

export type IconName = keyof typeof Ionicons.glyphMap;

export const DEFAULT_ICON: IconName = 'book-outline';

// Ícones que o usuário pode escolher
export const ICON_OPTIONS: IconName[] = [
  'book-outline', 'calculator-outline', 'flask-outline', 'code-slash-outline',
  'language-outline', 'globe-outline', 'leaf-outline', 'color-palette-outline',
  'musical-notes-outline', 'barbell-outline', 'briefcase-outline', 'bulb-outline',
  'school-outline', 'library-outline', 'rocket-outline',
];

export const SUBJECT_COLORS = [
  '#7C3AED', '#2563EB', '#0D9488', '#16A34A',
  '#D97706', '#EA580C', '#DB2777', '#DC2626',
];

// O banco guarda texto. Esta função garante um ícone válido (nunca quebra o app)
export function toIcon(name: string | null | undefined): IconName {
  return name && name in Ionicons.glyphMap ? (name as IconName) : DEFAULT_ICON;
}