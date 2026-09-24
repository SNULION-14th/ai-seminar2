import { X } from 'lucide-react'
import type { ReactNode } from 'react'

export function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="modal parchment" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <header><div><span className="eyebrow">ACADEMIC RECORD</span><h2 id="modal-title">{title}</h2></div><button type="button" className="icon-button" aria-label="Close dialog" onClick={onClose}><X size={18} /></button></header>
        {children}
      </section>
    </div>
  )
}

