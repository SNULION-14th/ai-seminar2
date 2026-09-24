// 완주 연출을 한 번만 보여 주기 위한 로컬 플래그 (SHR-08). localStorage 접근은
// 프라이빗 모드 등에서 막힐 수 있어 항상 try/catch로 감싼다.
const COMPLETION_FLAG_KEY = 'gt.completionCelebrated'

export function hasCelebratedCompletion(): boolean {
  try {
    return localStorage.getItem(COMPLETION_FLAG_KEY) === '1'
  } catch {
    return false
  }
}

export function markCompletionCelebrated(): void {
  try {
    localStorage.setItem(COMPLETION_FLAG_KEY, '1')
  } catch {
    // 저장에 실패해도 치명적이지 않다. 다음 방문에 연출이 다시 보일 뿐이다.
  }
}
