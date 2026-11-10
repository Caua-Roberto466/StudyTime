import { Activity, setActivityCompleted, setCalendarEventId } from '@/database/db';
import { removeDeadlineFromCalendar } from '@/utils/deviceCalendar';

// Marca/desmarca como concluída e, se concluiu, apaga o alarme da agenda.
// Devolve a atividade já atualizada, para a tela trocar só aquele item.
export async function toggleActivityCompleted(a: Activity, userId: number): Promise<Activity> {
  const completing = a.completed === 0;
  await setActivityCompleted(a.id, userId, completing);

  let eventId = a.calendar_event_id;
  if (completing && eventId) {
    await removeDeadlineFromCalendar(eventId);
    await setCalendarEventId(a.id, userId, null);
    eventId = null;
  }

  return { ...a, completed: completing ? 1 : 0, calendar_event_id: eventId };
}