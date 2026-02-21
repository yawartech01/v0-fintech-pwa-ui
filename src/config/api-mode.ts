// API Connection Mode Configuration
// Set to 'api' to use real backend, 'mock' to use localStorage

export const API_MODE = (import.meta.env.VITE_API_MODE || 'mock') as 'api' | 'mock'

export const useRealAPI = () => API_MODE === 'api'

// Check if backend is available
export const checkBackendHealth = async (): Promise<boolean> => {
  if (API_MODE === 'mock') return true
  
  try {
    const response = await fetch(import.meta.env.VITE_API_URL?.replace('/api', '') + '/health', {
      method: 'GET',
      signal: AbortSignal.timeout(3000),
    })
    return response.ok
  } catch {
    console.warn('⚠️ Backend API unavailable, using localStorage fallback')
    return false
  }
}
