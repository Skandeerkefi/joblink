export interface PersonalInfo {
  fullName: string
  email: string
  phone: string
  location: string
  links: string[]
}

export interface Education {
  school: string
  degree: string
  field: string
  startYear: string
  endYear: string
  details: string
}

export interface Experience {
  company: string
  title: string
  location: string
  startDate: string
  endDate: string
  current: boolean
  bullets: string[]
}

export interface Project {
  name: string
  link: string
  description: string
  bullets: string[]
}

export interface ManualData {
  personalInfo: PersonalInfo
  summary: string
  skills: string[]
  education: Education[]
  experience: Experience[]
  projects: Project[]
}

export interface Resume {
  _id: string
  type: 'UPLOAD' | 'MANUAL'
  // UPLOAD
  originalName?: string
  fileUrl?: string
  fileSize?: number
  // MANUAL
  title?: string
  manualData?: ManualData
  createdAt: string
}

export const emptyManualData = (): ManualData => ({
  personalInfo: { fullName: '', email: '', phone: '', location: '', links: [] },
  summary: '',
  skills: [],
  education: [],
  experience: [],
  projects: [],
})
