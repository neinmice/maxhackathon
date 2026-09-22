import React from 'react';
import { Home, Compass, Bookmark, CheckSquare, Bot } from 'lucide-react';
import { triggerHaptic } from '../../lib/maxBridge';

export type TabId = 'home' | 'catalog' | 'mascot' | 'grants' | 'checklist';

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
      zIndex: 45,
      background: 'rgba(18, 13, 29, 0.92)',
      backdropFilter: 'blur(24px)',
      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
      paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
      paddingTop: 8,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
    }}>
      {/* 1. Главная */}
      <button
        type="button"
        onClick={() => handleTabClick('home')}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
          color: currentTab === 'home' ? '#ffd21e' : '#a295c5',
          minWidth: 54,
        }}
      >
        <Home size={21} strokeWidth={currentTab === 'home' ? 2.5 : 1.8} />
        <span style={{ fontSize: 10, fontWeight: currentTab === 'home' ? 700 : 500 }}>
          Главная
        </span>
      </button>

      {/* 2. Каталог / Сервисы */}
      <button
        type="button"
        onClick={() => handleTabClick('catalog')}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
          color: currentTab === 'catalog' ? '#ffd21e' : '#a295c5',
          minWidth: 54,
        }}
      >
        <Compass size={21} strokeWidth={currentTab === 'catalog' ? 2.5 : 1.8} />
        <span style={{ fontSize: 10, fontWeight: currentTab === 'catalog' ? 700 : 500 }}>
          Каталог
        </span>
      </button>

      {/* 3. Центральная кнопка: Кот-Маскот / Ассистент */}
      <div style={{ position: 'relative', top: -14 }}>
        <button
          type="button"
          onClick={() => handleTabClick('mascot')}
          aria-label="Ассистент Кот-Навигатор"
          style={{
            width: 54,
            height: 54,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #7045c6 0%, #24173e 70%, #ffd21e 100%)',
            border: currentTab === 'mascot' ? '2px solid #ffd21e' : '2px solid rgba(255, 255, 255, 0.25)',
            boxShadow: currentTab === 'mascot'
              ? '0 0 20px rgba(255, 210, 30, 0.5), 0 8px 24px rgba(0,0,0,0.6)'
              : '0 8px 24px rgba(112, 69, 198, 0.4), 0 4px 12px rgba(0,0,0,0.5)',
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            transform: currentTab === 'mascot' ? 'scale(1.08)' : 'scale(1)',
            transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          }}
        >
          <Bot size={26} color={currentTab === 'mascot' ? '#ffd21e' : '#fff'} />
        </button>
      </div>

      {/* 4. Гранты / Избранное */}
      <button
        type="button"
        onClick={() => handleTabClick('grants')}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
          color: currentTab === 'grants' ? '#ffd21e' : '#a295c5',
          minWidth: 54,
          position: 'relative',
        }}
      >
        <div style={{ position: 'relative' }}>
          <Bookmark size={21} strokeWidth={currentTab === 'grants' ? 2.5 : 1.8} />
          {savedCount > 0 && (
            <span style={{
              position: 'absolute',
              top: -4,
              right: -8,
              background: '#ffd21e',
              color: '#120d1d',
              fontSize: 9,
              fontWeight: 800,
              width: 15,
              height: 15,
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
          Гранты
        </span>
      </button>

      {/* 5. Чеклист */}
      <button
        type="button"
        onClick={() => handleTabClick('checklist')}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
          color: currentTab === 'checklist' ? '#ffd21e' : '#a295c5',
          minWidth: 54,
        }}
      >
        <CheckSquare size={21} strokeWidth={currentTab === 'checklist' ? 2.5 : 1.8} />
        <span style={{ fontSize: 10, fontWeight: currentTab === 'checklist' ? 700 : 500 }}>
          Чеклист
        </span>
      </button>
    </nav>
  );
};
