const DEFAULT_API_URL = 'https://joblink-production-00f1.up.railway.app/api'
const rawApiUrl = import.meta.env.VITE_API_URL?.trim()

export const API_URL = rawApiUrl || DEFAULT_API_URL
export const API_BASE_URL = API_URL.replace(/\/api\/?$/, '')
