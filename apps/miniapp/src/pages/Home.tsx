import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FACTS, SECTIONS, STORIES, type Section } from '../data'
import { cityIn, useApp } from '../store'
import { Rays, StartSticker, ZigArrow } from '../components/icons'
import StoryViewer from '../components/StoryViewer'

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
          <button key={s.id} className={`story-tile ${viewedStories.has(s.id) ? 'is-viewed' : ''}`} onClick={() => setOpen(i)}>
            <span>{s.title}</span>
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

  const go = (d: 1 | -1) => {
    setDir(d)
    setI((v) => (v + d + FACTS.length) % FACTS.length)
  }

  useEffect(() => {
    timer.current = window.setTimeout(() => go(1), 4500)
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
      <p key={i} className={`facts__text ${dir === 1 ? 'from-right' : 'from-left'}`}>
        {FACTS[i]}
      </p>
      <button className="facts__arrow facts__arrow--right" onClick={() => go(1)} aria-label="Вперёд">
        <ZigArrow />
      </button>
    </div>
  )
}

export function CardsRow({ s }: { s: Section }) {
  const nav = useNavigate()
  const { city, setOnboardingOpen } = useApp()
  return (
    <div className="cards-wrap">
      {s.deco === 'start' && (
        <button
          onClick={() => setOnboardingOpen(true)}
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
          aria-label="Подобрать меры поддержки"
        >
          <StartSticker className="deco-start" />
        </button>
      )}
      {s.deco === 'rays' && <Rays className="deco-rays" />}
      <div className="cards">
        {s.cards.map((c) => (
          <button key={c.id} className="card" onClick={() => nav(`/card/${c.id}`)}>
            <span>{c.title.replace('{city}', cityIn(city))}</span>
          </button>
        ))}
      </div>
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
    </div>
  )
}

