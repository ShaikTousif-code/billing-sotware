import axios, { AxiosInstance, AxiosError } from 'axios'

// Get API base URL from environment variable, fallback to proxy path
// Remove trailing slash if present, then add /api
const baseUrl = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/+$/, '') || ''
const API_BASE_URL = baseUrl 
  ? `${baseUrl}/api`
  : '/api'

const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || '30000', 10)

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add token and prevent caching for all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // Prevent caching for all requests
    config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate, max-age=0'
    config.headers['Pragma'] = 'no-cache'
    config.headers['Expires'] = '0'
    
 
    
    // Debug logging (remove in production)
    if (import.meta.env.DEV) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
        params: config.params,
        headers: config.headers
      })
    }
    
    return config
  },
  (error) => {
    console.error('[API Request Error]', error)
    return Promise.reject(error)
  }
)

// Response interceptor for error handling and token refresh
api.interceptors.response.use(
  (response) => {
    // Debug logging (remove in production)
    if (import.meta.env.DEV) {
      console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data
      })
    }
    return response
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as any

    // Debug logging for errors
    if (import.meta.env.DEV) {
      console.error(`[API Error] ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url}`, {
        status: error.response?.status,
        message: error.message,
        data: error.response?.data
      })
    }

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      // Remove invalid token
      localStorage.removeItem('token')
      localStorage.removeItem('tenantId')
      localStorage.removeItem('tenantName')

      // Redirect to login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }

    // Handle 429 Too Many Requests
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after']
      const message = retryAfter
        ? `Rate limit exceeded. Please try again after ${retryAfter} seconds.`
        : 'Rate limit exceeded. Please try again later.'
      
      // Could show toast notification here
      console.warn(message)
    }

    return Promise.reject(error)
  }
)

export default api
