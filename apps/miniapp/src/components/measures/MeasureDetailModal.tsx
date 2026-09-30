import React from 'react';
import { X, ExternalLink, Bookmark, CheckCircle2, ShieldAlert, Building2, Calendar, FileText, Check } from 'lucide-react';
import type { MeasureRecord } from '../../types/api';
import { triggerHaptic, openExternalUrl } from '../../lib/maxBridge';

interface MeasureDetailModalProps {
  measure: MeasureRecord;
  isSaved: boolean;
  onToggleSave: (id: string) => void;
  onClose: () => void;
  onOpenChecklist: () => void;
}

export const MeasureDetailModal: React.FC<MeasureDetailModalProps> = ({
  measure,
  isSaved,
  onToggleSave,
  onClose,
  onOpenChecklist,
}) => {
  const handleOpenSource = () => {
    triggerHaptic('medium');
    openExternalUrl(measure.source_url);
  };

  const handleToggle = () => {
    triggerHaptic('light');
    onToggleSave(measure.id);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content-sheet" style={{ padding: '24px 20px max(24px, env(safe-area-inset-bottom)) 20px' }}>
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
            {measure.amount_description && (
              <span className="badge badge-yellow">
                {measure.amount_description}
              </span>
            )}
            <span className={`badge ${measure.data_status === 'CONFIRMED' ? 'badge-status-confirmed' : 'badge-status-model'}`}>
              {measure.data_status}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.1)',
              color: '#fff',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Title */}
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', lineHeight: 1.3, marginBottom: 8 }}>
          {measure.title}
        </h2>

        {/* Operator & Date */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Building2 size={14} color="#ffd21e" />
            <span style={{ fontSize: 13, color: '#e2dcf3', fontWeight: 600 }}>
              {measure.operator}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Calendar size={14} color="#a295c5" />
            <span style={{ fontSize: 12, color: '#a295c5' }}>
              {measure.deadline ? `Срок подачи: до ${measure.deadline}` : 'Подача заявок открыта бессрочно'} · Проверено {measure.last_checked}
            </span>
          </div>
        </div>

        {/* Section: Eligibility */}
        <div className="liquid-card" style={{ padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <CheckCircle2 size={16} color="#ffd21e" />
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#ffd21e', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Кто может получить
            </h3>
          </div>
          <p style={{ fontSize: 13, color: '#e2dcf3', lineHeight: 1.5 }}>
            {measure.eligibility}
          </p>
        </div>

        {/* Section: Documents */}
        <div className="liquid-card" style={{ padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <FileText size={16} color="#ffd21e" />
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#ffd21e', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Необходимые документы
            </h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {measure.documents.map((doc, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <div style={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: 'rgba(112, 69, 198, 0.3)',
                  border: '1px solid rgba(112, 69, 198, 0.6)',
                  color: '#ffd21e',
                  fontSize: 10,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: 1,
                }}>
                  {idx + 1}
                </div>
                <span style={{ fontSize: 13, color: '#f5f2ff', lineHeight: 1.4 }}>
                  {doc}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Provenance & Disclaimer Box */}
        <div style={{
          padding: 12,
          borderRadius: 14,
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          marginBottom: 20,
          display: 'flex',
          gap: 10,
        }}>
          <ShieldAlert size={18} color="#fbbf24" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#fbbf24', marginBottom: 2 }}>
              Официальный источник: {measure.source_name}
            </div>
            <div style={{ fontSize: 11, color: '#d8cdfe', lineHeight: 1.4 }}>
              {measure.disclaimer}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Main Action: Go to Official Source */}
          <button
            type="button"
            onClick={handleOpenSource}
            className="btn-primary"
            style={{ width: '100%', fontSize: 15, padding: 14 }}
          >
            <span>Перейти на официальный портал</span>
            <ExternalLink size={17} />
          </button>

          {/* Secondary Actions: Checklist toggle */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={handleToggle}
              className="btn-secondary"
              style={{
                flex: 1,
                padding: '12px 14px',
                fontSize: 13,
                border: isSaved ? '1px solid #ffd21e' : '1px solid rgba(255, 255, 255, 0.15)',
                color: isSaved ? '#ffd21e' : '#fff',
              }}
            >
              {isSaved ? <Check size={16} /> : <Bookmark size={16} />}
              <span>{isSaved ? 'В моем чеклисте' : 'Добавить в чеклист'}</span>
            </button>

            {isSaved && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenChecklist();
                }}
                className="btn-glass-purple"
                style={{ padding: '12px 16px', fontSize: 13 }}
              >
                <span>Открыть чеклист</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
