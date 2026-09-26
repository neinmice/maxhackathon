import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import mascot from '../assets/mascot-door.png'
import { Avatar } from '../components/Header'
import { MicIcon, Rays, Scribble, SendIcon } from '../components/icons'
import { CITIES, QUICK_QUESTIONS, quickText } from '../data'
import { cityIn, useApp } from '../store'

type Msg = { id: number; from: 'user' | 'bot'; text: ReactNode; time: string }

const now = () => new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })

function answer(q: string, city: string, address: string): ReactNode {
  const t = q.toLowerCase()
  if (t.includes('грант') || t.includes('300')) {
    return (
      <>
        <p>
          Привет, для получения гранта на 300.000 руб. <a className="link-y">необходимо:</a>
        </p>
        <p>
          — Не иметь долгов перед государством
          <br />— Пройти обучение в центре “Мой бизнес” (Который в {city} находится по адресу {address})
          <br />— Защитить бизнес-проект
          <br />— Внести минимум 30% от начальных затрат в проект
        </p>
        <p>
          Кстати, записаться на интенсив ты можешь в разделе <span className="text-y">“обучение” → “Азы бизнеса”</span>
        </p>
      </>
    )
  }
  if (t.includes('налог')) {
    return (
      <>
        <p>
          Коротко о <a className="link-y">налогах 2027</a> для начинающих:
        </p>
        <p>
          — Самозанятость (НПД): 4% с физлиц, 6% с юрлиц
          <br />— УСН «Доходы»: 6%, для новых ИП возможны налоговые каникулы 0%
          <br />— Патент: фиксированная сумма, зависит от вида деятельности
        </p>
        <p>
          Посчитать точную сумму можно в <span className="text-y">“сервисы” → “Калькулятор налогов”</span>
        </p>
      </>
    )
  }
  if (t.includes('обучен')) {
    return (
      <>
        <p>Бесплатное обучение можно пройти:</p>
        <p>
          — Онлайн в разделе <span className="text-y">“обучение”</span>
          <br />— Офлайн в центре “Мой бизнес” ({address})
          <br />— В акселераторе для молодых предпринимателей
        </p>
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
      </>
    )
  }
  if (t.includes('кто')) {
    return (
      <p>
        Я Навик, твой помощник по «Бизнес-Навигатору» 🙂 Отвечаю на вопросы про открытие бизнеса, гранты и обучение в {city}.
      </p>
    )
  }
  if (t.includes('квиз') || t.includes('тест') || t.includes('сертифик')) {
    return (
      <>
        <p>
          В ZVERY доступен <a className="link-y">Квиз готовности бизнес-проекта</a>!
        </p>
        <p>
          Ответь на 5 вопросов по налогам, грантам и открытию своего дела. При результате от 70% формируется именной верифицированный сертификат.
        </p>
      </>
    )
  }
  return (
    <p>
      Хороший вопрос! Сейчас я работаю в демо-режиме, но скоро смогу ответить подробно. Попробуй спросить про <a className="link-y">гранты</a> или{' '}
      <a className="link-y">налоги</a>.
    </p>
  )
}

export default function Assistant() {
  const { city, setQuizOpen } = useApp()
  const loc = useLocation()
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [text, setText] = useState('')
  const [typing, setTyping] = useState(false)
  const [listening, setListening] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const idRef = useRef(0)
  const address = CITIES.find((c) => c.name === city)!.region.replace('Центр «Мой бизнес», ', '')

  const send = (q: string) => {
    const v = q.trim()
    if (!v || typing) return
    setMsgs((m) => [...m, { id: ++idRef.current, from: 'user', text: v, time: now() }])
    setText('')
    setTyping(true)
    window.setTimeout(() => {
      setTyping(false)
      setMsgs((m) => [...m, { id: ++idRef.current, from: 'bot', text: answer(v, cityIn(city), address), time: now() }])
    }, 1300)
  }

  // вопрос, переданный из поиска
  useEffect(() => {
    const q = (loc.state as { q?: string } | null)?.q
    if (q) send(q)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [msgs, typing])

  const mic = () => {
    if (listening) return
    setListening(true)
    window.setTimeout(() => {
      setListening(false)
      setText('Как получить грант для молодых предпринимателей?')
    }, 1800)
  }

  const empty = msgs.length === 0

  return (
    <div className={`page assistant ${empty ? 'is-empty' : 'has-msgs'}`}>
      <div className="assistant__scroll" ref={listRef}>
        <div className="a-banner">
          <img className="a-banner__mascot" src={mascot} alt="" draggable={false} />
          <Rays className="a-banner__rays" color="#f5c56d" shade="#b98a33" />
          <div className="a-banner__title">
            <Scribble className="a-banner__scribble" />
            <span>
              Я твой помощник по
              <br />
              “Бизнес-Навигатору”
            </span>
          </div>
        </div>

        {empty && (
          <div className="chips">
            <button className="chip" onClick={() => setQuizOpen(true)}>
              <u>Пройти квиз</u> для бизнеса
            </button>
            {QUICK_QUESTIONS.map((q) => (
              <button key={q.hl} className="chip" onClick={() => send(quickText(q))}>
                {q.pre && <>{q.pre} </>}
                <u>{q.hl}</u>
                {q.post && <> {q.post}</>}
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
