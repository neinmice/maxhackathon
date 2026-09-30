/**
 * [ZVERY MVP] Задачи Паши №8 и №10: Карточка меры, официальный источник и чеклист документов
 * Автор: Паша (в стилистике Стаса)
 * Назначение: отображение условий программы, плашки свежести «АКТУАЛЬНО · 2026»,
 * оператора («Мой бизнес»), интерактивного чеклиста документов и сохранения меры.
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckIcon, ClockIcon } from './icons'
import Sheet from './Sheet'
import { cityIn, useApp } from '../store'
import { apiClient } from '../api/client'

export default function MeasureDetailSheet() {
  const { measureDetail, setMeasureDetail, savedMeasures, toggleSaveMeasure, city } = useApp()
  const nav = useNavigate()
  const [checkedDocs, setCheckedDocs] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (!measureDetail) {
      setCheckedDocs(new Set())
      return
    }
    let active = true
    setCheckedDocs(new Set())
    apiClient.getChecklist(measureDetail.id)
      .then((items) => {
        if (active) {
          setCheckedDocs(
            new Set(items.filter((item) => item.completed).map((item) => Number(item.key))),
          )
        }
      })
      .catch(() => {
        // The checklist remains usable locally if the server is unavailable.
      })
    return () => {
      active = false
    }
  }, [measureDetail?.id])

  if (!measureDetail) return null

  const isSaved = savedMeasures.has(measureDetail.id)

  const toggleDoc = (idx: number) => {
    setCheckedDocs((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      apiClient.updateChecklist(measureDetail.id, String(idx), next.has(idx)).catch(() => {})
      return next
    })
  }

  const title = (measureDetail.title || '').replace('{city}', cityIn(city))
  const amount = measureDetail.amount || measureDetail.tag || 'Доступно'
  const org = measureDetail.org || 'Центр «Мой бизнес»'
  const deadline = measureDetail.deadline || 'Приём открыт'
  const reqs: string[] = measureDetail.req || measureDetail.body || [
    'Отсутствие задолженности по налогам и сборам',
    'Регистрация бизнеса в выбранном регионе',
    'Соответствие критериям субъекта МСП',
  ]
  const docs: string[] = Array.isArray(measureDetail.documents) && measureDetail.documents.length
    ? measureDetail.documents
    : [
        'Паспорт гражданина РФ (скан всех страниц)',
        'Справка об отсутствии задолженности (КНД 1120101)',
        'Бизнес-план и финансовая смета проекта',
        'Заявление по утверждённой форме оператора',
      ]

  return (
    <Sheet open={!!measureDetail} onClose={() => setMeasureDetail(null)} title={title}>
      <div className="sheet-body" style={{ maxHeight: '72vh', overflowY: 'auto', paddingRight: '0.2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="grant-sheet__amount">{amount}</div>
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '0.25rem 0.6rem',
              borderRadius: '2rem',
              background: 'rgba(91, 143, 247, 0.15)',
              color: 'var(--blue, #5b8ff7)',
              letterSpacing: '0.04em',
            }}
          >
            АКТУАЛЬНО · 2026
          </span>
        </div>

        <p className="muted" style={{ margin: 0, fontSize: '0.85rem' }}>
          {org} · <ClockIcon style={{ verticalAlign: 'middle', display: 'inline' }} /> {deadline}
        </p>

        <div>
          <h4 className="sheet-sub" style={{ marginBottom: '0.5rem' }}>Условия программы</h4>
          <ul className="checklist" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {reqs.map((r, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                <CheckIcon style={{ color: 'var(--yellow)', flexShrink: 0, marginTop: '0.15rem' }} />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>

        <div style={{ background: 'var(--card-2)', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--line)' }}>
          <h4 className="sheet-sub" style={{ marginBottom: '0.5rem' }}>Чеклист документов</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {docs.map((doc, idx) => {
              const done = checkedDocs.has(idx)
              return (
                <button
                  key={idx}
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

        <div
          style={{
            fontSize: '0.75rem',
            color: 'var(--muted-2)',
            background: 'rgba(255, 255, 255, 0.03)',
            padding: '0.6rem 0.75rem',
            borderRadius: '0.5rem',
            lineHeight: 1.4,
          }}
        >
          <b>Источник:</b> Официальный портал поддержки МСП.
          <br />
          ZVERY предоставляет справочную верифицированную информацию. Итоговое решение о выдаче принимает уполномоченный оператор.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
          <button
            className={`btn ${isSaved ? 'btn--ghost' : 'btn--primary'} btn--block`}
            onClick={() => toggleSaveMeasure(measureDetail.id)}
          >
            {isSaved ? 'Удалить из сохранённых' : 'Сохранить меру'}
          </button>

          <button
            className="btn btn--ghost btn--block"
            onClick={() => {
              setMeasureDetail(null)
              nav('/assistant', { state: { q: `Расскажи подробнее про меру: ${title}` } })
            }}
          >
            Спросить ассистента о мере
          </button>
        </div>
      </div>
    </Sheet>
  )
}
