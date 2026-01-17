import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import api from '../services/api'
import { AuthContextType, LoginResponse, User } from '../types'

const AuthContext = createContext<AuthContextType | null>(null)

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const [tenantId, setTenantId] = useState<string | null>(localStorage.getItem('tenantId'))

  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      // Optionally fetch user details
    }
    setLoading(false)
  }, [token])

  const login = async (
    tenantCode: string | undefined,
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('[AuthContext] Calling login API...', { tenantCode: tenantCode || 'auto-detect', email })
      const response = await api.post<any>('/auth/login', {
        ...(tenantCode && { tenantCode }), // Only include tenantCode if provided
        email,
        password,
      })
      console.log('[AuthContext] Login API response:', response)
      
      // Handle different response structures - API may return data directly or wrapped in data property
      const responseData = (response.data?.data || response.data) as LoginResponse
      const { 
        token: newToken, 
        tenantId: newTenantId, 
        tenantName, 
        tenantCode: responseTenantCode, 
        businessType, 
        userRoles, 
        userName, 
        userEmail, 
        isSuperAdmin 
      } = responseData

      if (!newToken) {
        console.error('[AuthContext] No token in response:', responseData)
        return {
          success: false,
          error: 'Invalid response from server - no token received',
        }
      }

      console.log('[AuthContext] Saving authentication data...')
      setToken(newToken)
      const tenantIdStr = newTenantId?.toString() || ''
      setTenantId(tenantIdStr)
      localStorage.setItem('token', newToken)
      localStorage.setItem('tenantId', tenantIdStr)
      localStorage.setItem('tenantName', tenantName || 'Tenant')
      localStorage.setItem('tenantCode', responseTenantCode || tenantCode || '')
      localStorage.setItem('billingType', businessType || 'General')
      localStorage.setItem('userType', userRoles && userRoles.length > 0 ? userRoles.join(', ') : 'User')
      localStorage.setItem('userName', userName || userEmail || email)
      localStorage.setItem('isSuperAdmin', isSuperAdmin ? 'true' : 'false')

      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`

      setUser({
        id: 0, // Will be set from actual user data if available
        email: userEmail || email,
        tenantId: newTenantId,
        firstName: userName ? userName.split(' ')[0] : '',
        lastName: userName ? userName.split(' ').slice(1).join(' ') : '',
        isActive: true,
        createdAt: new Date().toISOString(),
      })
      
      console.log('[AuthContext] Login successful!')
      return { success: true }
    } catch (error: any) {
      console.error('[AuthContext] Login error:', error)
      console.error('[AuthContext] Error response:', error.response)
      console.error('[AuthContext] Error data:', error.response?.data)
      
      const errorMessage = error.response?.data?.message 
        || error.response?.data?.error
        || error.message 
        || 'Login failed'
      
      return {
        success: false,
        error: errorMessage,
      }
    }
  }

  const logout = (): void => {
    setToken(null)
    setTenantId(null)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('tenantId')
    localStorage.removeItem('tenantName')
    delete api.defaults.headers.common['Authorization']
  }

  return (
    <AuthContext.Provider value={{ user, token, tenantId, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

