import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageTitle } from '../Other'
import { COURSES } from '../../data'
import { CheckIcon, ChevronIcon, ClockIcon, LockIcon, Rays, ZigArrow } from '../../components/icons'
import Sheet from '../../components/Sheet'
import { triggerHaptic } from '../../lib/maxBridge'
import { useApp } from '../../store'

interface ChecklistStep {
  id: string
  title: string
  desc: string
  tag: string
}

interface ChecklistItem {
  id: string
  title: string
  subtitle: string
  tags: string[]
  duration: string
  badge: string
  assistantQuery: string
  toastMsg: string
  steps: ChecklistStep[]
}

const CHECKLISTS: ChecklistItem[] = [
  {
    id: 'ip-open',
    title: 'Чек-лист открытия ИП',
    subtitle: 'Пошаговый план от идеи до первой продажи',
    tags: ['Пошагово', 'Регистрация ФНС', 'Без пошлины'],
    duration: '1–3 дня',
    badge: '6 шагов',
    assistantQuery: 'Привет! Помоги мне пройти первые шаги по открытию ИП: с чего начать, какие ОКВЭД выбрать и как не допустить ошибок?',
    toastMsg: 'Чек-лист открытия ИП отправлен в диалог МАКС!',
    steps: [
      {
        id: 's1',
        title: '1. Проверка идеи и спроса',
        desc: 'Проведи интервью с 10 потенциальными клиентами, оцени спрос и посчитай средний чек.',
        tag: 'исследование',
      },
      {
        id: 's2',
        title: '2. Подбор кодов ОКВЭД',
        desc: 'Определи основной код деятельности (например, 62.01, 73.11) и до 20 дополнительных.',
        tag: 'классификатор',
      },
      {
        id: 's3',
        title: '3. Выбор налогового режима',
        desc: 'Сравни УСН 6% («Доходы»), УСН 15% («Доходы минус расходы») и патентную систему.',
        tag: 'налоги',
      },
      {
        id: 's4',
        title: '4. Подача заявления Р21001 онлайн',
        desc: 'Подай заявление через Госуслуги или центр «Мой бизнес» без уплаты госпошлины 800 ₽.',
        tag: 'без пошлины',
      },
      {
        id: 's5',
        title: '5. Открытие счёта и эквайринг',
        desc: 'Открой расчётный счёт для ИП с бесплатным обслуживанием и настрой приём платежей по СБП.',
        tag: 'банки',
      },
      {
        id: 's6',
        title: '6. Заявка на грант до 500 000 ₽',
        desc: 'Подай заявку на грант для молодых предпринимателей до 25 лет в региональном фонде.',
        tag: 'поддержка',
      },
    ],
  },
  {
    id: 'grant-prep',
    title: 'Чек-лист подготовки к гранту',
    subtitle: 'Сбор обязательных документов на грант до 500 000 ₽',
    tags: ['Гранты 2026', 'До 500 000 ₽', 'Пакет документов'],
    duration: 'до 15 октября',
    badge: '5 шагов',
    assistantQuery: 'Привет! Подскажи, как правильно составить смету для заявки на грант молодому предпринимателю до 500 000 ₽?',
    toastMsg: 'Чек-лист подготовки к гранту отправлен в диалог МАКС!',
    steps: [
      {
        id: 'g1',
        title: '1. Проверка критериев программы',
        desc: 'Возраст до 25 лет включительно, статус субъекта МСП в реестре ФНС.',
        tag: 'критерии',
      },
      {
        id: 'g2',
        title: '2. Сертификат обучения',
        desc: 'Пройди бесплатный курс в центре «Мой бизнес» и получи официальный сертификат.',
        tag: 'обучение',
      },
      {
        id: 'g3',
        title: '3. Бизнес-план и финансовая смета',
        desc: 'Рассчитай расходы проекта, софинансирование от 25% и плановые показатели.',
        tag: 'смета',
      },
      {
        id: 'g4',
        title: '4. Справка об отсутствии долгов',
        desc: 'Закажи электронную справку в личном кабинете налогоплательщика без очередей.',
        tag: 'КНД 1120101',
      },
      {
        id: 'g5',
        title: '5. Подача заявки через МАКС',
        desc: 'Загрузи скан-копии документов и отправь проект на рассмотрение экспертной комиссии.',
        tag: 'онлайн',
      },
    ],
  },
  {
    id: 'first-sales',
    title: 'Чек-лист первых продаж',
    subtitle: 'Тест спроса и привлечение первых 10 клиентов',
    tags: ['Маркетинг', 'Тест спроса', 'Практика'],
    duration: '5–7 дней',
    badge: '5 шагов',
    assistantQuery: 'Привет! Помоги протестировать спрос на мою бизнес-идею и упаковать первое предложение для клиентов.',
    toastMsg: 'Чек-лист первых продаж отправлен в диалог МАКС!',
    steps: [
      {
        id: 'p1',
        title: '1. Сегментация и боли аудитории',
        desc: 'Выдели 2-3 ключевых сегмента клиентов и сформулируй их главные боли.',
        tag: 'аналитика',
      },
      {
        id: 'p2',
        title: '2. Упаковка предложения (УТП)',
        desc: 'Сформулируй понятный оффер: ценность, выгода, гарантия и чёткий призыв.',
        tag: 'оффер',
      },
      {
        id: 'p3',
        title: '3. Бесплатные каналы лидогенерации',
        desc: 'Размести анонсы в профильных сообществах, чатах и задействуй нетворкинг.',
        tag: 'лидген',
      },
      {
        id: 'p4',
        title: '4. Первые 5 закрытых сделок',
        desc: 'Проведи встречи лично, отработай возражения и зафиксируй обратную связь.',
        tag: 'продажи',
      },
      {
        id: 'p5',
        title: '5. Подключение онлайн-кассы и СБП',
        desc: 'Настрой приём оплат по QR-кодам через Систему быстрых платежей (0.4–0.7%).',
        tag: 'финансы',
      },
    ],
  },
]

const FILTERS = ['Все', 'Чек-листы', 'Курсы'] as const

/**
 * Аккуратный, красивый и маленький пин прогресса 0/6, 1/6, 0/5
 */
function ProgressPin({ done, total }: { done: number; total: number }) {
  const isDone = done === total && total > 0
  const isStarted = done > 0 && !isDone

  return (
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
        background: isDone
          ? 'rgba(52, 199, 89, 0.15)'
          : isStarted
          ? 'rgba(245, 197, 109, 0.15)'
          : 'rgba(255, 255, 255, 0.08)',
        color: isDone ? '#34c759' : isStarted ? 'var(--yellow, #ffd21e)' : 'rgba(255, 255, 255, 0.65)',
        border: `1px solid ${
          isDone
            ? 'rgba(52, 199, 89, 0.3)'
            : isStarted
            ? 'rgba(245, 197, 109, 0.3)'
            : 'rgba(255, 255, 255, 0.1)'
        }`,
        whiteSpace: 'nowrap',
        flexShrink: 0,
        letterSpacing: '0.04em',
      }}
    >
      {done}/{total}
    </span>
  )
}

export default function WhereToStartPage() {
  const nav = useNavigate()
  const { showToast } = useApp()
  const [f, setF] = useState<string>('Все')
  const [selectedChecklist, setSelectedChecklist] = useState<ChecklistItem | null>(null)

  // Персистентное сохранение отмеченных пунктов
  const [checkedSteps, setCheckedSteps] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem('zvery_checklist_progress')
      return raw ? new Set(JSON.parse(raw)) : new Set(['s1'])
    } catch {
      return new Set(['s1'])
    }
  })

  const toggleStep = (id: string) => {
    triggerHaptic('light')
    setCheckedSteps((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      try {
        localStorage.setItem('zvery_checklist_progress', JSON.stringify(Array.from(next)))
      } catch {}
      return next
    })
  }

  const showChecklist = f === 'Все' || f === 'Чек-листы'
  const showCourses = f === 'Все' || f === 'Курсы'

  return (
    <div className="page">
      <PageTitle hl="С чего начать?" color="white" back />

      {/* Hero-плашка в эталонном стиле */}
      <div className="grant-hero">
        <div>
          <span className="grant-hero__label">Первые шаги предпринимателя</span>
          <b className="grant-hero__sum" style={{ color: '#ffffff' }}>Старт без ошибок</b>
          <span className="grant-hero__sub">Интерактивные чек-листы и курсы для новичков</span>
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

      {/* Блок 1: Чек-листы — плашки в каталожном стиле без лишних надписей */}
      {showChecklist && (
        <div style={{ marginBottom: '1.2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div
              className="sec-title"
              style={{
                fontFamily: "'VK Sans Display Expanded', var(--display)",
                fontWeight: 700,
                fontSize: '1.08rem',
                letterSpacing: '0.01em',
                color: '#ffffff',
              }}
            >
              <span>Чек-листы</span>
            </div>
          </div>

          <div className="grant-list">
            {CHECKLISTS.map((ch) => {
              const doneCount = ch.steps.filter((s) => checkedSteps.has(s.id)).length
              const totalCount = ch.steps.length

              return (
                <button
                  key={ch.id}
                  className="grant"
                  onClick={() => {
                    triggerHaptic('light')
                    setSelectedChecklist(ch)
                  }}
                >
                  <div className="grant__top">
                    <span className="grant__amount" style={{ fontSize: '1.14rem', lineHeight: 1.25, color: '#ffffff' }}>
                      {ch.title}
                    </span>
                    <ProgressPin done={doneCount} total={totalCount} />
                  </div>
                  <div className="grant__tags">
                    {ch.tags.map((t) => (
                      <span key={t}>{t}</span>
                    ))}
                  </div>
                  <div className="grant__bottom">
                    <span className="grant__deadline">
                      <ClockIcon /> {ch.duration}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Блок 2: Курсы из вкладки Обучение */}
      {showCourses && (
        <div style={{ marginBottom: '1.5rem', marginTop: showChecklist ? '1.4rem' : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div
              className="sec-title"
              style={{
                fontFamily: "'VK Sans Display Expanded', var(--display)",
                fontWeight: 700,
                fontSize: '1.08rem',
                letterSpacing: '0.01em',
                color: '#ffffff',
              }}
            >
              <span>Курсы</span>
            </div>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light')
                nav('/learning')
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                fontFamily: "'VK Sans Display Expanded', var(--display)",
                fontWeight: 700,
                fontSize: '0.82rem',
                letterSpacing: '0.01em',
                color: 'var(--yellow)',
              }}
            >
              <span>Все курсы</span>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ color: 'var(--yellow)', flexShrink: 0 }}
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </div>

          <div className="course-list">
            {COURSES.filter((c) => c.id === 'basics' || c.id === 'finance').map((c) => (
              <button
                key={c.id}
                className={`course course--${c.color}`}
                onClick={() => {
                  triggerHaptic('light')
                  if (!c.locked) nav(`/learning/${c.id}`)
                }}
                disabled={c.locked}
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
      )}

      {/* Детальный Bottom Sheet чеклиста */}
      <Sheet open={!!selectedChecklist} onClose={() => setSelectedChecklist(null)} title={selectedChecklist?.title}>
        {selectedChecklist && (() => {
          const doneCount = selectedChecklist.steps.filter((s) => checkedSteps.has(s.id)).length
          const totalCount = selectedChecklist.steps.length
          const pct = Math.round((doneCount / totalCount) * 100)

          return (
            <div
              className="sheet-body"
              style={{
                maxHeight: '74vh',
                overflowY: 'auto',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                paddingTop: '0.1rem',
                paddingBottom: 'calc(env(safe-area-inset-bottom, 16px) + 20px)',
              }}
            >
              {/* Срок + статус (аккуратная однострочная плашка) */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.5rem',
                  marginBottom: '0.45rem',
                }}
              >
                <span className="muted" style={{ fontSize: '0.84rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <ClockIcon style={{ width: 14, height: 14, verticalAlign: 'middle' }} />
                  {selectedChecklist.duration}
                </span>
                <ProgressPin done={doneCount} total={totalCount} />
              </div>

              {/* Тонкий аккуратный прогресс-бар */}
              <div
                style={{
                  width: '100%',
                  height: 4,
                  background: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: 2,
                  overflow: 'hidden',
                  marginBottom: '0.65rem',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${pct}%`,
                    background: 'linear-gradient(90deg, #7045c6, #ffd21e)',
                    borderRadius: 2,
                    transition: 'width 0.25s ease',
                  }}
                />
              </div>

              {/* Список шагов с компактным отступом */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginBottom: '0.9rem' }}>
                {selectedChecklist.steps.map((s) => {
                  const done = checkedSteps.has(s.id)
                  return (
                    <div
                      key={s.id}
                      onClick={() => toggleStep(s.id)}
                      style={{
                        background: done ? 'rgba(245, 197, 109, 0.08)' : 'var(--card)',
                        border: `1px solid ${done ? 'var(--yellow)' : 'var(--line)'}`,
                        borderRadius: '0.85rem',
                        padding: '0.7rem 0.85rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                        <div
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 6,
                            border: `1.5px solid ${done ? 'var(--yellow)' : 'var(--muted)'}`,
                            background: done ? 'var(--yellow)' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            marginTop: 2,
                          }}
                        >
                          {done && <CheckIcon style={{ color: '#1f1a2e', width: 15, height: 15 }} />}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '0.4rem',
                              marginBottom: 2,
                            }}
                          >
                            <b style={{ fontSize: '0.92rem', color: '#ffffff' }}>{s.title}</b>
                            <span
                              style={{
                                fontSize: '0.68rem',
                                padding: '0.15rem 0.45rem',
                                borderRadius: '0.4rem',
                                background: 'rgba(255, 255, 255, 0.06)',
                                color: 'var(--muted-2)',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {s.tag}
                            </span>
                          </div>
                          <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-2)', lineHeight: 1.35 }}>
                            {s.desc}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Кнопки действий внутри Sheet */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button
                  className="btn btn--primary btn--block"
                  onClick={() => {
                    triggerHaptic('medium')
                    showToast(selectedChecklist.toastMsg)
                  }}
                >
                  Отправить чеклист в МАКС
                </button>
                <button
                  className="btn btn--ghost btn--block"
                  onClick={() => {
                    triggerHaptic('medium')
                    nav('/assistant', { state: { q: selectedChecklist.assistantQuery } })
                  }}
                >
                  Спросить ассистента
                </button>
              </div>
            </div>
          )
        })()}
      </Sheet>
    </div>
  )
}
