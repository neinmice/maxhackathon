import React, { useState } from 'react'
import { BellIcon, CheckIcon, ClockIcon, ServiceGlyph } from './icons'
import mascotThink from '../assets/mascot/mascot-think.webp'
import { triggerHaptic } from '../lib/maxBridge'
import { useApp } from '../store'

export interface DevPoint {
  icon: React.ReactNode
  title: string
  desc: string
}

export interface InDevelopmentCardProps {
  title?: string
  desc?: string
  points?: DevPoint[]
  serviceId?: string
  storageKey?: string
  onClose?: () => void
  closeLabel?: string
  embedded?: boolean
}

const glyphStyle = { width: 20, height: 20, color: 'var(--yellow)' }

const CATEGORY_POINTS: Record<string, DevPoint[]> = {
  internship: [
    {
      icon: <ServiceGlyph name="internship" style={glyphStyle} />,
      title: 'Студентам и выпускникам',
      desc: 'Оплачиваемая практика в аккредитованных компаниях и менторство.',
    },
    {
      icon: <ServiceGlyph name="mentor" style={glyphStyle} />,
      title: 'Предпринимателям',
      desc: 'Поиск стажёров и субсидия до 3 МРОТ на наставничество.',
    },
  ],
  law: [
    {
      icon: <ServiceGlyph name="law" style={glyphStyle} />,
      title: 'Экспертиза договоров',
      desc: 'Правовой аудит контрактов, договоров аренды и соглашений с партнёрами.',
    },
    {
      icon: <ServiceGlyph name="docs" style={glyphStyle} />,
      title: 'Консультации юристов',
      desc: 'Помощь по трудовому праву, спорам с контрагентами и проверкам ведомств.',
    },
  ],
  account: [
    {
      icon: <ServiceGlyph name="account" style={glyphStyle} />,
      title: 'Онлайн-отчётность',
      desc: 'Автоматическое формирование и сдача деклараций в ФНС, СФР и Росстат.',
    },
    {
      icon: <ServiceGlyph name="calc" style={glyphStyle} />,
      title: 'Консультации бухгалтера',
      desc: 'Расчёт налогов, зарплат сотрудников и аудит первичных документов.',
    },
  ],
  place: [
    {
      icon: <ServiceGlyph name="place" style={glyphStyle} />,
      title: 'Льготные площадки',
      desc: 'Доступ к муниципальным технопаркам, инкубаторам и коворкингам.',
    },
    {
      icon: <ServiceGlyph name="register" style={glyphStyle} />,
      title: 'Проверенные условия',
      desc: 'Безопасные договоры аренды с субсидированной ставкой для МСП.',
    },
  ],
  marketing: [
    {
      icon: <ServiceGlyph name="marketing" style={glyphStyle} />,
      title: 'Продвижение бизнеса',
      desc: 'Пакеты рекламы и продвижения в соцсетях со скидкой от государства.',
    },
    {
      icon: <ServiceGlyph name="mentor" style={glyphStyle} />,
      title: 'Целевая аудитория',
      desc: 'Анализ клиентской базы и настройка рекламных кампаний под ключ.',
    },
  ],
  mentor: [
    {
      icon: <ServiceGlyph name="mentor" style={glyphStyle} />,
      title: 'Персональный трек',
      desc: 'Разбор бизнеса и консультации с действующими топ-предпринимателями.',
    },
    {
      icon: <ServiceGlyph name="support" style={glyphStyle} />,
      title: 'Экспертная сеть',
      desc: 'Помощь в масштабировании, выходе на маркетплейсы и оптимизации.',
    },
  ],
  export: [
    {
      icon: <ServiceGlyph name="export" style={glyphStyle} />,
      title: 'Выход на внешние рынки',
      desc: 'Сопровождение контрактов, таможенное оформление и сертификация.',
    },
    {
      icon: <ServiceGlyph name="law" style={glyphStyle} />,
      title: 'Субсидии на логистику',
      desc: 'Компенсация до 80% расходов на транспортировку продукции.',
    },
  ],
  lease: [
    {
      icon: <ServiceGlyph name="lease" style={glyphStyle} />,
      title: 'Льготный лизинг от 6%',
      desc: 'Оборудование, спецтехника и транспорт без первоначального залога.',
    },
    {
      icon: <ServiceGlyph name="calc" style={glyphStyle} />,
      title: 'Быстрое решение',
      desc: 'Предварительное одобрение заявки в онлайн-формате за 24 часа.',
    },
  ],
  patent: [
    {
      icon: <ServiceGlyph name="patent" style={glyphStyle} />,
      title: 'Защита бренда',
      desc: 'Проверка уникальности названия и регистрация в Роспатенте.',
    },
    {
      icon: <ServiceGlyph name="law" style={glyphStyle} />,
      title: 'Патентный поиск',
      desc: 'Анализ рисков и юридическая защита интеллектуальной собственности.',
    },
  ],
  support: [
    {
      icon: <ServiceGlyph name="support" style={glyphStyle} />,
      title: 'Горячая линия 24/7',
      desc: 'Прямая связь с операторами центра «Мой бизнес» и юристами.',
    },
    {
      icon: <ClockIcon style={{ width: 20, height: 20, color: 'var(--yellow)' }} />,
      title: 'Ответ за 5 минут',
      desc: 'Оперативная помощь по налогам, грантам и проверкам через MAX.',
    },
  ],
}

const DEFAULT_POINTS: DevPoint[] = [
  {
    icon: <ServiceGlyph name="register" style={glyphStyle} />,
    title: 'Интеграция с сервисами',
    desc: 'Бесшовное подключение к базам данных и государственным ресурсам.',
  },
  {
    icon: <ClockIcon style={{ width: 20, height: 20, color: 'var(--yellow)' }} />,
    title: 'Быстрый запуск',
    desc: 'Доступ ко всем возможностям в один клик прямо через мессенджер MAX.',
  },
]

export default function InDevelopmentCard({
  title,
  desc,
  points,
  serviceId,
  storageKey,
  onClose,
  closeLabel = 'На главную',
  embedded = false,
}: InDevelopmentCardProps) {
  const { showToast } = useApp()
  const key = storageKey || (serviceId ? `zvery_dev_notify_${serviceId}` : 'zvery_dev_notify')
  const [subscribed, setSubscribed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(key) === 'true'
    } catch {
      return false
    }
  })

  const effectivePoints = points || (serviceId ? CATEGORY_POINTS[serviceId] : undefined) || DEFAULT_POINTS
  const effectiveTitle = title || 'Раздел в разработке'
  const effectiveDesc = desc || 'Сервис находится в активной разработке. Мы готовим удобный инструмент с интеграцией в MAX.'

  const handleNotifyToggle = () => {
    triggerHaptic('medium')
    const next = !subscribed
    setSubscribed(next)
    try {
      localStorage.setItem(key, next ? 'true' : 'false')
    } catch {
      // no-op
    }
    if (next) {
      showToast('Вы в списке ожидания! Бот MAX пришлёт уведомление.')
    } else {
      showToast('Уведомление отменено')
    }
  }

  return (
    <div
      className={embedded ? '' : 'grant'}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        padding: embedded ? '0.4rem 0.2rem 0.2rem' : '1.4rem 1.2rem',
        marginTop: embedded ? '0' : '0.4rem',
        background: embedded ? 'transparent' : undefined,
        border: embedded ? 'none' : undefined,
        boxShadow: embedded ? 'none' : undefined,
      }}
    >
      <img
        src={mascotThink}
        alt="Маскот"
        style={{ width: '84px', height: '84px', objectFit: 'contain', marginBottom: '0.9rem' }}
      />

      <b
        style={{
          fontFamily: "'VK Sans Display Expanded', var(--display)",
          fontWeight: 800,
          fontSize: '1.25rem',
          color: '#ffffff',
          lineHeight: '1.25',
          marginBottom: '0.5rem',
          display: 'block',
        }}
      >
        {effectiveTitle}
      </b>

      <p className="muted" style={{ fontSize: '0.84rem', lineHeight: '1.35', marginBottom: '1.15rem', maxWidth: '310px' }}>
        {effectiveDesc}
      </p>

      {/* 2 пункта о будущем сервисе с SVG иконками */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.6rem',
          width: '100%',
          textAlign: 'left',
          marginBottom: '1.25rem',
        }}
      >
        {effectivePoints.map((p, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              background: '#212122',
              border: '1px solid #363638',
              padding: '0.65rem 0.8rem',
              borderRadius: '12px',
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '10px',
                background: 'rgba(245, 197, 109, 0.12)',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
              }}
            >
              {p.icon}
            </div>
            <div style={{ fontSize: '0.8rem', lineHeight: '1.3' }}>
              <b style={{ color: '#ffffff', display: 'block', marginBottom: '0.15rem' }}>{p.title}</b>
              <span className="muted" style={{ display: 'block' }}>{p.desc}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
        <button
          type="button"
          className={`btn ${subscribed ? 'btn--outline' : 'btn--primary'} btn--block`}
          onClick={handleNotifyToggle}
          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
        >
          {subscribed ? (
            <>
              <CheckIcon style={{ width: 16, height: 16 }} />
              Вы в списке ожидания
            </>
          ) : (
            <>
              <BellIcon style={{ width: 16, height: 16 }} />
              Уведомить о запуске
            </>
          )}
        </button>

        {onClose && (
          <button
            type="button"
            className="btn btn--ghost btn--block"
            onClick={() => {
              triggerHaptic('light')
              onClose()
            }}
            style={{
              fontFamily: "'VK Sans Display Expanded', var(--display)",
              fontWeight: 800,
              fontSize: '1rem',
              color: '#ffffff',
            }}
          >
            {closeLabel}
          </button>
        )}
      </div>
    </div>
  )
}
