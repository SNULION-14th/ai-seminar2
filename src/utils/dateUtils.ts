/**
 * Formats date into Korean date string matching Figma design:
 * E.g., "2026년 9월 22일 화요일"
 */
export function formatFullKoreanDate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  const dayOfWeek = dayNames[date.getDay()];
  return `${year}년 ${month}월 ${day}일 ${dayOfWeek}`;
}

/**
 * Returns today's date in YYYY-MM-DD string format
 */
export function getTodayDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
