import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { triggerHaptic, triggerNotification, triggerSelectionChanged } from '../lib/maxBridge'
import { CloseIcon } from './icons'
import mascotWave from '../assets/mascot/mascot-wave.png'
import mascotThink from '../assets/mascot/mascot-think.png'

type SpotlightStep = {
  title: string
  desc: string
  selector?: string
  badge?: string
}

const STEPS: SpotlightStep[] = [
  {
    title: 'Свежие сторис региона',
    desc: 'Смотри актуальные новости, гранты до 300 000 ₽ и дедлайны региона в формате коротких сторис.',
    selector: '.stories',
    badge: 'Истории',
  },
  {
    title: 'Программы поддержки',
    desc: 'Подбирай проверенные субсидии, льготные кредиты и бесплатные программы под свой бизнес.',
    selector: '.cards-wrap',
    badge: 'Каталог мер',
  },
  {
    title: 'Умный помощник',
    desc: 'Задавай любые вопросы боту: налоги 2026/2027, документы и регистрация без очередей.',
    selector: '.tab--mascot',
    badge: 'AI Бот',
  },
  {
    title: 'Демонстрационная версия (MVP)',
    desc: 'Приложение создано в рамках хакатона. Представлены синтетические примерочные данные для показа сценариев.',
    badge: 'О проекте',
  },
]

export default function SpotlightTutorial({
  onComplete,
}: {
  onComplete: () => void
}) {
  const [step, setStep] = useState(0)
  const [rect, setRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null)

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  useEffect(() => {
    if (!current.selector) {
      setRect(null)
      return
    }

    const updateRect = () => {
      const el = document.querySelector(current.selector!)
      if (el) {
        const r = el.getBoundingClientRect()
        setRect({
          top: r.top - 6,
          left: r.left - 6,
          width: r.width + 12,
          height: r.height + 12,
        })
      } else {
        setRect(null)
      }
    }

    updateRect()
    window.addEventListener('resize', updateRect)
    return () => window.removeEventListener('resize', updateRect)
  }, [step, current.selector])

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

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: rect && rect.top > 350 ? 'flex-start' : 'flex-end',
        padding: '24px 16px 28px',
        animation: 'fadeIn 0.25s ease',
        boxSizing: 'border-box',
      }}
    >
      {/* SVG маска с вырезом под целевой элемент */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <mask id="spotlight-mask" maskUnits="userSpaceOnUse">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {rect && (
              <rect
                x={rect.left - 4}
                y={rect.top - 4}
                width={rect.width + 8}
                height={rect.height + 8}
                rx="20"
                fill="black"
              />
            )}
          </mask>
        </defs>
      </svg>

      {/* Затемненный фон с размытием вокруг элемента (с вырезом под сам элемент) */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(18, 13, 29, 0.88)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          mask: rect ? 'url(#spotlight-mask)' : undefined,
          WebkitMask: rect ? 'url(#spotlight-mask)' : undefined,
          zIndex: 9999,
          pointerEvents: 'none',
        }}
      />

      {/* Круглая кнопка закрытия как в Stories */}
      <button
        onClick={skip}
        style={{
          position: 'fixed',
          top: '16px',
          right: '16px',
          zIndex: 10002,
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.15)',
          border: 'none',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          backdropFilter: 'blur(8px)',
        }}
        aria-label="Закрыть обучение"
      >
        <CloseIcon />
      </button>

      {/* Подсветка целевого элемента (Spotlight) с ярким неоновым фиолетовым свечением */}
      {rect && (
        <div
          style={{
            position: 'fixed',
            top: rect.top - 4,
            left: rect.left - 4,
            width: rect.width + 8,
            height: rect.height + 8,
            borderRadius: '20px',
            border: '2.5px solid #8455f6',
            boxShadow:
              '0 0 25px rgba(132, 85, 246, 0.9), 0 0 50px rgba(132, 85, 246, 0.45), inset 0 0 16px rgba(132, 85, 246, 0.3)',
            pointerEvents: 'none',
            transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            zIndex: 10001,
          }}
        />
      )}

      {/* Карточка подсказки от маскота */}
      <div
        style={{
          position: 'relative',
          background: '#212122',
          border: '1px solid #363638',
          borderRadius: '20px',
          padding: '20px 18px 16px',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.6)',
          zIndex: 10001,
          marginTop: rect && rect.top > 350 ? '70px' : '0',
          marginBottom: rect && rect.top <= 350 ? '24px' : '0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: '#c499f3',
                  background: 'rgba(132, 85, 246, 0.2)',
                  padding: '2px 8px',
                  borderRadius: '6px',
                }}
              >
                {current.badge}
              </span>
              <span style={{ fontSize: '11px', color: '#8d93a3' }}>Шаг {step + 1} из 4</span>
            </div>

            <h3
              style={{
                fontFamily: "'VK Sans Display Expanded', sans-serif",
                fontSize: '16px',
                fontWeight: 700,
                color: '#ffffff',
                marginBottom: '6px',
                lineHeight: 1.25,
              }}
            >
              {current.title}
            </h3>

            <p
              style={{
                fontFamily: "'VK Sans Text', sans-serif",
                fontSize: '13px',
                lineHeight: 1.4,
                color: 'rgba(255, 255, 255, 0.85)',
                marginBottom: '16px',
              }}
            >
              {current.desc}
            </p>
          </div>

          <img
            src={step % 2 === 0 ? mascotWave : mascotThink}
            alt=""
            style={{ width: '64px', height: '64px', objectFit: 'contain', flexShrink: 0 }}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={skip}
            style={{
              flex: 1,
              height: '42px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#8d93a3',
              fontFamily: "'VK Sans Display', sans-serif",
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Пропустить
          </button>
          <button
            className="spotlight-btn--next"
            onClick={next}
            style={{
              flex: 1.4,
              height: '42px',
              borderRadius: '12px',
              background: '#8455f6',
              border: 'none',
              color: '#ffffff',
              fontFamily: "'VK Sans Display', sans-serif",
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(132, 85, 246, 0.4)',
            }}
          >
            {isLast ? 'Готово' : 'Дальше'}
          </button>
        </div>

        {/* Индикатор шагов — внизу по центру */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '14px' }}>
          {STEPS.map((_, idx) => (
            <div
              key={idx}
              style={{
                width: idx === step ? '24px' : '6px',
                height: '4px',
                borderRadius: '2px',
                background: idx === step ? '#8455f6' : idx < step ? '#c499f3' : 'rgba(255, 255, 255, 0.2)',
                transition: 'all 0.25s',
              }}
            />
          ))}
        </div>
      </div>
    </div>,
    document.body,
  )
}
