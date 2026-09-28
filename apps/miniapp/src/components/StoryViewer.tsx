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
      setSlide(slide + 1)
    } else {
      onClose()
    }
  }, [slide, story.slides.length, onClose])

  const prev = () => {
    setProgress(0)
    if (slide > 0) {
      setSlide(slide - 1)
    }
  }

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

  const onStart = (e: React.TouchEvent | React.MouseEvent) => {
    const p = 'touches' in e ? e.touches[0] : e
    touch.current = { x: p.clientX, y: p.clientY, t: Date.now() }
    setPaused(true)
  }
  const onMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!touch.current) return
    const p = 'touches' in e ? e.touches[0] : e
    const dy = p.clientY - touch.current.y
    if (dy > 0) setDragY(dy)
  }
  const onEnd = (e: React.TouchEvent | React.MouseEvent) => {
    const st = touch.current
    touch.current = null
    setPaused(false)
    if (!st) return
    const p = 'changedTouches' in e ? e.changedTouches[0] : e
    const dx = p.clientX - st.x
    const dy = p.clientY - st.y
    setDragY(0)
    if (dy > 110) return onClose()
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) next()
      else prev()
      return
    }
    if (Date.now() - st.t < 250 && Math.abs(dx) < 10 && Math.abs(dy) < 10) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      if (p.clientX - rect.left < rect.width / 3) prev()
      else next()
    }
  }

  const key = `${story.id}-${slide}`

  return createPortal(
    <div className="story" style={{ transform: dragY ? `translateY(${dragY}px) scale(${1 - dragY / 2000})` : undefined, opacity: dragY ? 1 - dragY / 600 : 1 }}>
      <div className="story__bg" style={{ background: s.bg }} key={key}>
        <ZigArrow className="story__deco story__deco--a" dir="left" />
        <Rays className="story__deco story__deco--b" />
        <ZigArrow className="story__deco story__deco--c" />
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
        onTouchStart={onStart}
        onTouchMove={onMove}
        onTouchEnd={onEnd}
        onMouseDown={onStart}
        onMouseMove={(e) => e.buttons && onMove(e)}
        onMouseUp={onEnd}
      >
        <div className="story__content" key={key}>
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
