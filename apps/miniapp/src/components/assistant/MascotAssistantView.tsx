import React, { useState } from 'react';
import { Mic, ArrowRight, Award, RotateCcw, Send } from 'lucide-react';
import { triggerHaptic } from '../../lib/maxBridge';
import { MascotDoorIllustration, MascotAvatarIcon } from '../illustrations/MascotProps';
import { saveCertificate, loadCertificates, type StoredCertificate } from '../../lib/storage';

interface MascotAssistantViewProps {
  userName: string;
  onOpenMeasure: (id: string) => void;
  onOpenCatalog: () => void;
  onOpenEducation: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'mascot' | 'user';
  text: string;
  timestamp: string;
}

const DEFAULT_CHIPS = [
  'Гайд по налогам 2026',
  'Кто ты такой ?',
  'Что ты умеешь ?',
  'Где пройти обучение ?',
  'Как получить 300.000 руб. на бизнес ?',
];

export const MascotAssistantView: React.FC<MascotAssistantViewProps> = ({
  userName,
  onOpenMeasure,
  onOpenCatalog,
  onOpenEducation,
}) => {
  // If messages length > 0, we show the active chat dialogue!
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [certificate, setCertificate] = useState<StoredCertificate | null>(null);

  const handleChipClick = (chipText: string) => {
    triggerHaptic('medium');

    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      sender: 'user',
      text: chipText,
      timestamp: '12:23',
    };

    let replyText = '';
    if (chipText.includes('300.000') || chipText.includes('грант')) {
      replyText = `Привет, для получения гранта на 300.000 руб. необходимо:\n— Не иметь долгов перед государством\n— Пройти обучение в центре "Мой бизнес" (Который в Казани находится по адресу Ул. Петербургская, д. 28)\n— Защитить бизнес-проект\n— Внести минимум 30% от начальных затрат в проект\n\nКстати, записаться на интенсив ты можешь в разделе "обучение" -> "Азы бизнеса"`;
    } else if (chipText.includes('налогам')) {
      replyText = `По налогам в 2026 году действует золотое правило:\n— Если работаешь один — оформляй Самозанятость (НПД). Ставка 4-6%, 0 взносов и деклараций.\n— Если нанимаешь персонал или продаешь товары оптом — выбирай ИП на УСН "Доходы" 6%.\n\nПодробные условия и калькуляторы ждут тебя в разделе "сервисы".`;
    } else if (chipText.includes('Кто ты такой')) {
      replyText = `Я официальный виртуальный помощник Кот-Навигатор ZVERY! Помогаю молодым предпринимателям и самозанятым находить реальные гранты, субсидии и бесплатные программы в Казани, Москве и Санкт-Петербурге.`;
    } else if (chipText.includes('Что ты умеешь')) {
      replyText = `Я умею:\n1. Подбирать гранты и субсидии под твой налоговый режим и регион\n2. Формировать чеклист сбора документов\n3. Направлять на бесплатные акселераторы в ИТ-парке\n4. Проводить квизы и выдавать памятный сертификат!`;
    } else if (chipText.includes('обучение')) {
      replyText = `Бесплатное обучение для молодых предпринимателей доступно в центрах "Мой бизнес" (курс "Азбука предпринимателя") и в образовательных треках ИТ-парка им. Башира Рамеева.\n\nЗагляни в раздел "обучение", чтобы увидеть открытые наборы!`;
    } else {
      replyText = `Отличный вопрос! Я проверил базу данных мер поддержки. Рекомендую изучить раздел "сервисы" или пройти экспресс-тест в разделе "обучение".`;
    }

    const mascotMsg: ChatMessage = {
      id: `m_${Date.now() + 1}`,
      sender: 'mascot',
      text: replyText,
      timestamp: '12:23',
    };

    setMessages([userMsg, mascotMsg]);
  };

  const handleSend = () => {
    if (!inputText.trim()) return;
    handleChipClick(inputText);
    setInputText('');
  };

  const handleMicClick = () => {
    triggerHaptic('heavy');
    setIsRecording(!isRecording);
    if (!isRecording) {
      setTimeout(() => {
        setIsRecording(false);
        setInputText('Как получить грант для молодых предпринимателей?');
      }, 1500);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: 'calc(100dvh - 140px)',
      padding: '10px 16px 85px 16px',
      justifyContent: 'space-between',
    }}>
      {/* Top Content: either Prompt Screen or Chat Dialogue */}
      {messages.length === 0 ? (
        /* SCREEN 2: Mascot Peeking from Door + Prompt Chips */
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', paddingTop: 10 }}>
          {/* Mascot Door Illustration */}
          <MascotDoorIllustration />

          {/* Title from Mockup */}
          <h1 style={{
            fontSize: 22,
            fontWeight: 800,
            color: '#FFFFFF',
            margin: '18px 0 20px 0',
            maxWidth: 300,
            lineHeight: 1.25,
            letterSpacing: '-0.02em',
          }}>
            Я твой помощник по <br />
            <span style={{ color: '#C4B5FD' }}>«Бизнес-Навигатору»</span>
          </h1>

          {/* Chips matching Canva reference */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 10,
            maxWidth: 360,
          }}>
            {DEFAULT_CHIPS.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleChipClick(chip)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 20,
                  background: 'rgba(29, 20, 48, 0.85)',
                  border: '1.5px solid rgba(139, 92, 246, 0.45)',
                  color: '#FFFFFF',
                  fontSize: 13,
                  fontWeight: 600,
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
                  backdropFilter: 'blur(16px)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* SCREEN 3: Active Chat Dialogue */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 10 }}>
          {/* Reset chat button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => setMessages([])}
              style={{
                fontSize: 12,
                color: '#A295C5',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 8px',
              }}
            >
              <RotateCcw size={13} />
              <span>Новый вопрос</span>
            </button>
          </div>

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
                  maxWidth: '86%',
                  padding: '14px 18px',
                  borderRadius: 22,
                  borderBottomRightRadius: msg.sender === 'user' ? 4 : 22,
                  borderBottomLeftRadius: msg.sender === 'mascot' ? 4 : 22,
                  background: msg.sender === 'user'
                    ? '#5B2BB8'
                    : 'rgba(26, 17, 44, 0.95)',
                  border: msg.sender === 'mascot' ? '1.5px solid rgba(255, 255, 255, 0.12)' : 'none',
                  color: '#FFFFFF',
                  fontSize: 14,
                  lineHeight: 1.45,
                  whiteSpace: 'pre-line',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                }}
              >
                {msg.text}
              </div>

              {/* Timestamp & Mascot Avatar */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginTop: 4,
                marginInline: 8,
              }}>
                {msg.sender === 'mascot' && <MascotAvatarIcon size={16} />}
                <span style={{ fontSize: 11, color: '#8B80A6' }}>{msg.timestamp}</span>
              </div>
            </div>
          ))}

          {/* Quick link button to Education */}
          <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
            <button
              type="button"
              onClick={() => onOpenEducation()}
              className="btn-primary"
              style={{ flex: 1, padding: 12, fontSize: 13 }}
            >
              <span>Записаться на обучение</span>
              <ArrowRight size={15} />
            </button>
            <button
              type="button"
              onClick={() => onOpenMeasure('demo-kazan-support-001')}
              className="btn-secondary"
              style={{ padding: '12px 14px', fontSize: 13 }}
            >
              <span>Карточка гранта</span>
            </button>
          </div>
        </div>
      )}

      {/* Bottom Input Field with Microphone (From Mockup) */}
      <div style={{
        marginTop: 20,
        position: 'sticky',
        bottom: 74,
        zIndex: 30,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'rgba(26, 17, 44, 0.92)',
          border: '1.5px solid rgba(139, 92, 246, 0.35)',
          borderRadius: 24,
          padding: '8px 12px 8px 18px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(20px)',
        }}>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
            placeholder="Как получить грант для молодых предп...."
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              outline: 'none',
              color: '#FFFFFF',
              fontSize: 14,
              fontFamily: 'inherit',
            }}
          />

          {inputText.trim() ? (
            <button
              type="button"
              onClick={handleSend}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: '#FFD21E',
                color: '#120D1D',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Send size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleMicClick}
              title="Голосовой ввод"
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: isRecording ? '#EF4444' : 'rgba(255, 255, 255, 0.08)',
                color: isRecording ? '#FFFFFF' : '#E2DCF3',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isRecording ? '0 0 12px #EF4444' : 'none',
                transition: 'all 0.2s',
              }}
            >
              <Mic size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
