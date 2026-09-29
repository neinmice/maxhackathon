import storyRocket from './assets/stories/story-rocket.webp'
import storyPercent from './assets/stories/story-percent.webp'
import storyGrant from './assets/stories/story-grant.webp'
import storyAgro from './assets/stories/story-agro.webp'
import mascotCoin from './assets/mascot/mascot-coin.webp'
import mascotDoor from './assets/mascot/mascot-door.webp'
import mascotShrug from './assets/mascot/mascot-shrug.webp'
import mascotThink from './assets/mascot/mascot-think.webp'
import mascotWave from './assets/mascot/mascot-wave.webp'
import mascotWrench from './assets/mascot/mascot-wrench.webp'

export type City = 'Москва' | 'Санкт-Петербург' | 'Казань'
export const CITIES: { name: City; short: string; region: string }[] = [
  { name: 'Москва', short: 'Москва', region: 'Центр «Мой бизнес», ул. Покровка, д. 23' },
  { name: 'Санкт-Петербург', short: 'СПб', region: 'Центр «Мой бизнес», Кожевенная линия, д. 1–3' },
  { name: 'Казань', short: 'Казань', region: 'Центр «Мой бизнес», ул. Татарстан, д. 27' },
]

/* ---------- stories ---------- */

export type StorySlide = {
  title: string
  text: string
  accent?: string
  bg: string
  big?: string
  mascot?: string
}
export type Story = { id: string; title: string; cover?: string; slides: StorySlide[] }

export const STORIES: Story[] = [
  {
    id: 'new',
    title: 'Новинки',
    cover: storyRocket,
    slides: [
      {
        title: 'Бизнес-Навигатор 2.0',
        text: 'Теперь ассистент понимает голос и отвечает с учётом твоего города.',
        big: 'NEW',
        bg: 'linear-gradient(160deg,#3b2a78 0%,#1d1a2e 60%,#141414 100%)',
        mascot: mascotWave,
      },
      {
        title: 'Раздел «Гранты»',
        text: 'Все программы поддержки в одном месте с фильтром по сумме и сроку.',
        big: '12',
        accent: 'новых программ',
        bg: 'linear-gradient(160deg,#5a3f16 0%,#241d14 60%,#141414 100%)',
        mascot: mascotCoin,
      },
    ],
  },
  {
    id: 'news',
    title: 'Новости',
    cover: storyPercent,
    slides: [
      {
        title: 'Налоговые каникулы продлены',
        text: 'Для новых ИП на УСН и патенте ставка 0% сохраняется до конца 2027 года.',
        big: '0%',
        bg: 'linear-gradient(160deg,#2b3f7a 0%,#161b2c 60%,#141414 100%)',
        mascot: mascotCoin,
      },
      {
        title: 'Льготный лизинг',
        text: 'Для малого бизнеса запущена программа лизинга оборудования под 6% годовых.',
        big: '6%',
        bg: 'linear-gradient(160deg,#3b2a78 0%,#1d1a2e 60%,#141414 100%)',
        mascot: mascotWrench,
      },
      {
        title: 'Набор в акселератор',
        text: 'Открыт приём заявок в весенний поток акселератора для молодых предпринимателей.',
        big: '15.10',
        accent: 'дедлайн',
        bg: 'linear-gradient(160deg,#5a3f16 0%,#241d14 60%,#141414 100%)',
        mascot: mascotThink,
      },
    ],
  },
  {
    id: 'interview',
    title: 'Интервью',
    cover: storyGrant,
    slides: [
      {
        title: 'Кофейня за 300.000',
        text: '«Я боялась начать, пока не узнала про грант. Через полгода открыла вторую точку». Алина, 23 года.',
        bg: 'linear-gradient(160deg,#4a2a6e 0%,#1f1829 60%,#141414 100%)',
        mascot: mascotDoor,
      },
      {
        title: 'Из хобби в бизнес',
        text: '«Начал с продажи керамики друзьям, сейчас у нас свой цех и 8 сотрудников». Тимур, 27 лет.',
        bg: 'linear-gradient(160deg,#2b3f7a 0%,#161b2c 60%,#141414 100%)',
        mascot: mascotShrug,
      },
    ],
  },
  {
    id: 'numbers',
    title: 'Цифры',
    cover: storyAgro,
    slides: [
      {
        title: 'Молодые предприниматели',
        text: 'получили господдержку в прошлом году.',
        big: '48 000+',
        bg: 'linear-gradient(160deg,#3b2a78 0%,#1d1a2e 60%,#141414 100%)',
        mascot: mascotWave,
      },
      {
        title: 'Средний грант',
        text: 'на старт и развитие бизнеса для предпринимателей до 25 лет.',
        big: '300.000 ₽',
        bg: 'linear-gradient(160deg,#5a3f16 0%,#241d14 60%,#141414 100%)',
        mascot: mascotCoin,
      },
    ],
  },
]

/* ---------- facts carousel ---------- */

export interface FactItem {
  id: string
  text: string
  hasQuiz?: boolean
}

export const FACTS: FactItem[] = [
  {
    id: 'f1',
    text: '{y:7 из 10} молодых предпринимателей\nначинают бизнес {p:без стартового капитала}.',
  },
  {
    id: 'quiz',
    text: 'Пройди экспресс‑тест на знание основ бизнеса\nи {y:получи сертификат} —',
    hasQuiz: true,
  },
  {
    id: 'f_gdp',
    text: 'Малый бизнес создаёт более {y:21% ВВП} России\n— это свыше {p:30 триллионов рублей} в год.',
  },
  {
    id: 'f_self',
    text: 'Более {y:11 миллионов} человек в России\nуже зарегистрировались как {p:самозанятые}.',
  },
  {
    id: 'f_tax',
    text: 'Ставки {y:4% и 6%} для самозанятых в РФ\n— одни из самых {p:выгодных налогов} в мире.',
  },
  {
    id: 'f_holidays',
    text: 'Налоговые каникулы: ставка {y:0% на 2 года}\nдля впервые открывших {p:ИП на УСН и ПСН}.',
  },
  {
    id: 'f_grant',
    text: 'До {y:500.000 ₽} безвозвратного гранта\nдоступно молодым основателям {p:до 25 лет}.',
  },
  {
    id: 'f_youth',
    text: 'Свыше {y:40% новых ИП} в России сегодня\nоткрывают молодые люди {p:до 35 лет}.',
  },
  {
    id: 'f_work',
    text: 'В секторе малого бизнеса сейчас занято\nболее {y:31 миллиона} {p:граждан России}.',
  },
  {
    id: 'f_reg',
    text: '{y:Регистрация ИП онлайн} через Госуслуги\nзанимает всего от {p:10 минут до 3 дней}.',
  },
]

/* ---------- home sections ---------- */

export type Card = { id: string; title: string; subtitle: string; body: string[]; tag?: string }
export type Section = {
  id: string
  pre?: string
  hl: string
  post?: string
  hlColor: 'yellow' | 'purple'
  deco?: 'start' | 'none'
  cards: Card[]
}

export const SECTIONS: Section[] = [
  {
    id: 'start',
    pre: 'Начни',
    hl: 'свое',
    post: 'дело',
    hlColor: 'yellow',
    deco: 'start',
    cards: [
      {
        id: 'where-to-start',
        title: 'С чего\nначать?',
        subtitle: 'Чек-лист ИП',
        tag: 'старт',
        body: [
          'Определи идею и проверь спрос: поговори с 10 потенциальными клиентами.',
          'Посчитай стартовые затраты и точку безубыточности.',
          'Выбери форму: самозанятость, ИП или ООО.',
          'Зарегистрируйся онлайн через Госуслуги или в центре «Мой бизнес».',
          'Подай заявку на грант или льготный кредит.',
        ],
      },
      {
        id: 'idea',
        title: 'Грант',
        subtitle: 'Без возврата',
        tag: 'финансы',
        body: ['Опиши клиента и его боль.', 'Найди 3 конкурента и их слабые места.', 'Сделай MVP за неделю и получи первые продажи.'],
      },
      {
        id: 'guide',
        title: 'Инструкция',
        subtitle: 'Пошаговый гайд',
        tag: 'гайд',
        body: [
          'Подготовь паспорт, ИНН и СНИЛС.',
          'Выбери коды ОКВЭД под свою деятельность.',
          'Выбери систему налогообложения: УСН 6% или НПД.',
          'Подай заявление Р21001 онлайн и получи лист записи ЕГРИП.',
        ],
      },
      {
        id: 'forms',
        title: 'ИП или ООО',
        subtitle: 'Сравнение форм',
        tag: 'выбор',
        body: [
          'ИП проще открыть и вести, отвечает всем имуществом.',
          'ООО отвечает только уставным капиталом, но сложнее в отчётности.',
          'Самозанятость подходит для старта с доходом до 2,4 млн ₽ в год.',
        ],
      },
    ],
  },
  {
    id: 'free',
    hl: 'Бесплатные',
    post: 'программы',
    hlColor: 'yellow',
    cards: [
      {
        id: 'events-city',
        title: 'Встречи в {city}',
        subtitle: 'Офлайн-воркшопы',
        tag: 'офлайн',
        body: ['Питч-сессии с инвесторами каждую пятницу.', 'Воркшопы по маркетингу и финансам.', 'Нетворкинг для молодых предпринимателей.'],
      },
      {
        id: 'events-online',
        title: 'Онлайн-эфиры',
        subtitle: 'Вебинары с экспертами',
        tag: 'онлайн',
        body: ['Еженедельные вебинары с экспертами.', 'Разборы бизнес-планов в прямом эфире.', 'Записи доступны в разделе «Обучение».'],
      },
      {
        id: 'accelerator',
        title: 'Акселератор',
        subtitle: '8 недель с ментором',
        tag: 'набор',
        body: ['Наставник из реального бизнеса.', 'Демо-день с инвесторами.', 'Лучшие проекты получают гранты.'],
      },
      {
        id: 'mentoring',
        title: 'Менторство',
        subtitle: 'Личный наставник',
        tag: 'старт',
        body: ['Подберём наставника по твоей сфере.', 'Встречи раз в две недели.', 'Помощь с финмоделью и стратегией.'],
      },
    ],
  },
  {
    id: 'finance',
    pre: 'Финансовая',
    hl: 'поддержка',
    hlColor: 'purple',
    cards: [
      {
        id: 'grant-300',
        title: '300.000 ₽',
        subtitle: 'Грант на бизнес',
        tag: 'до 25 лет',
        body: [
          'Не иметь долгов перед государством.',
          'Пройти обучение в центре «Мой бизнес».',
          'Защитить бизнес-проект перед комиссией.',
          'Вложить минимум 30% от начальных затрат.',
        ],
      },
      {
        id: 'credit',
        title: '0% ставка',
        subtitle: 'Без залога до 3 лет',
        tag: 'льгота',
        body: ['Сумма до 1 млн ₽ на срок до 3 лет.', 'Без залога для сумм до 500.000 ₽.', 'Решение за 5 рабочих дней.'],
      },
      {
        id: 'subsidy',
        title: 'Субсидия 50%',
        subtitle: 'На аренду офиса',
        tag: 'аренда',
        body: ['Компенсация до 50% стоимости аренды.', 'Для резидентов бизнес-инкубаторов.', 'Выплаты ежеквартально.'],
      },
      {
        id: 'leasing',
        title: 'Льготный лизинг',
        subtitle: 'Оборудование под 6%',
        tag: '6%',
        body: ['Аванс от 10%.', 'Срок до 5 лет.', 'Российское оборудование.'],
      },
    ],
  },
]

export const allCards = () => SECTIONS.flatMap((s) => s.cards.map((c) => ({ ...c, section: s })))

/* ---------- assistant ---------- */

export const QUICK_QUESTIONS: { pre?: string; hl: string; post?: string; hlFirst?: boolean }[] = [
  { hl: 'Гайд по', post: 'налогам 2027', hlFirst: true },
  { pre: 'Ты кто', hl: 'такой', post: '?' },
  { pre: 'Что ты', hl: 'умеешь', post: '?' },
  { hl: 'Где пройти', post: 'обучение?', hlFirst: true },
  { hl: 'Как получить', post: '300.000 руб. на бизнес?', hlFirst: true },
]

export const quickText = (q: (typeof QUICK_QUESTIONS)[number]) =>
  [q.pre, q.hl, q.post].filter(Boolean).join(' ').replace(/\s+\?/g, '?')

/* ---------- services ---------- */

export const SERVICES = [
  { id: 'register', icon: 'register', title: 'Регистрация бизнеса', sub: 'ИП, ООО, самозанятость', badge: 'онлайн' },
  { id: 'calc', icon: 'calc', title: 'Калькулятор налогов', sub: 'УСН, НПД, патент' },
  { id: 'docs', icon: 'docs', title: 'Шаблоны документов', sub: 'Договоры и акты' },
  { id: 'internship', icon: 'internship', title: 'Витрина стажировок', sub: 'Практика и кадры', badge: 'скоро' },
  { id: 'law', icon: 'law', title: 'Юридическая помощь', sub: 'Консультация юриста', badge: 'скоро' },
  { id: 'account', icon: 'account', title: 'Бухгалтерия', sub: 'Отчётность и учёт', badge: 'скоро' },
  { id: 'place', icon: 'place', title: 'Помещение', sub: 'Инкубаторы и коворкинги', badge: 'скоро' },
  { id: 'marketing', icon: 'marketing', title: 'Маркетинг', sub: 'Продвижение и соцсети', badge: 'скоро' },
  { id: 'mentor', icon: 'mentor', title: 'Наставник', sub: 'Ментор из бизнеса', badge: 'скоро' },
  { id: 'export', icon: 'export', title: 'Экспорт', sub: 'Выход на новые рынки', badge: 'скоро' },
  { id: 'lease', icon: 'lease', title: 'Лизинг', sub: 'Оборудование под 6%', badge: 'скоро' },
  { id: 'patent', icon: 'patent', title: 'Товарный знак', sub: 'Регистрация бренда', badge: 'скоро' },
  { id: 'support', icon: 'support', title: 'Поддержка', sub: 'Ответим за 5 минут', badge: 'скоро' },
]

/* ---------- grants ---------- */

export type Grant = {
  id: string
  amount: string
  title: string
  org: string
  deadline: string
  tags: string[]
  filled: number
  hot?: boolean
  req: string[]
}

export const GRANT_FILTERS = ['Все', 'Гранты', 'Займы', 'Субсидии', 'Лизинг']

export const GRANTS: (Grant & { kind: string })[] = [
  {
    id: 'g1',
    kind: 'Гранты',
    amount: '300.000 ₽',
    title: 'Грант молодому предпринимателю',
    org: 'Центр «Мой бизнес»',
    deadline: 'до 15 октября',
    tags: ['до 25 лет', 'на развитие'],
    filled: 72,
    hot: true,
    req: ['Возраст от 14 до 25 лет', 'Нет долгов перед государством', 'Обучение «Азы бизнеса»', 'Софинансирование от 30%'],
  },
  {
    id: 'g2',
    kind: 'Займы',
    amount: '1.000.000 ₽',
    title: 'Микрозаём под 0%',
    org: 'Фонд поддержки МСП',
    deadline: 'бессрочно',
    tags: ['без залога', 'до 3 лет'],
    filled: 35,
    req: ['ИП или ООО старше 3 месяцев', 'Бизнес-план', 'Поручительство для сумм выше 500.000 ₽'],
  },
  {
    id: 'g3',
    kind: 'Гранты',
    amount: '500.000 ₽',
    title: 'Социальное предприятие',
    org: 'Минэкономразвития',
    deadline: 'до 1 ноября',
    tags: ['соцпроект'],
    filled: 54,
    req: ['Статус социального предприятия', 'Обучение в центре «Мой бизнес»', 'Софинансирование от 15%'],
  },
  {
    id: 'g4',
    kind: 'Субсидии',
    amount: '50%',
    title: 'Компенсация аренды',
    org: 'Бизнес-инкубатор',
    deadline: 'ежеквартально',
    tags: ['аренда', 'резидентам'],
    filled: 20,
    req: ['Резидентство в бизнес-инкубаторе', 'Договор аренды', 'Отчёт за квартал'],
  },
  {
    id: 'g5',
    kind: 'Лизинг',
    amount: '6%',
    title: 'Льготный лизинг оборудования',
    org: 'Региональная лизинговая компания',
    deadline: 'до 31 декабря',
    tags: ['аванс от 10%'],
    filled: 41,
    req: ['ИП или ООО', 'Российское оборудование', 'Аванс от 10%'],
  },
]

/* ---------- learning ---------- */

export type LessonItem = {
  t: string
  d: string
  done?: boolean
}

export type Course = {
  id: string
  title: string
  lessons: number
  done: number
  duration: string
  level: string
  color: 'purple' | 'yellow' | 'blue'
  locked?: boolean
  items: LessonItem[]
}

export const COURSES: Course[] = [
  {
    id: 'basics',
    title: 'Азы бизнеса',
    lessons: 7,
    done: 3,
    duration: '3 ч',
    level: 'Старт',
    color: 'purple',
    items: [
      { t: 'Что такое бизнес-модель', d: '12 мин', done: true },
      { t: 'Ищем идею и проверяем спрос', d: '18 мин', done: true },
      { t: 'Юнит-экономика простыми словами', d: '22 мин', done: true },
      { t: 'Форма бизнеса: ИП, ООО, НПД', d: '15 мин', done: false },
      { t: 'Регистрация онлайн без пошлины', d: '10 мин', done: false },
      { t: 'Первые клиенты и продажи', d: '20 мин', done: false },
      { t: 'Финансовый план на год', d: '25 мин', done: false },
    ],
  },
  {
    id: 'finance',
    title: 'Финансы для начинающих',
    lessons: 6,
    done: 0,
    duration: '2.5 ч',
    level: 'Старт',
    color: 'yellow',
    items: [
      { t: 'Доходы, расходы и чистая прибыль', d: '15 мин', done: false },
      { t: 'Точка безубыточности бизнеса', d: '20 мин', done: false },
      { t: 'Управление движением денег (ДДС)', d: '25 мин', done: false },
      { t: 'Кассовые разрывы и как их избежать', d: '18 мин', done: false },
      { t: 'Ценообразование и маржинальность', d: '20 мин', done: false },
      { t: 'Налоговое планирование для старта', d: '22 мин', done: false },
    ],
  },
  {
    id: 'marketing',
    title: 'Маркетинг без бюджета',
    lessons: 6,
    done: 0,
    duration: '2.5 ч',
    level: 'Средний',
    color: 'blue',
    items: [
      { t: 'Определение целевой аудитории и болей', d: '20 мин', done: false },
      { t: 'Создание ценностного предложения', d: '25 мин', done: false },
      { t: 'Партизанский маркетинг и нетворкинг', d: '18 мин', done: false },
      { t: 'Продвижение контентом в соцсетях', d: '22 мин', done: false },
      { t: 'Партнёрские интеграции и кросс-промо', d: '15 мин', done: false },
      { t: 'Сбор отзывов и повторные продажи', d: '20 мин', done: false },
    ],
  },
  {
    id: 'pitch',
    title: 'Как защитить проект',
    lessons: 5,
    done: 0,
    duration: '2 ч',
    level: 'Средний',
    color: 'purple',
    locked: true,
    items: [
      { t: 'Структура питча на 3 минуты', d: '15 мин', done: false },
      { t: 'Финансовая модель для экспертов', d: '25 мин', done: false },
      { t: 'Частые ошибки на защите гранта', d: '20 мин', done: false },
      { t: 'Ответы на сложные вопросы комиссии', d: '18 мин', done: false },
      { t: 'Чек-лист финальной презентации', d: '12 мин', done: false },
    ],
  },
  {
    id: 'tax',
    title: 'Налоги 2027',
    lessons: 5,
    done: 0,
    duration: '2 ч',
    level: 'Старт',
    color: 'yellow',
    items: [
      { t: 'Налоговая реформа 2026/2027: главное', d: '20 мин', done: false },
      { t: 'Сравнение режимов УСН и патента', d: '25 мин', done: false },
      { t: 'Автоматизированная УСН (АУСН)', d: '18 мин', done: false },
      { t: 'Страховые взносы и льготы МСП', d: '15 мин', done: false },
      { t: 'Календарь отчётности без штрафов', d: '22 мин', done: false },
    ],
  },
]

export const LESSONS = COURSES[0].items

