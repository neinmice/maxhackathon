import React from 'react';
import { CheckSquare, Square, FileText, ExternalLink, ShieldAlert, ArrowRight, Trash2 } from 'lucide-react';
import type { MeasureRecord } from '../../types/api';
import { triggerHaptic, openExternalUrl } from '../../lib/maxBridge';

interface ChecklistViewProps {
  savedMeasures: MeasureRecord[];
  progress: Record<string, Record<string, boolean>>;
  onToggleItem: (measureId: string, itemKey: string) => void;
  onRemoveMeasure: (measureId: string) => void;
  onOpenCatalog: () => void;
  onOpenDetail: (measure: MeasureRecord) => void;
}

export const ChecklistView: React.FC<ChecklistViewProps> = ({
  savedMeasures,
  progress,
  onToggleItem,
  onRemoveMeasure,
  onOpenCatalog,
  onOpenDetail,
}) => {
  // Calculate total stats
  let totalDocs = 0;
  let completedDocs = 0;

  savedMeasures.forEach((m) => {
    m.documents.forEach((_, idx) => {
      totalDocs += 1;
      const key = `doc_${idx}`;
      if (progress[m.id]?.[key]) {
        completedDocs += 1;
      }
    });
  });

  const percentage = totalDocs > 0 ? Math.round((completedDocs / totalDocs) * 100) : 0;

  if (savedMeasures.length === 0) {
    return (
      <div style={{
        padding: '40px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
      }}>
        <div style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: 'rgba(112, 69, 198, 0.2)',
          border: '1px solid rgba(112, 69, 198, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
          color: '#ffd21e',
        }}>
          <CheckSquare size={32} />
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 8 }}>
          Ваш чеклист пока пуст
        </h2>
        <p style={{ fontSize: 13, color: '#a295c5', maxWidth: 300, marginBottom: 24, lineHeight: 1.5 }}>
          Добавляйте понравившиеся гранты и субсидии из каталога, чтобы отслеживать сбор необходимых справок и документов.
        </p>
        <button
          type="button"
          onClick={() => {
            triggerHaptic('medium');
            onOpenCatalog();
          }}
          className="btn-primary"
        >
          <span>Перейти в каталог мер</span>
          <ArrowRight size={16} />
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px 16px 90px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Header & Progress */}
      <div className="liquid-card" style={{ padding: '20px 18px', background: 'linear-gradient(135deg, rgba(36,23,62,0.9), rgba(20,13,34,0.95))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>
              Чеклист документов
            </h2>
            <p style={{ fontSize: 12, color: '#a295c5' }}>
              Подготовка к подаче заявок
            </p>
          </div>
          <span className="badge badge-yellow" style={{ fontSize: 13, padding: '6px 12px' }}>
            {percentage}% готово
          </span>
        </div>

        {/* Progress Bar */}
        <div style={{
          width: '100%',
          height: 8,
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: 4,
          overflow: 'hidden',
          marginBottom: 10,
        }}>
          <div style={{
            height: '100%',
            width: `${percentage}%`,
            background: 'linear-gradient(90deg, #7045c6, #ffd21e)',
            borderRadius: 4,
            transition: 'width 0.3s ease',
          }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#e2dcf3' }}>
          <span>Собрано: {completedDocs} из {totalDocs} пунктов</span>
          <span>Мер в работе: {savedMeasures.length}</span>
        </div>
      </div>

      {/* Official Legal Disclaimer Banner */}
      <div style={{
        padding: 12,
        borderRadius: 14,
        background: 'rgba(245, 158, 11, 0.08)',
        border: '1px solid rgba(245, 158, 11, 0.25)',
        display: 'flex',
        gap: 10,
      }}>
        <ShieldAlert size={18} color="#fbbf24" style={{ flexShrink: 0, marginTop: 2 }} />
        <p style={{ fontSize: 11, color: '#e2dcf3', lineHeight: 1.45 }}>
          <strong>Обратите внимание:</strong> чеклист носит исключительно информационно-организационный характер для вашей самопроверки. Отметка пунктов в приложении не является юридически значимой подачей заявки в государственные органы.
        </p>
      </div>

      {/* Measures with document checklists */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {savedMeasures.map((measure) => (
          <div key={measure.id} className="liquid-card" style={{ padding: 18 }}>
            {/* Measure Card Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{ flex: 1, paddingRight: 8 }}>
                <span className="badge badge-purple" style={{ marginBottom: 6 }}>
                  {measure.amount_description || measure.region.toUpperCase()}
                </span>
                <h3
                  onClick={() => onOpenDetail(measure)}
                  style={{ fontSize: 15, fontWeight: 700, color: '#fff', cursor: 'pointer', lineHeight: 1.3 }}
                >
                  {measure.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  onRemoveMeasure(measure.id);
                }}
                aria-label="Удалить из чеклиста"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.06)',
                  color: '#a295c5',
                }}
              >
                <Trash2 size={15} />
              </button>
            </div>

            {/* Document Checklist Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
              {measure.documents.map((doc, docIdx) => {
                const itemKey = `doc_${docIdx}`;
                const isChecked = !!progress[measure.id]?.[itemKey];
                return (
                  <div
                    key={docIdx}
                    onClick={() => {
                      triggerHaptic('light');
                      onToggleItem(measure.id, itemKey);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      padding: '8px 10px',
                      borderRadius: 10,
                      background: isChecked ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.04)',
                      border: isChecked ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255, 255, 255, 0.06)',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ color: isChecked ? '#34d399' : '#a295c5', marginTop: 1 }}>
                      {isChecked ? <CheckSquare size={17} /> : <Square size={17} />}
                    </div>
                    <span style={{
                      fontSize: 13,
                      color: isChecked ? '#e2dcf3' : '#fff',
                      textDecoration: isChecked ? 'line-through' : 'none',
                      lineHeight: 1.35,
                    }}>
                      {doc}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Direct Official Link */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('medium');
                openExternalUrl(measure.source_url);
              }}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 12,
                background: 'rgba(112, 69, 198, 0.25)',
                border: '1px solid rgba(112, 69, 198, 0.45)',
                color: '#ffd21e',
                fontSize: 12,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <span>Подать на официальном сайте ({measure.source_name})</span>
              <ExternalLink size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
