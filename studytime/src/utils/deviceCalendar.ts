import { Platform } from 'react-native';
import * as Calendar from 'expo-calendar/legacy';

// Escolhe onde gravar: prefere a agenda principal editável (a da conta Google,
// que sincroniza com os outros aparelhos). Se não houver, cria uma local.
async function getWritableCalendarId(): Promise<string | null> {
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const writable = calendars.filter((c) => c.allowsModifications);
  const chosen = writable.find((c) => c.isPrimary) ?? writable[0];
  if (chosen) return chosen.id;

  if (Platform.OS === 'android') {
    return Calendar.createCalendarAsync({
      title: 'StudyTime',
      color: '#7C3AED',
      entityType: Calendar.EntityTypes.EVENT,
      source: { isLocalAccount: true, name: 'StudyTime', type: Calendar.SourceType.LOCAL },
      name: 'studytime',
      ownerAccount: 'StudyTime',
      accessLevel: Calendar.CalendarAccessLevel.OWNER,
    });
  }
  return null;
}

type Deadline = { title: string; dueAt: Date; notes?: string | null };

// Devolve o id do evento criado, ou null se não foi possível (sem permissão etc.)
export async function addDeadlineToCalendar({ title, dueAt, notes }: Deadline) {
  if (!(await Calendar.isAvailableAsync())) return null;

  let permission = await Calendar.getCalendarPermissionsAsync();
  if (!permission.granted) permission = await Calendar.requestCalendarPermissionsAsync();
  if (!permission.granted) return null;

  const calendarId = await getWritableCalendarId();
  if (!calendarId) return null;

  // alarmes (em minutos antes do início); descarta os que já passaram
  const minutesAhead = (dueAt.getTime() - Date.now()) / 60000;
  const alarms = [-1440, -60, 0]
    .filter((offset) => minutesAhead + offset > 0)
    .map((relativeOffset) => ({ relativeOffset }));

  return Calendar.createEventAsync(calendarId, {
    title: `Entrega: ${title}`,
    notes: notes ?? 'Atividade de alta prioridade criada no StudyTime.',
    startDate: dueAt,
    endDate: new Date(dueAt.getTime() + 60 * 60 * 1000), // dura 1 hora
    alarms,
  });
}

// Remove o evento (ex.: quando a atividade é concluída)
export async function removeDeadlineFromCalendar(eventId: string) {
  try {
    const permission = await Calendar.getCalendarPermissionsAsync();
    if (!permission.granted) return;
    await Calendar.deleteEventAsync(eventId);
  } catch {
    // o evento já foi apagado pelo usuário ou a permissão foi revogada: ignorar
  }
}