/** 모든 소스의 날씨 코드를 이 다섯 상태로 정규화한다. 밤/낮 구분은 아이콘에서 따로 처리. */
export type Condition = 'clear' | 'partly' | 'cloudy' | 'rain' | 'snow'

export interface HourPoint {
  temp: number | null
  pop: number | null
  condition: Condition | null
}

/** key: hourKey() 형식의 KST 시각 */
export type Series = Map<string, HourPoint>

export type SourceId = 'kma' | 'ecmwf' | 'gfs' | 'icon'

export type SourceState =
  | { status: 'loading' }
  | { status: 'ok'; series: Series }
  | { status: 'no-key' }
  | { status: 'error'; message: string }
