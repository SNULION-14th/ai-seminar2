import type { SourceMeta } from '../config'
import type { SourceState } from '../sources/types'

const NOTE: Partial<Record<SourceState['status'], string>> = {
  'no-key': 'API 키 필요',
  error: '불러오기 실패',
}

export function SourceLabel({ source, state }: { source: SourceMeta; state?: SourceState }) {
  const note = state ? NOTE[state.status] : undefined
  return (
    <div className="source" title={state?.status === 'error' ? state.message : source.name}>
      <span className="source-dot" style={{ background: source.color }} />
      <span className="source-body">
        <span className="source-brand">
          <img className={`source-logo source-logo--${source.id}`} src={source.logo} alt={source.name} />
          {source.tag && <span className="source-tag">{source.tag}</span>}
        </span>
        {note && <span className="source-note">{note}</span>}
      </span>
    </div>
  )
}
