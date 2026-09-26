import { NavLink, useLocation } from 'react-router-dom'
import mascot from '../assets/mascot-door.png'
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

const TABS = [
  { to: '/', label: 'главная', Icon: HomeOutlineIcon, Active: HomeIcon, dot: true },
  { to: '/services', label: 'сервисы', Icon: ServicesIcon, Active: ServicesFilledIcon },
  null,
  { to: '/grants', label: 'гранты', Icon: WalletIcon, Active: WalletFilledIcon, dot: true },
  { to: '/learning', label: 'обучение', Icon: DocIcon, Active: DocFilledIcon },
]

const match = (path: string, to: string) => (to === '/' ? path === '/' || path.startsWith('/section') || path.startsWith('/card') : path.startsWith(to))

export default function TabBar() {
  const { pathname } = useLocation()
  const assistantActive = pathname.startsWith('/assistant')

  return (
    <nav className="tabbar">
      {TABS.map((t) =>
        t === null ? (
          <NavLink key="assistant" to="/assistant" className={`tab tab--mascot ${assistantActive ? 'is-active' : ''}`} aria-label="Ассистент">
            <span className="tab__mascot">
              <img src={mascot} alt="" draggable={false} />
            </span>
          </NavLink>
        ) : (
          <NavLink key={t.to} to={t.to} className={`tab ${match(pathname, t.to) ? 'is-active' : ''}`}>
            <span className="tab__icon">
              {match(pathname, t.to) ? <t.Active /> : <t.Icon />}
              {t.dot && <i className="tab__dot" />}
            </span>
            <span className="tab__label">{t.label}</span>
          </NavLink>
        ),
      )}
    </nav>
  )
}
