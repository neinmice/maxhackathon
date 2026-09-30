/**
 * Первое обучение: четыре шага до анкеты.
 * Крестик запоминает просмотр ключом zvery_intro_seen, не zvery_onboarding_seen.
 */
import { useState } from 'react'
import Sheet from './Sheet'
import { useApp } from '../store'

const STEPS = [
  {
    title: 'Каталог — это фильтр',
    body: 'Каталог показывает меры, которые совпали с выбранными городом и отраслью. Это не рейтинг и не совет, какая мера нужнее.',
  },
  {
    title: 'Пока три города и три отрасли',
    body: 'Сейчас в каталоге Казань, Москва и Санкт-Петербург. Отрасли: агро, услуги и IT. Других городов и отраслей пока нет.',
  },
  {
    title: 'Данные мер примерочные',
    body: 'Записи каталога помечены как примерочные. Это не официальные условия и не подтверждённые меры.',
  },
  {
    title: 'Заявка не подаётся',
    body: 'Из приложения нельзя отправить заявку, записаться на обучение или оформить меру. Экраны только показывают, что уже есть в каталоге.',
  },
] as const

export default function FirstRunIntro() {
  const { introOpen, dismissIntro } = useApp()
  const [step, setStep] = useState(0)
  const current = STEPS[step]
  const last = step === STEPS.length - 1

  return (
    <Sheet open={introOpen} onClose={dismissIntro} title="Как устроен каталог">
      <div className="onboard-sheet" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.35rem' }} aria-hidden="true">
          {STEPS.map((item, index) => (
            <span
              key={item.title}
              style={{
                flex: 1,
                height: '0.25rem',
                borderRadius: '1rem',
                background: index <= step ? 'var(--yellow)' : 'var(--line)',
              }}
            />
          ))}
        </div>
        <p className="muted" style={{ margin: 0, fontSize: '0.82rem' }}>
          Шаг {step + 1} из {STEPS.length}
        </p>
        <div style={{ background: 'var(--card-2)', padding: '0.85rem', borderRadius: '1rem', border: '1px solid var(--line)' }}>
          <h4 style={{ fontSize: '0.98rem', margin: '0 0 0.45rem', color: 'var(--text-2)' }}>{current.title}</h4>
          <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.45 }}>{current.body}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {step > 0 && (
            <button type="button" className="btn btn--ghost btn--block" onClick={() => setStep((value) => value - 1)}>
              Назад
            </button>
          )}
          <button
            type="button"
            className="btn btn--primary btn--block"
            onClick={() => {
              if (last) dismissIntro()
              else setStep((value) => value + 1)
            }}
          >
            {last ? 'Дальше к анкете' : 'Дальше'}
          </button>
        </div>
      </div>
    </Sheet>
  )
}
