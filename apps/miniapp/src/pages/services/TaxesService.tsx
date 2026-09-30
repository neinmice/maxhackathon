import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageTitle } from '../Other'
import { CheckIcon, ClockIcon, Rays } from '../../components/icons'
import Sheet from '../../components/Sheet'
import { triggerHaptic, sendDataToChat } from '../../lib/maxBridge'
import { useApp, type UserTaxMode } from '../../store'

function formatRub(val: number): string {
  if (isNaN(val) || val <= 0) return '0 ₽'
  return Math.round(val).toLocaleString('ru-RU').replace(/\s/g, ' ') + ' ₽'
}

function formatDigits(val: number): string {
  if (isNaN(val) || val <= 0) return '0'
  return Math.round(val).toLocaleString('ru-RU').replace(/\s/g, ' ')
}

function getTaxFontSize(formattedStr: string): string {
  const len = formattedStr.length
  if (len > 15) return '0.67rem'
  if (len > 13) return '0.74rem'
  if (len > 11) return '0.82rem'
  if (len > 9) return '0.94rem'
  return '1.05rem'
}

function getNetFontSize(formattedStr: string): string {
  const len = formattedStr.length
  if (len > 16) return '0.55rem'
  if (len > 13) return '0.60rem'
  if (len > 11) return '0.64rem'
  return '0.68rem'
}

function getHeroFontSize(name: string): string {
  if (name.length > 22) return '0.80rem'
  if (name.length > 18) return '0.90rem'
  if (name.length > 14) return '1.10rem'
  return '1.35rem'
}

export default function TaxesService() {
  const nav = useNavigate()
  const { taxMode: userTaxMode, setTaxMode, showToast } = useApp()

  const [activeMode, setActiveMode] = useState<UserTaxMode>(userTaxMode || 'usn6')
  const [period, setPeriod] = useState<'year' | 'month'>('year')
  const [income, setIncome] = useState<number>(1500000)
  const [incomeStr, setIncomeStr] = useState<string>('1 500 000')

  const [expense, setExpense] = useState<number>(600000)
  const [expenseStr, setExpenseStr] = useState<string>('600 000')

  const [b2bShare, setB2bShare] = useState<number>(40)
  const hasEmployees = false

  // Sheet modal state for detailed conditions and checklist
  const [sheetOpen, setSheetOpen] = useState(false)
  const [checkedDocs, setCheckedDocs] = useState<Set<number>>(new Set([0]))

  const annualIncome = period === 'month' ? income * 12 : income
  const annualExpense = period === 'month' ? expense * 12 : expense

  // Input handlers with auto-formatting
  const handleIncomeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '')
    if (!raw) {
      setIncome(0)
      setIncomeStr('')
      return
    }
    const val = Math.min(parseInt(raw, 10), 500000000)
    setIncome(val)
    setIncomeStr(formatDigits(val))
  }

  const handleExpenseInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '')
    if (!raw) {
      setExpense(0)
      setExpenseStr('')
      return
    }
    const val = Math.min(parseInt(raw, 10), 500000000)
    setExpense(val)
    setExpenseStr(formatDigits(val))
  }

  const setPreset = (val: number) => {
    triggerHaptic('light')
    setIncome(val)
    setIncomeStr(formatDigits(val))
  }

  // Calculate comparisons for ALL 4 modes simultaneously
  const comparisons = useMemo(() => {
    const fixedPfr = 53658
    const extraPfr = Math.max(0, (annualIncome - 300000) * 0.01)
    const totalIpContributions = Math.min(fixedPfr + extraPfr, 320000)

    // 1. NPD
    const b2bIncome = annualIncome * (b2bShare / 100)
    const b2cIncome = annualIncome - b2bIncome
    const npdTax = b2cIncome * 0.04 + b2bIncome * 0.06
    const npdOverLimit = annualIncome > 2400000

    // 2. USN 6%
    const usn6RawTax = annualIncome * 0.06
    const usn6MaxDeduction = hasEmployees ? usn6RawTax * 0.5 : usn6RawTax
    const usn6Deduction = Math.min(totalIpContributions, usn6MaxDeduction)
    const usn6Tax = Math.max(0, usn6RawTax - usn6Deduction)

    // 3. USN 15%
    const usn15TaxBase = Math.max(0, annualIncome - (annualExpense + totalIpContributions))
    const usn15RawTax = usn15TaxBase * 0.15
    const usn15MinTax = annualIncome * 0.01
    const usn15Tax = Math.max(usn15RawTax, usn15MinTax)

    // 4. AUSN 8%
    const ausnTax = annualIncome * 0.08
    const ausnOverLimit = annualIncome > 60000000

    // Total expenses (tax + contributions) for each mode
    const npdTotal = npdTax
    const usn6Total = usn6Tax + totalIpContributions
    const usn15Total = usn15Tax + totalIpContributions + annualExpense
    const ausnTotal = ausnTax

    // Determine best mode among eligible
    const eligible: { id: UserTaxMode; totalPayments: number }[] = []
    if (!npdOverLimit) eligible.push({ id: 'npd', totalPayments: npdTotal })
    eligible.push({ id: 'usn6', totalPayments: usn6Tax + totalIpContributions })
    if (annualExpense > 0) eligible.push({ id: 'usn15', totalPayments: usn15Tax + totalIpContributions })
    if (!ausnOverLimit) eligible.push({ id: 'ausn', totalPayments: ausnTotal })

    let bestModeId: UserTaxMode = 'usn6'
    if (eligible.length > 0) {
      eligible.sort((a, b) => a.totalPayments - b.totalPayments)
      bestModeId = eligible[0].id
    }

    return {
      npd: {
        id: 'npd' as UserTaxMode,
        name: 'НПД (Самозанятость)',
        shortName: 'НПД',
        badge: '4–6%',
        tax: npdTax,
        contributions: 0,
        deduction: 0,
        netProfit: Math.max(0, annualIncome - npdTax),
        rate: annualIncome > 0 ? (npdTax / annualIncome) * 100 : 0,
        overLimit: npdOverLimit,
        isBest: bestModeId === 'npd',
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
      },
      usn6: {
        id: 'usn6' as UserTaxMode,
        name: 'УСН «Доходы»',
        shortName: 'УСН 6%',
        badge: '6%',
        tax: usn6Tax,
        contributions: totalIpContributions,
        deduction: usn6Deduction,
        netProfit: Math.max(0, annualIncome - usn6Tax - totalIpContributions),
        rate: annualIncome > 0 ? ((usn6Tax + totalIpContributions) / annualIncome) * 100 : 0,
        overLimit: false,
        isBest: bestModeId === 'usn6',
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
      },
      usn15: {
        id: 'usn15' as UserTaxMode,
        name: 'УСН «Доходы − Расходы»',
        shortName: 'УСН 15%',
        badge: '15%',
        tax: usn15Tax,
        contributions: totalIpContributions,
        deduction: 0,
        netProfit: Math.max(0, annualIncome - annualExpense - totalIpContributions - usn15Tax),
        rate: annualIncome > 0 ? ((usn15Tax + totalIpContributions) / annualIncome) * 100 : 0,
        overLimit: false,
        isBest: bestModeId === 'usn15',
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
      },
      ausn: {
        id: 'ausn' as UserTaxMode,
        name: 'АУСН (Автоматизированная)',
        shortName: 'АУСН 8%',
        badge: '8%',
        tax: ausnTax,
        contributions: 0,
        deduction: 0,
        netProfit: Math.max(0, annualIncome - ausnTax),
        rate: 8,
        overLimit: ausnOverLimit,
        isBest: bestModeId === 'ausn',
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
      },
    }
  }, [annualIncome, annualExpense, b2bShare, hasEmployees])

  // Current selected mode details
  const current = comparisons[activeMode] || comparisons.usn6

  // Presets list based on selected period
  const presets = period === 'year'
    ? [
        { label: '500 тыс. ₽', value: 500000 },
        { label: '1.5 млн ₽', value: 1500000 },
        { label: '2.4 млн ₽', value: 2400000 },
        { label: '5 млн ₽', value: 5000000 },
      ]
    : [
        { label: '100 тыс. ₽', value: 100000 },
        { label: '200 тыс. ₽', value: 200000 },
        { label: '300 тыс. ₽', value: 300000 },
        { label: '500 тыс. ₽', value: 500000 },
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
    sendDataToChat({
      action: 'tax_calculation',
      mode: current.name,
      period: period === 'year' ? 'За год' : 'За месяц',
      income: annualIncome,
      tax: current.tax,
      net_profit: current.netProfit,
      effective_rate: `${current.rate.toFixed(1)}%`,
    })
    const text = `📊 Расчёт налога (${current.name}):\n• Доход: ${formatRub(annualIncome)}\n• Налог к уплате: ${formatRub(current.tax)} (${current.rate.toFixed(1)}%)\n• Чистая прибыль: ${formatRub(current.netProfit)}\n• Срок: ${current.deadline}`
    navigator.clipboard?.writeText(text).catch(() => {})
    showToast('Расчёт налога отправлен в чат MAX!')
  }

  const sliderMax = period === 'year' ? 12000000 : 1000000
  const sliderStep = period === 'year' ? 50000 : 10000

  return (
    <div className="page" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 16px) + 80px)' }}>
      <PageTitle hl="Калькулятор налогов" color="white" back />

      {/* Hero-плашка с текущим статусом */}
      <div
        className="grant-hero"
        style={{
          marginBottom: '0.85rem',
          minHeight: '106px',
          height: '106px',
          boxSizing: 'border-box',
          alignItems: 'center',
        }}
      >
        <div style={{ maxWidth: 'calc(100% - 3.8rem)', minWidth: 0, width: '100%', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <span className="grant-hero__label">Выбранный налоговый режим</span>
          <b
            className="grant-hero__sum"
            style={{
              fontSize: getHeroFontSize(current.name),
              letterSpacing: current.name.length > 18 ? '-0.02em' : 'normal',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: 1.25,
            }}
          >
            {current.name}
          </b>
          <span
            className="grant-hero__sub"
            style={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            Ставка {current.badge} • Налог {formatRub(current.tax)} в {period === 'year' ? 'год' : 'месяц'}
          </span>
        </div>
        <Rays className="grant-hero__rays" color="#f5c56d" shade="#b98a33" />
      </div>

      {/* Карточка ввода параметров */}
      <div className="grant" style={{ marginBottom: '0.85rem' }}>
        {/* Переключатель периода: Год / Месяц */}
        <div className="svc-calc-row">
          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff' }}>Период расчёта:</span>
          <div className="svc-period-toggle">
            <button
              type="button"
              className={period === 'year' ? 'is-active' : ''}
              onClick={() => {
                triggerHaptic('light')
                setPeriod('year')
                if (period === 'month') {
                  const newIncome = income * 12
                  setIncome(newIncome)
                  setIncomeStr(formatDigits(newIncome))
                }
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
                if (period === 'year') {
                  const newIncome = Math.round(income / 12)
                  setIncome(newIncome)
                  setIncomeStr(formatDigits(newIncome))
                }
              }}
            >
              За месяц
            </button>
          </div>
        </div>

        {/* Поле ввода дохода */}
        <div className="svc-input-group" style={{ marginBottom: '0.5rem' }}>
          <div className="svc-input-label-row">
            <label htmlFor="tax-inc-input" style={{ fontWeight: 600 }}>
              {period === 'year' ? 'Планируемый доход за год' : 'Планируемый доход в месяц'}
            </label>
            <span style={{ fontSize: '0.78rem', color: 'var(--yellow, #f5c06a)' }}>
              {annualIncome > 2400000 && activeMode === 'npd' ? '⚠️ Лимит НПД 2.4 млн' : ''}
            </span>
          </div>

          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              id="tax-inc-input"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              className="svc-input"
              placeholder="0"
              value={incomeStr}
              onChange={handleIncomeInput}
              style={{ paddingRight: '2.5rem' }}
            />
            <span
              style={{
                position: 'absolute',
                right: '1rem',
                fontSize: '1.25rem',
                fontWeight: 800,
                color: 'var(--yellow, #f5c06a)',
                pointerEvents: 'none',
              }}
            >
              ₽
            </span>
          </div>

          {/* Аккуратные ровные чипы быстрых сумм */}
          <div className="svc-presets" style={{ marginTop: '0.65rem' }}>
            {presets.map((p) => {
              const selected = income === p.value
              return (
                <button
                  key={p.value}
                  type="button"
                  className={selected ? 'is-active' : ''}
                  onClick={() => setPreset(p.value)}
                >
                  {p.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Дополнительные параметры для УСН 15% */}
        {activeMode === 'usn15' && (
          <div className="svc-input-group" style={{ marginTop: '0.75rem' }}>
            <div className="svc-input-label-row">
              <label htmlFor="tax-exp-input" style={{ fontWeight: 600 }}>
                {period === 'year' ? 'Подтверждённые расходы за год' : 'Расходы в месяц'}
              </label>
            </div>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                id="tax-exp-input"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className="svc-input"
                placeholder="0"
                value={expenseStr}
                onChange={handleExpenseInput}
                style={{ paddingRight: '2.5rem' }}
              />
              <span
                style={{
                  position: 'absolute',
                  right: '1rem',
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: 'var(--yellow, #f5c06a)',
                  pointerEvents: 'none',
                }}
              >
                ₽
              </span>
            </div>
          </div>
        )}

        {/* Дополнительные параметры для НПД */}
        {activeMode === 'npd' && (
          <div style={{ marginTop: '0.75rem', paddingTop: '0.65rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div className="svc-calc-row" style={{ marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.75)' }}>Доля оплат от юрлиц (ставка 6%):</span>
              <b style={{ color: 'var(--yellow, #f5c06a)', fontSize: '0.88rem' }}>{b2bShare}%</b>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'rgba(255, 255, 255, 0.45)', marginTop: '2px' }}>
              <span>Физлица (4%)</span>
              <span>Компании и ИП (6%)</span>
            </div>
          </div>
        )}
      </div>

      {/* Заголовок блока сравнения */}
      <h3 className="svc-section-title">Сравнение налоговых режимов</h3>

      {/* Информативная сетка сравнения 4 режимов */}
      <div className="svc-modes-grid">
        {(['npd', 'usn6', 'usn15', 'ausn'] as UserTaxMode[]).map((modeKey) => {
          const item = comparisons[modeKey]
          const isSelected = activeMode === modeKey
          const totalPayments = item.tax + item.contributions
          const totalPaymentsFormatted = formatRub(totalPayments)
          const netProfitFormatted = formatRub(item.netProfit)
          return (
            <button
              key={modeKey}
              type="button"
              className={`svc-mode-card ${isSelected ? 'is-active' : ''}`}
              onClick={() => {
                triggerHaptic('light')
                setActiveMode(modeKey)
              }}
            >
              <div>
                <div className="svc-mode-card__top">
                  <span className="svc-mode-card__name">{item.shortName}</span>
                  {item.isBest && <span className="svc-badge-best">Выгодно</span>}
                  {item.overLimit && <span className="svc-badge-warn">Лимит</span>}
                </div>
                <div className="svc-mode-card__subname">{item.name}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.65rem', color: 'rgba(255, 255, 255, 0.55)', marginTop: '0.1rem' }}>
                  Всего в бюджет:
                </div>
                <div
                  className="svc-mode-card__tax"
                  style={{ fontSize: getTaxFontSize(totalPaymentsFormatted) }}
                >
                  {totalPaymentsFormatted}
                </div>
                <div
                  className="svc-mode-card__net"
                  style={{ fontSize: getNetFontSize(netProfitFormatted) }}
                >
                  На руки: <b>{netProfitFormatted}</b>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Детальная карточка выбранного режима */}
      <div className="grant" style={{ marginBottom: '0.85rem' }}>
        <div className="grant__top">
          <span
            className="grant__amount"
            style={{
              fontSize: formatRub(current.tax + current.contributions).length > 13 ? '1.35rem' : '1.6rem',
            }}
          >
            {formatRub(current.tax + current.contributions)}
          </span>
          <span
            style={{
              fontSize: '0.64rem',
              fontWeight: 700,
              fontFamily: 'var(--ui)',
              textTransform: 'uppercase',
              padding: '0.22rem 0.6rem',
              borderRadius: '6px',
              background: 'rgba(245, 192, 106, 0.15)',
              color: 'var(--yellow, #f5c06a)',
              border: '1px solid rgba(245, 192, 106, 0.3)',
              letterSpacing: '0.04em',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {current.badge}
          </span>
        </div>

        <b className="grant__title">Всего платежей в бюджет за период</b>
        <small className="grant__org">
          {current.contributions > 0
            ? `Налог: ${formatRub(current.tax)} + Взносы: ${formatRub(current.contributions)}`
            : `Налог по ставке ${current.badge} (взносы в Соцфонд 0 ₽)`}
        </small>

        {/* 3 ключевых финансовых показателя */}
        <div className="svc-stat-grid">
          <div className="svc-stat-box">
            <span className="svc-stat-box__label">Чистыми на руки</span>
            <span
              className="svc-stat-box__val"
              style={{
                color: '#4ade80',
                fontSize:
                  formatRub(current.netProfit).length > 15
                    ? '0.62rem'
                    : formatRub(current.netProfit).length > 11
                      ? '0.68rem'
                      : '0.84rem',
              }}
            >
              {formatRub(current.netProfit)}
            </span>
          </div>

          <div className="svc-stat-box">
            <span className="svc-stat-box__label">Эфф. нагрузка</span>
            <span className="svc-stat-box__val" style={{ color: 'var(--yellow, #f5c06a)' }}>
              {current.rate.toFixed(1)}%
            </span>
          </div>

          <div className="svc-stat-box">
            <span className="svc-stat-box__label">Взносы ИП</span>
            <span
              className="svc-stat-box__val"
              style={{
                fontSize:
                  formatRub(current.contributions).length > 15
                    ? '0.62rem'
                    : formatRub(current.contributions).length > 11
                      ? '0.68rem'
                      : '0.84rem',
              }}
            >
              {current.contributions > 0 ? formatRub(current.contributions) : '0 ₽'}
            </span>
          </div>
        </div>

        {/* Сроки уплаты и вычеты */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.75)', margin: '0.4rem 0 0.85rem' }}>
          <ClockIcon style={{ width: 14, height: 14, color: 'var(--yellow, #f5c06a)', flexShrink: 0 }} />
          <span>{current.deadline}</span>
        </div>

        {/* Кнопки действий */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button
            type="button"
            className="btn btn--primary btn--block"
            onClick={() => {
              triggerHaptic('medium')
              setTaxMode(activeMode)
              showToast(`Режим «${current.name}» сохранён в профиль!`)
            }}
          >
            Сохранить режим
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
              triggerHaptic('light')
              setCheckedDocs(new Set([0]))
              setSheetOpen(true)
            }}
          >
            Чеклист и условия
          </button>
        </div>
      </div>

      {/* Детальный Bottom Sheet с условиями и чеклистом */}
      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title={current.name}>
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
          {/* Сумма налога + пин */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <div className="grant-sheet__amount">{formatRub(current.tax)}</div>
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
              {current.badge}
            </span>
          </div>

          <p className="muted" style={{ margin: '0 0 0.85rem', fontSize: '0.85rem' }}>
            <ClockIcon style={{ verticalAlign: 'middle', display: 'inline' }} /> {current.deadline}
          </p>

          {/* Условия режима с золотыми галочками */}
          <div style={{ marginBottom: '1rem' }}>
            <h4 className="sheet-sub" style={{ marginBottom: '0.5rem' }}>Условия режима</h4>
            <ul className="checklist" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {current.reqs.map((r, i) => (
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
              {current.checklist.map((doc, idx) => {
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
                showToast(`Режим ${current.name} сохранён!`)
              }}
            >
              Сохранить режим в профиль
            </button>

            <button
              type="button"
              className="btn btn--ghost btn--block"
              onClick={() => {
                setSheetOpen(false)
                nav('/assistant', { state: { q: `Как уменьшить налог на режиме ${current.name}?` } })
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
