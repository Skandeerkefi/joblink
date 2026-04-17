const apiUrl = import.meta.env.VITE_API_URL || ''

export const API_BASE_URL = apiUrl ? apiUrl.replace(/\/api\/?$/, '') : ''
