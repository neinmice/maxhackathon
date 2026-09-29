import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageTitle } from '../Other'
import { CheckIcon, ClockIcon, Rays } from '../../components/icons'
import Sheet from '../../components/Sheet'
import { triggerHaptic } from '../../lib/maxBridge'
import { useApp } from '../../store'

interface OnlineEvent {
  id: string
  kind: 'Вебинары' | 'Стримы-разборы' | 'Интенсивы' | 'Подкасты'
  title: string
  time: string
  platform: string
  tags: string[]
  agenda: string[]
  speaker: string
}

const ONLINE_EVENTS: OnlineEvent[] = [
  {
    id: 'oe-1',
    kind: 'Вебинары',
    title: 'Вебинар: как получить грант до 500 000 ₽',
    time: 'Четверг, 19:00 · 1.5 часа',
    platform: 'Прямой эфир (MAX / VK Видео)',
    tags: ['Гранты', 'Прямой эфир', 'Смета'],
    agenda: [
      'Разбор критериев отбора регионального грантового конкурса 2026',
      'Как правильно составить смету расходов без замечаний казначейства',
      'Ответы на вопросы зрителей в прямом эфире',
    ],
    speaker: 'Михаил Громов, эксперт Агентства инвестиционного развития',
  },
  {
    id: 'oe-2',
    kind: 'Стримы-разборы',
    title: 'Стрим-разбор: ошибки новичков на УСН и патенте',
    time: 'Понедельник, 18:30 · 1 час',
    platform: 'Онлайн-трансляция',
    tags: ['Налоги', 'ФНС', 'Без штрафов'],
    agenda: [
      'Когда патент выгоднее УСН 6% и как их грамотно совмещать',
      'Сроки сдачи отчётности и оплата страховых взносов за себя',
      'Как защититься от блокировок счёта по 115-ФЗ',
    ],
    speaker: 'Ольга Зайцева, аттестованный аудитор и налоговый консультант',
  },
  {
    id: 'oe-3',
    kind: 'Интенсивы',
    title: 'Интенсив: маркетинг и первые продажи в соцсетях',
    time: 'Суббота, 12:00 · 3 часа',
    platform: 'Онлайн-практикум',
    tags: ['Маркетинг', 'Лидген', 'Практика'],
    agenda: [
      'Пошаговый запуск рекламы в Telegram Ads и посевы в пабликах',
      'Оформление посадочной страницы и чат-бота для приёма заказов',
      'Шаблоны продающих скриптов для закрытия первых 10 сделок',
    ],
    speaker: 'Артур Хабибуллин, руководитель digital-агентства',
  },
  {
    id: 'oe-4',
    kind: 'Подкасты',
    title: 'Бизнес-разбор: от идеи до 2 млн ₽ за 6 месяцев',
    time: 'Среда, 19:00 · 1.5 часа',
    platform: 'Прямой эфир с основателем',
    tags: ['Кейс', 'Опыт', 'Старт с нуля'],
    agenda: [
      'Реальная история запуска точки кофе с собой в жилом комплексе',
      'Сколько реально ушло на аренду, оборудование и персонал',
      'Открытый микрофон: вопросы зрителей создателю бизнеса',
    ],
    speaker: 'Роман Васильев, основатель сети кофеен',
  },
]

const FILTERS = ['Все', 'Вебинары', 'Стримы-разборы', 'Интенсивы', 'Подкасты'] as const

export default function OnlineEventsPage() {
  const nav = useNavigate()
  const { showToast } = useApp()
  const [f, setF] = useState<string>('Все')
  const [selected, setSelected] = useState<OnlineEvent | null>(null)
  const [reminders, setReminders] = useState<Set<string>>(new Set())

  const list = ONLINE_EVENTS.filter((item) => f === 'Все' || item.kind === f)

  const toggleReminder = (id: string) => {
    triggerHaptic('medium')
    setReminders((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
        showToast('Напоминание отменено')
      } else {
        next.add(id)
        showToast('Напоминание об эфире добавлено в МАКС!')
      }
      return next
    })
  }

  return (
    <div className="page">
      <PageTitle hl="Онлайн-эфиры" color="white" back />

      {/* Hero-плашка */}
      <div className="grant-hero">
        <div>
          <span className="grant-hero__label">Прямые трансляции и вебинары</span>
          <b className="grant-hero__sum" style={{ color: '#ffffff' }}>Учись онлайн</b>
          <span className="grant-hero__sub">Смотри эфиры экспертов и задавай вопросы в чате</span>
        </div>
        <Rays className="grant-hero__rays" color="#f5c56d" shade="#b98a33" />
      </div>

      {/* Фильтры */}
      <div className="filters">
        {FILTERS.map((x) => (
          <button
            key={x}
            className={`filter ${f === x ? 'is-active' : ''}`}
            onClick={() => {
              triggerHaptic('light')
              setF(x)
            }}
          >
            {x}
          </button>
        ))}
      </div>

      {/* Список карточек эфиров в стиле /services/registration */}
      <div className="grant-list">
        {list.map((item) => {
          const hasReminder = reminders.has(item.id)
          return (
            <button
              key={item.id}
              className="grant"
              onClick={() => {
                triggerHaptic('light')
                setSelected(item)
              }}
            >
              <div className="grant__top">
                <span className="grant__amount" style={{ fontSize: '1.08rem', lineHeight: 1.28, color: '#ffffff' }}>
                  {item.title}
                </span>
              </div>
              <div className="grant__tags">
                {item.tags.map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
              <div className="grant__bottom">
                <span className="grant__deadline">
                  <ClockIcon /> {item.time}
                </span>
                <span className="grant__filled" style={{ color: hasReminder ? 'var(--yellow)' : undefined }}>
                  {hasReminder ? 'напоминание вкл' : 'подробнее'}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Детальный Sheet эфира */}
      <Sheet open={!!selected} onClose={() => setSelected(null)} title={selected?.title}>
        {selected && (
          <div
            className="sheet-body"
            style={{
              maxHeight: '74vh',
              overflowY: 'auto',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              paddingBottom: 'calc(env(safe-area-inset-bottom, 16px) + 24px)',
            }}
          >
            {/* Время и пин 2026 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <span className="muted" style={{ fontSize: '0.85rem' }}>
                <ClockIcon style={{ verticalAlign: 'middle', display: 'inline', marginRight: '0.35rem' }} />
                {selected.time}
              </span>
              <span
                style={{
                  fontSize: '0.62rem',
                  fontWeight: 700,
                  fontFamily: 'var(--ui)',
                  textTransform: 'uppercase',
                  padding: '0.18rem 0.55rem',
                  borderRadius: '6px',
                  background: 'rgba(132, 85, 246, 0.18)',
                  color: 'var(--purple-3, #c499f3)',
                  letterSpacing: '0.04em',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                2026
              </span>
            </div>

            {/* Платформа трансляции */}
            <div style={{ background: '#2a2a2b', padding: '0.85rem', borderRadius: 'var(--radius-card, 16px)', border: '1px solid #363638', marginBottom: '0.85rem' }}>
              <b style={{ display: 'block', fontSize: '0.88rem', color: '#ffffff', marginBottom: '0.2rem' }}>
                {selected.platform}
              </b>
              <span style={{ fontSize: '0.8rem', color: 'var(--muted-2)' }}>
                Трансляция с живым чатом и ответами на вопросы
              </span>
            </div>

            {/* Программа */}
            <div style={{ marginBottom: '0.85rem' }}>
              <h4 className="sheet-sub" style={{ marginBottom: '0.5rem' }}>Темы эфира</h4>
              <ul className="checklist" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {selected.agenda.map((r, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.45rem', fontSize: '0.85rem', lineHeight: 1.35 }}>
                    <CheckIcon style={{ color: 'var(--yellow)', flexShrink: 0, marginTop: '0.15rem' }} />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Спикер */}
            <div style={{ marginBottom: '0.85rem', fontSize: '0.82rem', color: 'var(--text-2)' }}>
              <b style={{ color: '#ffffff' }}>Ведущий: </b> {selected.speaker}
            </div>

            {/* Памятка */}
            <div
              style={{
                fontSize: '0.78rem',
                color: 'var(--muted-2)',
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '0.65rem 0.75rem',
                borderRadius: '0.5rem',
                lineHeight: 1.4,
                marginBottom: '0.75rem',
              }}
            >
              Эфир бесплатный. Поставь напоминание, чтобы бот прислал ссылку на подключение за 15 минут до старта.
            </div>

            {/* Кнопки */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button
                className={`btn ${reminders.has(selected.id) ? 'btn--ghost' : 'btn--primary'} btn--block`}
                onClick={() => toggleReminder(selected.id)}
              >
                {reminders.has(selected.id) ? 'Напоминание установлено' : 'Напомнить в МАКС'}
              </button>
              <button
                className="btn btn--ghost btn--block"
                onClick={() => {
                  setSelected(null)
                  nav('/assistant', {
                    state: {
                      q: `Расскажи подробнее про онлайн-эфир: ${selected.title}`,
                    },
                  })
                }}
              >
                Спросить ассистента
              </button>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  )
}
