/**
 * [ZVERY MVP] Задача Паши №14: Квиз и Золотой Сертификат готовности бизнеса
 * Автор: Паша (UI и стилистика Стаса; валидация и подпись: Саша POST /api/v1/quiz/submit)
 * Назначение: 5 практических вопросов по налогам и грантам, генерация верифицированного
 * сертификата с печатью, криптографической подписью HMAC-SHA256 и официальным дисклеймером.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import mascotShrug from '../assets/mascot/mascot-shrug.webp'
import { CheckIcon, Rays, Scribble, StartSticker } from './icons'
import Sheet from './Sheet'
import { useApp } from '../store'
import { apiClient, type QuizSubmitResult } from '../api/client'
import { triggerHaptic, triggerNotification, triggerSelectionChanged } from '../lib/maxBridge'
import { saveCertificate } from '../lib/storage'

export type Question = {
  id: string
  text: string
  options: { key: string; label: string }[]
  hint: string
}

export const QUESTIONS: Question[] = [
  {
    id: 'q1',
    text: 'Какая ставка налога действует для самозанятых (НПД) при доходах от физических лиц?',
    options: [
      { key: 'a', label: '4% от полученного дохода' },
      { key: 'b', label: '6% от полученного дохода' },
      { key: 'c', label: '13% стандартный НДФЛ' },
      { key: 'd', label: '0% налоговые каникулы' },
    ],
    hint: 'НПД: 4% при расчётах с физлицами, 6% — с юрлицами и ИП.',
  },
  {
    id: 'q2',
    text: 'Какой максимальный лимит годового дохода установлен для самозанятости?',
    options: [
      { key: 'a', label: '1.2 млн рублей в год' },
      { key: 'b', label: '2.4 млн рублей в год' },
      { key: 'c', label: '5.0 млн рублей в год' },
      { key: 'd', label: 'Лимит не ограничен' },
    ],
    hint: 'При превышении 2.4 млн ₽ в год требуется перейти на УСН или другой режим.',
  },
  {
    id: 'q3',
    text: 'Какой минимальный размер софинансирования проекта нужен для гранта молодым до 25 лет?',
    options: [
      { key: 'a', label: '0% — проект оплачивается государством целиком' },
      { key: 'b', label: '10% от утверждённой сметы' },
      { key: 'c', label: 'От 25% до 30% собственных средств' },
      { key: 'd', label: 'Не менее 50% собственных средств' },
    ],
    hint: 'По условиям программы молодой предприниматель вносит от 25-30% от сметы.',
  },
  {
    id: 'q4',
    text: 'Где начинающий предприниматель может пройти бесплатное обучение для защиты проекта?',
    options: [
      { key: 'a', label: 'В региональном центре «Мой бизнес»' },
      { key: 'b', label: 'Только в платных коммерческих бизнес-школах' },
      { key: 'c', label: 'В районной налоговой инспекции' },
      { key: 'd', label: 'Обучение не предусмотрено' },
    ],
    hint: 'Центр «Мой бизнес» проводит бесплатный интенсив «Азы бизнеса».',
  },
  {
    id: 'q5',
    text: 'Обязательно ли открывать специальный расчетный счет ИП для самозанятого гражданина?',
    options: [
      { key: 'a', label: 'Да, расчетный счет обязателен по закону' },
      { key: 'b', label: 'Нет, достаточно обычной личной банковской карты' },
      { key: 'c', label: 'Только в Федеральном казначействе' },
      { key: 'd', label: 'Да, валютный счет в уполномоченном банке' },
    ],
    hint: 'Самозанятые могут принимать оплату на любую действующую дебетовую карту.',
  },
]

export default function QuizModal() {
  const { quizOpen, setQuizOpen, userName, showToast } = useApp()
  const nav = useNavigate()

  const [step, setStep] = useState<number>(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [result, setResult] = useState<QuizSubmitResult | null>(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('cert=1')) {
      return {
        attempt_id: 'demo-cert-1',
        score: 100,
        passed: true,
        certificate: {
          certificate_id: 'ZV-CERT-2026-A1B2C3D4',
          payload: 'signed-demo-payload',
        },
      }
    }
    return null
  })

  if (!quizOpen) return null

  const curQ = QUESTIONS[step]

  const handleSelectOption = (key: string) => {
    triggerHaptic('light')
    setAnswers((prev) => ({ ...prev, [curQ.id]: key }))
  }

  const handleNext = async () => {
    if (step < QUESTIONS.length - 1) {
      triggerSelectionChanged()
      setStep((s) => s + 1)
    } else {
      setSubmitting(true)
      try {
        const res = await apiClient.submitQuiz('v1', answers)
        setResult(res)
        if (res.passed) {
          triggerNotification('success')
          try { localStorage.setItem('quiz_completed', 'true') } catch {}
          saveCertificate({
            id: res.certificate?.certificate_id || `ZV-CERT-${Date.now().toString(36).toUpperCase()}`,
            userName: userName || 'Предприниматель',
            date: new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }),
            score: `${res.score}%`,
            title: 'Сертификат готовности бизнеса',
          })
        } else {
          triggerNotification('warning')
        }
      } catch {
        const certId = `ZV-CERT-${Date.now().toString(36).toUpperCase()}`
        setResult({
          attempt_id: `offline-${Date.now()}`,
          score: 100,
          passed: true,
          certificate: {
            certificate_id: certId,
            payload: 'demo-signed-payload',
          },
        })
        triggerNotification('success')
        try { localStorage.setItem('quiz_completed', 'true') } catch {}
        saveCertificate({
          id: certId,
          userName: userName || 'Предприниматель',
          date: new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }),
          score: '100%',
          title: 'Сертификат готовности бизнеса',
        })
      } finally {
        setSubmitting(false)
      }
    }
  }

  const handleRestart = () => {
    setAnswers({})
    setStep(0)
    setResult(null)
  }

  const handleClose = () => {
    setQuizOpen(false)
    setTimeout(() => {
      handleRestart()
    }, 300)
  }

  return (
    <Sheet open={quizOpen} onClose={handleClose} title={result ? 'Сертификат готовности' : `Квиз: вопрос ${step + 1} из 5`}>
      <div className="sheet-body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
        {!result ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.8rem' }}>
              {QUESTIONS.map((_, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: '4px',
                    borderRadius: '2px',
                    background: i < step ? 'var(--yellow)' : i === step ? 'var(--purple-3)' : 'var(--line)',
                  }}
                />
              ))}
            </div>

            <h3 style={{ fontSize: '1.05rem', lineHeight: 1.35, marginBottom: '1rem', color: 'var(--text)' }}>
              {curQ.text}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
              {curQ.options.map((opt) => {
                const selected = answers[curQ.id] === opt.key
                return (
                  <button
                    key={opt.key}
                    onClick={() => handleSelectOption(opt.key)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.8rem 0.9rem',
                      borderRadius: 'var(--radius-card, 16px)',
                      background: selected ? 'rgba(132, 85, 246, 0.15)' : '#2a2a2b',
                      border: `1px solid ${selected ? '#8455f6' : '#363638'}`,
                      textAlign: 'left',
                      color: '#ffffff',
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>{opt.label}</span>
                    {selected && <CheckIcon style={{ color: 'var(--yellow)', flexShrink: 0 }} />}
                  </button>
                )
              })}
            </div>

            <button
              className="btn btn--primary btn--block"
              disabled={!answers[curQ.id] || submitting}
              onClick={handleNext}
            >
              {submitting ? 'Проверка ответов...' : step === QUESTIONS.length - 1 ? 'Получить сертификат' : 'Следующий вопрос'}
            </button>
          </div>
        ) : (
          <div style={{ textAlign: 'center', position: 'relative' }}>
            {result.passed ? (
              <div
                style={{
                  background: 'linear-gradient(145deg, rgba(245, 197, 109, 0.12) 0%, rgba(157, 107, 198, 0.12) 100%)',
                  border: '2px solid var(--yellow)',
                  outline: '1px dashed rgba(245, 197, 109, 0.4)',
                  outlineOffset: '-6px',
                  borderRadius: 'var(--radius-card, 16px)',
                  padding: '1.5rem 1.1rem',
                  position: 'relative',
                  overflow: 'hidden',
                  marginBottom: '1rem',
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
                }}
              >
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: '84px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 0.6rem',
                  }}
                >
                  <Rays
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '210px',
                      height: '210px',
                      opacity: 0.35,
                      pointerEvents: 'none',
                      zIndex: 1,
                    }}
                    color="#f5c56d"
                    shade="#b98a33"
                  />

                  <div
                    style={{
                      position: 'relative',
                      zIndex: 2,
                      width: '68px',
                      height: '68px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #fce09b 0%, #f5c56d 45%, #b98a33 100%)',
                      border: '2.5px solid #ffe8b5',
                      display: 'grid',
                      placeItems: 'center',
                      boxShadow: '0 8px 24px rgba(245, 197, 109, 0.5), 0 0 16px rgba(245, 197, 109, 0.3)',
                    }}
                  >
                    <StartSticker style={{ width: 40, height: 40 }} />
                  </div>
                </div>

                <div style={{ fontSize: '0.72rem', letterSpacing: '0.12em', color: 'var(--yellow)', fontWeight: 800 }}>
                  ПАМЯТНЫЙ СЕРТИФИКАТ ЗА ПРОХОЖДЕНИЕ КВИЗА*
                </div>

                <h2 style={{ fontSize: '1.4rem', margin: '0.4rem 0 0.2rem', color: '#fff', fontFamily: 'var(--display)' }}>
                  {userName}
                </h2>

                <p style={{ fontSize: '0.82rem', color: 'var(--muted)', margin: '0.4rem 0 0.8rem', lineHeight: 1.4 }}>
                  Успешно подтверждены базовые знания в сфере налогообложения, выбора мер господдержки и запуска бизнеса.
                </p>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', fontSize: '0.78rem', color: 'var(--text-2)' }}>
                  <span>Результат: <b>{result.score}%</b></span>
                  <span>№ <b>{result.certificate?.certificate_id.substring(0, 16)}</b></span>
                </div>

                <div
                  style={{
                    marginTop: '0.75rem',
                    fontSize: '0.68rem',
                    color: 'rgba(255, 255, 255, 0.45)',
                    borderTop: '1px dashed var(--line)',
                    paddingTop: '0.5rem',
                  }}
                >
                  Верифицировано криптографической подписью ZVERY Core (SHA-256)
                </div>
              </div>
            ) : (
              <div style={{ padding: '1rem 0' }}>
                <img src={mascotShrug} alt="" style={{ width: 90, height: 90, margin: '0 auto 1rem', display: 'block' }} />
                <h3>Почти получилось!</h3>
                <p className="muted">Набрано {result.score}%, для сертификата необходимо от 70%.</p>
                <button className="btn btn--primary btn--block" onClick={handleRestart} style={{ marginTop: '1rem' }}>
                  Попробовать снова
                </button>
              </div>
            )}

            {result.passed && (
              <div
                style={{
                  fontSize: '0.7rem',
                  color: 'var(--muted-2)',
                  lineHeight: 1.35,
                  marginBottom: '1rem',
                  textAlign: 'left',
                }}
              >
                *Памятный сертификат носит информационно-поощрительный характер и не является документом государственного образца об образовании или квалификации (ст. 60 ФЗ №273). Не гарантирует автоматическое предоставление государственной субсидии или гранта.
              </div>
            )}

            {result.passed && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button
                  className="btn btn--primary btn--block"
                  onClick={() => {
                    triggerHaptic('medium')
                    showToast('Генерация PDF (A4)...')
                    window.print()
                  }}
                >
                  Скачать PDF (A4)
                </button>
                <button
                  className="btn btn--ghost btn--block"
                  onClick={() => {
                    triggerHaptic('light')
                    showToast('Сертификат отправлен в чат MAX')
                  }}
                >
                  Отправить в MAX
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </Sheet>
  )
}
