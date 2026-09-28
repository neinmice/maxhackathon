import React, { useState } from 'react';
import { Award, BookOpen, CheckCircle2, CheckSquare, ExternalLink, ShieldAlert, Sparkles, Square } from 'lucide-react';
import { triggerHaptic } from '../../lib/maxBridge';
import type { MeasureRecord } from '../../types/api';

interface EducationViewProps {
  userName: string;
  savedMeasures: MeasureRecord[];
  progress: Record<string, Record<string, boolean>>;
  onToggleItem: (measureId: string, itemKey: string) => void;
  onOpenMeasure: (id: string) => void;
}

const COURSES = [
  {
    id: 'c1',
    title: 'Курс «Азбука предпринимателя»',
    operator: 'Центр «Мой бизнес»',
    desc: 'Обязательный бесплатный курс для получения молодежного гранта 500.000 ₽.',
    format: 'Очно в Казани + онлайн',
    badge: 'БЕСПЛАТНО',
  },
  {
    id: 'c2',
    title: 'Акселератор ИТ-парка им. Рамеева',
    operator: 'ГАУ «ИТ-парк»',
    desc: 'Программа упаковки проектов и подготовка к гранту «Студенческий стартап» 1 000 000 ₽.',
    format: '3 месяца интенсив',
    badge: 'АКСЕЛЕРАТОР',
  },
  {
    id: 'c3',
    title: 'Налоги для самозанятых без штрафов',
    operator: 'ФНС России / ZVERY',
    desc: 'Как работать с юрлицами, формировать чеки и экономить на страховых взносах.',
    format: 'Экспресс-гайд',
    badge: 'ГАЙД',
  },
];

const QUIZ_QUESTIONS = [
  {
    q: 'До какого возраста можно получить грант молодому предпринимателю (до 500 000 ₽)?',
    options: ['До 21 года', 'До 25 лет включительно', 'До 35 лет'],
    correct: 1,
  },
  {
    q: 'Какая ставка налога действует для самозанятых при получении оплаты от физических лиц?',
    options: ['4%', '6%', '13%'],
    correct: 0,
  },
  {
    q: 'Нужно ли самозанятым сдавать налоговые декларации?',
    options: ['Да, раз в год', 'Нет, учет ведется автоматически в приложении', 'Да, ежеквартально'],
    correct: 1,
  },
];

export const EducationView: React.FC<EducationViewProps> = ({
  userName,
  savedMeasures,
  progress,
  onToggleItem,
  onOpenMeasure,
}) => {
  const [activeTab, setActiveTab] = useState<'courses' | 'quiz' | 'checklist'>('courses');
  const [quizStep, setQuizStep] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [certificate, setCertificate] = useState<{ id: string } | null>(null);

  const handleQuizAnswer = (idx: number) => {
    triggerHaptic('medium');
    const isCorrect = idx === QUIZ_QUESTIONS[quizStep].correct;
    const nextScore = isCorrect ? quizScore + 1 : quizScore;
    setQuizScore(nextScore);

    if (quizStep < QUIZ_QUESTIONS.length - 1) {
      setQuizStep((s) => s + 1);
    } else {
      setQuizFinished(true);
    }
  };

  return (
    <div style={{ padding: '14px 16px 90px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Subtabs Header */}
      <div style={{
        display: 'flex',
        borderRadius: 16,
        background: 'rgba(26, 17, 44, 0.85)',
        padding: 4,
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}>
        {[
          { id: 'courses' as const, label: 'Программы' },
          { id: 'quiz' as const, label: 'Квиз и сертификат' },
          { id: 'checklist' as const, label: 'Мой чеклист' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setActiveTab(t.id);
            }}
            style={{
              flex: 1,
              padding: '8px 10px',
              borderRadius: 12,
              fontSize: 12,
              fontWeight: activeTab === t.id ? 800 : 600,
              background: activeTab === t.id ? 'linear-gradient(135deg, #7045C6, #5B2BB8)' : 'transparent',
              color: activeTab === t.id ? '#FFFFFF' : '#A295C5',
              boxShadow: activeTab === t.id ? '0 2px 10px rgba(112, 69, 198, 0.4)' : 'none',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 1. COURSES TAB */}
      {activeTab === 'courses' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {COURSES.map((course) => (
            <div
              key={course.id}
              className="liquid-card"
              style={{ padding: 18 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <span className="badge badge-yellow">
                  {course.badge}
                </span>
                <span style={{ fontSize: 11, color: '#A295C5' }}>
                  {course.format}
                </span>
              </div>

              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF', marginBottom: 4 }}>
                {course.title}
              </h3>

              <p style={{ fontSize: 12, color: '#FFD21E', fontWeight: 600, marginBottom: 8 }}>
                {course.operator}
              </p>

              <p style={{ fontSize: 13, color: '#E2DCF3', lineHeight: 1.45, marginBottom: 14 }}>
                {course.desc}
              </p>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('medium');
                  alert('Запись на бесплатный интенсив открыта! Мы уведомим вас через чат-бота MAX.');
                }}
                className="btn-primary"
                style={{ width: '100%', padding: '10px 14px', fontSize: 13 }}
              >
                <span>Записаться бесплатно</span>
                <ExternalLink size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 2. QUIZ TAB */}
      {activeTab === 'quiz' && (
        <div className="liquid-card" style={{ padding: 20 }}>
          {!quizFinished ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span className="badge badge-yellow">
                  Вопрос {quizStep + 1} из {QUIZ_QUESTIONS.length}
                </span>
                <span style={{ fontSize: 12, color: '#A295C5' }}>
                  Тест на знание МСП
                </span>
              </div>

              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF', marginBottom: 16, lineHeight: 1.4 }}>
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
                      padding: '14px 16px',
                      textAlign: 'left',
                      justifyContent: 'flex-start',
                      fontSize: 14,
                      color: '#FFFFFF',
                      background: 'rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    <span>{opt}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* CERTIFICATE DISPLAY */
            <div>
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <Award size={36} color="#FFD21E" style={{ margin: '0 auto 8px auto' }} />
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF' }}>
                  Сертификат не выдан
                </h3>
                <p style={{ fontSize: 12, color: '#A295C5', marginTop: 8 }}>
                  Серверная проверка квиза доступна через основной раздел сервисов.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setQuizFinished(false);
                  setQuizStep(0);
                }}
                className="btn-secondary"
                style={{ width: '100%', padding: 12 }}
              >
                <span>Пройти заново</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* 3. CHECKLIST TAB */}
      {activeTab === 'checklist' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {savedMeasures.length > 0 ? (
            savedMeasures.map((measure) => (
              <div key={measure.id} className="liquid-card" style={{ padding: 16 }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF', marginBottom: 10 }}>
                  {measure.title}
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {measure.documents.map((doc, docIdx) => {
                    const key = `doc_${docIdx}`;
                    const isChecked = !!progress[measure.id]?.[key];
                    return (
                      <div
                        key={docIdx}
                        onClick={() => {
                          triggerHaptic('light');
                          onToggleItem(measure.id, key);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 10,
                          padding: '6px 8px',
                          borderRadius: 8,
                          background: isChecked ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.04)',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ color: isChecked ? '#34D399' : '#A295C5', marginTop: 1 }}>
                          {isChecked ? <CheckSquare size={16} /> : <Square size={16} />}
                        </div>
                        <span style={{ fontSize: 12, color: isChecked ? '#E2DCF3' : '#FFFFFF', textDecoration: isChecked ? 'line-through' : 'none' }}>
                          {doc}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: '#A295C5', fontSize: 13 }}>
              Сохраняйте меры поддержки в закладки, чтобы здесь сформировался чеклист документов!
            </div>
          )}
        </div>
      )}
    </div>
  );
};
