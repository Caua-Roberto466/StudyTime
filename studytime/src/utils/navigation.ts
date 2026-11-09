// src/utils/navigation.ts
import { Href, router } from 'expo-router';

// Volta para a tela anterior; se não houver, vai para o destino de reserva
export function goBack(fallback: Href = '/') {
  if (router.canGoBack()) router.back();
  else router.replace(fallback);
}