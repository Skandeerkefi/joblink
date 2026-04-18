import { createContext, useContext, useEffect, useMemo, useState } from 'react'

type Language = 'en' | 'fr'

interface Translation {
  nav: {
    home: string
    jobs: string
    dashboard: string
    myApplications: string
    savedJobs: string
    myResumes: string
    atsChecker: string
    myJobs: string
    applications: string
    adminUsers: string
    light: string
    dark: string
    switchToLight: string
    switchToDark: string
    login: string
    register: string
    logout: string
    language: string
  }
  jobs: {
    locationPlaceholder: string
    allGovernorates: string
    search: string
    clearAllFilters: string
    clearFilters: string
    remoteOnly: string
    allTypes: string
    allCategories: string
    title: string
    subtitle: string
    searchPlaceholder: string
    skillsPlaceholder: string
  }
  jobForm: {
    location: string
    selectGovernorate: string
    remotePosition: string
  }
}

const translations: Record<Language, Translation> = {
  en: {
    nav: {
      home: 'Home',
      jobs: 'Jobs',
      dashboard: 'Dashboard',
      myApplications: 'My Applications',
      savedJobs: 'Saved Jobs',
      myResumes: 'My Resumes',
      atsChecker: 'ATS Checker',
      myJobs: 'My Jobs',
      applications: 'Applications',
      adminUsers: 'Admin Users',
      light: '☀ Light',
      dark: '🌙 Dark',
      switchToLight: '☀ Switch to light',
      switchToDark: '🌙 Switch to dark',
      login: 'Login',
      register: 'Register',
      logout: 'Logout',
      language: 'Language',
    },
    jobs: {
      locationPlaceholder: 'Select governorate',
      allGovernorates: 'All Governorates',
      search: 'Search',
      clearAllFilters: 'Clear all filters',
      clearFilters: 'Clear filters',
      remoteOnly: 'Remote only',
      allTypes: 'All Types',
      allCategories: 'All Categories',
      title: 'Find Your Next Job',
      subtitle: 'Browse opportunities from top companies',
      searchPlaceholder: 'Search jobs by title or description...',
      skillsPlaceholder: 'Skills (e.g. React, Node)',
    },
    jobForm: {
      location: 'Location',
      selectGovernorate: 'Select a governorate',
      remotePosition: 'Remote position',
    },
  },
  fr: {
    nav: {
      home: 'Accueil',
      jobs: 'Offres',
      dashboard: 'Tableau de bord',
      myApplications: 'Mes candidatures',
      savedJobs: 'Offres sauvegardées',
      myResumes: 'Mes CV',
      atsChecker: 'Analyse ATS',
      myJobs: 'Mes offres',
      applications: 'Candidatures',
      adminUsers: 'Utilisateurs admin',
      light: '☀ Clair',
      dark: '🌙 Sombre',
      switchToLight: '☀ Passer en clair',
      switchToDark: '🌙 Passer en sombre',
      login: 'Connexion',
      register: 'Inscription',
      logout: 'Déconnexion',
      language: 'Langue',
    },
    jobs: {
      locationPlaceholder: 'Choisir un gouvernorat',
      allGovernorates: 'Tous les gouvernorats',
      search: 'Rechercher',
      clearAllFilters: 'Effacer tous les filtres',
      clearFilters: 'Effacer les filtres',
      remoteOnly: 'À distance uniquement',
      allTypes: 'Tous les types',
      allCategories: 'Toutes les catégories',
      title: 'Trouvez votre prochain emploi',
      subtitle: 'Parcourez des opportunités de grandes entreprises',
      searchPlaceholder: 'Rechercher par titre ou description...',
      skillsPlaceholder: 'Compétences (ex. React, Node)',
    },
    jobForm: {
      location: 'Localisation',
      selectGovernorate: 'Choisir un gouvernorat',
      remotePosition: 'Poste à distance',
    },
  },
}

interface LanguageContextType {
  language: Language
  setLanguage: (language: Language) => void
  t: Translation
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const stored = localStorage.getItem('language')
    return stored === 'fr' ? 'fr' : 'en'
  })

  useEffect(() => {
    localStorage.setItem('language', language)
    document.documentElement.lang = language
  }, [language])

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t: translations[language],
    }),
    [language]
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
