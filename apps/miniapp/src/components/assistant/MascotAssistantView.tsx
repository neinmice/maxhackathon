import React, { useState } from 'react';
import { Bot, Sparkles, Send, Award, HelpCircle, ArrowRight, CheckCircle2, RotateCcw } from 'lucide-react';
import { triggerHaptic } from '../../lib/maxBridge';
import { saveCertificate, loadCertificates, type StoredCertificate } from '../../lib/storage';

interface MascotAssistantViewProps {
  userName: string;
  onOpenMeasure: (id: string) => void;
  onOpenCatalog: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'mascot' | 'user';
  text: string;
  chips?: { label: string; action: string }[];
  targetMeasureId?: string;
  timestamp: string;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'm1',
    sender: 'mascot',
    text: 'Привет! Я виртуальный Кот-Навигатор ZVERY. Помогу разобраться в мерах господдержки, налогах и получении субсидий в Казани, Москве и Санкт-Петербурге.',
    timestamp: '12:00',
    chips: [
      { label: 'Как получить 500 000 ₽ на бизнес?', action: 'ask_grant' },
      { label: 'С чего начать свое дело?', action: 'ask_start' },
      { label: 'Лайфхаки по налогам 2026', action: 'ask_tax' },
      { label: 'Пройти квиз на сертификат', action: 'start_quiz' },
    ],
  },
];

const QUIZ_QUESTIONS = [
  {
    q: 'До какого возраста можно получить грант молодому предпринимателю (до 500 000 ₽)?',
    options: ['До 21 года', 'До 25 лет включительно', 'До 35 лет'],
    correct: 1,
    explanation: 'По правилам Минэкономразвития, гранты предоставляются гражданам РФ от 14 до 25 лет включительно.',
  },
  {
    q: 'Какая ставка налога действует для самозанятых при получении оплаты от физических лиц?',
    options: ['4%', '6%', '13%'],
    correct: 0,
    explanation: 'Налог на профессиональный доход (НПД) составляет 4% при расчетах с физлицами и 6% — с юрлицами.',
  },
  {
    q: 'Нужно ли самозанятым сдавать налоговые декларации?',
    options: ['Да, раз в год', 'Нет, учет ведется автоматически в приложении', 'Да, ежеквартально'],
    correct: 1,
    explanation: 'Самозанятые освобождены от сдачи деклараций — все чеки и налог формируются автоматически в «Мой налог».',
  },
];

export const MascotAssistantView: React.FC<MascotAssistantViewProps> = ({
  userName,
  onOpenMeasure,
  onOpenCatalog,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inQuiz, setInQuiz] = useState(false);
  const [quizStep, setQuizStep] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [certificate, setCertificate] = useState<StoredCertificate | null>(() => {
    const certs = loadCertificates();
    return certs.length > 0 ? certs[0] : null;
  });

  const appendUserMessage = (text: string) => {
    const newMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, newMsg]);
  };

  const appendMascotMessage = (text: string, chips?: { label: string; action: string }[], targetMeasureId?: string) => {
    const newMsg: ChatMessage = {
      id: `m_${Date.now()}`,
      sender: 'mascot',
      text,
      chips,
      targetMeasureId,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, newMsg]);
  };

  const handleChipClick = (action: string, label: string) => {
    triggerHaptic('light');
    appendUserMessage(label);

    setTimeout(() => {
      if (action === 'ask_grant') {
        appendMascotMessage(
          'Для получения гранта до 500 000 ₽ необходимо:\n— Быть в возрасте от 14 до 25 лет включительно\n— Не иметь задолженностей по налогам свыше 3000 ₽\n— Пройти бесплатное обучение в центре «Мой бизнес» (курс «Азбука предпринимателя»)\n— Обеспечить софинансирование от 25% расходов проекта.',
          [
            { label: 'Открыть карточку гранта', action: 'open_demo_grant' },
            { label: 'Пройти экспресс-квиз', action: 'start_quiz' },
          ],
          'demo-kazan-support-001',
        );
      } else if (action === 'open_demo_grant') {
        onOpenMeasure('demo-kazan-support-001');
      } else if (action === 'ask_start') {
        appendMascotMessage(
          'Пошаговый старт без лишних затрат:\n1. Определите формат: если работаете один — выбирайте Самозанятость (НПД) без страховых взносов.\n2. Если планируете нанимать людей или продавать товары оптом — регистрируйте ИП на УСН «Доходы» 6%.\n3. Подайте заявку на бесплатное рабочее место в ИТ-парке или инкубаторе.',
          [
            { label: 'Посмотреть каталог мер', action: 'go_catalog' },
            { label: 'Сдать тест на знание мер', action: 'start_quiz' },
          ],
        );
      } else if (action === 'go_catalog') {
        onOpenCatalog();
      } else if (action === 'ask_tax') {
        appendMascotMessage(
          'Лайфхак 2026: совмещение самозанятости и грантов. Молодой предприниматель может зарегистрироваться как ИП на НПД — тогда он имеет право на получение гранта до 500 000 ₽ и при этом не платит обязательные фиксированные страховые взносы (экономия около 50 000 ₽ в год)!',
          [
            { label: 'Пройти квиз на сертификат', action: 'start_quiz' },
            { label: 'В каталог мер', action: 'go_catalog' },
          ],
        );
      } else if (action === 'start_quiz') {
        setInQuiz(true);
        setQuizStep(0);
        setQuizScore(0);
        setQuizFinished(false);
      }
    }, 300);
  };

  const handleQuizAnswer = (optionIdx: number) => {
    triggerHaptic('medium');
    const isCorrect = optionIdx === QUIZ_QUESTIONS[quizStep].correct;
    const nextScore = isCorrect ? quizScore + 1 : quizScore;
    setQuizScore(nextScore);

    if (quizStep < QUIZ_QUESTIONS.length - 1) {
      setQuizStep((s) => s + 1);
    } else {
      // Quiz Finished!
      setQuizFinished(true);
      const newCert: StoredCertificate = {
        id: `ZVERY-NAV-${Math.floor(100000 + Math.random() * 900000)}`,
        userName: userName || 'Предприниматель MAX',
        date: new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' }),
        score: `${nextScore} из ${QUIZ_QUESTIONS.length}`,
        title: 'Успешное прохождение квиза «Навигатор господдержки МСП»',
      };
      saveCertificate(newCert);
      setCertificate(newCert);
    }
  };

  return (
    <div style={{ padding: '16px 16px 90px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Mascot Card Banner */}
      <div className="liquid-card" style={{
        padding: '20px 18px',
        background: 'linear-gradient(135deg, rgba(73, 31, 155, 0.5) 0%, rgba(26, 13, 54, 0.9) 100%)',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}>
        <div style={{
          width: 58,
          height: 58,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #7045c6, #ffd21e)',
          padding: 2.5,
          flexShrink: 0,
          boxShadow: '0 0 20px rgba(255, 210, 30, 0.4)',
        }}>
          <div style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            background: '#120d1d',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffd21e',
          }}>
            <Bot size={30} />
          </div>
        </div>

        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#fff', lineHeight: 1.25, marginBottom: 4 }}>
            Я твой помощник по «Бизнес-Навигатору»
          </h2>
          <p style={{ fontSize: 12, color: '#e2dcf3' }}>
            Детерминированная база знаний и квиз с выдачей памятного сертификата
          </p>
        </div>
      </div>

      {/* QUIZ MODE */}
      {inQuiz ? (
        <div className="liquid-card" style={{ padding: 20 }}>
          {!quizFinished ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span className="badge badge-yellow">
                  Вопрос {quizStep + 1} из {QUIZ_QUESTIONS.length}
                </span>
                <button
                  type="button"
                  onClick={() => setInQuiz(false)}
                  style={{ fontSize: 12, color: '#a295c5' }}
                >
                  Выйти из квиза
                </button>
              </div>

              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 16, lineHeight: 1.4 }}>
                {QUIZ_QUESTIONS[quizStep].q}
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {QUIZ_QUESTIONS[quizStep].options.map((opt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleQuizAnswer(idx)}
                    className="liquid-card liquid-card-interactive"
                    style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      justifyContent: 'flex-start',
                      fontSize: 14,
                      color: '#fff',
                      background: 'rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    <span>{opt}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Quiz Completed -> Certificate view */
            <div>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  background: 'rgba(255, 210, 30, 0.2)',
                  color: '#ffd21e',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 10,
                }}>
                  <Award size={28} />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 4 }}>
                  Тест успешно пройден!
                </h3>
                <p style={{ fontSize: 13, color: '#a295c5' }}>
                  Ваш результат: {quizScore} из {QUIZ_QUESTIONS.length} правильных ответов
                </p>
              </div>

              {/* MEMORABLE CERTIFICATE ACCORDING TO SPECS */}
              {certificate && (
                <div style={{
                  border: '2px solid rgba(255, 210, 30, 0.5)',
                  borderRadius: 16,
                  padding: '20px 16px',
                  background: 'linear-gradient(135deg, rgba(44, 27, 77, 0.8) 0%, rgba(18, 13, 29, 0.95) 100%)',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
                  marginBottom: 16,
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  {/* Decorative emblem */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#ffd21e', letterSpacing: '0.1em' }}>
                      MAX MINI APP · ZVERY
                    </span>
                    <span style={{ fontSize: 10, color: '#a295c5' }}>
                      № {certificate.id}
                    </span>
                  </div>

                  <h4 style={{
                    fontSize: 15,
                    fontWeight: 800,
                    color: '#fff',
                    textAlign: 'center',
                    marginBottom: 12,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    lineHeight: 1.3,
                  }}>
                    ПАМЯТНЫЙ СЕРТИФИКАТ ЗА ПРОХОЖДЕНИЕ КВИЗА*
                  </h4>

                  <p style={{ fontSize: 12, color: '#e2dcf3', textAlign: 'center', marginBottom: 4 }}>
                    Настоящим подтверждается, что пользователь
                  </p>
                  <p style={{ fontSize: 16, fontWeight: 800, color: '#ffd21e', textAlign: 'center', marginBottom: 12 }}>
                    {certificate.userName}
                  </p>

                  <p style={{ fontSize: 12, color: '#a295c5', textAlign: 'center', marginBottom: 16 }}>
                    успешно прошёл тестирование на знание мер государственной поддержки МСП и налоговых режимов РФ.
                  </p>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 11,
                    color: '#e2dcf3',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                    paddingTop: 10,
                  }}>
                    <span>Дата выдачи: {certificate.date}</span>
                    <span>Результат: {certificate.score}</span>
                  </div>

                  {/* Mandatory 7-8pt legal disclaimer footnote */}
                  <p style={{
                    fontSize: 9,
                    color: '#8b80a6',
                    marginTop: 14,
                    lineHeight: 1.35,
                    borderTop: '1px dashed rgba(255, 255, 255, 0.1)',
                    paddingTop: 8,
                  }}>
                    *Сертификат носит исключительно информационно-поощрительный характер за прохождение игрового теста в Mini App и не является документом государственного образца об образовании или квалификации.
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={() => setInQuiz(false)}
                className="btn-primary"
                style={{ width: '100%', padding: 12 }}
              >
                <span>Вернуться в диалог</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        /* CHAT MODE */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                style={{
                  maxWidth: '88%',
                  padding: '12px 16px',
                  borderRadius: 18,
                  borderBottomLeftRadius: msg.sender === 'mascot' ? 4 : 18,
                  borderBottomRightRadius: msg.sender === 'user' ? 4 : 18,
                  background: msg.sender === 'user'
                    ? 'linear-gradient(135deg, #7045c6, #5b2bb8)'
                    : 'rgba(36, 23, 62, 0.9)',
                  border: msg.sender === 'mascot' ? '1px solid rgba(255, 255, 255, 0.12)' : 'none',
                  color: '#fff',
                  fontSize: 14,
                  lineHeight: 1.45,
                  whiteSpace: 'pre-line',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.3)',
                }}
              >
                {msg.text}
              </div>
              <span style={{ fontSize: 10, color: '#a295c5', marginTop: 4, marginInline: 6 }}>
                {msg.timestamp}
              </span>

              {/* Chips suggestions */}
              {msg.chips && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10, maxWidth: '100%' }}>
                  {msg.chips.map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleChipClick(chip.action, chip.label)}
                      className="badge badge-yellow"
                      style={{
                        padding: '8px 12px',
                        fontSize: 12,
                        textTransform: 'none',
                        cursor: 'pointer',
                        borderRadius: 14,
                      }}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
