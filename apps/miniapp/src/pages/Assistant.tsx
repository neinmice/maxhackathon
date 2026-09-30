import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import mascot from '../assets/mascot/mascot-door-tight.webp'
import { Avatar } from '../components/Header'
import { MicIcon, Rays, Scribble, SendIcon } from '../components/icons'
import { CITIES, QUICK_QUESTIONS, quickText } from '../data'
import { triggerHaptic } from '../lib/maxBridge'
import { cityIn, useApp } from '../store'

type Msg = { id: number; from: 'user' | 'bot'; text: ReactNode; time: string }

const now = () => new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })

function answer(
  q: string,
  city: string,
  address: string,
  actions: {
    nav: (path: string) => void
    openQuiz: () => void
  },
): ReactNode {
  const t = q.toLowerCase()
  if (t.includes('грант') || t.includes('300')) {
    return (
      <>
        <p>
          Привет! Для получения гранта на 300.000 руб. <span className="text-y">необходимо:</span>
        </p>
        <p>
          — Не иметь долгов перед государством
          <br />— Пройти обучение в центре «Мой бизнес» (в {city} по адресу {address})
          <br />— Защитить бизнес-проект
          <br />— Внести минимум 30% от начальных затрат в проект
        </p>
        <p>
          Кстати, записаться на интенсив можно в разделе «Обучение», а изучить все доступные меры — в каталоге.
        </p>
        <div style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="filter is-active"
            onClick={() => {
              triggerHaptic('light')
              actions.nav('/grants')
            }}
            style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '10px' }}
          >
            Каталог грантов →
          </button>
          <button
            type="button"
            className="filter"
            onClick={() => {
              triggerHaptic('light')
              actions.nav('/learning')
            }}
            style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '10px' }}
          >
            Курс «Азы бизнеса»
          </button>
        </div>
      </>
    )
  }
  if (t.includes('налог')) {
    return (
      <>
        <p>
          Коротко о <span className="text-y">налогах 2027</span> для начинающих:
        </p>
        <p>
          — Самозанятость (НПД): 4% с физлиц, 6% с юрлиц
          <br />— УСН «Доходы»: 6%, для новых ИП возможны налоговые каникулы 0%
          <br />— Патент: фиксированная сумма, зависит от вида деятельности
        </p>
        <p>
          Посчитать точную сумму можно в онлайн-калькуляторе:
        </p>
        <div style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="filter is-active"
            onClick={() => {
              triggerHaptic('light')
              actions.nav('/services')
            }}
            style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '10px' }}
          >
            Калькулятор налогов →
          </button>
        </div>
      </>
    )
  }
  if (t.includes('обучен')) {
    return (
      <>
        <p>Бесплатное обучение можно пройти:</p>
        <p>
          — Онлайн в разделе «Обучение»
          <br />— Офлайн в центре «Мой бизнес» ({address})
          <br />— В акселераторе для молодых предпринимателей
        </p>
        <div style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="filter is-active"
            onClick={() => {
              triggerHaptic('light')
              actions.nav('/learning')
            }}
            style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '10px' }}
          >
            Раздел «Обучение» →
          </button>
        </div>
      </>
    )
  }
  if (t.includes('умеешь')) {
    return (
      <>
        <p>Я умею:</p>
        <p>
          — Подбирать гранты и льготы под твой проект
          <br />— Объяснять, как открыть ИП или ООО
          <br />— Считать налоги и стартовые затраты
          <br />— Записывать на обучение и мероприятия
        </p>
        <div style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="filter is-active"
            onClick={() => {
              triggerHaptic('light')
              actions.nav('/grants')
            }}
            style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '10px' }}
          >
            Подобрать гранты →
          </button>
          <button
            type="button"
            className="filter"
            onClick={() => {
              triggerHaptic('light')
              actions.nav('/quiz')
            }}
            style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '10px' }}
          >
            Тест по бизнесу →
          </button>
        </div>
      </>
    )
  }
  if (t.includes('кто')) {
    return (
      <p>
        Я твой персональный помощник по «Бизнес-Навигатору». Отвечаю на вопросы про открытие бизнеса, гранты и обучение в {city}.
      </p>
    )
  }
  if (t.includes('квиз') || t.includes('тест') || t.includes('сертифик') || t.includes('основ бизнеса')) {
    return (
      <>
        <p>
          Пройти <span className="text-y">тест на знание основ бизнеса</span> можно во вкладке <b style={{ color: '#fff' }}>«Обучение»</b> в нижнем меню или прямо по ссылке:
        </p>
        <p>
          <a
            href="https://zverybot.ru/quiz"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--yellow)', textDecoration: 'underline', wordBreak: 'break-all' }}
          >
            https://zverybot.ru/quiz
          </a>
        </p>
        <p style={{ marginTop: '6px' }}>
          Тест состоит из 5 вопросов по налогам, грантам и открытию своего дела. При результате от 70% формируется именной верифицированный сертификат!
        </p>
        <div style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="filter is-active"
            onClick={() => {
              triggerHaptic('light')
              actions.nav('/quiz')
            }}
            style={{ fontSize: '12px', padding: '6px 14px', borderRadius: '10px' }}
          >
            Перейти к тесту →
          </button>
          <button
            type="button"
            className="filter"
            onClick={() => {
              triggerHaptic('light')
              actions.nav('/learning')
            }}
            style={{ fontSize: '12px', padding: '6px 14px', borderRadius: '10px' }}
          >
            Раздел «Обучение»
          </button>
        </div>
      </>
    )
  }
  return (
    <>
      <p>
        Хороший вопрос! Сейчас я работаю в демо-режиме, но скоро смогу ответить подробно. Попробуй спросить про гранты или налоги.
      </p>
      <div style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button
          type="button"
          className="filter is-active"
          onClick={() => {
            triggerHaptic('light')
            actions.nav('/grants')
          }}
          style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '10px' }}
        >
          Каталог мер
        </button>
        <button
          type="button"
          className="filter"
          onClick={() => {
            triggerHaptic('light')
            actions.nav('/services')
          }}
          style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '10px' }}
        >
          Калькулятор
        </button>
      </div>
    </>
  )
}

export default function Assistant() {
  const { city, setQuizOpen, showToast } = useApp()
  const loc = useLocation()
  const nav = useNavigate()
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [text, setText] = useState('')
  const [typing, setTyping] = useState(false)
  const [listening, setListening] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const idRef = useRef(0)
  const initialQueryHandled = useRef(false)
  const address = CITIES.find((c) => c.name === city)!.region.replace('Центр «Мой бизнес», ', '')

  const send = (q: string) => {
    const v = q.trim()
    if (!v || typing) return
    setMsgs((m) => [...m, { id: ++idRef.current, from: 'user', text: v, time: now() }])
    setText('')
    setTyping(true)
    window.setTimeout(() => {
      setTyping(false)
      setMsgs((m) => [
        ...m,
        {
          id: ++idRef.current,
          from: 'bot',
          text: answer(v, cityIn(city), address, {
            nav,
            openQuiz: () => setQuizOpen(true),
          }),
          time: now(),
        },
      ])
    }, 1300)
  }

  // вопрос, переданный из поиска или шторки
  useEffect(() => {
    const q = (loc.state as { q?: string } | null)?.q
    if (q && !initialQueryHandled.current) {
      initialQueryHandled.current = true
      send(q)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [msgs, typing])

  const mic = () => {
    if (listening) return
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      showToast('Голосовой ввод не поддерживается браузером')
      setText('Как получить грант для молодых предпринимателей?')
      return
    }

    try {
      const recognition = new SpeechRecognition()
      recognition.lang = 'ru-RU'
      recognition.interimResults = true
      recognition.continuous = false

      recognition.onstart = () => {
        triggerHaptic('medium')
        setListening(true)
      }

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((res: any) => res[0].transcript)
          .join('')
        setText(transcript)
      }

      recognition.onerror = () => {
        setListening(false)
        showToast('Не удалось распознать речь')
      }

      recognition.onend = () => {
        setListening(false)
        triggerHaptic('light')
      }

      recognition.start()
    } catch {
      setListening(false)
      showToast('Голосовой ввод недоступен')
    }
  }

  const empty = msgs.length === 0

  return (
    <div className={`page assistant ${empty ? 'is-empty' : 'has-msgs'}`}>
      <div className="assistant__scroll" ref={listRef}>
        <div className="a-banner">
          <div className="a-banner__inner">
            <div className="a-banner__mascot-wrap">
              <img className="a-banner__mascot" src={mascot} alt="" draggable={false} />
              <Rays className="a-banner__rays" color="#f5c56d" shade="#b98a33" />
            </div>
            <div className="a-banner__title">
              <Scribble className="a-banner__scribble" />
              <span>
                Я твой помощник по
                <br />
                “Бизнес-Навигатору”
              </span>
            </div>
          </div>
        </div>

        {empty && (
          <div className="chips">
            <button className="chip" onClick={() => send('Пройти тест на знание основ бизнеса')}>
              <u>Пройти тест</u> на знание основ бизнеса
            </button>
            {QUICK_QUESTIONS.map((q) => (
              <button key={q.hl} className="chip" onClick={() => send(quickText(q))}>
                {q.pre ? `${q.pre} ` : ''}
                <u>{q.hl}</u>
                {q.post ? (/^[?!.,]/.test(q.post) ? q.post : ` ${q.post}`) : ''}
              </button>
            ))}
          </div>
        )}

        {!empty && (
          <div className="msgs">
            {msgs.map((m) => (
              <div key={m.id} className={`msg msg--${m.from}`}>
                <div className="msg__bubble">{m.text}</div>
                <div className="msg__meta">
                  <Avatar size={30} className="msg__ava" />
                  <span className="msg__time">{m.time}</span>
                </div>
              </div>
            ))}
            {typing && (
              <div className="msg msg--bot">
                <div className="msg__bubble msg__bubble--typing">
                  <i />
                  <i />
                  <i />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <form
        className="composer"
        onSubmit={(e) => {
          e.preventDefault()
          send(text)
        }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={listening ? 'Слушаю…' : 'Как получить грант для молодых предпринимателей?'}
          enterKeyHint="send"
        />
        {text.trim() ? (
          <button type="submit" className="composer__btn composer__btn--send" aria-label="Отправить">
            <SendIcon />
          </button>
        ) : (
          <button type="button" className={`composer__btn ${listening ? 'is-listening' : ''}`} onClick={mic} aria-label="Голосовой ввод">
            <MicIcon />
          </button>
        )}
      </form>
    </div>
  )
}
