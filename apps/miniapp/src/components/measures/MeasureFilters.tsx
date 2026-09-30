import React from 'react';
import type { Role } from '../../types/api';
import { triggerHaptic } from '../../lib/maxBridge';

export type CategoryFilter = 'all' | 'start' | 'grants' | 'finance' | 'programs';

interface MeasureFiltersProps {
  selectedCategory: CategoryFilter;
  onSelectCategory: (category: CategoryFilter) => void;
  selectedRole: Role | 'all';
  onSelectRole: (role: Role | 'all') => void;
}

export const MeasureFilters: React.FC<MeasureFiltersProps> = ({
  selectedCategory,
  onSelectCategory,
  selectedRole,
  onSelectRole,
}) => {
  const categories: { id: CategoryFilter; label: string }[] = [
    { id: 'all', label: 'Все меры' },
    { id: 'grants', label: 'Гранты до 1 млн' },
    { id: 'start', label: 'Начни свое дело' },
    { id: 'finance', label: 'Льготные займы' },
    { id: 'programs', label: 'ИТ-парки и инкубаторы' },
  ];

  const roles: { id: Role | 'all'; label: string }[] = [
    { id: 'all', label: 'Все формы' },
    { id: 'self_employed', label: 'Самозанятый' },
    { id: 'ip', label: 'ИП' },
    { id: 'llc', label: 'ООО' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '4px 16px 12px 16px' }}>
      {/* Category Pills */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }} className="no-scrollbar">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onSelectCategory(cat.id);
              }}
              style={{
                padding: '8px 14px',
                borderRadius: 20,
                fontSize: 13,
                fontWeight: isActive ? 700 : 500,
                whiteSpace: 'nowrap',
                background: isActive ? 'linear-gradient(135deg, #ffd21e, #ffe14d)' : 'rgba(255, 255, 255, 0.07)',
                color: isActive ? '#120d1d' : '#e2dcf3',
                border: isActive ? '1px solid #ffd21e' : '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: isActive ? '0 2px 10px rgba(255, 210, 30, 0.3)' : 'none',
              }}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Role Pills */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }} className="no-scrollbar">
        {roles.map((r) => {
          const isActive = selectedRole === r.id;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onSelectRole(r.id);
              }}
              style={{
                padding: '5px 12px',
                borderRadius: 14,
                fontSize: 12,
                fontWeight: isActive ? 700 : 500,
                whiteSpace: 'nowrap',
                background: isActive ? 'rgba(112, 69, 198, 0.4)' : 'transparent',
                color: isActive ? '#ffd21e' : '#a295c5',
                border: isActive ? '1px solid rgba(112, 69, 198, 0.7)' : '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              {r.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
