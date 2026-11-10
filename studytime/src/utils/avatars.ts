import { Directory, File, Paths } from 'expo-file-system';

// Pasta permanente das fotos de perfil
const avatarsDir = new Directory(Paths.document, 'avatars');

// Copia a foto temporária para a pasta permanente e devolve só o NOME
export async function saveAvatar(sourceUri: string): Promise<string> {
  avatarsDir.create({ intermediates: true, idempotent: true });

  const raw = sourceUri.split('?')[0].split('.').pop() ?? '';
  const ext = /^[a-z0-9]{2,5}$/i.test(raw) ? raw : 'jpg';
  // nome novo a cada foto: evita o <Image> mostrar a versão antiga em cache
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`;

  await new File(sourceUri).copy(new File(avatarsDir, name));
  return name;
}

export function avatarUri(name: string) {
  return new File(avatarsDir, name).uri;
}

// Apaga o arquivo da foto antiga (se já não existir, não faz nada)
export async function deleteAvatarFile(name: string | null) {
  if (!name) return;
  try {
    await new File(avatarsDir, name).delete();
  } catch {
    // arquivo já não existe: ignorar
  }
}