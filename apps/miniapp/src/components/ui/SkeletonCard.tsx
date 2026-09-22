import React from 'react';

export const SkeletonCard: React.FC = () => {
  return (
    <div
      className="liquid-card"
      style={{
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        minHeight: 170,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="skeleton" style={{ width: 100, height: 22, borderRadius: 20 }} />
        <div className="skeleton" style={{ width: 28, height: 28, borderRadius: '50%' }} />
      </div>
      <div className="skeleton" style={{ width: '85%', height: 20, borderRadius: 6 }} />
      <div className="skeleton" style={{ width: '60%', height: 16, borderRadius: 6 }} />
      <div style={{ marginTop: 'auto', paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
        <div className="skeleton" style={{ width: 110, height: 14, borderRadius: 4 }} />
        <div className="skeleton" style={{ width: 60, height: 14, borderRadius: 4 }} />
      </div>
    </div>
  );
};
