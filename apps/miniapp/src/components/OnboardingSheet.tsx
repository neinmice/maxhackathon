import { useEffect, useState } from 'react'
import { CheckIcon, Rays, StartSticker } from './icons'
import Sheet from './Sheet'
import { useApp, type UserGoal, type UserRole, type UserTaxMode } from '../store'
import type { City } from '../data'
import { triggerHaptic, triggerSelectionChanged } from '../lib/maxBridge'

export default function OnboardingSheet() {
  const {
    city,
    setCity,
    role,
    setRole,
    taxMode,
    setTaxMode,
    goal,
    setGoal,
    onboardingOpen,
    setOnboardingOpen,
    showToast,
  } = useApp()

  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (onboardingOpen) setStep(0)
  }, [onboardingOpen])

  const roles: { id: UserRole; title: string; desc: string }[] = [
    { id: 'self_employed', title: 'Самозанятый (НПД)', desc: 'Налог 4–6%, доход до 2.4 млн ₽, без отчётов' },
    { id: 'ip', title: 'Индивидуальный предприниматель', desc: 'ИП на УСН, патенте или АУСН' },
    { id: 'llc', title: 'ООО (Юрлицо)', desc: 'Компания с соучредителями и сотрудниками' },
    { id: 'planning', title: 'Пока только планирую', desc: 'Выбираю идею, изучаю стартовые субсидии' },
    { id: 'intern', title: 'Стажер / Ищу практику', desc: 'Студент или начинающий специалист' },
  ]

  const cities: City[] = ['Казань', 'Москва', 'Санкт-Петербург']

  const taxes: { id: UserTaxMode; title: string; desc: string }[] = [
    { id: 'npd', title: 'НПД (4–6%)', desc: 'Для самозанятых без наёмных сотрудников' },
    { id: 'usn6', title: 'УСН «Доходы» (6%)', desc: 'Базовый режим для сферы услуг' },
    { id: 'usn15', title: 'УСН «Доходы - расходы» (15%)', desc: 'Для торговли и производства' },
    { id: 'ausn', title: 'АУСН (Автоматизированная)', desc: 'Без отчетности, налог считает банк' },
  ]

  const goals: { id: UserGoal; title: string; desc: string }[] = [
    { id: 'start', title: 'Стартовый капитал', desc: 'Субсидии на открытие дела' },
    { id: 'grants', title: 'Гранты и субсидии', desc: 'Безвозмездное финансирование' },
    { id: 'education', title: 'Обучение и менторство', desc: 'Курсы и акселерационные программы' },
    { id: 'growth', title: 'Льготные кредиты', desc: 'Микрозаймы под низкий процент' },
  ]

  const skipTaxStep = role === 'self_employed' || role === 'intern' || role === 'planning'

  const goNext = () => {
    triggerSelectionChanged()
    if (step === 0) {
      setStep(1)
    } else if (step === 1) {
      if (skipTaxStep) setStep(3)
      else setStep(2)
    } else if (step === 2) {
      setStep(3)
    } else {
      handleApply()
    }
  }

  const goBack = () => {
    triggerHaptic('light')
    if (step === 3 && skipTaxStep) {
      setStep(1)
    } else if (step > 0) {
      setStep((s) => s - 1)
    }
  }

  const handleApply = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setOnboardingOpen(false)
      const roleLabel =
        role === 'ip' ? 'ИП' : role === 'self_employed' ? 'Самозанятый' : role === 'llc' ? 'ООО' : role === 'intern' ? 'Стажер' : 'Планирую'
      showToast(`Профиль настроен: ${city}, ${roleLabel}`)
    }, 350)
  }

  const stepTitles = [
    <>
      <span style={{ fontSize: '0.85rem', color: '#8d93a3', display: 'block', fontWeight: 600, marginBottom: '4px' }}>Шаг 1 из 4</span>
      <span>Где ты открываешь дело?</span>
    </>,
    <>
      <span style={{ fontSize: '0.85rem', color: '#8d93a3', display: 'block', fontWeight: 600, marginBottom: '4px' }}>Шаг 2 из 4</span>
      <span>Твой текущий статус</span>
    </>,
    <>
      <span style={{ fontSize: '0.85rem', color: '#8d93a3', display: 'block', fontWeight: 600, marginBottom: '4px' }}>Шаг 3 из 4</span>
      <span>Система налогообложения</span>
    </>,
    <>
      <span style={{ fontSize: '0.85rem', color: '#8d93a3', display: 'block', fontWeight: 600, marginBottom: '4px' }}>Шаг 4 из 4</span>
      <span>Главная цель</span>
    </>,
  ]

  return (
    <Sheet open={onboardingOpen} onClose={() => setOnboardingOpen(false)} title={stepTitles[step]}>
      <div className="onboard-sheet" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '1.5rem', maxHeight: '72vh', overflowY: 'auto' }}>
        {/* Индикатор прогресса шагов */}
        <div style={{ display: 'flex', gap: '6px', margin: '0.2rem 0' }}>
          {[0, 1, 2, 3].map((s) => {
            const isCompleted = s < step || (s === 2 && skipTaxStep && step === 3)
            const isCurrent = s === step
            return (
              <div
                key={s}
                style={{
                  flex: 1,
                  height: '4px',
                  borderRadius: '2px',
                  background: isCurrent ? 'var(--yellow)' : isCompleted ? 'var(--purple-2)' : 'rgba(255, 255, 255, 0.12)',
                  transition: 'background 0.2s',
                }}
              />
            )
          })}
        </div>

        {/* ШАГ 0: РЕГИОН */}
        {step === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <p className="muted" style={{ margin: 0, fontSize: '0.85rem' }}>
              Выберите регион регистрации бизнеса. Бизнес-навигатор подберет меры с учетом местных условий.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.3rem' }}>
              {cities.map((c) => (
                <button
                  key={c}
                  className={`menu__row ${c === city ? 'is-active' : ''}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.85rem 1rem',
                    borderRadius: '0.9rem',
                    background: c === city ? 'rgba(245, 197, 109, 0.1)' : 'var(--card-2)',
                    border: `1.5px solid ${c === city ? 'var(--yellow)' : 'var(--line)'}`,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onClick={() => {
                    triggerHaptic('light')
                    setCity(c)
                  }}
                >
                  <b style={{ fontSize: '0.95rem', color: c === city ? '#ffffff' : 'var(--text-sub)' }}>{c}</b>
                  {c === city && <CheckIcon style={{ color: 'var(--yellow)' }} />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ШАГ 1: ФОРМА БИЗНЕСА */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {roles.map((r) => (
              <button
                key={r.id}
                onClick={() => {
                  triggerHaptic('light')
                  setRole(r.id)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 0.9rem',
                  borderRadius: '0.85rem',
                  background: role === r.id ? 'rgba(132, 85, 246, 0.15)' : 'var(--card-2)',
                  border: `1.5px solid ${role === r.id ? 'var(--purple-2)' : 'var(--line)'}`,
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                <div>
                  <b style={{ display: 'block', fontSize: '0.92rem', color: '#fff' }}>{r.title}</b>
                  <small style={{ color: 'var(--muted-2)', fontSize: '0.78rem' }}>{r.desc}</small>
                </div>
                {role === r.id && <CheckIcon style={{ color: 'var(--purple-3)', flexShrink: 0 }} />}
              </button>
            ))}
          </div>
        )}

        {/* ШАГ 2: НАЛОГОВЫЙ РЕЖИМ */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {taxes.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  triggerHaptic('light')
                  setTaxMode(t.id)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 0.9rem',
                  borderRadius: '0.85rem',
                  background: taxMode === t.id ? 'rgba(132, 85, 246, 0.15)' : 'var(--card-2)',
                  border: `1.5px solid ${taxMode === t.id ? 'var(--purple-2)' : 'var(--line)'}`,
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                <div>
                  <b style={{ display: 'block', fontSize: '0.92rem', color: '#fff' }}>{t.title}</b>
                  <small style={{ color: 'var(--muted-2)', fontSize: '0.78rem' }}>{t.desc}</small>
                </div>
                {taxMode === t.id && <CheckIcon style={{ color: 'var(--purple-3)', flexShrink: 0 }} />}
              </button>
            ))}
          </div>
        )}

        {/* ШАГ 3: ГЛАВНАЯ ЦЕЛЬ */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {goals.map((g) => (
              <button
                key={g.id}
                onClick={() => {
                  triggerHaptic('light')
                  setGoal(g.id)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 0.9rem',
                  borderRadius: '0.85rem',
                  background: goal === g.id ? 'rgba(245, 197, 109, 0.12)' : 'var(--card-2)',
                  border: `1.5px solid ${goal === g.id ? 'var(--yellow)' : 'var(--line)'}`,
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                <div>
                  <b style={{ display: 'block', fontSize: '0.92rem', color: '#fff' }}>{g.title}</b>
                  <small style={{ color: 'var(--muted-2)', fontSize: '0.78rem' }}>{g.desc}</small>
                </div>
                {goal === g.id && <CheckIcon style={{ color: 'var(--yellow)', flexShrink: 0 }} />}
              </button>
            ))}
          </div>
        )}

        {/* НАВИГАЦИОННЫЕ КНОПКИ */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '0.5rem' }}>
          {step > 0 && (
            <button
              type="button"
              className="btn btn--ghost"
              onClick={goBack}
              style={{ flex: 1, height: '44px', fontSize: '0.9rem' }}
            >
              Назад
            </button>
          )}
          <button
            className="btn btn--primary"
            style={{ flex: step > 0 ? 1.6 : 1, height: '44px', fontSize: '0.92rem' }}
            disabled={loading}
            onClick={goNext}
          >
            {loading ? 'Сохраняем...' : step === 3 ? 'Готово' : 'Дальше'}
          </button>
        </div>
      </div>
    </Sheet>
  )
}
