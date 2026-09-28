import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { triggerHaptic, triggerNotification, triggerSelectionChanged } from '../lib/maxBridge'
import { ZigArrow } from './icons'

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
        background: 'rgba(18, 13, 29, 0.92)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: rect && rect.top > 350 ? 'flex-start' : 'flex-end',
        padding: '24px 16px 36px',
        animation: 'fadeIn 0.25s ease',
        boxSizing: 'border-box',
      }}
    >
      {/* Подсветка целевого элемента (Spotlight) */}
      {rect && (
        <div
          style={{
            position: 'fixed',
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            borderRadius: '20px',
            border: '2px solid #f5c06a',
            boxShadow: '0 0 25px rgba(245, 192, 106, 0.6), inset 0 0 15px rgba(245, 192, 106, 0.2)',
            pointerEvents: 'none',
            transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            zIndex: 10000,
          }}
        />
      )}

      {/* Верхняя панель со счётом шагов и кнопкой закрытия */}
      <div
        style={{
          position: 'fixed',
          top: '16px',
          left: '16px',
          right: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 10001,
        }}
      >
        <div style={{ display: 'flex', gap: '6px' }}>
          {STEPS.map((_, idx) => (
            <div
              key={idx}
              style={{
                width: '32px',
                height: '4px',
                borderRadius: '2px',
                background: idx <= step ? '#f5c06a' : 'rgba(255, 255, 255, 0.2)',
                transition: 'background 0.2s',
              }}
            />
          ))}
        </div>
        <button
          onClick={skip}
          style={{
            background: 'rgba(255, 255, 255, 0.14)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#ffffff',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: 700,
            flexShrink: 0,
          }}
          aria-label="Пропустить обучение"
        >
          ✕
        </button>
      </div>

      {/* Карточка подсказки */}
      <div
        style={{
          position: 'relative',
          background: '#212122',
          border: '1px solid #363638',
          borderRadius: '20px',
          padding: '20px 18px 18px',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.6)',
          zIndex: 10001,
          marginTop: rect && rect.top > 350 ? '70px' : '0',
          marginBottom: rect && rect.top <= 350 ? '30px' : '0',
        }}
      >
        {rect && rect.top <= 350 && (
          <div style={{ position: 'absolute', top: '-24px', left: '30px' }}>
            <ZigArrow dir="left" color="#f5c06a" shade="#b98524" style={{ width: '45px', height: '20px', transform: 'rotate(90deg)' }} />
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: '#f5c06a',
              background: 'rgba(245, 192, 106, 0.15)',
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
            fontSize: '17px',
            fontWeight: 700,
            color: '#ffffff',
            marginBottom: '8px',
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
            marginBottom: '18px',
          }}
        >
          {current.desc}
        </p>

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
            onClick={next}
            style={{
              flex: 1.4,
              height: '42px',
              borderRadius: '12px',
              background: '#7a35d8',
              border: 'none',
              color: '#ffffff',
              fontFamily: "'VK Sans Display', sans-serif",
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(122, 53, 216, 0.4)',
            }}
          >
            {isLast ? 'Подобрать меры' : 'Дальше'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
