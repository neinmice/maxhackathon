import { useCallback, useEffect, useRef, useState } from 'react'
import type { Story } from '../data'
import { useApp } from '../store'
import { CloseIcon, HeartIcon, Rays, ShareIcon, ZigArrow } from './icons'
import { createPortal } from 'react-dom'
import { appRoot } from './Sheet'

const DURATION = 5000

export default function StoryViewer({ story, onClose }: { story: Story; onClose: () => void }) {
  const { markSlideViewed, showToast } = useApp()
  const [slide, setSlide] = useState(0)
  const [progress, setProgress] = useState(0)
  const [paused, setPaused] = useState(false)
  const [liked, setLiked] = useState<Record<string, boolean>>({})
  const [dragY, setDragY] = useState(0)
  const touch = useRef<{ x: number; y: number; t: number } | null>(null)

  const s = story?.slides[slide]

  useEffect(() => {
    if (story) {
      markSlideViewed(story.id, slide)
    }
  }, [story?.id, slide]) // eslint-disable-line react-hooks/exhaustive-deps

  const next = useCallback(() => {
    setProgress(0)
    if (slide < story.slides.length - 1) {
      setSlide((s) => s + 1)
    } else {
      onClose()
    }
  }, [slide, story.slides.length, onClose])

  const prev = useCallback(() => {
    setProgress(0)
    setSlide((s) => Math.max(0, s - 1))
  }, [])

  useEffect(() => {
    if (paused) return
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = now - last
      last = now
      setProgress((p) => {
        const np = p + dt / DURATION
        return np >= 1 ? 1 : np
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [paused, slide])

  useEffect(() => {
    if (progress >= 1) next()
  }, [progress, next])

  const pointerState = useRef<{
    id: number
    x: number
    y: number
    t: number
    isDrag: boolean
  } | null>(null)

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return
    pointerState.current = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      t: Date.now(),
      isDrag: false,
    }
    setPaused(true)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    const st = pointerState.current
    if (!st || st.id !== e.pointerId) return
    const dy = e.clientY - st.y
    const dx = e.clientX - st.x

    if (dy > 15 && dy > Math.abs(dx)) {
      st.isDrag = true
      setDragY(dy)
    }
  }

  const onPointerUp = (e: React.PointerEvent) => {
    const st = pointerState.current
    if (!st || st.id !== e.pointerId) return
    pointerState.current = null
    setPaused(false)
    setDragY(0)

    const dx = e.clientX - st.x
    const dy = e.clientY - st.y
    const dt = Date.now() - st.t

    // 1. Swipe down to dismiss
    if (dy > 90 && dy > Math.abs(dx) * 1.3) {
      onClose()
      return
    }

    // 2. Horizontal swipe
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) next()
      else prev()
      return
    }

    // 3. Tap (no significant drag and press duration under 700ms)
    if (!st.isDrag && dt < 700 && Math.abs(dx) < 35 && Math.abs(dy) < 35) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      const left = rect ? rect.left : 0
      const width = rect ? rect.width : window.innerWidth
      if (e.clientX - left < width * 0.35) {
        prev()
      } else {
        next()
      }
    }
  }

  const onPointerCancel = () => {
    pointerState.current = null
    setPaused(false)
    setDragY(0)
  }

  const key = `${story.id}-${slide}`

  return createPortal(
    <div className="story" style={{ transform: dragY ? `translateY(${dragY}px) scale(${1 - dragY / 2000})` : undefined, opacity: dragY ? 1 - dragY / 600 : 1 }}>
      <div className="story__bg" style={{ background: s.bg }} key={key}>
        <ZigArrow className="story__deco story__deco--a" dir="left" />
        <Rays className="story__deco story__deco--b" />
      </div>

      <div className="story__bars">
        {story.slides.map((_, i) => (
          <span key={i} className="story__bar">
            <i style={{ width: `${i < slide ? 100 : i === slide ? progress * 100 : 0}%` }} />
          </span>
        ))}
      </div>

      <div className="story__top">
        <button className="icon-btn story__close" onClick={onClose} aria-label="Закрыть">
          <CloseIcon />
        </button>
      </div>

      <div
        className="story__tap"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      >
        <div className="story__content" key={key}>
          {s.mascot && (
            <div className="story__mascot-wrap">
              <img src={s.mascot} alt="Маскот" className="story__mascot" draggable={false} />
            </div>
          )}
          {s.big && <div className="story__big">{s.big}</div>}
          {s.accent && <div className="story__accent">{s.accent}</div>}
          <h2 className="story__title">{s.title}</h2>
          <p className="story__text">{s.text}</p>
        </div>
      </div>

      <div className="story__actions">
        <button className="btn btn--primary story__cta" onClick={() => showToast('Сохранено в избранное')}>
          Подробнее
        </button>
        <button className={`icon-btn story__like ${liked[key] ? 'is-on' : ''}`} onClick={() => setLiked((l) => ({ ...l, [key]: !l[key] }))} aria-label="Нравится">
          <HeartIcon filled={liked[key]} />
        </button>
        <button className="icon-btn" onClick={() => showToast('Ссылка скопирована')} aria-label="Поделиться">
          <ShareIcon />
        </button>
      </div>
    </div>,
    appRoot(),
  )
}
