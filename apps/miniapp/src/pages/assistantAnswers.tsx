import type { ReactNode } from 'react'
import { COURSES, SERVICES } from '../data'
import { cityIn, cityToRegion, type UserRole } from '../store'
import type { City } from '../data'
import type { MeasureRecord } from '../types/api'

export const ASSISTANT_INTENTS = [
  { id: 'measures', label: 'Какие меры поддержки есть для моего бизнеса?' },
  { id: 'taxes', label: 'Как рассчитать налоги для ИП и самозанятых?' },
  { id: 'learning', label: 'Где пройти бесплатное обучение для предпринимателей?' },
  { id: 'quiz', label: 'Пройти тест на знание основ бизнеса' },
  { id: 'selection', label: 'Как работает подбор мер в приложении?' },
] as const

export type AssistantIntent = (typeof ASSISTANT_INTENTS)[number]['id']

const ROLE_TITLE: Record<UserRole, string> = {
  self_employed: 'самозанятый',
  ip: 'ИП',
  llc: 'ООО',
  intern: 'стажер',
  planning: 'планирую',
}

const SECTOR_TITLE: Record<string, string> = {
  agro: 'агро',
  services: 'услуги',
  it: 'IT',
}

export type AssistantFacts = {
  city: City
  role: UserRole
  sector: string
  measures: MeasureRecord[] | null
  measuresError: string | null
}

type Actions = {
  go: (to: string) => void
  openQuiz: () => void
  openMeasure: (id: string) => void
}

function sectorTitle(sector: string): string {
  return SECTOR_TITLE[sector] ?? sector
}

function measuresForSector(facts: AssistantFacts): MeasureRecord[] {
  if (!facts.measures || !facts.sector) return []
  const region = cityToRegion(facts.city)
  return facts.measures.filter((item) => item.region === region && item.sector === facts.sector)
}

function cardLabel(title: string): string {
  if (title.includes('%') || title.includes('₽') || /руб|ставк|CONFIRMED/i.test(title)) return 'Карточка каталога'
  return title
}

function refuse(go: (to: string) => void): ReactNode {
  return (
    <p>
      На этот вопрос у меня нет готового ответа. Попробуйте выбрать один из вопросов выше, или откройте{' '}
      <button type="button" className="link-y" onClick={() => go('/grants')}>
        каталог мер
      </button>
      {' '}для поиска конкретных программ поддержки.
    </p>
  )
}

function measuresAnswer(facts: AssistantFacts, actions: Actions): ReactNode {
  if (facts.measuresError) {
    return (
      <p>
        Каталог мер сейчас недоступен. Попробуйте обновить страницу или откройте{' '}
        <button type="button" className="link-y" onClick={() => actions.go('/grants')}>
          каталог мер
        </button>
        {' '}позже.
      </p>
    )
  }
  if (facts.measures === null) {
    return <p>Каталог загружается. Список программ поддержки появится через несколько секунд.</p>
  }
  if (!facts.sector) {
    return (
      <p>
        Чтобы увидеть подходящие меры, выберите отрасль вашего бизнеса в{' '}
        <button type="button" className="link-y" onClick={() => actions.go('/grants')}>
          каталоге
        </button>
        .
      </p>
    )
  }
  const visible = measuresForSector(facts)
  const label = sectorTitle(facts.sector)
  if (visible.length === 0) {
    return (
      <p>
        Для отрасли «{label}» в {cityIn(facts.city)} сейчас нет доступных мер в каталоге. Попробуйте выбрать другую отрасль или регион.
      </p>
    )
  }
  return (
    <>
      <p>
        Для отрасли «{label}» в {cityIn(facts.city)} доступны следующие программы поддержки:
      </p>
      <p>
        {visible.map((item, index) => (
          <span key={item.id}>
            {index > 0 ? ' · ' : null}
            <button type="button" className="link-y" onClick={() => actions.openMeasure(item.id)}>
              {cardLabel(item.title)}
            </button>
          </span>
        ))}
      </p>
      <p>⚠️ Это демонстрационные данные. Условия смотрите в карточке, приложение не подаёт заявки.</p>
    </>
  )
}

function taxesAnswer(go: (to: string) => void): ReactNode {
  const calc = SERVICES.find((item) => item.id === 'calc')
  const taxCourse = COURSES.find((item) => item.id === 'tax')
  return (
    <>
      <p>Для расчёта налогов используйте онлайн-калькуляторы или обратитесь к бухгалтеру. Приложение показывает только общую информацию.</p>
      {calc && (
        <p>
          В разделе сервисов есть «{calc.title}» — {calc.sub}. Это описание для ознакомления, калькулятор не работает в демоверсии.
        </p>
      )}
      {taxCourse && (
        <p>
          Для изучения основ есть курс «{taxCourse.title}» ({taxCourse.lessons} уроков). Это демонстрационный курс, прогресс не сохраняется.
        </p>
      )}
      <p>
        <button type="button" className="link-y" onClick={() => go('/services')}>
          Открыть сервисы
        </button>
        {' · '}
        <button type="button" className="link-y" onClick={() => go('/learning/tax')}>
          Открыть курс
        </button>
      </p>
    </>
  )
}

function learningAnswer(go: (to: string) => void): ReactNode {
  return (
    <>
      <p>В разделе «Обучение» собраны бесплатные демонстрационные курсы для предпринимателей. Запись и сохранение прогресса доступны только в полной версии.</p>
      <p>Доступные курсы:</p>
      <p>
        {COURSES.map((course, index) => (
          <span key={course.id}>
            {index > 0 ? ' · ' : null}
            <button type="button" className="link-y" onClick={() => go(`/learning/${course.id}`)}>
              {course.title}
            </button>
          </span>
        ))}
      </p>
      <p>
        <button type="button" className="link-y" onClick={() => go('/learning')}>
          Открыть все курсы
        </button>
      </p>
    </>
  )
}

function quizAnswer(go: (to: string) => void): ReactNode {
  return (
    <>
      <p>Пройти тест на знание основ бизнеса можно во вкладке «Обучение» или прямо по ссылке:</p>
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
      <p>
        <button type="button" className="link-y" onClick={() => go('/quiz')}>
          Перейти к тесту →
        </button>
      </p>
    </>
  )
}

function selectionAnswer(facts: AssistantFacts, go: (to: string) => void): ReactNode {
  const sectors = ['agro', 'services', 'it'].map(sectorTitle).join(', ')
  return (
    <>
      <p>
        Подбор работает как фильтр: приложение показывает только те меры, которые подходят вашему городу, форме бизнеса ({ROLE_TITLE[facts.role]}) и отрасли.
      </p>
      <p>
        Доступные отрасли: {sectors}. Вы выбрали: «{sectorTitle(facts.sector) || 'отрасль не выбрана'}».
      </p>
      <p>
        Если пропустить анкету, подбор не запустится и каталог будет пустым. Заполните профиль, чтобы увидеть подходящие программы.
      </p>
      <p>
        <button type="button" className="link-y" onClick={() => go('/grants')}>
          Открыть каталог мер
        </button>
      </p>
    </>
  )
}

export function answerIntent(intent: AssistantIntent, facts: AssistantFacts, actions: Actions): ReactNode {
  if (intent === 'measures') return measuresAnswer(facts, actions)
  if (intent === 'taxes') return taxesAnswer(actions.go)
  if (intent === 'learning') return learningAnswer(actions.go)
  if (intent === 'quiz') return quizAnswer(actions.go)
  return selectionAnswer(facts, actions.go)
}

export function answerFreeText(go: (to: string) => void): ReactNode {
  return refuse(go)
}
