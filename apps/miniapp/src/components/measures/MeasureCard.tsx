import React from 'react';
import { Bookmark, Building2, Calendar, ShieldCheck, ChevronRight } from 'lucide-react';
import type { MeasureRecord } from '../../types/api';
import { triggerHaptic } from '../../lib/maxBridge';

interface MeasureCardProps {
  measure: MeasureRecord;
  isSaved: boolean;
  onToggleSave: (id: string) => void;
  onOpenDetail: (measure: MeasureRecord) => void;
}

export const MeasureCard: React.FC<MeasureCardProps> = ({
  measure,
  isSaved,
  onToggleSave,
  onOpenDetail,
}) => {
  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('light');
    onToggleSave(measure.id);
  };

  const handleCardClick = () => {
    triggerHaptic('light');
    onOpenDetail(measure);
  };

  return (
    <div
      onClick={handleCardClick}
      className="liquid-card liquid-card-interactive"
      style={{
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: 180,
      }}
    >
      {/* Top Header: Category / Amount & Bookmark */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
            {measure.amount_description && (
              <span className="badge badge-yellow">
                {measure.amount_description}
              </span>
            )}
            <span className={`badge ${measure.data_status === 'CONFIRMED' ? 'badge-status-confirmed' : 'badge-status-model'}`}>
              <ShieldCheck size={11} style={{ marginRight: 2 }} />
              {measure.data_status}
            </span>
          </div>

          <button
            type="button"
            onClick={handleSaveClick}
            aria-label={isSaved ? 'Удалить из сохраненных' : 'Сохранить'}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: isSaved ? 'rgba(255, 210, 30, 0.2)' : 'rgba(255, 255, 255, 0.08)',
              border: isSaved ? '1px solid #ffd21e' : '1px solid rgba(255, 255, 255, 0.1)',
              color: isSaved ? '#ffd21e' : '#a295c5',
            }}
          >
            <Bookmark size={15} fill={isSaved ? '#ffd21e' : 'none'} />
          </button>
        </div>

        {/* Title */}
        <h3 style={{
          fontSize: 16,
          fontWeight: 700,
          color: '#ffffff',
          lineHeight: 1.35,
          marginBottom: 8,
        }}>
          {measure.title}
        </h3>

        {/* Operator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <Building2 size={13} color="#a295c5" />
          <span style={{ fontSize: 12, color: '#a295c5', fontWeight: 500 }}>
            {measure.operator}
          </span>
        </div>
      </div>

      {/* Footer Info: Deadline / Last checked & Action */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        marginTop: 6,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Calendar size={13} color="#ffd21e" />
          <span style={{ fontSize: 11, color: '#e2dcf3' }}>
            {measure.deadline ? `Приём до ${measure.deadline}` : `Проверено ${measure.last_checked}`}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 2, color: '#ffd21e', fontSize: 12, fontWeight: 700 }}>
          <span>Условия</span>
          <ChevronRight size={14} />
        </div>
      </div>
    </div>
  );
};
