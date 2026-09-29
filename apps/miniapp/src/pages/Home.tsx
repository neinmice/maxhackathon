import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FACTS, GRANTS, SECTIONS, STORIES, type Card, type Section } from '../data'
import { cityIn, useApp } from '../store'
import { ClayCoin, DeadlineSticker, SparkleClay, StartSticker, QuizPinSticker, TwinSparkle, ZeroPercentSticker, ZigArrow, ServiceGlyph } from '../components/icons'
import StoryViewer from '../components/StoryViewer'
import { triggerHaptic, triggerSelectionChanged } from '../lib/maxBridge'
import mascotCoin from '../assets/mascot/mascot-coin.webp'
import mascotThink from '../assets/mascot/mascot-think.webp'
import mascotWave from '../assets/mascot/mascot-wave.webp'
import Sheet from '../components/Sheet'
import InDevelopmentCard from '../components/InDevelopmentCard'

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

function renderFactLine(raw: string) {
  if (!raw) return null
  const regex = /\{(y|p):([^}]+)\}/g
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(raw)) !== null) {
    if (match.index > lastIndex) {
      parts.push(raw.substring(lastIndex, match.index).replace(/ /g, '\u00A0'))
    }
    const isYellow = match[1] === 'y'
    parts.push(
      <span key={match.index} className={`hl ${isYellow ? 'hl--yellow' : 'hl--purple'}`}>
        {match[2].replace(/ /g, '\u00A0')}
      </span>,
    )
    lastIndex = regex.lastIndex
  }

  if (lastIndex < raw.length) {
    parts.push(raw.substring(lastIndex).replace(/ /g, '\u00A0'))
  }

  return parts.length > 0 ? parts : raw
}

function Facts() {
  const nav = useNavigate()
  const [i, setI] = useState(0)
  const [dir, setDir] = useState<1 | -1>(1)
  const timer = useRef<number>(0)
  const touchX = useRef<number | null>(null)

  const go = (d: 1 | -1) => {
    triggerSelectionChanged()
    setDir(d)
    setI((v) => (v + d + FACTS.length) % FACTS.length)
  }

  useEffect(() => {
    timer.current = window.setTimeout(() => go(1), 10000)
    return () => window.clearTimeout(timer.current)
  }, [i])

  const item = FACTS[i]
  const text = typeof item === 'string' ? item : item.text
  const hasQuiz = typeof item === 'object' ? Boolean(item.hasQuiz) : false
  const lines = text.split('\n')

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
        key={i}
        className={`facts__text ${dir === 1 ? 'from-right' : 'from-left'}`}
        onClick={() => {
          if (hasQuiz) {
            triggerHaptic('medium')
            nav('/quiz')
          }
        }}
        role={hasQuiz ? 'button' : undefined}
        tabIndex={hasQuiz ? 0 : undefined}
      >
        <span className="facts__message">
          <span className="facts__line facts__line--1">{renderFactLine(lines[0])}</span>
          <span className="facts__line facts__line--2">
            <span>{renderFactLine(lines[1] || '')}</span>
            {hasQuiz && (
              <span
                className="facts__quiz-pin"
                onClick={(e) => {
                  e.stopPropagation()
                  triggerHaptic('medium')
                  nav('/quiz')
                }}
                role="button"
                tabIndex={0}
                aria-label="Пройти тест"
              >
                <QuizPinSticker />
              </span>
            )}
          </span>
        </span>
      </div>
      <button className="facts__arrow facts__arrow--right" onClick={() => go(1)} aria-label="Вперёд">
        <ZigArrow />
      </button>
    </div>
  )
}

export function SingleCard({
  c,
  sId,
  index,
  isHero = false,
}: {
  c: Card
  sId: string
  index: number
  isHero?: boolean
}) {
  const nav = useNavigate()
  const { city, setMeasureDetail } = useApp()

  const handleClick = () => {
    if (isHero) return
    triggerHaptic('light')

    // Финансовая поддержка: 300.000 ₽, 0% ставка, субсидия, лизинг -> открывает карточку с мерой из grants
    if (sId === 'finance') {
      const grantMap: Record<string, string> = {
        'grant-300': 'g1',
        'credit': 'g2',
        'subsidy': 'g4',
        'leasing': 'g5',
      }
      const gId = grantMap[c.id]
      const found = GRANTS.find((g) => g.id === gId)
      if (found) {
        setMeasureDetail(found)
        return
      }
    }

    // Блок «Начни свое дело»: карточка «Грант» -> просто открывает категорию с грантами
    if (sId === 'start' && c.id === 'idea') {
      nav('/grants')
      return
    }

    nav(`/card/${c.id}`)
  }

  // Фирменные 3D SVG-стикеры в правый верхний угол внахлёст
  let sticker = null
  if (sId === 'start') {
    if (index === 0) sticker = <StartSticker className="card__sticker" />
  } else if (sId === 'finance') {
    if (index === 1) sticker = <ZeroPercentSticker className="card__sticker" />
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

  // Форматирование заголовка — для широкого формата убираем принудительный перенос, для узкого переносим
  let title = c.title.replace('{city}', cityIn(city))
  if (isHero) {
    title = title.replace('\n', ' ')
  } else {
    if (c.id === 'subsidy' || title === 'Субсидия 50%') title = 'Субсидия\n50%'
    if (c.id === 'leasing' || title === 'Льготный лизинг') title = 'Льготный\nлизинг'
    if (c.id === 'events-city') title = `Встречи в\n${cityIn(city)}`
    if (c.id === 'events-online') title = 'Онлайн-\nэфиры'
    if (c.id === 'where-to-start') title = 'С чего\nначать?'
    if (c.id === 'forms') title = 'ИП или\nООО'
    if (c.id === 'guide') title = 'Гайд для\nстарта'
  }

  const Comp = isHero ? 'div' : 'button'

  return (
    <Comp
      className={`card card--${sId} ${isHero ? 'card--hero' : ''}`}
      onClick={isHero ? undefined : handleClick}
    >
      {sticker}
      <div className="card__top">
        <span className={`card__tag ${isPurpleTag ? 'card__tag--purple' : isYellowTag ? 'card__tag--yellow' : ''}`}>
          {c.tag || 'старт'}
        </span>
      </div>
      {decoIcon && <div className="card__icon">{decoIcon}</div>}
      <div className="card__title">{title}</div>
      <div className="card__sub">{c.subtitle}</div>
      {mascot && <img className="card__mascot" src={mascot} alt="mascot" />}
    </Comp>
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
    to: '/services/registration',
    glyph: 'register',
    variant: 'purple',
  },
  {
    title: 'Налоги',
    to: '/services/taxes',
    glyph: 'calc',
    variant: 'yellow',
  },
  {
    title: 'Документы',
    to: '/services/documents',
    glyph: 'docs',
    variant: 'yellow',
  },
  {
    title: 'Стажировка',
    to: '/services/internship',
    glyph: 'internship',
    variant: 'purple',
  },
]

function ServicesBottomRow() {
  const nav = useNavigate()
  const [internshipOpen, setInternshipOpen] = useState(false)

  return (
    <>
      <div className="services-bottom-grid">
        {BOTTOM_SERVICES.map((s) => (
          <button
            key={s.title}
            className="services-bottom-tile"
            onClick={() => {
              triggerHaptic('light')
              if (s.glyph === 'internship') {
                setInternshipOpen(true)
                return
              }
              nav(s.to)
            }}
          >
            <div className={`services-bottom-tile__icon services-bottom-tile__icon--${s.variant}`}>
              <ServiceGlyph name={s.glyph} />
            </div>
            <span className="services-bottom-tile__label">{s.title}</span>
          </button>
        ))}
      </div>

      <Sheet open={internshipOpen} onClose={() => setInternshipOpen(false)}>
        <InDevelopmentCard
          title="Витрина стажировок"
          desc="Единая платформа поиска молодых специалистов и оплачиваемой практики для бизнеса через MAX."
          serviceId="internship"
          storageKey="zvery_internship_notify"
          onClose={() => setInternshipOpen(false)}
          closeLabel="Закрыть"
          embedded
        />
      </Sheet>
    </>
  )
}

export default function Home() {
  const nav = useNavigate()
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
                nav(`/section/${s.id}`)
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
            <span>Сервисы</span>
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
