import React from 'react';
import { Search, ChevronDown } from 'lucide-react';
import type { Region } from '../../types/api';
import { triggerHaptic } from '../../lib/maxBridge';
import { MascotAvatarIcon } from '../illustrations/MascotProps';

interface HeaderProps {
  userName: string;
  selectedRegion: Region;
  onRegionChange: (region: Region) => void;
  onOpenSearch?: () => void;
  onOpenOnboarding: () => void;
}

const REGION_LABELS: Record<Region, string> = {
  kazan: 'Казань',
  moscow: 'Москва',
  spb: 'СПб',
};

export const Header: React.FC<HeaderProps> = ({
  userName,
  selectedRegion,
  onRegionChange,
  onOpenSearch,
  onOpenOnboarding,
}) => {
  const [showGeoMenu, setShowGeoMenu] = React.useState(false);

  const handleSelectRegion = (r: Region) => {
    triggerHaptic('light');
    onRegionChange(r);
    setShowGeoMenu(false);
  };

  return (
    <header style={{
      padding: 'max(14px, env(safe-area-inset-top)) 16px 10px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      background: 'rgba(13, 9, 20, 0.92)',
      backdropFilter: 'blur(24px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
    }}>
      {/* Left: ЛК Profile Button (Avatar + Name) */}
      <div
        onClick={() => {
          triggerHaptic('light');
          onOpenOnboarding();
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          cursor: 'pointer',
        }}
        title="Личный кабинет и настройки"
      >
        <div style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #7045C6, #3B82F6)',
          padding: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 10px rgba(112, 69, 198, 0.4)',
        }}>
          <div style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            background: '#120D1D',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <MascotAvatarIcon size={24} />
          </div>
        </div>

        <span style={{
          fontWeight: 800,
          fontSize: 17,
          color: '#FFFFFF',
          letterSpacing: '-0.02em',
        }}>
          {userName}
        </span>
      </div>

      {/* Right: Search + Geo Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {onOpenSearch && (
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onOpenSearch();
            }}
            aria-label="Поиск"
            style={{
              color: '#FFFFFF',
              padding: 4,
            }}
          >
            <Search size={20} strokeWidth={2.2} />
          </button>
        )}

        {/* Geo Selector */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setShowGeoMenu(!showGeoMenu);
            }}
            style={{
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: 15,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 6px',
            }}
          >
            <span>{REGION_LABELS[selectedRegion]}</span>
            <ChevronDown size={14} style={{ transform: showGeoMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', opacity: 0.7 }} />
          </button>

          {/* Geo Dropdown */}
          {showGeoMenu && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: 150,
              background: '#1F1436',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 14,
              boxShadow: '0 12px 30px rgba(0, 0, 0, 0.7)',
              padding: 6,
              zIndex: 50,
              backdropFilter: 'blur(24px)',
            }}>
              {(['kazan', 'moscow', 'spb'] as Region[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => handleSelectRegion(r)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    textAlign: 'left',
                    justifyContent: 'flex-start',
                    fontSize: 13,
                    fontWeight: selectedRegion === r ? 700 : 500,
                    color: selectedRegion === r ? '#FFD21E' : '#E2DCF3',
                    background: selectedRegion === r ? 'rgba(112, 69, 198, 0.35)' : 'transparent',
                  }}
                >
                  {REGION_LABELS[r]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
