import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { triggerHaptic } from '../../lib/maxBridge';
import { SquiggleDecorations } from '../illustrations/MascotProps';

interface FactItem {
  id: string;
  stat: string;
  text: string;
  tag: string;
}

const FACTS: FactItem[] = [
  {
    id: 'f1',
    stat: '90%',
    text: 'Боятся начать из за страха незнания.',
    tag: 'Аналитика МСП',
  },
  {
    id: 'f2',
    stat: '500.000 ₽',
    text: 'Безвозмездный грант молодым предпринимателям до 25 лет.',
    tag: 'Господдержка',
  },
  {
    id: 'f3',
    stat: '0 ₽',
    text: 'Расходов на взносы и бухгалтерию при выборе Самозанятости.',
    tag: 'Лайфхак',
  },
  {
    id: 'f4',
    stat: '100% субсидия',
    text: 'На размещение в ИТ-парке им. Башира Рамеева (Казань).',
    tag: 'ИТ-парк',
  },
];

interface FactTickerProps {
  onAction?: (action: string) => void;
}

export const FactTicker: React.FC<FactTickerProps> = ({ onAction }) => {
  const [index, setIndex] = useState(0);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('light');
    setIndex((prev) => (prev > 0 ? prev - 1 : FACTS.length - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('light');
    setIndex((prev) => (prev < FACTS.length - 1 ? prev + 1 : 0));
  };

  const current = FACTS[index];

  return (
    <div style={{ padding: '0 16px', margin: '8px 0 16px 0' }}>
      <div
        onClick={() => {
          triggerHaptic('light');
          if (onAction) onAction('open_catalog');
        }}
        className="liquid-card liquid-card-interactive"
        style={{
          padding: '14px 18px',
          background: 'linear-gradient(145deg, rgba(29, 18, 48, 0.95) 0%, rgba(16, 10, 28, 0.98) 100%)',
          border: '1.5px solid rgba(139, 92, 246, 0.35)',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        {/* Yellow lightning top squiggle */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <svg width="34" height="14" viewBox="0 0 34 14" fill="none">
            <path
              d="M2 10 L11 3 L18 11 L27 2 L32 7"
              stroke="#FFD21E"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          {/* Mini arrows controls */}
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Назад"
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#e2dcf3',
              }}
            >
              <ChevronLeft size={14} />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Вперед"
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#e2dcf3',
              }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Text exactly matching the Canva reference */}
        <div style={{ textAlign: 'center', padding: '2px 0 6px 0' }}>
          <h2 style={{
            fontSize: 16,
            fontWeight: 800,
            color: '#FFFFFF',
            lineHeight: 1.35,
            letterSpacing: '-0.01em',
          }}>
            <span style={{ color: '#FFD21E' }}>{current.stat} </span>
            {current.text}
          </h2>
        </div>

        {/* Purple wavy arrow bottom right */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <svg width="44" height="16" viewBox="0 0 44 16" fill="none">
            <path
              d="M2 8 Q10 2 18 8 T34 8 L30 4 M34 8 L30 12"
              stroke="#A78BFA"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};
