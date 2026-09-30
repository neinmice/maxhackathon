import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import mascot from '../assets/mascot/mascot-door-tab.webp'
import {
  DocFilledIcon,
  DocIcon,
  HomeIcon,
  HomeOutlineIcon,
  ServicesFilledIcon,
  ServicesIcon,
  WalletFilledIcon,
  WalletIcon,
} from './icons'
import { triggerSelectionChanged } from '../lib/maxBridge'
import { useApp } from '../store'

const TABS = [
  { to: '/', label: 'главная', Icon: HomeOutlineIcon, Active: HomeIcon, hasDot: false },
  { to: '/services', label: 'сервисы', Icon: ServicesIcon, Active: ServicesFilledIcon, hasDot: true },
  null,
  { to: '/grants', label: 'гранты', Icon: WalletIcon, Active: WalletFilledIcon, hasDot: true },
  { to: '/learning', label: 'обучение', Icon: DocIcon, Active: DocFilledIcon, hasDot: true },
]

const match = (path: string, to: string) => (to === '/' ? path === '/' || path.startsWith('/section') || path.startsWith('/card') : path.startsWith(to))

export default function TabBar() {
  const { pathname } = useLocation()
  const { dismissIntro } = useApp()
  const assistantActive = pathname.startsWith('/assistant')

  const [seenDots, setSeenDots] = useState<Record<string, boolean>>(() => {
    try {
      const saved = sessionStorage.getItem('zvery_tabs_seen')
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })

  const markTabSeen = (to: string) => {
    dismissIntro()
    triggerSelectionChanged()
    if (!seenDots[to]) {
      const next = { ...seenDots, [to]: true }
      setSeenDots(next)
      try {
        sessionStorage.setItem('zvery_tabs_seen', JSON.stringify(next))
      } catch {
        // no-op
      }
    }
  }

  const handleAssistantClick = () => {
    dismissIntro()
    triggerSelectionChanged()
  }

  return (
    <nav className="tabbar">
      {TABS.map((t) =>
        t === null ? (
          <NavLink
            key="assistant"
            to="/assistant"
            onClick={handleAssistantClick}
            className={`tab tab--mascot ${assistantActive ? 'is-active' : ''}`}
            aria-label="Ассистент"
          >
            <span className="tab__mascot">
              <img src={mascot} alt="" draggable={false} />
            </span>
          </NavLink>
        ) : (
          <NavLink
            key={t.to}
            to={t.to}
            onClick={() => markTabSeen(t.to)}
            className={`tab ${match(pathname, t.to) ? 'is-active' : ''}`}
          >
            <span className="tab__icon">
              {match(pathname, t.to) ? <t.Active /> : <t.Icon />}
              {t.hasDot && !seenDots[t.to] && <i className="tab__dot" />}
            </span>
            <span className="tab__label">{t.label}</span>
          </NavLink>
        ),
      )}
    </nav>
  )
}

