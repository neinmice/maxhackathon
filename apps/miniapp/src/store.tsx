import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { apiClient } from './api/client'
import { CITIES, STORIES, type City } from './data'

export type UserRole = 'self_employed' | 'ip' | 'llc' | 'intern' | 'planning'
export type UserTaxMode = 'npd' | 'usn6' | 'usn15' | 'ausn'
export type UserGoal = 'start' | 'grants' | 'growth' | 'education' | 'support'

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
  canonicalIds: Set<string> | null
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
  // Имя пользователя приходит только из MAX Bridge.
  const [userName, setUserName] = useState<string>('')
  const [city, setCity] = useState<City>('Казань')
  const [role, setRole] = useState<UserRole>('ip')
  const [taxMode, setTaxMode] = useState<UserTaxMode>('usn6')
  const [goal, setGoal] = useState<UserGoal>('support')

  // Хранилище просмотренных слайдов: "storyId:slideIndex"
  const [viewedSlides, setViewedSlides] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem('zvery_viewed_slides')
      return raw ? new Set(JSON.parse(raw)) : new Set<string>()
    } catch {
      return new Set<string>()
    }
  })
  // Saved-набор стартует пустым: фантомные локальные ID не являются мерами каталога.
  // Фильтрация против канонического каталога выполняется ниже, после загрузки каталога из API.
  const [savedMeasures, setSavedMeasures] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem('zvery_saved_measures')
      if (!raw) return new Set<string>()
      const parsed: unknown = JSON.parse(raw)
      if (!Array.isArray(parsed)) return new Set<string>()
      return new Set(parsed.filter((id): id is string => typeof id === 'string' && id.length > 0))
    } catch {
      return new Set<string>()
    }
  })
  const [canonicalIds, setCanonicalIds] = useState<Set<string> | null>(null)
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

  // Синхронизация сохранённых мер с сервером
  useEffect(() => {
    let cancelled = false
    apiClient.getSavedMeasures()
      .then((ids) => {
        if (cancelled) return
        setSavedMeasures((prev) => {
          const merged = new Set([...prev, ...ids])
          try {
            localStorage.setItem('zvery_saved_measures', JSON.stringify([...merged]))
          } catch {
            // no-op
          }
          return merged
        })
      })
      .catch(() => {
        // Local storage remains the offline visual state only.
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Канонический каталог — единственный источник production-данных о мерах (ADR 0001).
  // Пока каталог не загружен, сохранённые ID не фильтруются и не рендерятся как меры.
  useEffect(() => {
    let cancelled = false
    apiClient
      .getAllMeasures()
      .then((records) => {
        if (cancelled) return
        const ids = new Set(records.map((item) => item.id))
        setCanonicalIds(ids)
        setSavedMeasures((prev) => {
          const filtered = new Set([...prev].filter((id) => ids.has(id)))
          if (filtered.size === prev.size) return prev
          try {
            localStorage.setItem('zvery_saved_measures', JSON.stringify([...filtered]))
          } catch {
            // no-op
          }
          return filtered
        })
      })
      .catch(() => {
        // каталог недоступен: canonicalIds остаётся null, UI показывает честное отсутствие данных
      })
    return () => {
      cancelled = true
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

  // Сохранение/удаление подтверждает сервер: при недоступном API локальное состояние не меняется
  // и toast честно сообщает об ошибке вместо ложного успеха.
  const toggleSaveMeasure = (id: string) => {
    const isSaved = savedMeasures.has(id)
    if (isSaved) {
      apiClient
        .removeSavedMeasure(id)
        .then(() => {
          setSavedMeasures((prev) => {
            const next = new Set(prev)
            next.delete(id)
            try {
              localStorage.setItem('zvery_saved_measures', JSON.stringify([...next]))
            } catch {
              // no-op
            }
            return next
          })
          showToast('Удалено из сохранённых')
        })
        .catch(() => {
          showToast('Не удалось удалить: сервис недоступен')
        })
    } else {
      apiClient
        .saveMeasure(id)
        .then(() => {
          setSavedMeasures((prev) => {
            const next = new Set(prev)
            next.add(id)
            try {
              localStorage.setItem('zvery_saved_measures', JSON.stringify([...next]))
            } catch {
              // no-op
            }
            return next
          })
          showToast('Добавлено в сохранённые')
        })
        .catch(() => {
          showToast('Не удалось сохранить: сервис недоступен')
        })
    }
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
        canonicalIds,
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
