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
/* ───────────── Usadas pelas telas Início e Perfil ───────────── */

const WEEKDAYS = [
  'domingo', 'segunda-feira', 'terça-feira', 'quarta-feira',
  'quinta-feira', 'sexta-feira', 'sábado',
];
const WEEKDAYS_SHORT = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// '2026-11-03T14:00' -> Date no horário LOCAL (sem depender do parser do Date)
export function parseLocal(iso: string) {
  const [date, time = '00:00'] = iso.split('T');
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  return new Date(y, m - 1, d, hh, mm);
}

// 'terça-feira, 10 de novembro'
export function formatLongDate(now = new Date()) {
  return `${WEEKDAYS[now.getDay()]}, ${now.getDate()} de ${MONTHS[now.getMonth()]}`;
}

export function greeting(now = new Date()) {
  const h = now.getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

// 'Em 25 min' | 'Em 3 h' | 'Em 2 dias'
export function timeLeft(iso: string, now = new Date()) {
  const diff = parseLocal(iso).getTime() - now.getTime();
  if (diff < 0) return 'Atrasada';
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'Agora';
  if (min < 60) return `Em ${min} min`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `Em ${hours} h`;
  const days = Math.floor(hours / 24);
  return `Em ${days} ${days === 1 ? 'dia' : 'dias'}`;
}

// Os 7 dias da semana atual, de segunda a domingo
export function getWeekDays(now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const todayKey = toDateKey(now);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = toDateKey(d);
    return { key, label: WEEKDAYS_SHORT[d.getDay()], day: d.getDate(), isToday: key === todayKey };
  });
}

// '2026-11' -> 'Novembro' (com o ano se não for o ano atual: 'Novembro de 2025')
export function formatMonthTitle(monthKey: string, now = new Date()) {
  const [y, m] = monthKey.split('-').map(Number);
  const name = capitalize(MONTHS[m - 1]);
  return y === now.getFullYear() ? name : `${name} de ${y}`;
}

// '2026-11-03T14:00' -> '03/11'
export function formatShortDate(iso: string) {
  const [, m, d] = iso.split('T')[0].split('-');
  return `${d}/${m}`;
}