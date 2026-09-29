import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageTitle } from '../Other'
import { CheckIcon, ClockIcon, Rays } from '../../components/icons'
import Sheet from '../../components/Sheet'
import { triggerHaptic } from '../../lib/maxBridge'
import { useApp } from '../../store'

interface DocItem {
  id: string
  kind: 'Отчётность' | 'Договоры' | 'Первичка'
  code: string
  hot?: string
  title: string
  tags: string[]
  deadline: string
  reqs: string[]
  checklist: string[]
  pdfName: string
}

const DOC_ITEMS: DocItem[] = [
  {
    id: 'usn',
    kind: 'Отчётность',
    code: 'КНД 1152017',
    hot: 'годовая',
    title: 'Декларация по УСН «Доходы»',
    tags: ['до 25 апреля', 'УСН 6%', 'ИП и ООО'],
    deadline: 'Срок сдачи: ИП до 25 апреля, ООО до 25 марта',
    reqs: [
      'Титульный лист: заполняется ИНН, период «34» и код инспекции',
      'Раздел 1.1: суммы авансовых платежей за 1 кв., полугодие и 9 месяцев',
      'Раздел 2.1.1: нарастающий доход и уплаченные страховые взносы',
      'Сумма вычета взносов не превышает исчисленный налог',
    ],
    checklist: [
      'Титульный лист с кодом налогового периода',
      'Расчёт налоговой базы нарастающим итогом',
      'Квитанции об уплате страховых взносов за себя',
      'Книга учёта доходов и расходов (КУДиР)',
    ],
    pdfName: 'deklaraciya_usn_knd1152017.pdf',
  },
  {
    id: 'nds',
    kind: 'Отчётность',
    code: 'КНД 1151001',
    hot: 'квартальная',
    title: 'Декларация по НДС',
    tags: ['до 25 числа', 'ОСНО / УСН', 'строго онлайн'],
    deadline: 'Срок сдачи: ежеквартально до 25 числа',
    reqs: [
      'Подача строго в электронном виде с квалифицированной КЭП',
      'Раздел 1: итоговая сумма НДС к уплате по коду КБК',
      'Раздел 3: расчёт налога по операциям реализации и налоговые вычеты',
      'Выгрузка книг покупок и продаж из учётной программы',
    ],
    checklist: [
      'Раздел 1 и Раздел 3 декларации',
      'Сведения из книги покупок (Раздел 8)',
      'Сведения из книги продаж (Раздел 9)',
      'Квалифицированная электронная подпись (КЭП)',
    ],
    pdfName: 'deklaraciya_nds_knd1151001.pdf',
  },
  {
    id: 'contract',
    kind: 'Договоры',
    code: 'Договор',
    title: 'Договор с самозанятым или ИП',
    tags: ['без рисков', 'по чеку НПД', 'акт услуг'],
    deadline: '',
    reqs: [
      'Формулировка конкретного объёма и результата услуг',
      'Обязательство выдать электронный чек из приложения «Мой налог»',
      'Оплата услуг производится строго на основании акта сдачи-приёмки',
      'Отсутствие признаков подчинения трудовому распорядку',
    ],
    checklist: [
      'Преамбула и паспортные реквизиты исполнителя',
      'Техническое задание с подробным перечнем работ',
      'Пункт об обязанности выдачи чека плательщика НПД',
      'Форма закрывающего акта сдачи-приёмки',
    ],
    pdfName: 'dogovor_okazaniya_uslug_samozanyaty.pdf',
  },
  {
    id: 'act',
    kind: 'Первичка',
    code: 'УПД / Акт',
    hot: 'первичка',
    title: 'Акт сдачи-приёмки оказанных услуг',
    tags: ['закрывающий', 'для расходов', 'PDF бланк'],
    deadline: '',
    reqs: [
      'Дата составления акта фиксирует дату признания дохода/расхода',
      'Прямая ссылка на номер и дату заключённого договора',
      'Таблица с детализацией объёма, единиц измерения и стоимости',
      'Пункт о надлежащем качестве и отсутствии претензий у заказчика',
    ],
    checklist: [
      'Номер и дата составления документа',
      'Подробное наименование и объём оказанных услуг',
      'Итоговая стоимость цифрами и прописью в рублях',
      'Подписи и печати уполномоченных лиц сторон',
    ],
    pdfName: 'akt_sdachi_priemki_uslug.pdf',
  },
]

const FILTERS = ['Все', 'Отчётность', 'Договоры', 'Первичка'] as const

export default function DocumentsService() {
  const nav = useNavigate()
  const { showToast } = useApp()
  const [f, setF] = useState<string>('Все')
  const [selected, setSelected] = useState<DocItem | null>(null)
  const [checkedDocs, setCheckedDocs] = useState<Set<number>>(new Set([0]))

  const list = DOC_ITEMS.filter((item) => f === 'Все' || item.kind === f)

  const toggleDoc = (idx: number) => {
    triggerHaptic('light')
    setCheckedDocs((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  const handleDownload = (doc: DocItem) => {
    triggerHaptic('medium')
    const content = `%PDF-1.4\n% ОФИЦИАЛЬНЫЙ ШАБЛОН: ${doc.title}\n% Код: ${doc.code}\n% ${doc.deadline}\n\nУсловия:\n${doc.reqs.map((r, i) => `${i + 1}. ${r}`).join('\n')}\n\nЧеклист:\n${doc.checklist.map((c) => `• ${c}`).join('\n')}`
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = doc.pdfName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    showToast(`Файл ${doc.pdfName} скачивается!`)
  }

  const handleSendToBot = (doc: DocItem) => {
    triggerHaptic('medium')
    const webapp = (window as any).WebApp
    if (webapp && typeof webapp.sendData === 'function') {
      try {
        webapp.sendData(JSON.stringify({ action: 'send_doc', docId: doc.id, docCode: doc.code }))
      } catch {
        // no-op
      }
    }
    showToast(`Шаблон «${doc.title}» отправлен в МАКС!`)
  }

  return (
    <div className="page">
      <PageTitle hl="Документы" color="white" back />

      {/* Hero-плашка как в разделе грантов */}
      <div className="grant-hero">
        <div>
          <span className="grant-hero__label">База бланков и договоров</span>
          <b className="grant-hero__sum">4 шаблона</b>
          <span className="grant-hero__sub">С инструкциями по заполнению и отправкой в MAX</span>
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
              <span className="grant__amount">{item.code}</span>
              {item.hot && <em className="grant__hot">{item.hot}</em>}
            </div>
            <b className="grant__title">{item.title}</b>
            <div className="grant__tags">
              {item.tags.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
            <div className="grant__bottom">
              {item.deadline && (
                <span className="grant__deadline">
                  <ClockIcon /> {item.tags[0]}
                </span>
              )}
              <span className="grant__filled" style={{ marginLeft: 'auto' }}>бланк и чеклист</span>
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
            {/* Сумма / код + пин 2026 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <div className="grant-sheet__amount">{selected.code}</div>
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

            {selected.deadline && (
              <p className="muted" style={{ margin: '0 0 0.85rem', fontSize: '0.85rem' }}>
                <ClockIcon style={{ verticalAlign: 'middle', display: 'inline' }} /> {selected.deadline}
              </p>
            )}

            {/* Условия и правила с золотыми галочками */}
            <div style={{ marginBottom: '1rem' }}>
              <h4 className="sheet-sub" style={{ marginBottom: '0.5rem' }}>Правила заполнения</h4>
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

            {/* Чеклист документов для отправки */}
            <div
              style={{
                background: '#2a2a2b',
                padding: '0.85rem',
                borderRadius: 'var(--radius-card, 16px)',
                border: '1px solid #363638',
                marginBottom: '1rem',
              }}
            >
              <h4 className="sheet-sub" style={{ marginBottom: '0.5rem' }}>Чеклист для отправки</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {selected.checklist.map((doc, idx) => {
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
                onClick={() => handleDownload(selected)}
              >
                Скачать шаблон (PDF)
              </button>

              <button
                type="button"
                className="btn btn--ghost btn--block"
                onClick={() => handleSendToBot(selected)}
              >
                Отправить в МАКС
              </button>

              <button
                type="button"
                className="btn btn--ghost btn--block"
                onClick={() => {
                  setSelected(null)
                  nav('/assistant', { state: { q: `Как правильно заполнить документ: ${selected.title}` } })
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
