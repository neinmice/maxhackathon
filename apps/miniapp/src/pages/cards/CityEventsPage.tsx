import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageTitle } from '../Other'
import { CheckIcon, ClockIcon, Rays } from '../../components/icons'
import Sheet from '../../components/Sheet'
import { triggerHaptic } from '../../lib/maxBridge'
import { cityIn, useApp } from '../../store'
import { CITIES } from '../../data'

interface CityEvent {
  id: string
  kind: 'Бизнес-завтраки' | 'Воркшопы' | 'Питч-сессии' | 'Лектории'
  title: string
  time: string
  place: string
  tags: string[]
  agenda: string[]
  speaker: string
}

const CITY_EVENTS: CityEvent[] = [
  {
    id: 'ce-1',
    kind: 'Бизнес-завтраки',
    title: 'Бизнес-завтрак: первые клиенты без бюджета',
    time: 'Пятница, 10:00 · 2 часа',
    place: 'Центр «Мой бизнес»',
    tags: ['Офлайн', 'Бесплатно', 'Нетворкинг'],
    agenda: [
      'Разбор инструментов лидогенерации без платного трафика',
      'Кейсы предпринимателей с первыми продажами до 300 000 ₽',
      'Свободный нетворкинг и обмен контактами',
    ],
    speaker: 'Дмитрий Соколов, серийный предприниматель, ментор МСП',
  },
  {
    id: 'ce-2',
    kind: 'Воркшопы',
    title: 'Воркшоп: защита бизнес-плана на грант 500 000 ₽',
    time: 'Вторник, 16:30 · 2.5 часа',
    place: 'Конференц-зал «Старт»',
    tags: ['Гранты 2026', 'Практика', 'Смета'],
    agenda: [
      'Типичные ошибки в структуре расходов и финансовой модели',
      'Критерии региональной конкурсной комиссии',
      'Индивидуальный экспресс-разбор презентаций участников',
    ],
    speaker: 'Елена Мартынова, эксперт грантового комитета МСП',
  },
  {
    id: 'ce-3',
    kind: 'Питч-сессии',
    title: 'Питч-сессия: открытый микрофон перед менторами',
    time: 'Суббота, 14:00 · 3 часа',
    place: 'Главный коворкинг',
    tags: ['Инвесторы', 'Питчинг', 'Обратная связь'],
    agenda: [
      'Регламент: 3 минуты выступления + 5 минут вопросов жюри',
      'Оценка бизнес-модели экспертами и бизнес-ангелами',
      'Возможность найти ментора или партнёра в проект',
    ],
    speaker: 'Клуб бизнес-ангелов и наставников региона',
  },
  {
    id: 'ce-4',
    kind: 'Лектории',
    title: 'Открытый лекторий: налоги и автоматизация бизнеса',
    time: 'Четверг, 18:00 · 1.5 часа',
    place: 'Лекторий «Мой бизнес»',
    tags: ['ФНС', 'УСН / Патент', 'Автоматизация'],
    agenda: [
      'Налоговые изменения и льготы 2026 года для новых ИП',
      'Как настроить онлайн-кассу и эквайринг без переплат',
      'Сессия живых ответов на вопросы с налоговым юристом',
    ],
    speaker: 'Анна Воронова, налоговый консультант палаты МСП',
  },
]

const FILTERS = ['Все', 'Бизнес-завтраки', 'Воркшопы', 'Питч-сессии', 'Лектории'] as const

export default function CityEventsPage() {
  const nav = useNavigate()
  const { city, showToast } = useApp()
  const [f, setF] = useState<string>('Все')
  const [selected, setSelected] = useState<CityEvent | null>(null)
  const [reminders, setReminders] = useState<Set<string>>(new Set())

  const cityInfo = CITIES.find((c) => c.name === city)
  const address = cityInfo?.region || 'Центр «Мой бизнес»'

  const list = CITY_EVENTS.filter((item) => f === 'Все' || item.kind === f)

  const toggleReminder = (id: string) => {
    triggerHaptic('medium')
    setReminders((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
        showToast('Напоминание отменено')
      } else {
        next.add(id)
        showToast('Напоминание о встрече добавлено в МАКС!')
      }
      return next
    })
  }

  return (
    <div className="page">
      <PageTitle pre="Встречи в" hl={cityIn(city)} color="white" back />

      {/* Hero-плашка как в разделе грантов / регистрации */}
      <div className="grant-hero">
        <div>
          <span className="grant-hero__label">Офлайн-события в {cityIn(city)}</span>
          <b className="grant-hero__sum" style={{ color: '#ffffff' }}>Живой нетворкинг</b>
          <span className="grant-hero__sub">{address}</span>
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

      {/* Список карточек встреч в стиле /services/registration */}
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

      {/* Детальный Sheet встречи */}
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

            {/* Место проведения */}
            <div style={{ background: '#2a2a2b', padding: '0.85rem', borderRadius: 'var(--radius-card, 16px)', border: '1px solid #363638', marginBottom: '0.85rem' }}>
              <b style={{ display: 'block', fontSize: '0.88rem', color: '#ffffff', marginBottom: '0.2rem' }}>
                {selected.place}
              </b>
              <span style={{ fontSize: '0.8rem', color: 'var(--muted-2)' }}>{address}</span>
            </div>

            {/* Программа встречи */}
            <div style={{ marginBottom: '0.85rem' }}>
              <h4 className="sheet-sub" style={{ marginBottom: '0.5rem' }}>В программе</h4>
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
              <b style={{ color: '#ffffff' }}>Спикер: </b> {selected.speaker}
            </div>

            {/* Памятка без записи */}
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
              Предварительная запись не требуется — вход свободный для участников МАКС. Поставь напоминание, чтобы не пропустить встречу.
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
                      q: `Расскажи подробнее про событие: ${selected.title} в ${cityIn(city)} (${selected.place})`,
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
