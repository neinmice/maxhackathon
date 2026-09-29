import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageTitle } from '../Other'
import { CheckIcon, ClockIcon, Rays } from '../../components/icons'
import Sheet from '../../components/Sheet'
import { triggerHaptic } from '../../lib/maxBridge'
import { useApp, type UserTaxMode } from '../../store'

export default function TaxesService() {
  const nav = useNavigate()
  const { taxMode: userTaxMode, setTaxMode, setOnboardingOpen, showToast } = useApp()

  const [activeMode, setActiveMode] = useState<UserTaxMode>(userTaxMode || 'usn6')
  const [period, setPeriod] = useState<'year' | 'month'>('year')
  const [incomeInput, setIncomeInput] = useState<string>('1500000')
  const [expenseInput, setExpenseInput] = useState<string>('600000')
  const [b2bShare, setB2bShare] = useState<number>(40)
  const [hasEmployees, setHasEmployees] = useState<boolean>(false)

  // Sheet modal state for detailed conditions
  const [sheetOpen, setSheetOpen] = useState(false)
  const [checkedDocs, setCheckedDocs] = useState<Set<number>>(new Set([0]))

  const rawIncome = Math.max(0, parseFloat(incomeInput.replace(/\s+/g, '')) || 0)
  const annualIncome = period === 'month' ? rawIncome * 12 : rawIncome

  const rawExpense = Math.max(0, parseFloat(expenseInput.replace(/\s+/g, '')) || 0)
  const annualExpense = period === 'month' ? rawExpense * 12 : rawExpense

  const calc = useMemo(() => {
    const fixedPfr = 53658
    const extraPfr = Math.max(0, (annualIncome - 300000) * 0.01)
    const totalIpContributions = Math.min(fixedPfr + extraPfr, 320000)

    if (activeMode === 'npd') {
      const b2bIncome = annualIncome * (b2bShare / 100)
      const b2cIncome = annualIncome - b2bIncome
      const tax = b2cIncome * 0.04 + b2bIncome * 0.06

      return {
        modeName: 'НПД (Самозанятость)',
        badge: '4–6%',
        tax,
        contributions: 0,
        deduction: 0,
        netProfit: annualIncome - tax,
        rate: annualIncome > 0 ? (tax / annualIncome) * 100 : 0,
        deadline: 'Ежемесячно до 28 числа',
        reqs: [
          'Ставка 4% при получении оплат от физических лиц',
          'Ставка 6% при получении оплат от компаний и ИП',
          'Лимит годового дохода: до 2.4 млн ₽',
          'Полное освобождение от сдачи отчётов и деклараций',
          'Страховые взносы в Социальный фонд добровольные',
        ],
        checklist: [
          'Формирование чека в приложении «Мой налог»',
          'Отправка чека клиенту в день оплаты',
          'Оплата начисленного налога до 28 числа месяца',
          'Контроль лимита годового дохода 2.4 млн ₽',
        ],
      }
    }

    if (activeMode === 'usn6') {
      const rawTax = annualIncome * 0.06
      const maxDeduction = hasEmployees ? rawTax * 0.5 : rawTax
      const deduction = Math.min(totalIpContributions, maxDeduction)
      const finalTax = Math.max(0, rawTax - deduction)

      return {
        modeName: 'УСН «Доходы»',
        badge: '6%',
        tax: finalTax,
        contributions: totalIpContributions,
        deduction,
        netProfit: annualIncome - finalTax - totalIpContributions,
        rate: annualIncome > 0 ? ((finalTax + totalIpContributions) / annualIncome) * 100 : 0,
        deadline: 'Авансы до 28 числа квартала, финал до 25 апреля',
        reqs: [
          'Ставка 6% со всей полученной выручки',
          'Уменьшение налога на взносы за себя до 100% (без сотрудников)',
          'Освобождение от уплаты НДС и налога на имущество бизнеса',
          'Лимит годовой выручки бизнеса до 450 млн ₽',
          'Ведение Книги учёта доходов и расходов (КУДиР)',
        ],
        checklist: [
          'Книга учёта доходов и расходов (КУДиР)',
          'Платёжные поручения по авансам за 1, 2, 3 кварталы',
          'Квитанция об уплате фиксированных взносов ИП',
          'Годовая декларация по УСН (форма КНД 1152017)',
        ],
      }
    }

    if (activeMode === 'usn15') {
      const taxBase = Math.max(0, annualIncome - (annualExpense + totalIpContributions))
      const calculatedTax = taxBase * 0.15
      const minTax = annualIncome * 0.01
      const finalTax = Math.max(calculatedTax, minTax)

      return {
        modeName: 'УСН «Доходы − Расходы»',
        badge: '15%',
        tax: finalTax,
        contributions: totalIpContributions,
        deduction: 0,
        netProfit: annualIncome - annualExpense - totalIpContributions - finalTax,
        rate: annualIncome > 0 ? ((finalTax + totalIpContributions) / annualIncome) * 100 : 0,
        deadline: 'Авансы до 28 числа, финал до 25 апреля',
        reqs: [
          'Ставка 15% с разницы между доходами и расходами',
          'Все расходы должны быть экономически обоснованы и подтверждены',
          'Минимальный налог: 1% от выручки при убытке или малой марже',
          'Уплата фиксированных страховых взносов ИП за себя',
        ],
        checklist: [
          'Первичные документы, подтверждающие расходы (накладные, акты)',
          'Книга учёта доходов и расходов (КУДиР)',
          'Квитанции об уплате авансов и взносов ИП',
          'Годовая декларация по УСН (форма КНД 1152017)',
        ],
      }
    }

    const ausnTax = annualIncome * 0.08
    return {
      modeName: 'АУСН (Автоматизированная)',
      badge: '8%',
      tax: ausnTax,
      contributions: 0,
      deduction: 0,
      netProfit: annualIncome - ausnTax,
      rate: 8,
      deadline: 'Считает банк ежемесячно',
      reqs: [
        'Ставка 8% с доходов, расчёт налога производит банк',
        'Страховые взносы за себя и сотрудников: 0 ₽ (включены в ставку)',
        'Полное отсутствие налоговых деклараций и отчётности',
        'Лимит дохода до 60 млн ₽ в год, до 5 сотрудников',
      ],
      checklist: [
        'Подключение к сервису АУСН в интернет-банке',
        'Разметка входящих и исходящих операций по счёту',
        'Подтверждение ежемесячного расчёта налога в приложении',
      ],
    }
  }, [activeMode, annualIncome, annualExpense, b2bShare, hasEmployees])

  const formatRub = (v: number) => Math.round(v).toLocaleString('ru-RU') + ' ₽'

  const MODES: { id: UserTaxMode; label: string }[] = [
    { id: 'usn6', label: 'УСН 6%' },
    { id: 'usn15', label: 'УСН 15%' },
    { id: 'npd', label: 'Самозанятый (НПД)' },
    { id: 'ausn', label: 'АУСН 8%' },
  ]

  const toggleDoc = (idx: number) => {
    triggerHaptic('light')
    setCheckedDocs((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  const handleSendToMax = () => {
    triggerHaptic('medium')
    const webapp = (window as any).WebApp
    if (webapp && typeof webapp.sendData === 'function') {
      try {
        webapp.sendData(JSON.stringify({ action: 'send_tax_calc', mode: calc.modeName, income: annualIncome, tax: calc.tax }))
      } catch {
        // no-op
      }
    }
    const text = `Расчёт налога (${calc.modeName}):\n• Налог к уплате: ${formatRub(calc.tax)} (${calc.rate}%)\n• Срок: ${calc.deadline}`
    navigator.clipboard?.writeText(text).catch(() => {})
    showToast('Расчёт налога отправлен в МАКС!')
  }

  return (
    <div className="page">
      <PageTitle hl="Налоги" color="white" back />

      {/* Hero-плашка как в разделе грантов */}
      <div className="grant-hero">
        <div>
          <span className="grant-hero__label">Текущий режим по анкете</span>
          <b className="grant-hero__sum">{calc.modeName}</b>
          <span className="grant-hero__sub">Ставка {calc.badge} • Расчёт налога и чистой прибыли</span>
        </div>
        <Rays className="grant-hero__rays" color="#f5c56d" shade="#b98a33" />
      </div>

      {/* Фильтры режимов */}
      <div className="filters">
        {MODES.map((m) => (
          <button
            key={m.id}
            className={`filter ${activeMode === m.id ? 'is-active' : ''}`}
            onClick={() => {
              triggerHaptic('light')
              setActiveMode(m.id)
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Карточка параметров калькулятора */}
      <div className="grant" style={{ marginBottom: '0.85rem' }}>
        <div className="svc-calc-row">
          <span className="grant__title">Период:</span>
          <div className="svc-period-toggle">
            <button
              type="button"
              className={period === 'year' ? 'is-active' : ''}
              onClick={() => {
                triggerHaptic('light')
                setPeriod('year')
              }}
            >
              За год
            </button>
            <button
              type="button"
              className={period === 'month' ? 'is-active' : ''}
              onClick={() => {
                triggerHaptic('light')
                setPeriod('month')
              }}
            >
              За месяц
            </button>
          </div>
        </div>

        <div className="svc-input-group">
          <div className="svc-input-label-row">
            <label htmlFor="tax-inc-input">{period === 'year' ? 'Планируемый годовой доход' : 'Доход в месяц'}</label>
            <span className="grant__amount" style={{ fontSize: '1rem' }}>₽</span>
          </div>
          <input
            id="tax-inc-input"
            type="text"
            className="svc-input"
            value={incomeInput}
            onChange={(e) => setIncomeInput(e.target.value)}
          />
          <div className="svc-presets">
            <button type="button" onClick={() => setIncomeInput('500 000')}>500 тыс</button>
            <button type="button" onClick={() => setIncomeInput('1 500 000')}>1.5 млн</button>
            <button type="button" onClick={() => setIncomeInput('3 000 000')}>3 млн</button>
            <button type="button" onClick={() => setIncomeInput('10 000 000')}>10 млн</button>
          </div>
        </div>

        {activeMode === 'usn15' && (
          <div className="svc-input-group">
            <div className="svc-input-label-row">
              <label htmlFor="tax-exp-input">{period === 'year' ? 'Подтверждённые расходы за год' : 'Расходы в месяц'}</label>
              <span className="grant__amount" style={{ fontSize: '1rem' }}>₽</span>
            </div>
            <input
              id="tax-exp-input"
              type="text"
              className="svc-input"
              value={expenseInput}
              onChange={(e) => setExpenseInput(e.target.value)}
            />
          </div>
        )}

        {activeMode === 'npd' && (
          <div style={{ marginTop: '0.4rem' }}>
            <div className="svc-calc-row">
              <small className="muted">Оплаты от компаний (ставка 6%):</small>
              <b>{b2bShare}%</b>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="10"
              value={b2bShare}
              onChange={(e) => setB2bShare(Number(e.target.value))}
              className="svc-slider"
            />
          </div>
        )}

        {activeMode === 'usn6' && (
          <label className="svc-checkbox-label">
            <input
              type="checkbox"
              checked={hasEmployees}
              onChange={(e) => setHasEmployees(e.target.checked)}
            />
            <span>Есть наёмные сотрудники (вычет взносов до 50%)</span>
          </label>
        )}
      </div>

      {/* Карточка результатов расчёта в стиле Grants */}
      <div className="grant" style={{ background: 'linear-gradient(135deg, #2b1f48 0%, #1e1b29 100%)', border: '1px solid rgba(132, 85, 246, 0.4)' }}>
        <div className="grant__top">
          <span className="grant__amount" style={{ fontSize: '1.45rem' }}>{formatRub(calc.tax)}</span>
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

        <b className="grant__title">Налог к уплате за период</b>
        <small className="grant__org">
          Чистая прибыль после налогов: <b style={{ color: '#4ade80' }}>{formatRub(calc.netProfit)}</b>
        </small>

        <div className="grant__tags" style={{ marginTop: '0.45rem' }}>
          {calc.contributions > 0 && <span>взносы {formatRub(calc.contributions)}</span>}
          {calc.deduction > 0 && <span>вычет −{formatRub(calc.deduction)}</span>}
          <span>{calc.deadline}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.85rem' }}>
          <button
            type="button"
            className="btn btn--primary btn--block"
            onClick={() => {
              triggerHaptic('light')
              setCheckedDocs(new Set([0]))
              setSheetOpen(true)
            }}
          >
            Подробные условия и чеклист
          </button>

          <button
            type="button"
            className="btn btn--ghost btn--block"
            onClick={() => {
              triggerHaptic('medium')
              setTaxMode(activeMode)
              showToast(`Режим ${calc.modeName} сохранён в профиль!`)
            }}
          >
            Сохранить этот режим в профиль
          </button>
        </div>
      </div>

      {/* Детальный Bottom Sheet 1-в-1 как в Грантах */}
      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title={calc.modeName}>
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
          {/* Сумма налога + пин 2026 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <div className="grant-sheet__amount">{formatRub(calc.tax)}</div>
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

          <p className="muted" style={{ margin: '0 0 0.85rem', fontSize: '0.85rem' }}>
            <ClockIcon style={{ verticalAlign: 'middle', display: 'inline' }} /> {calc.deadline}
          </p>

          {/* Условия режима с золотыми галочками */}
          <div style={{ marginBottom: '1rem' }}>
            <h4 className="sheet-sub" style={{ marginBottom: '0.5rem' }}>Условия режима</h4>
            <ul className="checklist" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {calc.reqs.map((r, i) => (
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

          {/* Чеклист обязательных отчётов и платежей */}
          <div
            style={{
              background: 'var(--card-2)',
              padding: '0.75rem',
              borderRadius: '0.75rem',
              border: '1px solid var(--line)',
              marginBottom: '1rem',
            }}
          >
            <h4 className="sheet-sub" style={{ marginBottom: '0.5rem' }}>Чеклист платежей и отчётности</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {calc.checklist.map((doc, idx) => {
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
              onClick={() => {
                triggerHaptic('medium')
                setTaxMode(activeMode)
                setSheetOpen(false)
                showToast(`Режим ${calc.modeName} сохранён!`)
              }}
            >
              Сохранить режим в профиль
            </button>

            <button
              type="button"
              className="btn btn--ghost btn--block"
              onClick={handleSendToMax}
            >
              Отправить в МАКС
            </button>

            <button
              type="button"
              className="btn btn--ghost btn--block"
              onClick={() => {
                setSheetOpen(false)
                nav('/assistant', { state: { q: `Как уменьшить налог на режиме ${calc.modeName}?` } })
              }}
            >
              Спросить ассистента
            </button>
          </div>
        </div>
      </Sheet>
    </div>
  )
}
