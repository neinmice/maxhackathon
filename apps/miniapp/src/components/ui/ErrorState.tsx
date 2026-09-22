import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { triggerHaptic } from '../../lib/maxBridge';

interface ErrorStateProps {
  message?: string;
  code?: string;
  requestId?: string;
  onRetry: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message = 'Не удалось загрузить данные каталога',
  code = 'network_error',
  requestId,
  onRetry,
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
        background: 'rgba(239, 68, 68, 0.15)',
        border: '1px solid rgba(239, 68, 68, 0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#f87171',
        marginBottom: 16,
      }}>
        <AlertTriangle size={28} />
      </div>

      <h3 style={{ fontSize: 17, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
        Ошибка соединения
      </h3>

      <p style={{ fontSize: 13, color: '#e2dcf3', maxWidth: 320, marginBottom: 8, lineHeight: 1.45 }}>
        {message}
      </p>

      <span style={{ fontSize: 11, color: '#a295c5', marginBottom: 20 }}>
        Код: {code} {requestId ? `· Запрос: ${requestId}` : ''}
      </span>

      <button
        type="button"
        onClick={() => {
          triggerHaptic('medium');
          onRetry();
        }}
        className="btn-primary"
        style={{ fontSize: 13, padding: '10px 20px' }}
      >
        <RefreshCw size={15} />
        <span>Повторить попытку</span>
      </button>
    </div>
  );
};
