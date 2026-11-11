// Sombras dos cards que "flutuam" na tela. Listas simples ficam sem sombra.
export const cardShadow = {
  shadowColor: '#4C1D95',
  shadowOpacity: 0.12,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 6 },
  elevation: 4,
} as const;

export const floatingShadow = {
  shadowColor: '#4C1D95',
  shadowOpacity: 0.35,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 8 },
  elevation: 8,
} as const;