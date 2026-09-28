import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FACTS, SECTIONS, STORIES, type Card, type Section } from '../data'
import { cityIn, useApp } from '../store'
import { ClayCoin, DeadlineSticker, HotSticker, SparkleClay, StartSticker, TwinSparkle, ZeroPercentSticker, ZigArrow } from '../components/icons'
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
      <svg className="sec-title__gt" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="m9 18 6-6-6-6" />
      </svg>
    </button>
  )
}

function Stories() {
  const { viewedSlides, isStoryFullyViewed } = useApp()
  const [openStoryId, setOpenStoryId] = useState<string | null>(null)

  // Пока человек не просмотрел, ни одна из историй не отображается серым.
  // Просмотренные истории автоматически уходят вправо (только когда все слайды просмотрены).
  const sortedStories = useMemo(() => {
    return [...STORIES].sort((a, b) => {
      const aDone = isStoryFullyViewed(a.id, a.slides.length) ? 1 : 0
      const bDone = isStoryFullyViewed(b.id, b.slides.length) ? 1 : 0
      return aDone - bDone
    })
  }, [viewedSlides, isStoryFullyViewed])

  const openStory = openStoryId ? STORIES.find((s) => s.id === openStoryId) : null

  return (
    <>
      <div className="stories">
        {sortedStories.map((s) => {
          const fullyViewed = isStoryFullyViewed(s.id, s.slides.length)
          const count = s.slides.length
          const gap = count === 1 ? 0 : count === 2 ? 4 : 3.5
          const len = (100 - count * gap) / count

          return (
            <button
              key={s.id}
              className={`story-tile ${fullyViewed ? 'is-viewed' : ''}`}
              onClick={() => {
                triggerHaptic('light')
                setOpenStoryId(s.id)
              }}
              aria-label={s.title}
            >
              <svg className="story-ring" viewBox="0 0 100 100">
                {s.slides.map((_, idx) => {
                  const done = viewedSlides.has(`${s.id}:${idx}`)
                  return (
                    <rect
                      key={idx}
                      x="2"
                      y="2"
                      width="96"
                      height="96"
                      rx="16"
                      fill="none"
                      stroke={done ? '#555558' : '#8455f6'}
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      pathLength={100}
                      strokeDasharray={`${len} ${100 - len}`}
                      strokeDashoffset={`${-(idx * (len + gap) + gap / 2)}`}
                    />
                  )
                })}
              </svg>
              <div className="story-tile__inner">
                {s.cover ? <img src={s.cover} alt={s.title} /> : <span>{s.title}</span>}
              </div>
            </button>
          )
        })}
      </div>
      {openStory && (
        <StoryViewer
          story={openStory}
          onClose={() => setOpenStoryId(null)}
        />
      )}
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
        <span className="facts__cta">
          <span>Пройти тест бизнеса</span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: '3px' }}>
            <path d="m9 18 6-6-6-6" />
          </svg>
        </span>
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

  // Фирменные 3D SVG-стикеры в правый верхний угол внахлёст
  let sticker = null
  if (sId === 'start') {
    if (index === 0) sticker = <StartSticker className="card__sticker" />
    else if (index === 1) sticker = <HotSticker className="card__sticker" />
  } else if (sId === 'finance') {
    if (index === 0) sticker = <HotSticker className="card__sticker" />
    else if (index === 1) sticker = <ZeroPercentSticker className="card__sticker" />
  } else if (sId === 'free') {
    if (index === 0) sticker = <StartSticker className="card__sticker" />
    else if (index === 2) sticker = <DeadlineSticker className="card__sticker" />
  }

  // Цвета тегов (пинов)
  const isPurpleTag = sId === 'finance' ? index % 2 === 1 : false
  const isYellowTag = sId === 'start' ? index % 2 === 1 : false

  // Маскот для «Начни свое дело»
  const isStart = sId === 'start'
  const mascot = isStart ? (index % 3 === 0 ? mascotCoin : index % 3 === 1 ? mascotThink : mascotWave) : null

  // Декоративная глиняная иконка справа вверху (аккуратный размер 32px для единой высоты)
  let decoIcon = null
  if (sId === 'finance') {
    decoIcon = index === 0 ? <TwinSparkle size={32} /> : index === 1 ? <ClayCoin size={32} /> : <SparkleClay size={32} />
  } else if (sId === 'free') {
    decoIcon = <SparkleClay size={32} />
  }

  // Форматирование заголовка — гарантируем перенос в 2 строки без вылетов
  let title = c.title.replace('{city}', cityIn(city))
  if (c.id === 'subsidy' || title === 'Субсидия 50%') title = 'Субсидия\n50%'
  if (c.id === 'leasing' || title === 'Льготный лизинг') title = 'Льготный\nлизинг'
  if (c.id === 'events-city') title = `Встречи в\n${cityIn(city)}`
  if (c.id === 'events-online') title = 'Онлайн-\nэфиры'
  if (c.id === 'where-to-start') title = 'С чего\nначать?'
  if (c.id === 'forms') title = 'ИП или\nООО'
  if (c.id === 'guide') title = 'Гайд для\nстарта'

  return (
    <button className={`card card--${sId}`} onClick={handleClick}>
      {sticker}
      <div className="card__top">
        <span className={`card__tag ${isPurpleTag ? 'card__tag--purple' : isYellowTag ? 'card__tag--yellow' : ''}`}>
          {c.tag || 'старт'}
        </span>
        {decoIcon && <div className="card__icon">{decoIcon}</div>}
      </div>
      <div className="card__body">
        <div className="card__title">{title}</div>
        <div className="card__sub">{c.subtitle}</div>
      </div>
      {mascot && <img className="card__mascot" src={mascot} alt="mascot" />}
    </button>
  )
}

export function CardsRow({ s }: { s: Section }) {
  return (
    <div className="cards-wrap">
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
      <svg viewBox="0 0 24 24" fill="none" stroke="#8455f6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    title: 'Налоги',
    to: '/card/forms',
    icon: (
      <svg viewBox="0 0 24 24" stroke="#8455f6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <rect className="calc-frame" x="4" y="2" width="16" height="20" rx="3" stroke="#8455f6" strokeWidth="1.8" fill="none" />
        <rect className="calc-screen" x="7" y="5" width="10" height="3.5" rx="1" fill="#f5c06a" fillOpacity="0.3" stroke="#f5c06a" strokeWidth="1.2" />
        <rect className="calc-btn" x="7" y="11" width="2.2" height="2.2" rx="0.5" fill="#f5c06a" stroke="none" />
        <rect className="calc-btn" x="11" y="11" width="2.2" height="2.2" rx="0.5" fill="#f5c06a" stroke="none" />
        <rect className="calc-btn" x="15" y="11" width="2.2" height="2.2" rx="0.5" fill="#f5c06a" stroke="none" />
        <rect className="calc-btn" x="7" y="14.5" width="2.2" height="2.2" rx="0.5" fill="#f5c06a" stroke="none" />
        <rect className="calc-btn" x="11" y="14.5" width="2.2" height="2.2" rx="0.5" fill="#f5c06a" stroke="none" />
        <rect className="calc-btn" x="15" y="14.5" width="2.2" height="2.2" rx="0.5" fill="#f5c06a" stroke="none" />
        <rect className="calc-btn" x="7" y="18" width="6.2" height="2" rx="0.5" fill="#f5c06a" stroke="none" />
        <rect className="calc-btn" x="15" y="18" width="2.2" height="2.2" rx="0.5" fill="#f5c06a" stroke="none" />
      </svg>
    ),
  },
  {
    title: 'Документы',
    to: '/services',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#8455f6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
        <line x1="12" y1="11" x2="12" y2="17" />
        <line x1="9" y1="14" x2="15" y2="14" />
      </svg>
    ),
  },
  {
    title: 'Обучение',
    to: '/learning',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#8455f6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="m4 6 8-4 8 4-8 4-8-4Z" />
        <path d="m18 10 4 2v6" />
        <path d="M6 10v6c0 2.5 2.7 4 6 4s6-1.5 6-4v-6" />
      </svg>
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
            <svg className="sec-title__gt" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>
        <ServicesBottomRow />
      </section>
    </div>
  )
}
