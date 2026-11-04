const pad = (n: number) => String(n).padStart(2, '0')

export function toLocalISO(d: Date){
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function getWeekRange(now = new Date){
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7))
    const end = new Date(start)
    end.setDate(end.getDate() + 7)
    return { start: toLocalISO(start), end: toLocalISO(end) }
}

export function formatDue(iso: string, now = new Date()){
    const [date, time = '00:00'] = iso.split('T')
    const tomorrow = new Date(now)
    tomorrow.setDate(now.getDate() + 1)

    const today = toLocalISO(now).split('T')[0]
    const tmr = toLocalISO(tomorrow).split('T')[0];
    const [, month, day] = date.split('-');

    const label = date === today ? 'Hoje' : date === tmr ? 'Amanhã' : `${day}/${month}`;
    return `${label} • ${time}`;
}

