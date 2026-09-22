import React, { useState } from 'react';
import { Search, X, ChevronRight, Building2 } from 'lucide-react';
import type { MeasureRecord } from '../../types/api';
import { triggerHaptic } from '../../lib/maxBridge';

interface SearchModalProps {
  measures: MeasureRecord[];
  onClose: () => void;
  onSelectMeasure: (measure: MeasureRecord) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  measures,
  onClose,
  onSelectMeasure,
}) => {
  const [query, setQuery] = useState('');

  const filtered = measures.filter((m) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      m.title.toLowerCase().includes(q) ||
      m.operator.toLowerCase().includes(q) ||
      m.sector.toLowerCase().includes(q) ||
      m.eligibility.toLowerCase().includes(q) ||
      (m.amount_description && m.amount_description.toLowerCase().includes(q))
    );
  });

  return (
    <div className="modal-overlay">
      <div className="modal-content-sheet" style={{ height: '85dvh', padding: '20px 16px' }}>
        {/* Search input header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: 14,
            padding: '10px 14px',
          }}>
            <Search size={18} color="#a295c5" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск мер поддержки, грантов, субсидий..."
              autoFocus
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                outline: 'none',
                color: '#fff',
                fontSize: 14,
                fontFamily: 'inherit',
              }}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                style={{ color: '#a295c5' }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '10px 14px',
              fontSize: 14,
              color: '#ffd21e',
              fontWeight: 600,
            }}
          >
            Отмена
          </button>
        </div>

        {/* Results */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span style={{ fontSize: 12, color: '#a295c5', marginBottom: 4 }}>
            Найдено: {filtered.length} программ
          </span>

          {filtered.map((measure) => (
            <div
              key={measure.id}
              onClick={() => {
                triggerHaptic('light');
                onClose();
                onSelectMeasure(measure);
              }}
              className="liquid-card liquid-card-interactive"
              style={{ padding: 14 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                <span className="badge badge-yellow" style={{ fontSize: 10 }}>
                  {measure.amount_description || measure.region.toUpperCase()}
                </span>
                <span style={{ fontSize: 11, color: '#a295c5' }}>
                  {measure.region.toUpperCase()}
                </span>
              </div>

              <h4 style={{ fontSize: 14, fontWeight: 700, color: '#fff', lineHeight: 1.3, marginBottom: 6 }}>
                {measure.title}
              </h4>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Building2 size={12} color="#a295c5" />
                  <span style={{ fontSize: 11, color: '#a295c5' }}>
                    {measure.operator}
                  </span>
                </div>
                <ChevronRight size={16} color="#ffd21e" />
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 10px', color: '#a295c5' }}>
              Ничего не найдено по запросу «{query}»
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
