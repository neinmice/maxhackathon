import React from 'react';
import { SearchX, RotateCcw } from 'lucide-react';
import { triggerHaptic } from '../../lib/maxBridge';

interface EmptyStateProps {
  title?: string;
  description?: string;
  onResetFilters?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'Под выбранные фильтры пока нет мер',
  description = 'Попробуйте изменить регион, форму бизнеса или сбросить фильтрацию категорий, чтобы увидеть все доступные программы.',
  onResetFilters,
}) => {
  return (
    <div style={{
      padding: '40px 20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
    }}>
      <div style={{
        width: 60,
        height: 60,
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.06)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#a295c5',
        marginBottom: 16,
      }}>
        <SearchX size={28} />
      </div>

      <h3 style={{ fontSize: 17, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
        {title}
      </h3>

      <p style={{ fontSize: 13, color: '#a295c5', maxWidth: 320, marginBottom: 20, lineHeight: 1.45 }}>
        {description}
      </p>

      {onResetFilters && (
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            onResetFilters();
          }}
          className="btn-secondary"
          style={{ fontSize: 13, padding: '10px 18px' }}
        >
          <RotateCcw size={15} />
          <span>Сбросить фильтры</span>
        </button>
      )}
    </div>
  );
};
