import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageTitle } from '../Other'
import { CheckIcon, ClockIcon, Rays } from '../../components/icons'
import Sheet from '../../components/Sheet'
import { triggerHaptic } from '../../lib/maxBridge'
import { useApp } from '../../store'

interface RegItem {
  id: string
  kind: 'ИП' | 'ООО' | 'Самозанятость'
  title: string
  duration: string
  deadline: string
  tags: string[]
  reqs: string[]
  docs: string[]
}

const REG_ITEMS: RegItem[] = [
  {
    id: 'ip',
    kind: 'ИП',
    title: 'Регистрация ИП',
    duration: 'Оформление: 3 дня',
    deadline: 'Срок оформления: 3 рабочих дня',
    tags: ['без пошлины', 'УСН 6% / Патент', 'вывод на карту'],
    reqs: [
      'Подбор кодов ОКВЭД (основной и до 20 дополнительных)',
      'Выбор системы налогообложения (УСН 6% или Патент)',
      'Формирование заявления по форме Р21001 онлайн',
      'Подача без госпошлины с бесплатной КЭП',
      'Получение выписки из ЕГРИП и открытие расчётного счёта',
    ],
    docs: [
      'Паспорт гражданина РФ (скан всех страниц)',
      'Индивидуальный номер налогоплательщика (ИНН)',
      'Заявление по утверждённой форме Р21001',
      'Уведомление о переходе на УСН (форма 26.2-1)',
    ],
  },
  {
    id: 'llc',
    kind: 'ООО',
    title: 'Регистрация ООО',
    duration: 'Оформление: 3–5 дней',
    deadline: 'Срок оформления: 3–5 рабочих дней',
    tags: ['до 50 учредителей', 'типовой устав', 'капитал от 10 000 ₽'],
    reqs: [
      'Определение названия компании и юридического адреса',
      'Оформление решения единственного учредителя или протокола',
      'Выбор типового устава Минэкономразвития РФ',
      'Уставный капитал от 10 000 ₽ (вносится в течение 4 месяцев)',
      'Подача онлайн без уплаты госпошлины 4 000 ₽',
    ],
    docs: [
      'Заявление по форме Р11001',
      'Решение учредителя или протокол общего собрания',
      'Устав ООО (типовой или индивидуальный)',
      'Гарантийное письмо на юридический адрес',
    ],
  },
  {
    id: 'npd',
    kind: 'Самозанятость',
    title: 'Регистрация самозанятости (НПД)',
    duration: 'Оформление: 10 минут',
    deadline: 'Срок оформления: 10–15 минут',
    tags: ['без отчётов', 'налог 4–6%', 'бонус 10 000 ₽'],
    reqs: [
      'Установка мобильного приложения «Мой налог»',
      'Быстрая авторизация через Госуслуги или по паспорту',
      'Выбор видов деятельности и региона ведения бизнеса',
      'Автоматическое начисление стартового бонуса 10 000 ₽',
      'Мгновенная отправка чеков клиентам прямо с телефона',
    ],
    docs: [
      'Паспорт гражданина РФ',
      'Номер ИНН физического лица',
      'Учётная запись Госуслуг для быстрого входа',
    ],
  },
]

const FILTERS = ['Все', 'ИП', 'ООО', 'Самозанятость'] as const

export default function RegistrationService() {
  const nav = useNavigate()
  const { showToast } = useApp()
  const [f, setF] = useState<string>('Все')
  const [selected, setSelected] = useState<RegItem | null>(null)
  const [checkedDocs, setCheckedDocs] = useState<Set<number>>(new Set([0]))

  const list = REG_ITEMS.filter((item) => f === 'Все' || item.kind === f)

  const toggleDoc = (idx: number) => {
    triggerHaptic('light')
    setCheckedDocs((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  const handleSendChecklist = (item: RegItem) => {
    triggerHaptic('medium')
    const webapp = (window as any).WebApp
    if (webapp && typeof webapp.sendData === 'function') {
      try {
        webapp.sendData(JSON.stringify({ action: 'send_checklist', regId: item.id, title: item.title }))
      } catch {
        // no-op
      }
    }
    const text = `${item.title}\n\nНеобходимые документы:\n${item.docs.map((d) => `• ${d}`).join('\n')}\n\n${item.deadline}`
    navigator.clipboard?.writeText(text).catch(() => {})
    showToast('Чеклист отправлен в МАКС!')
  }

  return (
    <div className="page">
      <PageTitle hl="Регистрация" color="white" back />

      {/* Hero-плашка как в разделе грантов */}
      <div className="grant-hero">
        <div>
          <span className="grant-hero__label">Госпошлина при подаче онлайн</span>
          <b className="grant-hero__sum" style={{ color: '#ffffff' }}>0 ₽</b>
          <span className="grant-hero__sub">Срок открытия бизнеса — от 10 минут до 3 дней</span>
        </div>
        <Rays className="grant-hero__rays" color="#f5c56d" shade="#b98a33" />
      </div>

      {/* Фильтры категорий */}
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

      {/* Список карточек по структуре Грантов */}
      <div className="grant-list">
        {list.map((item) => (
          <button
            key={item.id}
            className="grant"
            onClick={() => {
              triggerHaptic('light')
              setCheckedDocs(new Set([0]))
              setSelected(item)
            }}
          >
            <div className="grant__top">
              <span className="grant__amount" style={{ fontSize: '1.2rem', lineHeight: 1.25, color: '#ffffff' }}>
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
                <ClockIcon /> {item.duration}
              </span>
              <span className="grant__filled">условия и чеклист</span>
            </div>
          </button>
        ))}
      </div>

      {/* Детальный Bottom Sheet 1-в-1 как в Грантах */}
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
            {/* Срок оформления + пин 2026 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.85rem' }}>
              <span className="muted" style={{ fontSize: '0.85rem' }}>
                <ClockIcon style={{ verticalAlign: 'middle', display: 'inline', marginRight: '0.35rem' }} />
                {selected.deadline}
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

            {/* Условия / этапы с золотыми галочками */}
            <div style={{ marginBottom: '1rem' }}>
              <h4 className="sheet-sub" style={{ marginBottom: '0.5rem' }}>Условия и этапы</h4>
              <ul className="checklist" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {selected.reqs.map((r, i) => (
                  <li
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.5rem',
                      marginBottom: '0.4rem',
                      fontSize: '0.85rem',
                      lineHeight: '1.35',
                    }}
                  >
                    <CheckIcon style={{ color: 'var(--yellow)', flexShrink: 0, marginTop: '0.15rem' }} />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Чеклист документов с интерактивными кнопками */}
            <div
              style={{
                background: '#2a2a2b',
                padding: '0.85rem',
                borderRadius: 'var(--radius-card, 16px)',
                border: '1px solid #363638',
                marginBottom: '1rem',
              }}
            >
              <h4 className="sheet-sub" style={{ marginBottom: '0.5rem' }}>Чеклист документов</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {selected.docs.map((doc, idx) => {
                  const done = checkedDocs.has(idx)
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => toggleDoc(idx)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        background: done ? 'rgba(245, 197, 109, 0.08)' : 'var(--card)',
                        border: `1px solid ${done ? 'var(--yellow)' : 'var(--line)'}`,
                        borderRadius: '0.5rem',
                        padding: '0.5rem 0.65rem',
                        textAlign: 'left',
                        color: done ? 'var(--text)' : 'var(--muted)',
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                      }}
                    >
                      <span
                        style={{
                          width: '1.1rem',
                          height: '1.1rem',
                          borderRadius: '0.25rem',
                          border: `1px solid ${done ? 'var(--yellow)' : 'var(--muted-2)'}`,
                          background: done ? 'var(--yellow)' : 'transparent',
                          display: 'grid',
                          placeItems: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {done && <CheckIcon style={{ color: '#000', width: 12, height: 12 }} />}
                      </span>
                      <span>{doc}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Кнопки действий */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn--primary btn--block"
                onClick={() => handleSendChecklist(selected)}
              >
                Отправить чеклист в МАКС
              </button>

              <button
                type="button"
                className="btn btn--ghost btn--block"
                onClick={() => {
                  setSelected(null)
                  nav('/assistant', { state: { q: `Расскажи подробнее, как открыть ${selected.title}` } })
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


