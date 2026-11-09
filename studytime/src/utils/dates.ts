export const MONTHS = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

export const pad = (n: number) => String(n).padStart(2, '0');

// Date -> '2026-11-03T14:00' (horário LOCAL)
export function toLocalISO(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Date -> '2026-11-03'
export function toDateKey(d: Date) {
  return toLocalISO(d).split('T')[0];
}

export function getWeekRange(now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7)); // segunda = 0
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return { start: toLocalISO(start), end: toLocalISO(end) };
}

// '2026-11-03T14:00' -> 'Amanhã • 14:00'
export function formatDue(iso: string, now = new Date()) {
  const [date, time = '00:00'] = iso.split('T');
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const [, month, day] = date.split('-');

  const label =
    date === toDateKey(now) ? 'Hoje' : date === toDateKey(tomorrow) ? 'Amanhã' : `${day}/${month}`;
  return `${label} • ${time}`;
}

// '2026-11-03' -> 'Hoje, 3 de novembro' ou '3 de novembro'
export function formatDayTitle(key: string, now = new Date()) {
  const [, m, d] = key.split('-').map(Number);
  const text = `${d} de ${MONTHS[m - 1]}`;
  return key === toDateKey(now) ? `Hoje, ${text}` : text;
}

// Date -> '03/11/2026' e '14:00' (para mostrar no formulário)
export const formatDate = (d: Date) =>
  `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
export const formatTime = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;