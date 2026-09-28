import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { apiClient } from './api/client'
import { CITIES, STORIES, type City } from './data'

export type UserRole = 'self_employed' | 'ip' | 'llc' | 'intern' | 'planning'
export type UserTaxMode = 'npd' | 'usn6' | 'usn15' | 'ausn'
export type UserGoal = 'start' | 'grants' | 'growth' | 'education'

type Ctx = {
  userName: string
  city: City
  setCity: (c: City) => void
  role: UserRole
  setRole: (r: UserRole) => void
  taxMode: UserTaxMode
  setTaxMode: (t: UserTaxMode) => void
  goal: UserGoal
  setGoal: (g: UserGoal) => void
  viewedStories: Set<string>
  viewedSlides: Set<string>
  markSlideViewed: (storyId: string, slideIdx: number) => void
  markViewed: (id: string) => void
  isStoryFullyViewed: (storyId: string, slidesCount: number) => boolean
  savedMeasures: Set<string>
  toggleSaveMeasure: (id: string) => void
  toast: string | null
  showToast: (t: string) => void
  onboardingOpen: boolean
  setOnboardingOpen: (v: boolean) => void
  introOpen: boolean
  setIntroOpen: (v: boolean) => void
  dismissIntro: () => void
  measureDetail: any | null
  setMeasureDetail: (m: any | null) => void
  quizOpen: boolean
  setQuizOpen: (v: boolean) => void
}

const AppCtx = createContext<Ctx>(null!)

export function AppProvider({ children }: { children: ReactNode }) {
  // 1. Имя пользователя: из MAX WebApp или по умолчанию "Анастасия"
  const [userName, setUserName] = useState<string>('Анастасия')
  const [city, setCity] = useState<City>('Казань')
  const [role, setRole] = useState<UserRole>('ip')
  const [taxMode, setTaxMode] = useState<UserTaxMode>('usn6')
  const [goal, setGoal] = useState<UserGoal>('start')

  // Хранилище просмотренных слайдов: "storyId:slideIndex"
  const [viewedSlides, setViewedSlides] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem('zvery_viewed_slides')
      return raw ? new Set(JSON.parse(raw)) : new Set<string>()
    } catch {
      return new Set<string>()
    }
  })
  const [savedMeasures, setSavedMeasures] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem('zvery_saved_measures')
      return raw ? new Set(JSON.parse(raw)) : new Set(['young', 'micro'])
    } catch {
      return new Set(['young', 'micro'])
    }
  })
  const [toast, setToast] = useState<string | null>(null)
  const [onboardingOpen, setOnboardingOpen] = useState(false)
  const [introOpen, setIntroOpen] = useState(() => {
    try {
      return !localStorage.getItem('zvery_intro_seen')
    } catch {
      return false
    }
  })
  const [measureDetail, setMeasureDetail] = useState<any | null>(null)
  const [quizOpen, setQuizOpen] = useState(false)

  const dismissIntro = () => {
    setIntroOpen(false)
    try {
      localStorage.setItem('zvery_intro_seen', 'true')
    } catch {
      // no-op
    }
  }

  // Инициализация MAX Bridge и пользователя
  useEffect(() => {
    const webapp = (window as any).WebApp
    if (webapp) {
      try {
        webapp.ready?.()
        webapp.expand?.()
        const user = webapp.initDataUnsafe?.user
        if (user?.first_name) {
          setUserName(user.first_name)
        }
      } catch {
        // no-op
      }
    }
  }, [])

  const markSlideViewed = (storyId: string, slideIdx: number) => {
    setViewedSlides((prev) => {
      const key = `${storyId}:${slideIdx}`
      if (prev.has(key)) return prev
      const next = new Set(prev).add(key)
      try {
        localStorage.setItem('zvery_viewed_slides', JSON.stringify(Array.from(next)))
      } catch {
        // no-op
      }
      return next
    })
  }

  const isStoryFullyViewed = (storyId: string, slidesCount: number) => {
    for (let i = 0; i < slidesCount; i++) {
      if (!viewedSlides.has(`${storyId}:${i}`)) return false
    }
    return true
  }

  const markViewed = (storyId: string) => {
    const s = STORIES.find((x) => x.id === storyId)
    if (!s) return
    setViewedSlides((prev) => {
      const next = new Set(prev)
      for (let i = 0; i < s.slides.length; i++) {
        next.add(`${storyId}:${i}`)
      }
      try {
        localStorage.setItem('zvery_viewed_slides', JSON.stringify(Array.from(next)))
      } catch {
        // no-op
      }
      return next
    })
  }

  const viewedStories = new Set<string>()
  for (const s of STORIES) {
    if (isStoryFullyViewed(s.id, s.slides.length)) {
      viewedStories.add(s.id)
    }
  }

  const showToast = (t: string) => {
    setToast(t)
    window.setTimeout(() => setToast(null), 2400)
  }

  const toggleSaveMeasure = (id: string) => {
    setSavedMeasures((prev) => {
      const next = new Set(prev)
      const isSaved = next.has(id)
      if (isSaved) {
        next.delete(id)
        apiClient.removeSavedMeasure(id).catch(() => {})
        showToast('Удалено из сохранённых')
      } else {
        next.add(id)
        apiClient.saveMeasure(id).catch(() => {})
        showToast('Добавлено в сохранённые')
      }
      try {
        localStorage.setItem('zvery_saved_measures', JSON.stringify([...next]))
      } catch {
        // no-op
      }
      return next
    })
  }

  return (
    <AppCtx.Provider
      value={{
        userName,
        city,
        setCity,
        role,
        setRole,
        taxMode,
        setTaxMode,
        goal,
        setGoal,
        viewedStories,
        viewedSlides,
        markSlideViewed,
        markViewed,
        isStoryFullyViewed,
        savedMeasures,
        toggleSaveMeasure,
        toast,
        showToast,
        onboardingOpen,
        setOnboardingOpen,
        introOpen,
        setIntroOpen,
        dismissIntro,
        measureDetail,
        setMeasureDetail,
        quizOpen,
        setQuizOpen,
      }}
    >
      {children}
    </AppCtx.Provider>
  )
}

export const useApp = () => useContext(AppCtx)

export const cityIn = (c: City) => ({ Москва: 'Москве', 'Санкт-Петербург': 'Петербурге', Казань: 'Казани' })[c]

export function cityToRegion(city: City): 'kazan' | 'moscow' | 'spb' {
  switch (city) {
    case 'Казань':
      return 'kazan'
    case 'Москва':
      return 'moscow'
    case 'Санкт-Петербург':
      return 'spb'
  }
}
