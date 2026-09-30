import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import mascotWave from '../assets/mascot/mascot-wave.webp'
import mascotCoin from '../assets/mascot/mascot-coin.webp'
import { apiClient } from '../api/client'
import { Avatar } from '../components/Header'
import EmptyState from '../components/ui/EmptyState'
import type { MeasureRecord } from '../types/api'
import {
  BackIcon,
  BellIcon,
  CheckIcon,
  ChevronIcon,
  ClockIcon,
  LockIcon,
  PlayIcon,
  QuizSticker,
  Rays,
  Scribble,
  SearchIcon,
  ServiceGlyph,
  StartSticker,
  ZigArrow,
} from '../components/icons'
import Sheet from '../components/Sheet'
import InDevelopmentCard from '../components/InDevelopmentCard'
import { COURSES, GRANT_FILTERS, LESSONS, SECTIONS, SERVICES, allCards, type Grant } from '../data'
import { cityIn, useApp } from '../store'
import { triggerHaptic } from '../lib/maxBridge'
import { loadCertificates } from '../lib/storage'
import { SingleCard } from './Home'
import WhereToStartPage from './cards/WhereToStartPage'
import CityEventsPage from './cards/CityEventsPage'
import OnlineEventsPage from './cards/OnlineEventsPage'

/* ---------- shared ---------- */

export function PageTitle({
  pre,
  hl,
  post,
  color = 'yellow',
  back,
  rightSlot,
}: {
  pre?: string
  hl: string
  post?: string
  color?: 'yellow' | 'purple' | 'white'
  back?: boolean
  rightSlot?: React.ReactNode
}) {
  const nav = useNavigate()
  return (
    <div
      className="page-title"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: rightSlot ? 'space-between' : 'flex-start',
        width: '100%',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', minWidth: 0 }}>
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
      {rightSlot && (
        <div style={{ flexShrink: 0, marginLeft: 'auto' }}>
          {rightSlot}
        </div>
      )}
    </div>
  )
}

/* ---------- services ---------- */

export function Services() {
  const nav = useNavigate()
  const { showToast } = useApp()
  const [open, setOpen] = useState<(typeof SERVICES)[number] | null>(null)
  return (
    <div className="page">
      <PageTitle pre="Все" hl="сервисы" post="для бизнеса" color="white" />
      <div className="promo">
        <div className="promo__text">
          <b>Открой ИП онлайн</b>
          <span>за 3 дня без визита в налоговую</span>
          <button className="btn btn--primary btn--sm" onClick={() => nav('/services/registration')}>
            Начать
          </button>
        </div>
        <StartSticker className="promo__sticker" />
        <ZigArrow className="promo__arrow" />
      </div>
      <div className="svc-grid">
        {SERVICES.map((s) => (
          <button
            key={s.id}
            className="svc"
            onClick={() => {
              triggerHaptic('light')
              if (s.id === 'register') return nav('/services/registration')
              if (s.id === 'calc') return nav('/services/taxes')
              if (s.id === 'docs') return nav('/services/documents')
              setOpen(s)
            }}
          >
            <span className="svc__icon">
              <ServiceGlyph name={s.icon} />
            </span>
            <b>{s.title}</b>
            <small>{s.sub}</small>
            {s.badge && <em className={`svc__badge ${s.badge === 'скоро' ? 'svc__badge--soon' : ''}`}>{s.badge}</em>}
          </button>
        ))}
      </div>
      <Sheet open={!!open} onClose={() => setOpen(null)}>
        {open && (
          <InDevelopmentCard
            title={open.title}
            desc={open.sub ? `${open.sub}. Сервис готовится к запуску в MAX.` : undefined}
            serviceId={open.id}
            storageKey={`zvery_notify_${open.id}`}
            onClose={() => setOpen(null)}
            closeLabel="Закрыть"
            embedded
          />
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

// Сопоставление MeasureRecord с ручным layout GrantCard: только фактические server-поля,
// суммы/сроки/источники не синтезируются — отсутствующее поле даёт нейтральный прочерк.
function measureToGrant(m: MeasureRecord): (Grant & { kind: string }) | null {
  const kind = m.category ?? 'Гранты'
  if (!GRANT_FILTERS.includes(kind)) return null
  return {
    id: m.id,
    kind,
    amount: m.amount_description ?? '—',
    title: m.title,
    org: m.operator,
    deadline: m.deadline ?? 'срок не указан',
    tags: [m.sector, m.data_status],
    filled: 0,
    req: [m.eligibility],
  }
}

export function Grants() {
  const { setMeasureDetail } = useApp()
  const [f, setF] = useState('Все')
  const [measures, setMeasures] = useState<MeasureRecord[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    apiClient
      .getAllMeasures()
      .then((records) => {
        if (!cancelled) setMeasures(records)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Каталог недоступен')
      })
    return () => {
      cancelled = true
    }
  }, [])

  const grants = (measures ?? []).map(measureToGrant).filter((g): g is Grant & { kind: string } => g !== null)
  const list = grants.filter((g) => f === 'Все' || g.kind === f)
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
        {measures !== null && list.length === 0 && (
          <EmptyState
            title="В этой категории пока нет программ"
            description="Выберите «Все» или измените категорию, чтобы увидеть доступные меры господдержки."
            onResetFilters={() => setF('Все')}
            resetLabel="Показать все гранты"
          />
        )}
        {error !== null && (
          <EmptyState
            title="Каталог недоступен"
            description={error}
          />
        )}
      </div>
    </div>
  )
}

/* ---------- learning ---------- */

export function Learning() {
  const nav = useNavigate()
  const { showToast } = useApp()

  const current = COURSES[0]

  // Разделение курсов:
  // «Мои курсы» — курсы в процессе прохождения (c.done > 0)
  // «Все курсы» — оставшиеся курсы (c.done === 0)
  const myCourses = COURSES.filter((c) => c.done > 0)
  const otherCourses = COURSES.filter((c) => c.done === 0)

  const quizCompleted = typeof window !== 'undefined' && localStorage.getItem('quiz_completed') === 'true'

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

      {/* Раздел: Тесты */}
      <div style={{ marginBottom: '1.25rem' }}>
        <h2 className="sub-h" style={{ margin: '0 0 0.75rem' }}>
          Тесты
        </h2>

        {/* Карточка теста — визуал точно по референсу скриншота 1 */}
        <button
          type="button"
          className="grant"
          style={{
            width: '100%',
            textAlign: 'left',
            cursor: 'pointer',
          }}
          onClick={() => {
            triggerHaptic('medium')
            nav('/quiz')
          }}
        >
          <div className="grant__top">
            <span
              className="grant__amount"
              style={{
                fontFamily: "'VK Sans Display Expanded', var(--display)",
                fontWeight: 700,
                fontSize: '1.14rem',
                lineHeight: 1.25,
                color: '#ffffff',
              }}
            >
              Тест на знание основ бизнеса
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.62rem',
                fontWeight: 700,
                fontFamily: 'var(--ui)',
                textTransform: 'uppercase',
                lineHeight: 1,
                padding: '0.18rem 0.55rem',
                borderRadius: '6px',
                background: quizCompleted ? 'rgba(52, 199, 89, 0.15)' : 'rgba(245, 192, 106, 0.15)',
                color: quizCompleted ? '#34c759' : 'var(--yellow)',
                border: `1px solid ${quizCompleted ? 'rgba(52, 199, 89, 0.3)' : 'rgba(245, 192, 106, 0.35)'}`,
                whiteSpace: 'nowrap',
                flexShrink: 0,
                letterSpacing: '0.04em',
              }}
            >
              {quizCompleted ? '5/5' : '0/5'}
            </span>
          </div>
          <div className="grant__tags">
            <span>5 вопросов</span>
            <span>Сертификат</span>
            <span>Налоги и гранты</span>
          </div>
          <div className="grant__bottom">
            <span className="grant__deadline">
              <ClockIcon /> 3–5 минут
            </span>
          </div>
        </button>
      </div>

      {/* Раздел: Мои курсы (курсы в процессе прохождения) */}
      {myCourses.length > 0 && (
        <div style={{ marginBottom: '1.25rem' }}>
          <h2 className="sub-h" style={{ margin: '0 0 0.75rem' }}>
            Мои курсы
          </h2>
          <div className="course-list">
            {myCourses.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`course course--${c.color}`}
                onClick={() => {
                  if (c.locked) {
                    triggerHaptic('medium')
                    showToast('Курс в разработке и скоро будет доступен')
                  } else {
                    triggerHaptic('light')
                    nav(`/learning/${c.id}`)
                  }
                }}
              >
                <span className="course__cover">
                  {c.color === 'purple' && <Rays />}
                  {c.color === 'yellow' && <ZigArrow dir="left" />}
                  {c.color === 'blue' && <ZigArrow color="#5b8ff7" shade="#2f5cc0" />}
                </span>
                <span className="course__body">
                  <b>{c.title}</b>
                  <small>
                    {c.done} из {c.lessons} уроков · {c.duration}
                  </small>
                  <span className="progress progress--sm">
                    <i style={{ width: `${(c.done / c.lessons) * 100}%` }} />
                  </span>
                </span>
                {c.locked ? <LockIcon className="course__lock" /> : <ChevronIcon className="course__chev" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Раздел: Все курсы (оставшиеся доступные курсы) */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 className="sub-h" style={{ margin: '0 0 0.75rem' }}>
          Все курсы
        </h2>
        <div className="course-list">
          {otherCourses.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`course course--${c.color}`}
              onClick={() => {
                if (c.locked) {
                  triggerHaptic('medium')
                  showToast('Курс в разработке и скоро будет доступен')
                } else {
                  triggerHaptic('light')
                  nav(`/learning/${c.id}`)
                }
              }}
            >
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
    </div>
  )
}

export function Course() {
  const { id } = useParams()
  const { showToast } = useApp()
  const c = COURSES.find((x) => x.id === id) ?? COURSES[0]
  const courseLessons = c.items || LESSONS

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
            <i style={{ width: `${c.lessons > 0 ? (c.done / c.lessons) * 100 : 0}%` }} />
          </span>
        </div>
      </div>
      <div className="lessons">
        {courseLessons.map((l, i, arr) => {
          const isNext = !l.done && (i === 0 || arr[i - 1].done)
          return (
            <button
              key={l.t}
              className={`lesson ${l.done ? 'is-done' : ''} ${isNext ? 'is-next' : ''}`}
              onClick={() => {
                triggerHaptic('medium')
                showToast('Материалы урока находятся в разработке')
              }}
            >
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
  const s = SECTIONS.find((x) => x.id === id) ?? SECTIONS[0]
  return (
    <div className="page">
      <PageTitle
        pre={s.pre}
        hl={s.hl}
        post={s.post}
        color={s.hlColor as any}
        back
      />
      <div className="card-grid">
        {s.cards.map((c, idx) => (
          <SingleCard key={c.id} c={c} sId={s.id} index={idx} />
        ))}
      </div>
    </div>
  )
}

export function CardPage() {
  const { id } = useParams()
  if (id === 'where-to-start') return <WhereToStartPage />
  if (id === 'events-city') return <CityEventsPage />
  if (id === 'events-online') return <OnlineEventsPage />

  const nav = useNavigate()
  const { city, toggleSaveMeasure, savedMeasures } = useApp()
  const c = allCards().find((x) => x.id === id) ?? allCards()[0]
  const isSaved = savedMeasures.has(c.id)

  const section = (c as any).section || SECTIONS.find((sec) => sec.cards.some((card) => card.id === c.id)) || SECTIONS[0]
  const index = section.cards.findIndex((card: any) => card.id === c.id)

  return (
    <div className="page">
      <div className="page-title">
        <button className="icon-btn page-title__back" onClick={() => nav(-1)} aria-label="Назад">
          <BackIcon />
        </button>
      </div>
      <SingleCard c={c} sId={section.id} index={index >= 0 ? index : 0} isHero />
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
  const { city, userName, role, savedMeasures, canonicalIds, toggleSaveMeasure, setOnboardingOpen, setQuizOpen, showToast } = useApp()
  const [notif, setNotif] = useState(true)
  const [measuresById, setMeasuresById] = useState<Map<string, MeasureRecord>>(new Map())

  // Тайтлы сохранённых мер берутся из канонического каталога; при недоступном API секция скрыта
  useEffect(() => {
    let cancelled = false
    apiClient
      .getAllMeasures()
      .then((records) => {
        if (!cancelled) setMeasuresById(new Map(records.map((item) => [item.id, item])))
      })
      .catch(() => {
        // no-op: фантомные тайтлы не подставляем
      })
    return () => {
      cancelled = true
    }
  }, [])

  const canonicalSaved = canonicalIds === null ? [] : [...savedMeasures].filter((id) => canonicalIds.has(id))

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

  const certsCount = typeof window !== 'undefined' ? loadCertificates().length : 0

  const rows = [
    {
      t: 'Избранное',
      v: `${savedMeasures.size} сохранено`,
      onClick: () => {
        triggerHaptic('light')
        if (canonicalSaved.length > 0) {
          const el = document.getElementById('saved-measures-section')
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' })
          } else {
            showToast(`Сохранено: ${canonicalSaved.length} мер`)
          }
        } else {
          showToast('В избранном пока нет сохранённых мер')
        }
      },
    },
    {
      t: 'Мои сертификаты',
      v: certsCount > 0 ? `${certsCount} получено` : 'Пройти тест',
      onClick: () => {
        triggerHaptic('light')
        nav('/certificates')
      },
    },
    {
      t: 'Параметры подбора мер',
      v: `${city} · ${role === 'ip' ? 'ИП' : role === 'self_employed' ? 'НПД' : role === 'llc' ? 'ООО' : role === 'intern' ? 'Стажер' : 'План'}`,
      onClick: () => setOnboardingOpen(true),
    },
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
          <b>{canonicalSaved.length}</b>
          <small>сохранено</small>
        </div>
        <div>
          <b>3</b>
          <small>события</small>
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

      {canonicalSaved.length > 0 && (
        <div id="saved-measures-section" style={{ marginTop: '1.25rem' }}>
          <h2 className="sub-h" style={{ marginBottom: '0.6rem' }}>Сохранённые меры</h2>
          <div className="menu">
            {canonicalSaved.map((id) => {
              const cardItem = allCards().find((c) => c.id === id)
              const itemTitle = (
                measuresById.get(id)?.title ||
                cardItem?.title ||
                'Мера государственной поддержки'
              ).replace('{city}', cityIn(city))

              return (
                <div
                  key={id}
                  className="menu__row"
                  style={{ justifyContent: 'space-between', alignItems: 'center', cursor: 'default' }}
                >
                  <div
                    style={{ minWidth: 0, flex: 1, marginRight: '0.6rem', cursor: 'pointer' }}
                    onClick={() => {
                      if (measuresById.has(id)) nav('/grants')
                      else if (cardItem) nav(`/card/${cardItem.id}`)
                    }}
                  >
                    <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                      {itemTitle}
                    </span>
                  </div>
                  <button
                    className="btn btn--sm btn--ghost"
                    style={{ padding: '0.3rem 0.65rem', fontSize: '0.72rem', height: 'auto', flexShrink: 0, borderRadius: '8px' }}
                    onClick={(e) => {
                      e.stopPropagation()
                      triggerHaptic('light')
                      toggleSaveMeasure(id)
                    }}
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
  const [measures, setMeasures] = useState<MeasureRecord[]>([])
  useEffect(() => {
    let cancelled = false
    apiClient
      .getAllMeasures()
      .then((records) => {
        if (!cancelled) setMeasures(records)
      })
      .catch(() => {
        // каталог недоступен: поиск показывает только локальные разделы
      })
    return () => {
      cancelled = true
    }
  }, [])
  const items = [
    ...allCards().map((c) => ({ t: c.title.replace('{city}', cityIn(city)), s: c.subtitle, to: `/card/${c.id}` })),
    ...SERVICES.map((s) => ({ t: s.title, s: s.sub, to: '/services' })),
    ...measures.map((m) => ({ t: m.title, s: m.amount_description ?? 'мера поддержки', to: '/grants' })),
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
