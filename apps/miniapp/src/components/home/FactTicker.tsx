import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Zap, ArrowRight } from 'lucide-react';
import { triggerHaptic } from '../../lib/maxBridge';

interface FactItem {
  id: string;
  stat: string;
  text: string;
  tag: string;
  ctaText?: string;
  action?: 'onboarding' | 'catalog' | 'quiz';
}

const FACTS: FactItem[] = [
  {
    id: 'f1',
    stat: '90%',
    text: 'боятся начать бизнес из-за страха неизвестности и налоговой отчетности.',
    tag: 'Аналитика МСП',
    ctaText: 'Пройти гид новичка',
    action: 'onboarding',
  },
  {
    id: 'f2',
    stat: '500 000 ₽',
    text: 'безвозмездный грант молодым предпринимателям до 25 лет на развитие проекта.',
    tag: 'Господдержка 2026',
    ctaText: 'Смотреть гранты',
    action: 'catalog',
  },
  {
    id: 'f3',
    stat: '0 ₽',
    text: 'расходов на страховые взносы при выборе режима Самозанятости (НПД).',
    tag: 'Лайфхак по налогам',
    ctaText: 'Сдать экспресс-тест',
    action: 'quiz',
  },
  {
    id: 'f4',
    stat: '100% субсидия',
    text: 'на размещение стартапов в ИТ-парке им. Башира Рамеева (Казань) на 6 месяцев.',
    tag: 'ИТ-инфраструктура',
    ctaText: 'Узнать подробности',
    action: 'catalog',
  },
];

interface FactTickerProps {
  onAction: (action: 'onboarding' | 'catalog' | 'quiz') => void;
}

export const FactTicker: React.FC<FactTickerProps> = ({ onAction }) => {
  const [index, setIndex] = useState(0);

  const handlePrev = () => {
    triggerHaptic('light');
    setIndex((prev) => (prev > 0 ? prev - 1 : FACTS.length - 1));
  };

  const handleNext = () => {
    triggerHaptic('light');
    setIndex((prev) => (prev < FACTS.length - 1 ? prev + 1 : 0));
  };

  const current = FACTS[index];

  return (
    <div style={{ padding: '0 16px', marginBottom: 16 }}>
      <div
        className="liquid-card"
        style={{
          padding: '16px 18px',
          background: 'linear-gradient(135deg, rgba(44, 27, 77, 0.75) 0%, rgba(18, 13, 29, 0.85) 100%)',
          border: '1px solid rgba(255, 210, 30, 0.25)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Zap size={14} color="#ffd21e" />
            <span style={{ fontSize: 11, fontWeight: 800, color: '#ffd21e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {current.tag}
            </span>
          </div>

          {/* Navigation Arrows */}
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Предыдущий факт"
              style={{
                width: 26,
                height: 26,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#e2dcf3',
              }}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Следующий факт"
              style={{
                width: 26,
                height: 26,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#e2dcf3',
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 24, fontWeight: 800, color: '#ffd21e' }}>
            {current.stat}
          </span>
          <span style={{ fontSize: 13, color: '#ffffff', fontWeight: 600, lineHeight: 1.35 }}>
            {current.text}
          </span>
        </div>

        {current.ctaText && (
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              if (current.action) onAction(current.action);
            }}
            style={{
              paddingTop: 6,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontWeight: 700,
              color: '#ffd21e',
            }}
          >
            <span>{current.ctaText}</span>
            <ArrowRight size={13} />
          </button>
        )}
      </div>
    </div>
  );
};
