import { Directory, File, Paths } from 'expo-file-system';

// Pasta permanente do app (o sistema não apaga como faz com o cache)
const attachmentsDir = new Directory(Paths.document, 'attachments');

// Copia a imagem temporária para a pasta permanente e devolve só o NOME
export async function saveAttachment(sourceUri: string): Promise<string> {
  attachmentsDir.create({ intermediates: true, idempotent: true });

  const raw = sourceUri.split('?')[0].split('.').pop() ?? '';
  const ext = /^[a-z0-9]{2,5}$/i.test(raw) ? raw : 'jpg';
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  await new File(sourceUri).copy(new File(attachmentsDir, name));
  return name;
}

// Nome salvo no banco -> URI que o <Image> consegue abrir
export function attachmentUri(name: string) {
  return new File(attachmentsDir, name).uri;
}

// Texto JSON do banco -> lista de nomes (nunca quebra)
export function parseAttachments(json: string | null): string[] {
  if (!json) return [];
  try {
    const value = JSON.parse(json);
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}