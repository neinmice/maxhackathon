import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FACTS, SECTIONS, STORIES, type Card, type Section } from '../data'
import { cityIn, useApp } from '../store'
import { ClayCoin, Rays, SparkleClay, StartSticker, TwinSparkle, ZigArrow } from '../components/icons'
import StoryViewer from '../components/StoryViewer'
import { triggerHaptic, triggerSelectionChanged } from '../lib/maxBridge'
import mascotCoin from '../assets/mascot/mascot-coin.png'
import mascotThink from '../assets/mascot/mascot-think.png'
import mascotWave from '../assets/mascot/mascot-wave.png'

export function SectionTitle({ s, onClick }: { s: Section; onClick?: () => void }) {
  return (
    <button className="sec-title" onClick={onClick}>
      {s.pre && <span>{s.pre} </span>}
      <span className={`hl hl--${s.hlColor}`}>{s.hl}</span>
      {s.post && <span> {s.post}</span>}
      <span className="sec-title__gt">&gt;</span>
    </button>
  )
}

function Stories() {
  const { viewedStories } = useApp()
  const [open, setOpen] = useState<number | null>(null)
  return (
    <>
      <div className="stories">
        {STORIES.map((s, i) => (
          <button
            key={s.id}
            className={`story-tile ${viewedStories.has(s.id) ? 'is-viewed' : ''}`}
            onClick={() => {
              triggerHaptic('light')
              setOpen(i)
            }}
            aria-label={s.title}
          >
            {s.cover ? <img src={s.cover} alt={s.title} /> : <span>{s.title}</span>}
          </button>
        ))}
      </div>
      {open !== null && <StoryViewer stories={STORIES} startIndex={open} onClose={() => setOpen(null)} />}
    </>
  )
}

function Facts() {
  const [i, setI] = useState(0)
  const [dir, setDir] = useState<1 | -1>(1)
  const timer = useRef<number>(0)
  const touchX = useRef<number | null>(null)
  const { setQuizOpen } = useApp()

  const go = (d: 1 | -1) => {
    triggerSelectionChanged()
    setDir(d)
    setI((v) => (v + d + FACTS.length) % FACTS.length)
  }

  useEffect(() => {
    timer.current = window.setTimeout(() => go(1), 5000)
    return () => window.clearTimeout(timer.current)
  }, [i])

  return (
    <div
      className="facts"
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return
        const dx = e.changedTouches[0].clientX - touchX.current
        touchX.current = null
        if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1)
      }}
    >
      <button className="facts__arrow facts__arrow--left" onClick={() => go(-1)} aria-label="Назад">
        <ZigArrow dir="left" />
      </button>
      <div
        className={`facts__text ${dir === 1 ? 'from-right' : 'from-left'}`}
        onClick={() => {
          triggerHaptic('medium')
          setQuizOpen(true)
        }}
        role="button"
        tabIndex={0}
      >
        <span>{FACTS[i]}</span>
        <span className="facts__cta">Пройти тест бизнеса &gt;</span>
      </div>
      <button className="facts__arrow facts__arrow--right" onClick={() => go(1)} aria-label="Вперёд">
        <ZigArrow />
      </button>
    </div>
  )
}

function SingleCard({ c, sId, index }: { c: Card; sId: string; index: number }) {
  const nav = useNavigate()
  const { city } = useApp()

  const handleClick = () => {
    triggerHaptic('light')
    nav(`/card/${c.id}`)
  }

  if (sId === 'finance') {
    // Style A: Крупная цифра + золотой акцент 26px
    const isPurpleTag = index % 2 === 1
    const icon = index === 0 ? <TwinSparkle size={26} /> : index === 1 ? <ClayCoin size={26} /> : <SparkleClay size={26} />
    return (
      <button className="card card--style-a" onClick={handleClick}>
        <div className="card__top">
          <span className={`card__tag ${isPurpleTag ? 'card__tag--purple' : ''}`}>{c.tag || 'льгота'}</span>
          <div className="card__icon">{icon}</div>
        </div>
        <div className="card__title">{c.title.replace('{city}', cityIn(city))}</div>
        <div className="card__sub">{c.subtitle}</div>
      </button>
    )
  }

  if (sId === 'start') {
    // Style B: Секция «Начни свое дело» — увеличенный маскот 72px
    const mascot = index % 3 === 0 ? mascotCoin : index % 3 === 1 ? mascotThink : mascotWave
    const isYellowTag = index % 2 === 1
    return (
      <button className="card card--style-b" onClick={handleClick}>
        <div className="card__content">
          <span className={`card__tag ${isYellowTag ? 'card__tag--yellow' : ''}`}>{c.tag || 'старт'}</span>
          <div className="card__title">{c.title.replace('{city}', cityIn(city))}</div>
          <div className="card__sub">{c.subtitle}</div>
        </div>
        <img className="card__mascot" src={mascot} alt="mascot" />
      </button>
    )
  }

  // Обычные карточки (например, «Бесплатные программы»)
  return (
    <button className="card" onClick={handleClick}>
      <div className="card__top">
        {c.tag && <span className="card__tag">{c.tag}</span>}
        <div className="card__icon">
          <SparkleClay size={20} />
        </div>
      </div>
      <div
        className="card__title"
        style={{
          fontSize: c.title.length > 12 ? '0.8rem' : '0.86rem',
          fontWeight: 700,
          letterSpacing: '-0.02em',
        }}
      >
        {c.title.replace('{city}', cityIn(city))}
      </div>
      <div className="card__sub">{c.subtitle}</div>
    </button>
  )
}

export function CardsRow({ s }: { s: Section }) {
  const { setOnboardingOpen } = useApp()
  return (
    <div className="cards-wrap">
      {s.deco === 'start' && (
        <button
          onClick={() => {
            triggerHaptic('medium')
            setOnboardingOpen(true)
          }}
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
          aria-label="Подобрать меры поддержки"
        >
          <StartSticker className="deco-start" />
        </button>
      )}
      {s.deco === 'rays' && <Rays className="deco-rays" />}
      <div className="cards">
        {s.cards.map((c, idx) => (
          <SingleCard key={c.id} c={c} sId={s.id} index={idx} />
        ))}
      </div>
    </div>
  )
}

const BOTTOM_SERVICES = [
  {
    title: 'Регистрация',
    to: '/card/guide',
    icon: (
      <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
    ),
  },
  {
    title: 'Налоги',
    to: '/card/forms',
    icon: (
      <svg viewBox="0 0 24 24"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="16" y1="14" x2="16" y2="18"/><path d="M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M8 18h.01M12 18h.01"/></svg>
    ),
  },
  {
    title: 'Документы',
    to: '/services',
    icon: (
      <svg viewBox="0 0 24 24"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>
    ),
  },
  {
    title: 'Обучение',
    to: '/learning',
    icon: (
      <svg viewBox="0 0 24 24"><path d="m4 6 8-4 8 4-8 4-8-4Z"/><path d="m18 10 4 2v6"/><path d="M6 10v6c0 2.5 2.7 4 6 4s6-1.5 6-4v-6"/></svg>
    ),
  },
]

function ServicesBottomRow() {
  const nav = useNavigate()
  return (
    <div className="services-bottom-grid">
      {BOTTOM_SERVICES.map((s) => (
        <button
          key={s.title}
          className="services-bottom-tile"
          onClick={() => {
            triggerHaptic('light')
            nav(s.to)
          }}
        >
          {s.icon}
          <span>{s.title}</span>
        </button>
      ))}
    </div>
  )
}

export default function Home() {
  const nav = useNavigate()
  const { setOnboardingOpen } = useApp()
  return (
    <div className="page home">
      <Stories />
      <Facts />
      {SECTIONS.map((s) => (
        <section key={s.id} className={`home-sec home-sec--${s.id}`}>
          <div className="home-sec__head">
            <SectionTitle
              s={s}
              onClick={() => {
                triggerHaptic('light')
                if (s.id === 'start') {
                  setOnboardingOpen(true)
                } else {
                  nav(`/section/${s.id}`)
                }
              }}
            />
            {s.deco === 'rays-right' && <Rays className="deco-rays-right" />}
          </div>
          <CardsRow s={s} />
        </section>
      ))}

      {/* Самый нижний блок: СЕРВИСЫ (4 квадрата в одну строку строго под всеми секциями) */}
      <section className="home-sec home-sec--services-bottom">
        <div className="home-sec__head">
          <button
            className="sec-title"
            onClick={() => {
              triggerHaptic('light')
              nav('/services')
            }}
          >
            <span className="hl hl--purple">Сервисы</span>
            <span className="sec-title__gt">&gt;</span>
          </button>
        </div>
        <ServicesBottomRow />
      </section>
    </div>
  )
}
