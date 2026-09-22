import React from 'react';
import { triggerHaptic } from '../../lib/maxBridge';
import type { MeasureRecord } from '../../types/api';
import { StartSticker, SunburstSticker } from '../illustrations/MascotProps';

interface CategoryCardItem {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  measure?: MeasureRecord;
  customAction?: () => void;
  bgGradient?: string;
}

interface CategoryBlockProps {
  title: React.ReactNode;
  sticker?: 'start' | 'sunburst' | 'sphere';
  onHeaderClick: () => void;
  cards: CategoryCardItem[];
  onOpenMeasure: (measure: MeasureRecord) => void;
}

export const CategoryBlock: React.FC<CategoryBlockProps> = ({
  title,
  sticker,
  onHeaderClick,
  cards,
  onOpenMeasure,
}) => {
  return (
    <div style={{ marginBottom: 20 }}>
      {/* Block Header with Sticker & Arrow */}
      <div
        onClick={() => {
          triggerHaptic('light');
          onHeaderClick();
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px 10px 16px',
          cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h2 style={{
            fontSize: 18,
            fontWeight: 800,
            color: '#FFFFFF',
            letterSpacing: '-0.02em',
          }}>
            {title}
          </h2>

          {sticker === 'start' && <StartSticker />}
          {sticker === 'sunburst' && <SunburstSticker />}
          {sticker === 'sphere' && (
            <div style={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 35%, #C4B5FD 0%, #7C3AED 60%, #4C1D95 100%)',
              boxShadow: '0 0 10px rgba(124, 58, 237, 0.6)',
              display: 'inline-block',
            }} />
          )}
        </div>

        <span style={{ fontSize: 16, fontWeight: 700, color: '#A78BFA' }}>&gt;</span>
      </div>

      {/* 2-Column Card Grid (Matching Canva Reference Exactly) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 12,
        padding: '0 16px',
      }}>
        {cards.map((card) => (
          <div
            key={card.id}
            onClick={() => {
              triggerHaptic('light');
              if (card.customAction) {
                card.customAction();
              } else if (card.measure) {
                onOpenMeasure(card.measure);
              }
            }}
            className="liquid-card liquid-card-interactive"
            style={{
              padding: '16px 14px',
              minHeight: 96,
              borderRadius: 20,
              background: card.bgGradient || 'linear-gradient(145deg, rgba(29, 20, 48, 0.95) 0%, rgba(17, 11, 30, 0.98) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Subtle card top glow */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '35%',
              background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.06) 0%, transparent 100%)',
              pointerEvents: 'none',
            }} />

            {card.badge && (
              <span className="badge badge-yellow" style={{ fontSize: 9, padding: '2px 6px', marginBottom: 6 }}>
                {card.badge}
              </span>
            )}

            <h3 style={{
              fontSize: 15,
              fontWeight: 700,
              color: '#FFFFFF',
              lineHeight: 1.3,
              letterSpacing: '-0.01em',
            }}>
              {card.title}
            </h3>

            {card.subtitle && (
              <span style={{ fontSize: 11, color: '#A295C5', marginTop: 4 }}>
                {card.subtitle}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
