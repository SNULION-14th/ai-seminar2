/**
 * Formats current date to Figma design style: "Saturday, Sep 19, 2026"
 */
export function formatToday(): string {
  const now = new Date();
  return now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Formats date to Korean style: "2026. 09. 19 (토)"
 */
export function formatTodayKorean(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const dayName = days[now.getDay()];

  return `${year}. ${month}. ${day} (${dayName})`;
}
