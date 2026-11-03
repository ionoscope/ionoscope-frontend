export interface CalendarDay {
  iso: string;
  day: number;
  current: boolean;
}
export function monthGrid(year: number, month: number): CalendarDay[] {
  const first = new Date(Date.UTC(year, month, 1));
  const offset = (first.getUTCDay() + 6) % 7;
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(Date.UTC(year, month, 1 - offset + index));
    return {
      iso: date.toISOString().slice(0, 10),
      day: date.getUTCDate(),
      current: date.getUTCMonth() === month,
    };
  });
}
export function shiftDay(iso: string, days: number): string {
  return new Date(Date.parse(iso + 'T00:00:00Z') + days * 86400000).toISOString().slice(0, 10);
}
