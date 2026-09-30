/**
 * Карточка меры: условия, срок, документы и сохранение.
 * Данные приходят из канонического каталога; суммы и сроки не синтезируются.
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckIcon, ClockIcon } from './icons'
import Sheet from './Sheet'
import { cityIn, useApp } from '../store'
import { apiClient } from '../api/client'
import { sendDataToChat, triggerHaptic } from '../lib/maxBridge'

export default function MeasureDetailSheet() {
  const { measureDetail, setMeasureDetail, savedMeasures, toggleSaveMeasure, city, showToast } = useApp()
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
  // Только фактические поля серверной записи: суммы и сроки не выдумываются
  const amount: string = measureDetail.amount_description || (measureDetail as any).amount || 'Сумма не указана'
  const org = measureDetail.operator || (measureDetail as any).org || 'Оператор не указан'
  const deadline: string = measureDetail.deadline || 'срок не указан'
  const reqs: string[] = Array.isArray(measureDetail.documents) && measureDetail.documents.length
    ? measureDetail.documents
    : (Array.isArray((measureDetail as any).req) ? (measureDetail as any).req : [])
  const conditions: string[] = measureDetail.eligibility ? [measureDetail.eligibility] : []
  const isModelData = measureDetail.data_status === 'MODEL DATA' || measureDetail.freshness_status === 'model'
  const docs: string[] = reqs.length > 0 ? reqs : ['Документы не указаны оператором']

  return (
    <Sheet open={!!measureDetail} onClose={() => setMeasureDetail(null)} title={title}>
      <div className="sheet-body" style={{ maxHeight: '72vh', overflowY: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none', paddingBottom: 'calc(env(safe-area-inset-bottom, 16px) + 24px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
          <div className="grant-sheet__amount">{amount}</div>
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
            {measureDetail.last_checked ? `ДАННЫЕ ОТ ${measureDetail.last_checked}` : 'ДАННЫЕ НЕ ПРОВЕРЕНЫ'}
          </span>
        </div>

        <p className="muted" style={{ margin: 0, fontSize: '0.85rem' }}>
          {org} · <ClockIcon style={{ verticalAlign: 'middle', display: 'inline' }} /> {deadline}
        </p>

        <div>
          <h4 className="sheet-sub" style={{ marginBottom: '0.5rem' }}>Условия программы</h4>
          <ul className="checklist" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {conditions.length > 0 && conditions.map((r, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                <CheckIcon style={{ color: 'var(--yellow)', flexShrink: 0, marginTop: '0.15rem' }} />
                <span>{r}</span>
              </li>
            ))}
            {reqs.map((r, i) => (
              <li key={`d${i}`} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                <CheckIcon style={{ color: 'var(--yellow)', flexShrink: 0, marginTop: '0.15rem' }} />
                <span>{r}</span>
              </li>
            ))}
            {conditions.length === 0 && reqs.length === 0 && (
              <li style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Условия не указаны оператором</li>
            )}
          </ul>
        </div>

        <div style={{ background: '#2a2a2b', padding: '0.85rem', borderRadius: 'var(--radius-card, 16px)', border: '1px solid #363638' }}>
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
          <button
            type="button"
            className="btn btn--ghost btn--block"
            style={{
              marginTop: '0.65rem',
              fontSize: '0.8rem',
              padding: '0.55rem',
              borderRadius: '12px',
            }}
            onClick={() => {
              triggerHaptic('medium')
              const checklistData = {
                action: 'checklist',
                measure_id: measureDetail.id,
                title,
                operator: org,
                amount,
                deadline,
                items: docs.map((doc, idx) => ({
                  key: String(idx),
                  title: doc,
                  completed: checkedDocs.has(idx),
                })),
              }
              sendDataToChat(checklistData)
              apiClient.sendChecklistToChat(checklistData).catch(() => {})
              showToast('Чеклист отправлен в чат MAX')
            }}
          >
            Отправить чеклист в чат MAX
          </button>
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
          <b>Источник:</b> {measureDetail.source_name || 'не указан'}{isModelData ? ' · MODEL DATA (демонстрационная запись)' : ''}.
          <br />
          {measureDetail.disclaimer || 'Итоговое решение о выдаче принимает уполномоченный оператор.'}
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
            Спросить ассистента
          </button>
        </div>
      </div>
    </Sheet>
  )
}
