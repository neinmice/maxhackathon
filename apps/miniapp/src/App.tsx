import { useEffect, useRef } from 'react'
import { BrowserRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import Header from './components/Header'
import TabBar from './components/TabBar'
import OnboardingSheet from './components/OnboardingSheet'
import MeasureDetailSheet from './components/MeasureDetailSheet'
import QuizModal from './components/QuizModal'
import SpotlightTutorial from './components/SpotlightTutorial'
import Assistant from './pages/Assistant'
import Home from './pages/Home'
import { CardPage, Course, Grants, Learning, Profile, Search, SectionPage, Services } from './pages/Other'
import { AppProvider, useApp } from './store'
import { bindBackButton, hideBackButton } from './lib/maxBridge'

function Shell() {
  const { pathname, search } = useLocation()
  const nav = useNavigate()
  const { toast, setQuizOpen, setOnboardingOpen, setMeasureDetail, introOpen, dismissIntro } = useApp()
  const main = useRef<HTMLElement>(null)
  const bare = pathname.startsWith('/search') || pathname.startsWith('/profile')

  useEffect(() => {
    main.current?.scrollTo(0, 0)
  }, [pathname])

  useEffect(() => {
    const isSubroute =
      pathname.startsWith('/card/') ||
      pathname.startsWith('/section/') ||
      pathname.startsWith('/learning/') ||
      pathname.startsWith('/profile') ||
      pathname.startsWith('/search')

    if (isSubroute) {
      return bindBackButton(() => nav(-1))
    } else {
      hideBackButton()
    }
  }, [pathname, nav])

  // Deep linking: обработка ?startapp= (quiz, catalog, saved, home, onboarding, measure)
  useEffect(() => {
    const params = new URLSearchParams(search)
    const startParam =
      params.get('startapp') ||
      params.get('tgWebAppStartParam') ||
      params.get('start_param') ||
      (window as any).WebApp?.initDataUnsafe?.start_param

    if (!startParam && params.get('cert') !== '1') return

    if (startParam === 'quiz' || startParam === 'cert' || params.get('cert') === '1') {
      setQuizOpen(true)
    } else if (startParam === 'catalog') {
      nav('/grants')
    } else if (startParam === 'saved') {
      nav('/profile')
    } else if (startParam === 'home') {
      nav('/')
    } else if (startParam === 'onboarding') {
      setOnboardingOpen(true)
    } else if (startParam === 'measure') {
      import('./data').then(({ GRANTS }) => setMeasureDetail(GRANTS[0]))
    }
  }, [search, nav, setQuizOpen, setOnboardingOpen, setMeasureDetail])

  return (
    <div className="app">
      {!bare && <Header />}
      <main className={`main ${pathname.startsWith('/assistant') ? 'main--chat' : ''}`} ref={main}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/section/:id" element={<SectionPage />} />
          <Route path="/card/:id" element={<CardPage />} />
          <Route path="/services" element={<Services />} />
          <Route path="/assistant" element={<Assistant />} />
          <Route path="/grants" element={<Grants />} />
          <Route path="/learning" element={<Learning />} />
          <Route path="/learning/:id" element={<Course />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/search" element={<Search />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <TabBar />
      <OnboardingSheet />
      <MeasureDetailSheet />
      <QuizModal />
      {introOpen && pathname === '/' && (
        <SpotlightTutorial
          onComplete={() => {
            dismissIntro()
            setOnboardingOpen(true)
          }}
        />
      )}
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Shell />
      </BrowserRouter>
    </AppProvider>
  )
}
