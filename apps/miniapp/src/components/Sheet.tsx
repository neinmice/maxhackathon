import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { CloseIcon } from './icons'

export const appRoot = () => document.querySelector('.app') ?? document.body

export default function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title?: ReactNode
  children: ReactNode
}) {
  const [mounted, setMounted] = useState(open)

  useEffect(() => {
    if (open) setMounted(true)
    else {
      const t = window.setTimeout(() => setMounted(false), 260)
      return () => window.clearTimeout(t)
    }
  }, [open])

  if (!mounted) return null
  return createPortal(
    <div className={`sheet ${open ? 'is-open' : ''}`}>
      <div className="sheet__backdrop" onClick={onClose} />
      <div className="sheet__panel" role="dialog" aria-modal="true">
        <button className="sheet__close" onClick={onClose} aria-label="Закрыть">
          <CloseIcon />
        </button>
        {title && <h3 className="sheet__title">{title}</h3>}
        {children}
      </div>
    </div>,
    appRoot(),
  )
}
