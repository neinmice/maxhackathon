import React from 'react';
import { MapPin, Search, ChevronDown, Sparkles } from 'lucide-react';
import type { Region } from '../../types/api';
import { triggerHaptic } from '../../lib/maxBridge';

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
  spb: 'Санкт-Петербург',
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
      padding: 'max(16px, env(safe-area-inset-top)) 16px 12px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      background: 'rgba(18, 13, 29, 0.82)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    }}>
      {/* Left: User Profile badge (Click to edit onboarding/profile) */}
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
        title="Настройки профиля"
      >
        <div style={{
          width: 38,
          height: 38,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #7045c6, #ffd21e)',
          padding: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(112, 69, 198, 0.35)',
        }}>
          <div style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            background: '#1c132f',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: 14,
            color: '#ffd21e',
          }}>
            {userName.charAt(0).toUpperCase()}
          </div>
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>
              {userName}
            </span>
            <Sparkles size={12} color="#ffd21e" />
          </div>
          <span style={{ fontSize: 11, color: '#a295c5', display: 'block' }}>
            Настройки бизнеса
          </span>
        </div>
      </div>

      {/* Right: Search & Geo selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {onOpenSearch && (
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onOpenSearch();
            }}
            aria-label="Поиск"
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.07)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#e2dcf3',
            }}
          >
            <Search size={16} />
          </button>
        )}

        {/* Geo Selector Pill */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setShowGeoMenu(!showGeoMenu);
            }}
            style={{
              padding: '6px 12px',
              borderRadius: 20,
              background: 'rgba(112, 69, 198, 0.22)',
              border: '1px solid rgba(112, 69, 198, 0.45)',
              color: '#ffd21e',
              fontWeight: 700,
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <MapPin size={13} color="#ffd21e" />
            <span>{REGION_LABELS[selectedRegion]}</span>
            <ChevronDown size={14} style={{ transform: showGeoMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>

          {/* Geo Dropdown */}
          {showGeoMenu && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: 170,
              background: '#24173e',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 14,
              boxShadow: '0 12px 30px rgba(0, 0, 0, 0.6)',
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
                    color: selectedRegion === r ? '#ffd21e' : '#e2dcf3',
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
