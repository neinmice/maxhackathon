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
import QuizPage from './pages/QuizPage'
import CertificatesPage from './pages/CertificatesPage'
import { CardPage, Course, Grants, Learning, Profile, Search, SectionPage, Services } from './pages/Other'
import {
  RegistrationService,
  TaxesService,
  DocumentsService,
  InternshipService,
} from './pages/services'
import { AppProvider, useApp } from './store'
import { bindBackButton, hideBackButton, initBridge } from './lib/maxBridge'
import { applyLaunchParam, resolveLaunchParamFromWindow } from './lib/deepLink'
import { apiClient } from './api/client'

function Shell() {
  const { pathname, search } = useLocation()
  const nav = useNavigate()
  const { toast, setQuizOpen, setOnboardingOpen, setMeasureDetail, introOpen, dismissIntro } = useApp()
  const main = useRef<HTMLElement>(null)
  const bare = pathname.startsWith('/search') || pathname.startsWith('/profile') || pathname.startsWith('/certificates')

  const openMeasure = (measureId: string) => {
    apiClient.getMeasure(measureId).then(setMeasureDetail).catch(() => {})
  }

  useEffect(() => {
    initBridge()
  }, [])

  useEffect(() => {
    main.current?.scrollTo(0, 0)
  }, [pathname])

  useEffect(() => {
    const isSubroute =
      pathname.startsWith('/card/') ||
      pathname.startsWith('/section/') ||
      pathname.startsWith('/learning/') ||
      pathname.startsWith('/services/') ||
      pathname.startsWith('/quiz') ||
      pathname.startsWith('/profile') ||
      pathname.startsWith('/certificates') ||
      pathname.startsWith('/search')

    if (isSubroute) {
      return bindBackButton(() => nav(-1))
    } else {
      hideBackButton()
    }
  }, [pathname, nav])

  // Deep linking: канонический payload measure_<id> и маршруты home/quiz/cert/catalog/saved/onboarding
  const hasAppliedLaunchRef = useRef(false)
  useEffect(() => {
    if (hasAppliedLaunchRef.current) return
    hasAppliedLaunchRef.current = true
    applyLaunchParam(resolveLaunchParamFromWindow(), {
      openMeasure,
      openQuiz: () => setQuizOpen(true),
      openOnboarding: () => setOnboardingOpen(true),
      navigate: nav,
    })
  }, [nav])

  return (
    <div className="app">
      {!bare && <Header />}
      <main className={`main ${pathname.startsWith('/assistant') ? 'main--chat' : ''}`} ref={main}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/section/:id" element={<SectionPage />} />
          <Route path="/card/:id" element={<CardPage />} />
          <Route path="/services" element={<Services />} />
          <Route path="/services/registration" element={<RegistrationService />} />
          <Route path="/services/taxes" element={<TaxesService />} />
          <Route path="/services/documents" element={<DocumentsService />} />
          <Route path="/services/internship" element={<InternshipService />} />
          <Route path="/assistant" element={<Assistant />} />
          <Route path="/grants" element={<Grants />} />
          <Route path="/learning" element={<Learning />} />
          <Route path="/learning/:id" element={<Course />} />
          <Route path="/quiz" element={<QuizPage />} />
          <Route path="/certificates" element={<CertificatesPage />} />
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
          onSkip={() => {
            dismissIntro()
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
