import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { triggerHaptic, triggerNotification, triggerSelectionChanged } from '../lib/maxBridge'
import { CloseIcon } from './icons'
import mascotDoor from '../assets/mascot-door.webp'

type SpotlightStep = {
  title: string
  desc: string
  selector?: string
  fallbackSelector?: string
  badge: string
  radius?: number
  pad?: number
}

const STEPS: SpotlightStep[] = [
  {
    title: 'Свежие сторис региона',
    desc: 'Смотри актуальные новости, гранты до 300 000 ₽ и дедлайны региона в формате коротких сторис.',
    selector: '.stories',
    badge: 'Истории',
    radius: 18,
    pad: 4,
  },
  {
    title: 'Программы поддержки',
    desc: 'Подбирай субсидии, льготные кредиты и бесплатные программы под свой бизнес и регион.',
    selector: '.home-sec--start',
    fallbackSelector: '.cards-wrap',
    badge: 'Каталог мер',
    radius: 20,
    pad: 6,
  },
  {
    title: 'Умный помощник',
    desc: 'Задавай любые вопросы боту: налоги 2026/2027, документы и регистрация без очередей.',
    selector: '.tab__mascot',
    fallbackSelector: '.tab--mascot',
    badge: 'AI Помощник',
    radius: 9999,
    pad: 4,
  },
  {
    title: 'Демонстрационная версия',
    desc: 'Приложение создано для хакатона ZVERY. Представлены синтетические примерочные данные для показа сценариев.',
    badge: 'О проекте',
    radius: 0,
    pad: 0,
  },
]

export default function SpotlightTutorial({
  onComplete,
}: {
  onComplete: () => void
}) {
  const [step, setStep] = useState(0)
  const [rect, setRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null)
  const [containerSize, setContainerSize] = useState({ width: 390, height: 800 })
  const contentRef = useRef<HTMLDivElement>(null)
  const [contentHeight, setContentHeight] = useState(210)

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.offsetHeight)
    }
  }, [step, current])

  useEffect(() => {
    const updateRect = () => {
      const appEl = document.querySelector('.app')
      if (appEl) {
        setContainerSize({
          width: appEl.clientWidth,
          height: appEl.clientHeight,
        })
      }

      if (!current.selector) {
        setRect(null)
        return
      }

      const sel = current.selector
      const fallback = current.fallbackSelector
      const target = (sel ? document.querySelector(sel) : null) || (fallback ? document.querySelector(fallback) : null)

      if (target && appEl) {
        const appRect = appEl.getBoundingClientRect()
        const r = target.getBoundingClientRect()
        setRect({
          top: r.top - appRect.top,
          left: r.left - appRect.left,
          width: r.width,
          height: r.height,
        })
      } else {
        setRect(null)
      }
    }

    if (current.selector) {
      const sel = current.selector
      const fallback = current.fallbackSelector
      const target = (sel ? document.querySelector(sel) : null) || (fallback ? document.querySelector(fallback) : null)
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    }

    updateRect()
    const timer1 = setTimeout(updateRect, 80)
    const timer2 = setTimeout(updateRect, 320)

    window.addEventListener('resize', updateRect)
    const mainEl = document.querySelector('.main')
    mainEl?.addEventListener('scroll', updateRect)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      window.removeEventListener('resize', updateRect)
      mainEl?.removeEventListener('scroll', updateRect)
    }
  }, [step, current.selector, current.fallbackSelector])

  const finish = () => {
    triggerNotification('success')
    try {
      localStorage.setItem('zvery_intro_seen', 'true')
    } catch {
      // no-op
    }
    onComplete()
  }

  const next = () => {
    triggerSelectionChanged()
    if (isLast) {
      finish()
    } else {
      setStep((s) => s + 1)
    }
  }

  const skip = () => {
    triggerHaptic('light')
    finish()
  }

  const pad = current.pad ?? 4
  const radius = current.radius ?? 18

  const getTargetY = (): number => {
    if (!rect) {
      return Math.max(24, Math.round((containerSize.height - contentHeight) / 2))
    }

    const elementBottom = rect.top + rect.height + pad
    const spaceBelow = containerSize.height - elementBottom

    if (spaceBelow >= contentHeight + 20) {
      return elementBottom + 20
    }

    const elementTop = rect.top - pad
    return Math.max(24, elementTop - contentHeight - 20)
  }

  const targetY = getTargetY()

  const cutTop = rect ? Math.max(0, rect.top - pad) : 0
  const cutBottom = rect ? rect.top + rect.height + pad : 0
  const cutLeft = rect ? Math.max(0, rect.left - pad) : 0
  const cutRight = rect ? rect.left + rect.width + pad : 0

  const appEl = typeof document !== 'undefined' ? document.querySelector('.app') : null

  return createPortal(
    <div className="spotlight-overlay" style={{ pointerEvents: 'none' }}>
      {/* Затемняющие панели с реальным аппаратным backdrop-filter: blur(16px) */}
      {rect ? (
        <>
          {/* Сверху от выреза */}
          <div
            className="spotlight-panel"
            style={{
              top: 0,
              left: 0,
              right: 0,
              height: `${cutTop}px`,
            }}
          />
          {/* Снизу от выреза */}
          <div
            className="spotlight-panel"
            style={{
              top: `${cutBottom}px`,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />
          {/* Слева от выреза */}
          <div
            className="spotlight-panel"
            style={{
              top: `${cutTop}px`,
              left: 0,
              width: `${cutLeft}px`,
              height: `${Math.max(0, cutBottom - cutTop)}px`,
            }}
          />
          {/* Справа от выреза */}
          <div
            className="spotlight-panel"
            style={{
              top: `${cutTop}px`,
              left: `${cutRight}px`,
              right: 0,
              height: `${Math.max(0, cutBottom - cutTop)}px`,
            }}
          />
        </>
      ) : (
        <div
          className="spotlight-panel"
          style={{
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        />
      )}

      {/* Кнопка закрытия обучения (крестик) */}
      <button className="spotlight-close" onClick={skip} aria-label="Закрыть обучение">
        <CloseIcon />
      </button>

      {/* Подсветка целевого элемента: неон, тонкая фиолетовая рамка и радиус */}
      {rect && (
        <div
          className="spotlight-cutout"
          style={{
            top: `${rect.top - pad}px`,
            left: `${rect.left - pad}px`,
            width: `${rect.width + pad * 2}px`,
            height: `${rect.height + pad * 2}px`,
            borderRadius: radius === 9999 ? '50%' : `${radius}px`,
          }}
        />
      )}

      {/* Плавающий текст с плавной анимацией скольжения по экрану между этапами */}
      <div
        ref={contentRef}
        className={`spotlight-floating ${!rect ? 'spotlight-floating--center' : ''}`}
        style={{
          transform: `translate3d(0, ${targetY}px, 0)`,
        }}
      >
        <div key={step} className="spotlight-text-anim">
          {!rect && (
            <img
              src={mascotDoor}
              alt="ZVERY"
              style={{ width: '84px', height: '84px', objectFit: 'contain', marginBottom: '1.25rem' }}
            />
          )}

          <div className="spotlight-meta">
            <span className="spotlight-badge">{current.badge}</span>
            <span className="spotlight-counter">Шаг {step + 1} из {STEPS.length}</span>
          </div>

          <h2 className="spotlight-title">{current.title}</h2>
          <p className="spotlight-desc">{current.desc}</p>
        </div>

        <div className="spotlight-actions">
          <button className="spotlight-btn-skip" onClick={skip}>
            Пропустить
          </button>
          <button className="spotlight-btn-next" onClick={next}>
            {isLast ? 'Подобрать меры' : 'Дальше'}
          </button>
        </div>

        <div className="spotlight-dots">
          {STEPS.map((_, idx) => (
            <span
              key={idx}
              className={`spotlight-dot ${idx === step ? 'is-active' : idx < step ? 'is-done' : ''}`}
            />
          ))}
        </div>
      </div>
    </div>,
    appEl || document.body,
  )
}
