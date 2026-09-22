import { useState, useEffect, useMemo } from 'react';
import './styles/main.css';
import {
  initBridge,
  getBridgeUser,
  getDeepLinkPayload,
  triggerHaptic,
} from './lib/maxBridge';
import {
  loadUserProfile,
  saveUserProfile,
  loadSavedMeasureIds,
  toggleSavedMeasure,
  loadChecklistProgress,
  toggleChecklistItem,
} from './lib/storage';
import { apiClient } from './api/client';
import type { MeasureRecord, UserProfile, Region, Role } from './types/api';
import type { StoryItem } from './components/stories/StoriesBar';
import { Header } from './components/layout/Header';
import { BottomNav, type TabId } from './components/layout/BottomNav';
import { StoriesBar } from './components/stories/StoriesBar';
import { StoryModal } from './components/stories/StoryModal';
import { FactTicker } from './components/home/FactTicker';
import { CategoryBlock } from './components/home/CategoryBlock';
import { MeasureCard } from './components/measures/MeasureCard';
import { MeasureDetailModal } from './components/measures/MeasureDetailModal';
import { MeasureFilters, type CategoryFilter } from './components/measures/MeasureFilters';
import { OnboardingModal } from './components/onboarding/OnboardingModal';
import { MascotAssistantView } from './components/assistant/MascotAssistantView';
import { EducationView } from './components/education/EducationView';
import { SearchModal } from './components/search/SearchModal';
import { SkeletonCard } from './components/ui/SkeletonCard';
import { EmptyState } from './components/ui/EmptyState';
import { ErrorState } from './components/ui/ErrorState';

export function App() {
  // 1. User & Profile State
  const [profile, setProfile] = useState<UserProfile>(() => loadUserProfile());
  const [userName, setUserName] = useState<string>('Анастасия');
  const [savedIds, setSavedIds] = useState<string[]>(() => loadSavedMeasureIds());
  const [checklistProgress, setChecklistProgress] = useState(() => loadChecklistProgress());

  // 2. Navigation & Views
  const [currentTab, setCurrentTab] = useState<TabId>('home');
  const [activeStory, setActiveStory] = useState<StoryItem | null>(null);
  const [selectedMeasure, setSelectedMeasure] = useState<MeasureRecord | null>(null);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [showSearch, setShowSearch] = useState<boolean>(false);

  // 3. Catalog & Filters
  const [measures, setMeasures] = useState<MeasureRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorInfo, setErrorInfo] = useState<{ message: string; code?: string } | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [roleFilter, setRoleFilter] = useState<Role | 'all'>('all');

  // Initialize MAX Bridge & check Deep links
  useEffect(() => {
    initBridge();
    const bridgeUser = getBridgeUser();
    if (bridgeUser?.first_name) {
      setUserName(bridgeUser.first_name);
    }

    // Auto-open onboarding if not completed yet
    const saved = loadUserProfile();
    if (!saved.isOnboarded) {
      setShowOnboarding(true);
    }

    // Parse deep-link payload
    const payload = getDeepLinkPayload();
    if (payload) {
      if (payload.startsWith('measure_')) {
        const targetId = payload.replace('measure_', '');
        apiClient.getMeasure(targetId).then((m) => {
          setSelectedMeasure(m);
        }).catch(() => {});
      } else if (payload === 'quiz') {
        setCurrentTab('mascot');
      } else if (payload === 'education') {
        setCurrentTab('education');
      } else if (payload === 'onboarding') {
        setShowOnboarding(true);
      }
    }
  }, []);

  // Fetch catalog recommendations
  const loadData = async () => {
    setIsLoading(true);
    setErrorInfo(null);
    try {
      await apiClient.getHealth();
      const all = await apiClient.getAllMeasures();
      setMeasures(all);
    } catch (err: any) {
      console.warn('[App] Load error, using offline fixtures:', err);
      try {
        const fallback = await apiClient.getAllMeasures();
        setMeasures(fallback);
      } catch (e: any) {
        setErrorInfo({ message: e.message || 'Ошибка загрузки данных', code: 'LOAD_ERROR' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [profile.region]);

  // Handle region change from Header dropdown
  const handleRegionChange = (newRegion: Region) => {
    const updated = { ...profile, region: newRegion };
    setProfile(updated);
    saveUserProfile(updated);
  };

  // Handle save profile from Onboarding
  const handleSaveProfile = (newProfile: UserProfile) => {
    setProfile(newProfile);
    saveUserProfile(newProfile);
    setShowOnboarding(false);
    triggerHaptic('medium');
  };

  // Handle bookmark toggle
  const handleToggleSave = (measureId: string) => {
    const nextSaved = toggleSavedMeasure(measureId);
    setSavedIds(nextSaved);
  };

  // Handle checklist item check/uncheck
  const handleToggleChecklistItem = (measureId: string, itemKey: string) => {
    const next = toggleChecklistItem(measureId, itemKey);
    setChecklistProgress(next);
  };

  // Filtered measures for Catalog Tab & Search
  const filteredMeasures = useMemo(() => {
    return measures.filter((item) => {
      if (item.region !== profile.region) return false;
      if (categoryFilter !== 'all') {
        if (categoryFilter === 'grants' && item.category !== 'grants') return false;
        if (categoryFilter === 'start' && item.category !== 'start') return false;
        if (categoryFilter === 'finance' && item.category !== 'finance') return false;
        if (categoryFilter === 'programs' && item.category !== 'programs') return false;
      }
      if (roleFilter !== 'all') {
        if (!item.roles.includes(roleFilter)) return false;
      }
      return true;
    });
  }, [measures, profile.region, categoryFilter, roleFilter]);

  // Saved measures list
  const savedMeasures = useMemo(() => {
    return measures.filter((m) => savedIds.includes(m.id));
  }, [measures, savedIds]);

  // Specific measures for the 2-column blocks
  const youthGrantMeasure = useMemo(() => {
    return measures.find((m) => m.region === profile.region && m.category === 'grants') || measures[0];
  }, [measures, profile.region]);

  const incubatorMeasure = useMemo(() => {
    return measures.find((m) => m.region === profile.region && m.category === 'programs') || measures[2];
  }, [measures, profile.region]);

  const loanMeasure = useMemo(() => {
    return measures.find((m) => m.region === profile.region && m.category === 'finance') || measures[1];
  }, [measures, profile.region]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: '#0D0B14' }}>
      {/* 1. Header (Sticky) with ЛК Avatar + Anastasia + Kazan */}
      <Header
        userName={userName}
        selectedRegion={profile.region}
        onRegionChange={handleRegionChange}
        onOpenSearch={() => setShowSearch(true)}
        onOpenOnboarding={() => setShowOnboarding(true)}
      />

      {/* 2. Main Content Area */}
      <main style={{ flex: 1, paddingBottom: 85 }}>
        {/* --- TAB: ГЛАВНАЯ (HOME) --- */}
        {currentTab === 'home' && (
          <div>
            {/* Stories carousel: [ Новинки ] [ Новости ] [ Интервью ] [ Цифры ] */}
            <StoriesBar onSelectStory={(s) => setActiveStory(s)} />

            {/* Fact Ticker: 90% Боятся начать из за страха незнания */ }
            <FactTicker onAction={() => setCurrentTab('catalog')} />

            {/* Loading / Error States */}
            {isLoading && (
              <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <SkeletonCard />
                <SkeletonCard />
              </div>
            )}

            {errorInfo && !isLoading && (
              <ErrorState
                message={errorInfo.message}
                code={errorInfo.code}
                onRetry={loadData}
              />
            )}

            {!isLoading && !errorInfo && (
              <div>
                {/* 1. BLOCK: Начни свое дело > with [START] sticker */}
                <CategoryBlock
                  title={
                    <>
                      Начни <span style={{ color: '#FFD21E' }}>свое дело</span>
                    </>
                  }
                  sticker="start"
                  onHeaderClick={() => {
                    setCategoryFilter('start');
                    setCurrentTab('catalog');
                  }}
                  onOpenMeasure={(m) => setSelectedMeasure(m)}
                  cards={[
                    {
                      id: 'c_start_1',
                      title: 'С чего начать',
                      subtitle: 'Пошаговый гид',
                      badge: 'СТАРТ',
                      measure: youthGrantMeasure,
                    },
                    {
                      id: 'c_start_2',
                      title: 'Инструкция',
                      subtitle: 'Регистрация и налоги',
                      badge: 'ГАЙД',
                      customAction: () => setCurrentTab('education'),
                    },
                  ]}
                />

                {/* 2. BLOCK: Бесплатные программы > with Sphere prop */}
                <CategoryBlock
                  title={
                    <>
                      <span style={{ color: '#FFD21E' }}>Бесплатные</span> программы
                    </>
                  }
                  sticker="sphere"
                  onHeaderClick={() => {
                    setCategoryFilter('programs');
                    setCurrentTab('catalog');
                  }}
                  onOpenMeasure={(m) => setSelectedMeasure(m)}
                  cards={[
                    {
                      id: 'c_prog_1',
                      title: profile.region === 'kazan' ? 'Мероприятия в Казани' : profile.region === 'moscow' ? 'Мероприятия в Москве' : 'Мероприятия в СПб',
                      subtitle: 'ИТ-парк и коворкинги',
                      badge: 'ОЧНО',
                      measure: incubatorMeasure,
                    },
                    {
                      id: 'c_prog_2',
                      title: 'Онлайн мероприятия',
                      subtitle: 'Курсы «Мой бизнес»',
                      badge: 'ОНЛАЙН',
                      customAction: () => setCurrentTab('education'),
                    },
                  ]}
                />

                {/* 3. BLOCK: Финансовая поддержка > with Sunburst */}
                <CategoryBlock
                  title={
                    <>
                      Финансовая <span style={{ color: '#8B5CF6' }}>поддержка</span>
                    </>
                  }
                  sticker="sunburst"
                  onHeaderClick={() => {
                    setCategoryFilter('finance');
                    setCurrentTab('catalog');
                  }}
                  onOpenMeasure={(m) => setSelectedMeasure(m)}
                  cards={[
                    {
                      id: 'c_fin_1',
                      title: '300.000 на развитие',
                      subtitle: 'Гранты до 500 тыс. ₽',
                      badge: 'ГРАНТ',
                      measure: youthGrantMeasure,
                    },
                    {
                      id: 'c_fin_2',
                      title: 'Кредит без процентов',
                      subtitle: 'Займы под 3.5%',
                      badge: 'ЛЬГОТНЫЙ',
                      measure: loanMeasure,
                    },
                  ]}
                />
              </div>
            )}
          </div>
        )}

        {/* --- TAB: СЕРВИСЫ (КАТАЛОГ) --- */}
        {currentTab === 'catalog' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <MeasureFilters
              selectedCategory={categoryFilter}
              onSelectCategory={setCategoryFilter}
              selectedRole={roleFilter}
              onSelectRole={setRoleFilter}
            />

            <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {isLoading ? (
                <>
                  <SkeletonCard />
                  <SkeletonCard />
                </>
              ) : filteredMeasures.length > 0 ? (
                filteredMeasures.map((m) => (
                  <MeasureCard
                    key={m.id}
                    measure={m}
                    isSaved={savedIds.includes(m.id)}
                    onToggleSave={handleToggleSave}
                    onOpenDetail={(item) => setSelectedMeasure(item)}
                  />
                ))
              ) : (
                <EmptyState
                  onResetFilters={() => {
                    setCategoryFilter('all');
                    setRoleFilter('all');
                  }}
                />
              )}
            </div>
          </div>
        )}

        {/* --- TAB: МАСКОТ-АССИСТЕНТ (Screen 2 & 3 in Canva) --- */}
        {currentTab === 'mascot' && (
          <MascotAssistantView
            userName={userName}
            onOpenMeasure={(id) => {
              const item = measures.find((m) => m.id === id);
              if (item) setSelectedMeasure(item);
            }}
            onOpenCatalog={() => setCurrentTab('catalog')}
            onOpenEducation={() => setCurrentTab('education')}
          />
        )}

        {/* --- TAB: ГРАНТЫ --- */}
        {currentTab === 'grants' && (
          <div style={{ padding: '14px 16px 20px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#FFFFFF' }}>
                  Гранты и финансирование
                </h2>
                <p style={{ fontSize: 12, color: '#A295C5' }}>
                  Все программы региона {profile.region.toUpperCase()}
                </p>
              </div>
              <span className="badge badge-yellow">
                {measures.filter((m) => m.category === 'grants' || m.category === 'finance').length} программ
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {measures
                .filter((m) => m.category === 'grants' || m.category === 'finance')
                .map((m) => (
                  <MeasureCard
                    key={m.id}
                    measure={m}
                    isSaved={savedIds.includes(m.id)}
                    onToggleSave={handleToggleSave}
                    onOpenDetail={(item) => setSelectedMeasure(item)}
                  />
                ))}
            </div>
          </div>
        )}

        {/* --- TAB: ОБУЧЕНИЕ --- */}
        {currentTab === 'education' && (
          <EducationView
            userName={userName}
            savedMeasures={savedMeasures}
            progress={checklistProgress}
            onToggleItem={handleToggleChecklistItem}
            onOpenMeasure={(id) => {
              const item = measures.find((m) => m.id === id);
              if (item) setSelectedMeasure(item);
            }}
          />
        )}
      </main>

      {/* 3. Bottom Navigation Bar with Center Mascot Button */}
      <BottomNav
        currentTab={currentTab}
        onTabChange={(tab) => setCurrentTab(tab)}
        savedCount={savedIds.length}
      />

      {/* 4. Modals */}
      {/* Stories Modal */}
      {activeStory && (
        <StoryModal
          story={activeStory}
          onClose={() => setActiveStory(null)}
          onOpenMeasure={(id) => {
            const m = measures.find((item) => item.id === id);
            if (m) setSelectedMeasure(m);
          }}
          onOpenCatalog={() => setCurrentTab('catalog')}
          onOpenQuiz={() => setCurrentTab('mascot')}
        />
      )}

      {/* Measure Detail Modal */}
      {selectedMeasure && (
        <MeasureDetailModal
          measure={selectedMeasure}
          isSaved={savedIds.includes(selectedMeasure.id)}
          onToggleSave={handleToggleSave}
          onClose={() => setSelectedMeasure(null)}
          onOpenChecklist={() => setCurrentTab('education')}
        />
      )}

      {/* Onboarding Modal */}
      {showOnboarding && (
        <OnboardingModal
          initialProfile={profile}
          onSave={handleSaveProfile}
          onClose={() => setShowOnboarding(false)}
          isInitialSetup={!profile.isOnboarded}
        />
      )}

      {/* Search Modal */}
      {showSearch && (
        <SearchModal
          measures={measures}
          onClose={() => setShowSearch(false)}
          onSelectMeasure={(m) => setSelectedMeasure(m)}
        />
      )}
    </div>
  );
}

export default App;
