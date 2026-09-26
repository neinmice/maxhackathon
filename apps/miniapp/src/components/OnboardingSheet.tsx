import { useState } from 'react'
import { CheckIcon, Rays, StartSticker } from './icons'
import Sheet from './Sheet'
import { useApp, type UserGoal, type UserRole, type UserTaxMode } from '../store'
import type { City } from '../data'

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

  const [loading, setLoading] = useState(false)

  const roles: { id: UserRole; title: string; desc: string }[] = [
    { id: 'self_employed', title: 'Самозанятый', desc: 'НПД до 2.4 млн ₽, без отчётов' },
    { id: 'ip', title: 'Индивидуальный предприниматель', desc: 'ИП на УСН/патенте' },
    { id: 'llc', title: 'ООО (Юрлицо)', desc: 'Компания с соучредителями' },
  ]

  const cities: City[] = ['Казань', 'Москва', 'Санкт-Петербург']

  const taxes: { id: UserTaxMode; title: string }[] = [
    { id: 'npd', title: 'НПД (4–6%)' },
    { id: 'usn6', title: 'УСН «Доходы» (6%)' },
    { id: 'usn15', title: 'УСН «Доходы - расходы» (15%)' },
    { id: 'ausn', title: 'АУСН (Автоматизированная)' },
  ]

  const goals: { id: UserGoal; title: string }[] = [
    { id: 'start', title: 'Стартовый капитал' },
    { id: 'grants', title: 'Гранты и субсидии' },
    { id: 'education', title: 'Обучение и менторство' },
    { id: 'growth', title: 'Льготные кредиты' },
  ]

  const handleApply = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setOnboardingOpen(false)
      showToast(`Профиль обновлён: ${city}, ${role === 'ip' ? 'ИП' : role === 'self_employed' ? 'Самозанятый' : 'ООО'}`)
    }, 350)
  }

  return (
    <Sheet open={onboardingOpen} onClose={() => setOnboardingOpen(false)} title="Подбор мер поддержки">
      <div className="onboard-sheet" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '1rem' }}>
        <div style={{ background: 'var(--card-2)', padding: '0.75rem 0.85rem', borderRadius: '1rem', border: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.55rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--muted-2)' }}>Твой регион</span>
            <span style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--yellow)' }}>{city}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
            {cities.map((c) => (
              <button
                key={c}
                className={`filter ${c === city ? 'is-active' : ''}`}
                style={{ width: '100%', textAlign: 'center', padding: '0.4rem 0', fontSize: '0.82rem' }}
                onClick={() => setCity(c)}
              >
                {c === 'Санкт-Петербург' ? 'СПб' : c}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-2)' }}>Форма бизнеса</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {roles.map((r) => (
              <button
                key={r.id}
                onClick={() => setRole(r.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem',
                  borderRadius: '0.85rem',
                  background: role === r.id ? 'var(--card)' : 'var(--card-2)',
                  border: `1px solid ${role === r.id ? 'var(--purple-2)' : 'var(--line)'}`,
                  textAlign: 'left',
                }}
              >
                <div>
                  <b style={{ display: 'block', fontSize: '0.92rem' }}>{r.title}</b>
                  <small style={{ color: 'var(--muted-2)', fontSize: '0.78rem' }}>{r.desc}</small>
                </div>
                {role === r.id && <CheckIcon style={{ color: 'var(--purple-3)', flexShrink: 0 }} />}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-2)' }}>Налоговый режим</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {taxes.map((t) => (
              <button
                key={t.id}
                className={`filter ${taxMode === t.id ? 'is-active' : ''}`}
                onClick={() => setTaxMode(t.id)}
                style={{ fontSize: '0.82rem', padding: '0.45rem 0.8rem' }}
              >
                {t.title}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-2)' }}>Главная цель</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {goals.map((g) => (
              <button
                key={g.id}
                className={`filter ${goal === g.id ? 'is-active' : ''}`}
                onClick={() => setGoal(g.id)}
                style={{ fontSize: '0.82rem', padding: '0.45rem 0.8rem' }}
              >
                {g.title}
              </button>
            ))}
          </div>
        </div>

        <button
          className="btn btn--primary btn--block"
          style={{ marginTop: '0.5rem', position: 'relative', overflow: 'hidden' }}
          disabled={loading}
          onClick={handleApply}
        >
          {loading ? 'Подбираем меры...' : 'Подобрать меры поддержки'}
        </button>
      </div>
    </Sheet>
  )
}
