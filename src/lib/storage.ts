const KEY = 'trip-pocket:v1'

export interface SavedState {
  cityId: string
  start: string
  end: string
  checked: string[]
  custom: { id: string; label: string }[]
  picked: string[]
}

export function loadState(): Partial<SavedState> {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Partial<SavedState>) : {}
  } catch {
    return {}
  }
}

export function saveState(state: SavedState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* private mode 등: 저장 실패는 무시 */
  }
}
