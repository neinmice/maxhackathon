import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import mascot from '../assets/mascot-door.webp'
import { CITIES } from '../data'
import { useApp } from '../store'
import { CheckIcon, PinIcon, Scribble, SearchIcon } from './icons'
import Sheet from './Sheet'

export function Avatar({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <span className={`avatar ${className}`} style={{ width: size, height: size }}>
      <img src={mascot} alt="" draggable={false} />
    </span>
  )
}

export default function Header() {
  const nav = useNavigate()
  const { city, setCity, userName } = useApp()
  const [open, setOpen] = useState(false)
  const short = CITIES.find((c) => c.name === city)!.short

  return (
    <>
      <header className="header">
        <button className="header__user" onClick={() => nav('/profile')} aria-label="Личный кабинет">
          <Avatar size={34} />
          <span className="header__name">
            <Scribble className="header__scribble" />
            <span>{userName}</span>
          </span>
        </button>
        <div className="header__right">
          <button className="icon-btn" onClick={() => nav('/search')} aria-label="Поиск">
            <SearchIcon />
          </button>
          <button className="header__geo" onClick={() => setOpen(true)}>
            <PinIcon className="header__pin" />
            <span>{short}</span>
          </button>
        </div>
      </header>

      <Sheet open={open} onClose={() => setOpen(false)} title="Выбери город">
        <div className="city-list">
          {CITIES.map((c) => (
            <button
              key={c.name}
              className={`city-item ${c.name === city ? 'is-active' : ''}`}
              onClick={() => {
                setCity(c.name)
                setOpen(false)
              }}
            >
              <PinIcon className="city-item__pin" />
              <span className="city-item__text">
                <b>{c.name}</b>
                <small>{c.region}</small>
              </span>
              {c.name === city && <CheckIcon className="city-item__check" />}
            </button>
          ))}
        </div>
      </Sheet>
    </>
  )
}
