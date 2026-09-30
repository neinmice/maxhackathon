import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import mascotShrug from '../assets/mascot/mascot-shrug.webp'
import { CheckIcon, ClockIcon, Rays, StartSticker } from '../components/icons'
import { QUESTIONS } from '../components/QuizModal'
import { useApp } from '../store'
import { apiClient, type QuizSubmitResult } from '../api/client'
import { triggerHaptic, triggerNotification, triggerSelectionChanged } from '../lib/maxBridge'
import { saveCertificateResult } from '../lib/storage'
import { PageTitle } from './Other'

export default function QuizPage() {
  const { userName, showToast } = useApp()
  const nav = useNavigate()

  const [step, setStep] = useState<number>(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [result, setResult] = useState<QuizSubmitResult | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

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
      setSubmitError(null)
      try {
        const res = await apiClient.submitQuiz('v1', answers)
        setResult(res)
        if (res.passed && res.certificate) {
          // Кэшируем только валидированный серверный результат; presentation-поля выставляет storage
          saveCertificateResult(res, userName || 'Предприниматель')
          triggerNotification('success')
        } else {
          triggerNotification('warning')
        }
      } catch (err) {
        // Честный retry-статус: результат требует сервера, локальный сертификат не создаётся
        setSubmitError(err instanceof Error && err.message ? err.message : 'Сервис проверки недоступен')
        triggerNotification('error')
      } finally {
        setSubmitting(false)
      }
    }
  }

  const handleRestart = () => {
    setAnswers({})
    setStep(0)
    setResult(null)
    setSubmitError(null)
  }

  return (
    <div className="page quiz-page" style={{ paddingBottom: '80px' }}>
      <PageTitle
        pre="Основы"
        hl="бизнеса"
        color="yellow"
        back
        rightSlot={
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.68rem',
              fontWeight: 700,
              fontFamily: 'var(--ui)',
              textTransform: 'uppercase',
              lineHeight: 1,
              padding: '0.22rem 0.55rem',
              borderRadius: '6px',
              background: 'rgba(245, 192, 106, 0.15)',
              color: 'var(--yellow)',
              border: '1px solid rgba(245, 192, 106, 0.35)',
              whiteSpace: 'nowrap',
              letterSpacing: '0.04em',
            }}
          >
            {!result
              ? `${step + 1}/${QUESTIONS.length}`
              : `${Math.round((result.score / 100) * QUESTIONS.length)}/${QUESTIONS.length}`}
          </span>
        }
      />

      {!result ? (
        <div style={{ marginTop: '10px' }}>
          {/* Прогресс-бар вопросов */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
            {QUESTIONS.map((_, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: '5px',
                  borderRadius: '3px',
                  background: i < step ? '#f5c06a' : i === step ? '#8455f6' : 'rgba(255, 255, 255, 0.15)',
                  transition: 'background 0.25s ease',
                }}
              />
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: '#c499f3',
                background: 'rgba(132, 85, 246, 0.2)',
                padding: '3px 8px',
                borderRadius: '6px',
                letterSpacing: '0.04em',
              }}
            >
              Экспресс-тест
            </span>
            <span style={{ fontSize: '12px', color: '#8d93a3', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <ClockIcon style={{ width: 13, height: 13 }} /> 3–5 минут
            </span>
          </div>

          <h3
            style={{
              fontFamily: "'VK Sans Display Expanded', sans-serif",
              fontSize: '17px',
              lineHeight: 1.35,
              marginBottom: '20px',
              color: '#ffffff',
            }}
          >
            {curQ.text}
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
            {curQ.options.map((opt) => {
              const selected = answers[curQ.id] === opt.key
              return (
                <button
                  key={opt.key}
                  className="quiz-option"
                  onClick={() => handleSelectOption(opt.key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 16px',
                    borderRadius: '16px',
                    background: selected ? 'rgba(132, 85, 246, 0.15)' : '#2a2a2b',
                    border: `1px solid ${selected ? '#8455f6' : '#363638'}`,
                    textAlign: 'left',
                    color: selected ? '#ffffff' : 'rgba(255, 255, 255, 0.9)',
                    fontFamily: "'VK Sans Text', sans-serif",
                    fontSize: '14px',
                    lineHeight: 1.35,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: selected ? '0 0 16px rgba(132, 85, 246, 0.3)' : 'none',
                  }}
                >
                  <span>{opt.label}</span>
                  {selected && (
                    <div
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        background: '#8455f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginLeft: '8px',
                      }}
                    >
                      <CheckIcon style={{ color: '#ffffff', width: '14px', height: '14px' }} />
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          <button
            className="btn btn--primary btn--block"
            disabled={!answers[curQ.id] || submitting}
            onClick={handleNext}
            style={{
              height: '48px',
              borderRadius: '14px',
              background: '#8455f6',
              boxShadow: '0 4px 16px rgba(132, 85, 246, 0.4)',
              fontSize: '15px',
              fontWeight: 700,
            }}
          >
            {submitting
              ? 'Проверка ответов...'
              : step === QUESTIONS.length - 1
                ? 'Получить сертификат'
                : 'Следующий вопрос'}
          </button>

          {submitError && (
            <div
              style={{
                marginTop: '12px',
                padding: '10px 12px',
                borderRadius: '12px',
                background: 'rgba(255, 90, 90, 0.12)',
                border: '1px solid rgba(255, 90, 90, 0.35)',
                color: '#ff8a8a',
                fontSize: '12px',
                lineHeight: 1.4,
                textAlign: 'left',
              }}
            >
              {submitError}. Проверка выполняется на сервере — нажмите «Получить сертификат», чтобы повторить.
            </div>
          )}
        </div>
      ) : (
        <div style={{ textAlign: 'center', position: 'relative', marginTop: '10px' }}>
          {result.passed ? (
            <div
              style={{
                background: 'linear-gradient(145deg, rgba(245, 197, 109, 0.12) 0%, rgba(132, 85, 246, 0.15) 100%)',
                border: '2px solid #f5c06a',
                outline: '1px dashed rgba(245, 197, 109, 0.4)',
                outlineOffset: '-6px',
                borderRadius: '20px',
                padding: '24px 18px',
                position: 'relative',
                overflow: 'hidden',
                marginBottom: '16px',
                boxShadow: '0 12px 36px rgba(0, 0, 0, 0.5)',
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
                  margin: '0 auto 10px',
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

              <div
                style={{
                  fontSize: '11px',
                  letterSpacing: '0.12em',
                  color: '#f5c06a',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                }}
              >
                ПАМЯТНЫЙ СЕРТИФИКАТ ЗА ПРОХОЖДЕНИЕ КВИЗА*
              </div>

              <h2
                style={{
                  fontSize: '22px',
                  margin: '8px 0 4px',
                  color: '#ffffff',
                  fontFamily: "'VK Sans Display Expanded', sans-serif",
                }}
              >
                {userName}
              </h2>

              <p
                style={{
                  fontSize: '13px',
                  color: '#8d93a3',
                  margin: '6px 0 12px',
                  lineHeight: 1.4,
                }}
              >
                Успешно подтверждены базовые знания в сфере налогообложения, выбора мер господдержки и запуска бизнеса.
              </p>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '16px',
                  fontSize: '13px',
                  color: '#c499f3',
                }}
              >
                <span>
                  Результат: <b>{result.score}%</b>
                </span>
                <span>
                  № <b>{result.certificate?.certificate_id.substring(0, 16)}</b>
                </span>
              </div>

              <div
                style={{
                  marginTop: '12px',
                  fontSize: '11px',
                  color: 'rgba(255, 255, 255, 0.45)',
                  borderTop: '1px dashed rgba(255, 255, 255, 0.15)',
                  paddingTop: '8px',
                }}
              >
                Верифицировано криптографической подписью ZVERY Core (SHA-256)
              </div>
            </div>
          ) : (
            <div style={{ padding: '20px 0' }}>
              <img
                src={mascotShrug}
                alt=""
                style={{ width: 90, height: 90, margin: '0 auto 16px', display: 'block' }}
              />
              <h3 style={{ fontSize: '18px', color: '#ffffff', marginBottom: '8px' }}>Почти получилось!</h3>
              <p style={{ color: '#8d93a3', fontSize: '13px' }}>
                Набрано {result.score}%, для сертификата необходимо от 70%.
              </p>
              <button
                className="btn btn--primary btn--block"
                onClick={handleRestart}
                style={{ marginTop: '16px', height: '46px', background: '#8455f6' }}
              >
                Попробовать снова
              </button>
            </div>
          )}

          {result.passed && (
            <div
              style={{
                fontSize: '11px',
                color: '#656568',
                lineHeight: 1.4,
                marginBottom: '16px',
                textAlign: 'left',
              }}
            >
              *Памятный сертификат носит информационно-поощрительный характер и не является документом государственного
              образца об образовании или квалификации (ст. 60 ФЗ №273). Не гарантирует автоматическое предоставление
              государственной субсидии или гранта.
            </div>
          )}

          {result.passed && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                className="btn btn--primary btn--block"
                onClick={() => {
                  triggerHaptic('medium')
                  showToast('Генерация PDF (A4)...')
                  window.print()
                }}
                style={{ height: '46px', background: '#8455f6' }}
              >
                Скачать PDF (A4)
              </button>
              <button
                className="btn btn--ghost btn--block"
                onClick={() => {
                  triggerHaptic('light')
                  nav('/grants')
                }}
                style={{ height: '46px' }}
              >
                Подобрать меры поддержки
              </button>
              <button
                className="btn btn--ghost btn--block"
                onClick={handleRestart}
                style={{ height: '40px', fontSize: '12px' }}
              >
                Пройти тест снова
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
