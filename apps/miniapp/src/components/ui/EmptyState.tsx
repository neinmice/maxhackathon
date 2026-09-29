import React from 'react'
import mascotShrug from '../../assets/mascot/mascot-shrug.webp'
import { triggerHaptic } from '../../lib/maxBridge'

interface EmptyStateProps {
  title?: string
  description?: string
  onResetFilters?: () => void
  resetLabel?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'Ничего не нашлось',
  description = 'Попробуйте изменить регион, форму бизнеса или сбросить фильтрацию, чтобы увидеть все доступные меры.',
  onResetFilters,
  resetLabel = 'Сбросить фильтры',
  action,
}) => {
  return (
    <div
      style={{
        padding: '36px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 96,
          height: 96,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 14,
        }}
      >
        <img
          src={mascotShrug}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          draggable={false}
        />
      </div>

      <h3
        style={{
          fontFamily: "'VK Sans Display Expanded', sans-serif",
          fontSize: 17,
          fontWeight: 700,
          color: '#ffffff',
          marginBottom: 8,
          lineHeight: 1.25,
        }}
      >
        {title}
      </h3>

      <p
        style={{
          fontFamily: "'VK Sans Text', sans-serif",
          fontSize: 13,
          color: '#8d93a3',
          maxWidth: 300,
          marginBottom: 20,
          lineHeight: 1.45,
        }}
      >
        {description}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', maxWidth: '240px' }}>
        {onResetFilters && (
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light')
              onResetFilters()
            }}
            className="btn btn--primary"
            style={{ width: '100%', height: '40px', fontSize: '13px' }}
          >
            {resetLabel}
          </button>
        )}

        {action && (
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light')
              action.onClick()
            }}
            className={onResetFilters ? 'btn btn--ghost' : 'btn btn--primary'}
            style={{
              width: '100%',
              height: '40px',
              fontSize: '13px',
              color: onResetFilters ? '#8d93a3' : '#ffffff',
            }}
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  )
}

export default EmptyState
