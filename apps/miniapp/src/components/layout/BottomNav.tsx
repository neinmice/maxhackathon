import React from 'react';
import { Home, LayoutGrid, Award, FileText } from 'lucide-react';
import { triggerHaptic } from '../../lib/maxBridge';
import { MascotAvatarIcon } from '../illustrations/MascotProps';

export type TabId = 'home' | 'catalog' | 'mascot' | 'grants' | 'education';

interface BottomNavProps {
  currentTab: TabId;
  onTabChange: (tab: TabId) => void;
  savedCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onTabChange,
  savedCount = 0,
}) => {
  const handleTabClick = (tab: TabId) => {
    triggerHaptic('light');
    onTabChange(tab);
  };

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 50,
      background: 'rgba(14, 9, 24, 0.96)',
      backdropFilter: 'blur(30px)',
      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
      paddingBottom: 'max(10px, env(safe-area-inset-bottom))',
      paddingTop: 8,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
    }}>
      {/* 1. главная */}
      <button
        type="button"
        onClick={() => handleTabClick('home')}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          color: currentTab === 'home' ? '#3B82F6' : '#8B80A6',
          minWidth: 56,
        }}
      >
        <Home size={22} color={currentTab === 'home' ? '#3B82F6' : '#8B80A6'} />
        <span style={{ fontSize: 10, fontWeight: currentTab === 'home' ? 700 : 500 }}>
          главная
        </span>
      </button>

      {/* 2. сервисы */}
      <button
        type="button"
        onClick={() => handleTabClick('catalog')}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          color: currentTab === 'catalog' ? '#3B82F6' : '#8B80A6',
          minWidth: 56,
        }}
      >
        <LayoutGrid size={22} color={currentTab === 'catalog' ? '#3B82F6' : '#8B80A6'} />
        <span style={{ fontSize: 10, fontWeight: currentTab === 'catalog' ? 700 : 500 }}>
          сервисы
        </span>
      </button>

      {/* 3. Center Mascot Button */}
      <div style={{ position: 'relative', top: -14 }}>
        <button
          type="button"
          onClick={() => handleTabClick('mascot')}
          aria-label="Маскот-Ассистент"
          style={{
            width: 58,
            height: 58,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #7045C6 0%, #24173E 70%, #FFD21E 100%)',
            border: currentTab === 'mascot' ? '2.5px solid #FFD21E' : '2px solid rgba(255, 255, 255, 0.25)',
            boxShadow: currentTab === 'mascot'
              ? '0 0 24px rgba(255, 210, 30, 0.6), 0 8px 24px rgba(0,0,0,0.6)'
              : '0 8px 24px rgba(112, 69, 198, 0.5), 0 4px 12px rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: currentTab === 'mascot' ? 'scale(1.1)' : 'scale(1)',
            transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            padding: 2,
          }}
        >
          <div style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            background: '#130A24',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <MascotAvatarIcon size={38} />
          </div>
        </button>
      </div>

      {/* 4. гранты */}
      <button
        type="button"
        onClick={() => handleTabClick('grants')}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          color: currentTab === 'grants' ? '#3B82F6' : '#8B80A6',
          minWidth: 56,
          position: 'relative',
        }}
      >
        <div style={{ position: 'relative' }}>
          <Award size={22} color={currentTab === 'grants' ? '#3B82F6' : '#8B80A6'} />
          {savedCount > 0 && (
            <span style={{
              position: 'absolute',
              top: -3,
              right: -8,
              background: '#FFD21E',
              color: '#120D1D',
              fontSize: 9,
              fontWeight: 800,
              width: 14,
              height: 14,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {savedCount}
            </span>
          )}
        </div>
        <span style={{ fontSize: 10, fontWeight: currentTab === 'grants' ? 700 : 500 }}>
          гранты
        </span>
      </button>

      {/* 5. обучение */}
      <button
        type="button"
        onClick={() => handleTabClick('education')}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          color: currentTab === 'education' ? '#3B82F6' : '#8B80A6',
          minWidth: 56,
        }}
      >
        <FileText size={22} color={currentTab === 'education' ? '#3B82F6' : '#8B80A6'} />
        <span style={{ fontSize: 10, fontWeight: currentTab === 'education' ? 700 : 500 }}>
          обучение
        </span>
      </button>
    </nav>
  );
};
