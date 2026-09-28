import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import mascotWave from '../assets/mascot/mascot-wave.png'
import { apiClient } from '../api/client'
import { Avatar } from '../components/Header'
import EmptyState from '../components/ui/EmptyState'
import {
  BackIcon,
  BellIcon,
  CheckIcon,
  ChevronIcon,
  ClockIcon,
  LockIcon,
  PlayIcon,
  Rays,
  Scribble,
  SearchIcon,
  ServiceGlyph,
  StartSticker,
  ZigArrow,
} from '../components/icons'
import Sheet from '../components/Sheet'
import { COURSES, GRANT_FILTERS, GRANTS, LESSONS, SECTIONS, SERVICES, allCards, type Grant } from '../data'
import { cityIn, useApp } from '../store'
import { SectionTitle } from './Home'

/* ---------- shared ---------- */

export function PageTitle({ pre, hl, post, color = 'yellow', back }: { pre?: string; hl: string; post?: string; color?: 'yellow' | 'purple'; back?: boolean }) {
  const nav = useNavigate()
  return (
    <div className="page-title">
      {back && (
        <button className="icon-btn page-title__back" onClick={() => nav(-1)} aria-label="Назад">
          <BackIcon />
        </button>
      )}
      <h1>
        {pre && <>{pre} </>}
        <span className={`hl hl--${color}`}>{hl}</span>
        {post && <> {post}</>}
      </h1>
    </div>
  )
}

/* ---------- services ---------- */

export function Services() {
  const { showToast } = useApp()
  const [open, setOpen] = useState<(typeof SERVICES)[number] | null>(null)
  return (
    <div className="page">
      <PageTitle pre="Все" hl="сервисы" post="для бизнеса" color="purple" />
      <div className="promo">
        <div className="promo__text">
          <b>Открой ИП онлайн</b>
          <span>за 3 дня без визита в налоговую</span>
          <button className="btn btn--primary btn--sm" onClick={() => setOpen(SERVICES[0])}>
            Начать
          </button>
        </div>
        <StartSticker className="promo__sticker" />
        <ZigArrow className="promo__arrow" />
      </div>
      <div className="svc-grid">
        {SERVICES.map((s) => (
          <button key={s.id} className="svc" onClick={() => setOpen(s)}>
            <span className="svc__icon">
              <ServiceGlyph name={s.icon} />
            </span>
            <b>{s.title}</b>
            <small>{s.sub}</small>
            {s.badge && <em className="svc__badge">{s.badge}</em>}
          </button>
        ))}
      </div>
      <Sheet open={!!open} onClose={() => setOpen(null)} title={open?.title}>
        {open && (
          <div className="sheet-body">
            <div className="svc svc--hero">
              <span className="svc__icon">
                <ServiceGlyph name={open.icon} />
              </span>
              <small>{open.sub}</small>
            </div>
            <p className="muted">Сервис скоро будет доступен прямо в приложении. Оставь заявку, и специалист центра «Мой бизнес» свяжется с тобой.</p>
            <button
              className="btn btn--primary btn--block"
              onClick={() => {
                setOpen(null)
                showToast('Заявка отправлена')
              }}
            >
              Оставить заявку
            </button>
          </div>
        )}
      </Sheet>
    </div>
  )
}

/* ---------- grants ---------- */

function GrantCard({ g, onOpen }: { g: Grant; onOpen: () => void }) {
  return (
    <button className="grant" onClick={onOpen}>
      <div className="grant__top">
        <span className="grant__amount">{g.amount}</span>
        {g.hot && <em className="grant__hot">горит</em>}
      </div>
      <b className="grant__title">{g.title}</b>
      <small className="grant__org">{g.org}</small>
      <div className="grant__tags">
        {g.tags.map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>
      <div className="grant__bottom">
        <span className="grant__deadline">
          <ClockIcon /> {g.deadline}
        </span>
        <span className="grant__filled">приём открыт</span>
      </div>
      <span className="grant__bar">
        <i style={{ width: `${g.filled}%` }} />
      </span>
    </button>
  )
}

export function Grants() {
  const { setMeasureDetail } = useApp()
  const [f, setF] = useState('Все')
  const list = GRANTS.filter((g) => f === 'Все' || g.kind === f)
  return (
    <div className="page">
      <PageTitle pre="Гранты и" hl="поддержка" color="purple" />
      <div className="grant-hero">
        <div>
          <span className="grant-hero__label">Тебе доступно до</span>
          <b className="grant-hero__sum">1.800.000 ₽</b>
          <span className="grant-hero__sub">по 5 программам поддержки</span>
        </div>
        <Rays className="grant-hero__rays" color="#f5c56d" shade="#b98a33" />
      </div>
      <div className="filters">
        {GRANT_FILTERS.map((x) => (
          <button key={x} className={`filter ${f === x ? 'is-active' : ''}`} onClick={() => setF(x)}>
            {x}
          </button>
        ))}
      </div>
      <div className="grant-list">
        {list.map((g) => (
          <GrantCard key={g.id} g={g} onOpen={() => setMeasureDetail(g)} />
        ))}
        {list.length === 0 && (
          <EmptyState
            title="В этой категории пока нет программ"
            description="Выберите «Все» или измените категорию, чтобы увидеть доступные меры господдержки."
            onResetFilters={() => setF('Все')}
            resetLabel="Показать все гранты"
          />
        )}
      </div>
    </div>
  )
}

/* ---------- learning ---------- */

export function Learning() {
  const nav = useNavigate()
  const current = COURSES[0]
  return (
    <div className="page">
      <PageTitle pre="Твое" hl="обучение" color="yellow" />
      <button className="continue" onClick={() => nav(`/learning/${current.id}`)}>
        <div className="continue__text">
          <span className="continue__label">Продолжить</span>
          <b>{current.title}</b>
          <span className="continue__meta">
            урок {current.done + 1} из {current.lessons}
          </span>
          <span className="progress">
            <i style={{ width: `${(current.done / current.lessons) * 100}%` }} />
          </span>
        </div>
        <span className="continue__play">
          <PlayIcon />
        </span>
        <Scribble className="continue__scribble" />
      </button>

      <h2 className="sub-h">Курсы</h2>
      <div className="course-list">
        {COURSES.map((c) => (
          <button key={c.id} className={`course course--${c.color}`} onClick={() => !c.locked && nav(`/learning/${c.id}`)} disabled={c.locked}>
            <span className="course__cover">
              {c.color === 'purple' && <Rays />}
              {c.color === 'yellow' && <ZigArrow dir="left" />}
              {c.color === 'blue' && <ZigArrow color="#5b8ff7" shade="#2f5cc0" />}
            </span>
            <span className="course__body">
              <b>{c.title}</b>
              <small>
                {c.lessons} уроков · {c.duration} · {c.level}
              </small>
              {c.done > 0 && (
                <span className="progress progress--sm">
                  <i style={{ width: `${(c.done / c.lessons) * 100}%` }} />
                </span>
              )}
            </span>
            {c.locked ? <LockIcon className="course__lock" /> : <ChevronIcon className="course__chev" />}
          </button>
        ))}
      </div>
    </div>
  )
}

export function Course() {
  const { id } = useParams()
  const { showToast } = useApp()
  const c = COURSES.find((x) => x.id === id) ?? COURSES[0]
  return (
    <div className="page">
      <PageTitle hl={c.title} back color="yellow" />
      <div className="course-hero">
        <img src={mascotWave} alt="" />
        <div>
          <b>
            {c.done} / {c.lessons}
          </b>
          <span>уроков пройдено</span>
          <span className="progress">
            <i style={{ width: `${(c.done / c.lessons) * 100}%` }} />
          </span>
        </div>
      </div>
      <div className="lessons">
        {LESSONS.map((l, i) => {
          const isNext = !l.done && (i === 0 || LESSONS[i - 1].done)
          return (
            <button key={l.t} className={`lesson ${l.done ? 'is-done' : ''} ${isNext ? 'is-next' : ''}`} onClick={() => showToast(l.done ? 'Урок уже пройден' : 'Урок запущен')}>
              <span className="lesson__n">{l.done ? <CheckIcon /> : i + 1}</span>
              <span className="lesson__t">
                <b>{l.t}</b>
                <small>
                  <ClockIcon /> {l.d}
                </small>
              </span>
              {isNext && (
                <span className="lesson__play">
                  <PlayIcon />
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ---------- home section list + card ---------- */

export function SectionPage() {
  const { id } = useParams()
  const nav = useNavigate()
  const { city } = useApp()
  const s = SECTIONS.find((x) => x.id === id) ?? SECTIONS[0]
  return (
    <div className="page">
      <div className="page-title">
        <button className="icon-btn page-title__back" onClick={() => nav(-1)} aria-label="Назад">
          <BackIcon />
        </button>
        <SectionTitle s={s} />
      </div>
      <div className="card-grid">
        {s.cards.map((c) => (
          <button key={c.id} className="card card--full" onClick={() => nav(`/card/${c.id}`)}>
            {c.tag && <em className="card__tag">{c.tag}</em>}
            <span>{c.title.replace('{city}', cityIn(city))}</span>
            <small>{c.subtitle}</small>
          </button>
        ))}
      </div>
    </div>
  )
}

export function CardPage() {
  const { id } = useParams()
  const nav = useNavigate()
  const { city, toggleSaveMeasure, savedMeasures } = useApp()
  const c = allCards().find((x) => x.id === id) ?? allCards()[0]
  const isSaved = savedMeasures.has(c.id)
  return (
    <div className="page">
      <div className="page-title">
        <button className="icon-btn page-title__back" onClick={() => nav(-1)} aria-label="Назад">
          <BackIcon />
        </button>
      </div>
      <div className="detail-hero">
        {c.tag && <em className="card__tag">{c.tag}</em>}
        <h1>{c.title.replace('{city}', cityIn(city))}</h1>
        <p>{c.subtitle}</p>
        <Rays className="detail-hero__rays" />
      </div>
      <ol className="steps">
        {c.body.map((b, i) => (
          <li key={b}>
            <span className="steps__n">{i + 1}</span>
            <span>{b}</span>
          </li>
        ))}
      </ol>
      <div className="detail-actions">
        <button
          className={`btn ${isSaved ? 'btn--ghost' : 'btn--primary'} btn--block`}
          onClick={() => toggleSaveMeasure(c.id)}
        >
          {isSaved ? 'Удалить из сохранённых' : 'Добавить в мой план'}
        </button>
        <button
          className="btn btn--ghost btn--block"
          onClick={() => nav('/assistant', { state: { q: `Расскажи подробнее: ${c.title.replace('{city}', cityIn(city))}` } })}
        >
          Спросить помощника
        </button>
      </div>
    </div>
  )
}

/* ---------- profile ---------- */

export function Profile() {
  const nav = useNavigate()
  const { city, userName, role, savedMeasures, toggleSaveMeasure, setOnboardingOpen, setQuizOpen, showToast } = useApp()
  const [notif, setNotif] = useState(true)

  const roleTitle =
    role === 'ip'
      ? 'Индивидуальный предприниматель'
      : role === 'self_employed'
        ? 'Самозанятый (НПД)'
        : role === 'llc'
          ? 'Юрлицо (ООО)'
          : role === 'intern'
            ? 'Стажер / Ищу практику'
            : 'Пока только планирую'

  const rows = [
    { t: 'Мои заявки', v: '1 активная', onClick: () => showToast('Заявка на рассмотрении') },
    { t: 'Избранные меры', v: `${savedMeasures.size} сохранено`, onClick: () => nav('/grants') },
    { t: 'Квиз и сертификат', v: 'Пройти тест', onClick: () => setQuizOpen(true) },
    { t: 'Параметры подбора мер', v: `${city} · ${role === 'ip' ? 'ИП' : role === 'self_employed' ? 'НПД' : role === 'llc' ? 'ООО' : role === 'intern' ? 'Стажер' : 'План'}`, onClick: () => setOnboardingOpen(true) },
    { t: 'Мой бизнес-план', v: '40%', onClick: () => showToast('Раздел бизнес-плана в разработке') },
  ]
  return (
    <div className="page">
      <div className="page-title">
        <button className="icon-btn page-title__back" onClick={() => nav(-1)} aria-label="Назад">
          <BackIcon />
        </button>
      </div>
      <div className="profile">
        <Avatar size={88} className="profile__ava" />
        <div className="profile__name">
          <Scribble className="profile__scribble" />
          <span>{userName}</span>
        </div>
        <small className="muted">{roleTitle} · {city}</small>
      </div>
      <div className="stats">
        <div>
          <b>5</b>
          <small>уроков</small>
        </div>
        <div>
          <b>{savedMeasures.size}</b>
          <small>сохранено</small>
        </div>
        <div>
          <b>3</b>
          <small>события</small>
        </div>
      </div>
      <div className="app-status">
        <div className="app-status__head">
          <b>Грант 300.000 ₽</b>
          <em>на проверке</em>
        </div>
        <div className="app-status__steps">
          {['Заявка', 'Обучение', 'Защита', 'Решение'].map((s, i) => (
            <span key={s} className={i < 2 ? 'is-done' : ''}>
              <i />
              {s}
            </span>
          ))}
        </div>
      </div>
      <div className="menu">
        {rows.map((r) => (
          <button key={r.t} className="menu__row" onClick={r.onClick}>
            <span>{r.t}</span>
            <span className="menu__v">
              {r.v}
              <ChevronIcon />
            </span>
          </button>
        ))}
        <label className="menu__row">
          <span className="menu__label">
            <BellIcon /> Уведомления и напоминания
          </span>
          <input
            type="checkbox"
            className="switch"
            checked={notif}
            onChange={(e) => {
              const val = e.target.checked
              setNotif(val)
              apiClient.optInNotifications(val)
              showToast(val ? 'Уведомления включены' : 'Уведомления отключены')
            }}
          />
        </label>
      </div>

      {savedMeasures.size > 0 && (
        <div style={{ marginTop: '1.25rem' }}>
          <h2 className="sub-h" style={{ marginBottom: '0.6rem' }}>Сохранённые меры</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {[...savedMeasures].map((id) => {
              const item = GRANTS.find((g) => g.id === id) || allCards().find((c) => c.id === id) || { id, title: `Мера поддержки #${id}` }
              return (
                <div key={id} className="menu__row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.86rem', fontWeight: 600 }}>{item.title}</span>
                  <button
                    className="btn btn--sm btn--ghost"
                    style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem', height: 'auto' }}
                    onClick={() => toggleSaveMeasure(id)}
                  >
                    Удалить
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

/* ---------- search ---------- */

export function Search() {
  const nav = useNavigate()
  const { city } = useApp()
  const [q, setQ] = useState('')
  const items = [
    ...allCards().map((c) => ({ t: c.title.replace('{city}', cityIn(city)), s: c.subtitle, to: `/card/${c.id}` })),
    ...SERVICES.map((s) => ({ t: s.title, s: s.sub, to: '/services' })),
    ...GRANTS.map((g) => ({ t: g.title, s: g.amount, to: '/grants' })),
    ...COURSES.map((c) => ({ t: c.title, s: 'курс', to: `/learning/${c.id}` })),
  ]
  const res = q.trim() ? items.filter((i) => (i.t + ' ' + i.s).toLowerCase().includes(q.toLowerCase())) : []
  const popular = ['грант', 'налоги', 'ИП', 'обучение', 'аренда']
  return (
    <div className="page">
      <div className="search-bar">
        <button className="icon-btn" onClick={() => nav(-1)} aria-label="Назад">
          <BackIcon />
        </button>
        <label className="search-bar__field">
          <SearchIcon />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск по приложению" />
        </label>
      </div>
      {!q && (
        <>
          <h2 className="sub-h">Популярное</h2>
          <div className="filters filters--wrap">
            {popular.map((p) => (
              <button key={p} className="filter" onClick={() => setQ(p)}>
                {p}
              </button>
            ))}
          </div>
        </>
      )}
      <div className="search-res">
        {res.map((r) => (
          <button key={r.t + r.to} className="menu__row" onClick={() => nav(r.to)}>
            <span className="search-res__t">
              <b>{r.t}</b>
              <small>{r.s}</small>
            </span>
            <ChevronIcon />
          </button>
        ))}
        {q && res.length === 0 && (
          <EmptyState
            title="Ничего не нашлось"
            description={`По запросу «${q}» ничего не найдено. Наш помощник готов ответить на ваши вопросы.`}
            action={{
              label: 'Спросить помощника',
              onClick: () => nav('/assistant', { state: { q } }),
            }}
          />
        )}
      </div>
    </div>
  )
}
