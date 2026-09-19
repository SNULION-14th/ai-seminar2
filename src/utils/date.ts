export function formatHeaderDate(date: Date = new Date()): string {
  const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date);
  const month = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date);
  const day = date.getDate();

  return `${weekday}, ${month} ${day}`;
}
