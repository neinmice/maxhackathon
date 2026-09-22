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
  defaultProfile,
} from './lib/storage';
import { apiClient } from './api/client';
import type { MeasureRecord, UserProfile, Region, Role } from './types/api';
import type { StoryItem } from './components/stories/StoriesBar';
import { Header } from './components/layout/Header';
import { BottomNav, type TabId } from './components/layout/BottomNav';
import { StoriesBar } from './components/stories/StoriesBar';
import { StoryModal } from './components/stories/StoryModal';
import { FactTicker } from './components/home/FactTicker';
import { MeasureCard } from './components/measures/MeasureCard';
import { MeasureDetailModal } from './components/measures/MeasureDetailModal';
import { MeasureFilters, type CategoryFilter } from './components/measures/MeasureFilters';
import { OnboardingModal } from './components/onboarding/OnboardingModal';
import { ChecklistView } from './components/checklist/ChecklistView';
import { MascotAssistantView } from './components/assistant/MascotAssistantView';
import { SearchModal } from './components/search/SearchModal';
import { SkeletonCard } from './components/ui/SkeletonCard';
import { EmptyState } from './components/ui/EmptyState';
import { ErrorState } from './components/ui/ErrorState';
import { ChevronRight, ArrowRight, ShieldCheck } from 'lucide-react';

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

    // Parse deep-link payload (e.g. ?startapp=measure_demo-kazan-support-001 or ?startapp=quiz)
    const payload = getDeepLinkPayload();
    if (payload) {
      if (payload.startsWith('measure_')) {
        const targetId = payload.replace('measure_', '');
        apiClient.getMeasure(targetId).then((m) => {
          setSelectedMeasure(m);
        }).catch(() => {});
      } else if (payload === 'quiz') {
        setCurrentTab('mascot');
      } else if (payload === 'checklist') {
        setCurrentTab('checklist');
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
      // First verify backend liveness
      await apiClient.getHealth();

      // Fetch recommended measures for the user profile
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
      // Region match
      if (item.region !== profile.region) return false;

      // Category filter
      if (categoryFilter !== 'all') {
        if (categoryFilter === 'grants' && item.category !== 'grants') return false;
        if (categoryFilter === 'start' && item.category !== 'start') return false;
        if (categoryFilter === 'finance' && item.category !== 'finance') return false;
        if (categoryFilter === 'programs' && item.category !== 'programs') return false;
      }

      // Role filter
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

  // Measures by category for Home blocks
  const startMeasures = useMemo(() => {
    return measures.filter((m) => m.region === profile.region && (m.category === 'start' || m.category === 'grants'));
  }, [measures, profile.region]);

  const financeMeasures = useMemo(() => {
    return measures.filter((m) => m.region === profile.region && m.category === 'finance');
  }, [measures, profile.region]);

  const programMeasures = useMemo(() => {
    return measures.filter((m) => m.region === profile.region && m.category === 'programs');
  }, [measures, profile.region]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      {/* 1. Header (Sticky) */}
      <Header
        userName={userName}
        selectedRegion={profile.region}
        onRegionChange={handleRegionChange}
        onOpenSearch={() => setShowSearch(true)}
        onOpenOnboarding={() => setShowOnboarding(true)}
      />

      {/* 2. Main Content Area according to active tab */}
      <main style={{ flex: 1, paddingBottom: 85 }}>
        {/* --- TAB: HOME --- */}
        {currentTab === 'home' && (
          <div>
            {/* Stories carousel */}
            <StoriesBar onSelectStory={(s) => setActiveStory(s)} />

            {/* Dynamic Fact Ticker banner */}
            <FactTicker
              onAction={(act) => {
                if (act === 'onboarding') setShowOnboarding(true);
                else if (act === 'catalog') setCurrentTab('catalog');
                else if (act === 'quiz') setCurrentTab('mascot');
              }}
            />

            {/* Loading Skeletons */}
            {isLoading && (
              <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <SkeletonCard />
                <SkeletonCard />
              </div>
            )}

            {/* Error State */}
            {errorInfo && !isLoading && (
              <ErrorState
                message={errorInfo.message}
                code={errorInfo.code}
                onRetry={loadData}
              />
            )}

            {!isLoading && !errorInfo && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '0 0 20px 0' }}>
                {/* Block 1: Начни свое дело > */}
                <div>
                  <div
                    onClick={() => {
                      setCategoryFilter('start');
                      setCurrentTab('catalog');
                    }}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0 16px 10px 16px',
                      cursor: 'pointer',
                    }}
                  >
                    <h2 style={{ fontSize: 17, fontWeight: 800, color: '#fff' }}>
                      Начни <span style={{ color: '#ffd21e' }}>свое дело</span> &gt;
                    </h2>
                    <span style={{ fontSize: 12, color: '#ffd21e', fontWeight: 700 }}>Все</span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      gap: 12,
                      padding: '0 16px',
                      overflowX: 'auto',
                    }}
                    className="no-scrollbar"
                  >
                    {startMeasures.length > 0 ? (
                      startMeasures.map((m) => (
                        <div key={m.id} style={{ minWidth: 260, maxWidth: 280, flexShrink: 0 }}>
                          <MeasureCard
                            measure={m}
                            isSaved={savedIds.includes(m.id)}
                            onToggleSave={handleToggleSave}
                            onOpenDetail={(item) => setSelectedMeasure(item)}
                          />
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: '16px', color: '#a295c5', fontSize: 13 }}>
                        Меры для данного региона готовятся оператором
                      </div>
                    )}
                  </div>
                </div>

                {/* Block 2: Бесплатные программы и инкубаторы > */}
                <div>
                  <div
                    onClick={() => {
                      setCategoryFilter('programs');
                      setCurrentTab('catalog');
                    }}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0 16px 10px 16px',
                      cursor: 'pointer',
                    }}
                  >
                    <h2 style={{ fontSize: 17, fontWeight: 800, color: '#fff' }}>
                      <span style={{ color: '#ffd21e' }}>Бесплатные</span> программы &gt;
                    </h2>
                    <span style={{ fontSize: 12, color: '#ffd21e', fontWeight: 700 }}>Все</span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      gap: 12,
                      padding: '0 16px',
                      overflowX: 'auto',
                    }}
                    className="no-scrollbar"
                  >
                    {programMeasures.length > 0 ? (
                      programMeasures.map((m) => (
                        <div key={m.id} style={{ minWidth: 260, maxWidth: 280, flexShrink: 0 }}>
                          <MeasureCard
                            measure={m}
                            isSaved={savedIds.includes(m.id)}
                            onToggleSave={handleToggleSave}
                            onOpenDetail={(item) => setSelectedMeasure(item)}
                          />
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: '16px', color: '#a295c5', fontSize: 13 }}>
                        Меры для данного региона готовятся оператором
                      </div>
                    )}
                  </div>
                </div>

                {/* Block 3: Финансовая поддержка > */}
                <div>
                  <div
                    onClick={() => {
                      setCategoryFilter('finance');
                      setCurrentTab('catalog');
                    }}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0 16px 10px 16px',
                      cursor: 'pointer',
                    }}
                  >
                    <h2 style={{ fontSize: 17, fontWeight: 800, color: '#fff' }}>
                      Финансовая <span style={{ color: '#ffd21e' }}>поддержка</span> &gt;
                    </h2>
                    <span style={{ fontSize: 12, color: '#ffd21e', fontWeight: 700 }}>Все</span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      gap: 12,
                      padding: '0 16px',
                      overflowX: 'auto',
                    }}
                    className="no-scrollbar"
                  >
                    {financeMeasures.length > 0 ? (
                      financeMeasures.map((m) => (
                        <div key={m.id} style={{ minWidth: 260, maxWidth: 280, flexShrink: 0 }}>
                          <MeasureCard
                            measure={m}
                            isSaved={savedIds.includes(m.id)}
                            onToggleSave={handleToggleSave}
                            onOpenDetail={(item) => setSelectedMeasure(item)}
                          />
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: '16px', color: '#a295c5', fontSize: 13 }}>
                        Меры для данного региона готовятся оператором
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- TAB: CATALOG --- */}
        {currentTab === 'catalog' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Filter Pills */}
            <MeasureFilters
              selectedCategory={categoryFilter}
              onSelectCategory={setCategoryFilter}
              selectedRole={roleFilter}
              onSelectRole={setRoleFilter}
            />

            {/* List of Measures */}
            <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
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

        {/* --- TAB: MASCOT ASSISTANT --- */}
        {currentTab === 'mascot' && (
          <MascotAssistantView
            userName={userName}
            onOpenMeasure={(id) => {
              const item = measures.find((m) => m.id === id);
              if (item) setSelectedMeasure(item);
            }}
            onOpenCatalog={() => setCurrentTab('catalog')}
          />
        )}

        {/* --- TAB: GRANTS (SAVED MEASURES) --- */}
        {currentTab === 'grants' && (
          <div style={{ padding: '16px 16px 20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>
                  Сохраненные гранты
                </h2>
                <p style={{ fontSize: 12, color: '#a295c5' }}>
                  Программы, добавленные вами в закладки
                </p>
              </div>
              <span className="badge badge-yellow">
                {savedMeasures.length} мер
              </span>
            </div>

            {savedMeasures.length > 0 ? (
              savedMeasures.map((m) => (
                <MeasureCard
                  key={m.id}
                  measure={m}
                  isSaved={true}
                  onToggleSave={handleToggleSave}
                  onOpenDetail={(item) => setSelectedMeasure(item)}
                />
              ))
            ) : (
              <EmptyState
                title="Нет сохраненных мер"
                description="Нажимайте на значок закладки на любой карточке, чтобы сохранить меру в этот раздел и сформировать чеклист документов."
                onResetFilters={() => setCurrentTab('catalog')}
              />
            )}
          </div>
        )}

        {/* --- TAB: CHECKLIST --- */}
        {currentTab === 'checklist' && (
          <ChecklistView
            savedMeasures={savedMeasures}
            progress={checklistProgress}
            onToggleItem={handleToggleChecklistItem}
            onRemoveMeasure={handleToggleSave}
            onOpenCatalog={() => setCurrentTab('catalog')}
            onOpenDetail={(m) => setSelectedMeasure(m)}
          />
        )}
      </main>

      {/* 3. Bottom Navigation Bar */}
      <BottomNav
        currentTab={currentTab}
        onTabChange={(tab) => setCurrentTab(tab)}
        savedCount={savedIds.length}
      />

      {/* 4. Modals and Overlays */}
      {/* Story Player Modal */}
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
          onOpenChecklist={() => setCurrentTab('checklist')}
        />
      )}

      {/* Onboarding Wizard Modal */}
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
