import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ShoppingCart } from 'lucide-react'

const Login = () => {
  const [tenantCode, setTenantCode] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [showTenantCode, setShowTenantCode] = useState<boolean>(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    console.log('[Login] Attempting login...', { tenantCode: tenantCode || 'auto-detect', email })
    
    try {
      const result = await login(tenantCode || undefined, email, password)
      console.log('[Login] Login result:', result)
      
      setLoading(false)

      if (result.success) {
        console.log('[Login] Login successful, navigating to dashboard...')
        navigate('/dashboard')
      } else {
        console.error('[Login] Login failed:', result.error)
        setError(result.error || 'Login failed')
        // If error indicates tenant code is required, show the tenant code field
        if (result.error?.includes('multiple tenants') || result.error?.includes('tenant code')) {
          setShowTenantCode(true)
        }
      }
    } catch (err: any) {
      console.error('[Login] Login exception:', err)
      setLoading(false)
      const errorMessage = err.response?.data?.message || 'An unexpected error occurred during login'
      setError(errorMessage)
      // If error indicates tenant code is required, show the tenant code field
      if (errorMessage.includes('multiple tenants') || errorMessage.includes('tenant code')) {
        setShowTenantCode(true)
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4 py-8 sm:py-0">
      <div className="max-w-md w-full space-y-6 sm:space-y-8 bg-white p-4 sm:p-8 rounded-lg shadow-lg">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="bg-primary-600 p-2 sm:p-3 rounded-full">
              <ShoppingCart className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
          </div>
          <h2 className="mt-4 sm:mt-6 text-2xl sm:text-3xl font-bold text-gray-900">
            Billing Software
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-gray-600">
            Sign in to your account
          </p>
        </div>
        <form className="mt-6 sm:mt-8 space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded text-xs sm:text-sm">
              {error}
            </div>
          )}
          <div className="space-y-3 sm:space-y-4">
            {showTenantCode && (
              <div>
                <label htmlFor="tenantCode" className="block text-xs sm:text-sm font-medium text-gray-700">
                  Tenant Code <span className="text-red-500">*</span>
                </label>
                <input
                  id="tenantCode"
                  name="tenantCode"
                  type="text"
                  required={showTenantCode}
                  value={tenantCode}
                  onChange={(e) => setTenantCode(e.target.value)}
                  className="mt-1 block w-full px-3 py-2.5 sm:py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter tenant code"
                />
                <p className="mt-1 text-xs text-gray-500">Required when user exists in multiple tenants</p>
              </div>
            )}
            {!showTenantCode && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setShowTenantCode(true)}
                  className="text-xs sm:text-sm text-primary-600 hover:text-primary-700"
                >
                  Have multiple tenants? Enter tenant code
                </button>
              </div>
            )}
            <div>
              <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2.5 sm:py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-xs sm:text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2.5 sm:py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 sm:py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 touch-manipulation"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Login

