import { useState, useEffect } from 'react'
import api from '../services/api'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Users, Plus, Edit, Trash2, CheckCircle, XCircle, Search, Shield, Key, Building2, ArrowLeft } from 'lucide-react'

interface User {
  id: number
  email: string
  firstName: string
  lastName: string
  phone?: string
  isActive: boolean
  createdAt: string
  lastLoginAt?: string
  tenantId: number
  tenantName?: string
  tenantCode?: string
  roles: string[]
}

interface Role {
  id: number
  name: string
  description?: string
}

const UserManagement = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [tenants, setTenants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTenantId, setFilterTenantId] = useState<number | null>(() => {
    const tenantId = searchParams.get('tenantId')
    return tenantId ? parseInt(tenantId) : null
  })
  const [selectedTenant, setSelectedTenant] = useState<any | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [passwordUserId, setPasswordUserId] = useState<number | null>(null)

  useEffect(() => {
    fetchTenants()
    fetchRoles()
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [filterTenantId])

  useEffect(() => {
    if (tenants.length > 0 && filterTenantId) {
      const tenant = tenants.find(t => t.id === filterTenantId)
      setSelectedTenant(tenant || null)
      setSearchParams({ tenantId: filterTenantId.toString() })
    } else if (!filterTenantId) {
      setSelectedTenant(null)
      setSearchParams({})
    }
  }, [filterTenantId, tenants])

  const fetchTenants = async () => {
    try {
      console.log('[UserManagement] Fetching tenants...')
      const response = await api.get('/admin/tenants')
      console.log('[UserManagement] Tenants response:', response)
      const tenantsData = response.data.data || response.data || []
      setTenants(tenantsData)
      
      // If tenantId is in URL, find and set the tenant
      const tenantId = searchParams.get('tenantId')
      if (tenantId) {
        const tenant = tenantsData.find((t: any) => t.id === parseInt(tenantId))
        if (tenant) setSelectedTenant(tenant)
      }
    } catch (error) {
      console.error('[UserManagement] Error fetching tenants:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      console.log('[UserManagement] Fetching users...', { filterTenantId })
      setLoading(true)
      const params: any = {}
      if (filterTenantId) params.tenantId = filterTenantId
      const response = await api.get('/admin/users', { params })
      console.log('[UserManagement] Users response:', response)
      setUsers(response.data.data || response.data || [])
    } catch (error) {
      console.error('[UserManagement] Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRoles = async () => {
    try {
      const response = await api.get('/admin/users/roles')
      setRoles(response.data.data || response.data || [])
    } catch (error) {
      console.error('Error fetching roles:', error)
    }
  }

  const handleCreate = async (userData: any) => {
    try {
      await api.post('/admin/users', userData)
      setShowCreateModal(false)
      fetchUsers()
      alert('User created successfully!')
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create user')
    }
  }

  const handleUpdate = async (id: number, userData: any) => {
    try {
      await api.put(`/admin/users/${id}`, userData)
      setEditingUser(null)
      fetchUsers()
      alert('User updated successfully!')
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update user')
    }
  }

  const handleSetPassword = async (userId: number, password: string) => {
    try {
      await api.put(`/admin/users/${userId}`, { password })
      setPasswordUserId(null)
      fetchUsers()
      alert('Password updated successfully!')
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update password')
    }
  }

  const handleToggleActive = async (id: number, isActive: boolean) => {
    try {
      if (isActive) {
        await api.post(`/admin/users/${id}/activate`)
      } else {
        await api.post(`/admin/users/${id}/deactivate`)
      }
      fetchUsers()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update user')
    }
  }

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.tenantName?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading users...</div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4 sm:mb-6">
        {selectedTenant && (
          <div className="mb-4 p-3 sm:p-4 bg-primary-50 border border-primary-200 rounded-lg">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={() => {
                    setFilterTenantId(null)
                    setSelectedTenant(null)
                  }}
                  className="p-1 text-primary-600 hover:text-primary-800 hover:bg-primary-100 rounded transition-colors touch-manipulation"
                  title="Clear filter"
                >
                  <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
                <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600" />
                <div>
                  <div className="text-sm sm:text-base font-semibold text-primary-900">{selectedTenant.name}</div>
                  <div className="text-xs sm:text-sm text-primary-700">Code: {selectedTenant.code} | Type: {selectedTenant.businessType || 'N/A'}</div>
                </div>
              </div>
              <button
                onClick={() => navigate(`/admin/tenants`)}
                className="text-xs sm:text-sm text-primary-600 hover:text-primary-800 font-medium self-start sm:self-auto"
              >
                View Tenant Details →
              </button>
            </div>
          </div>
        )}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              {selectedTenant 
                ? `Manage users for ${selectedTenant.name}` 
                : 'Manage users across all tenants'}
            </p>
          </div>
          <button
            onClick={() => {
              if (selectedTenant) {
                // Pre-fill tenant in create modal
                setShowCreateModal(true)
              } else {
                setShowCreateModal(true)
              }
            }}
            className="bg-primary-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center justify-center gap-2 text-sm touch-manipulation"
          >
            <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline">Create User</span>
            <span className="sm:hidden">Create</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <select
          value={filterTenantId || ''}
          onChange={(e) => {
            const tenantId = e.target.value ? parseInt(e.target.value) : null
            setFilterTenantId(tenantId)
            if (tenantId) {
              const tenant = tenants.find(t => t.id === tenantId)
              setSelectedTenant(tenant || null)
            } else {
              setSelectedTenant(null)
            }
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="">All Tenants</option>
          {tenants.map(t => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.code})
            </option>
          ))}
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Tenant</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Roles</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Last Login</th>
                <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 mr-2" />
                      <div>
                        <div className="text-xs sm:text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500">{user.email}</div>
                        <div className="md:hidden text-xs text-gray-400 mt-1">
                          {user.tenantName || 'N/A'} • {user.roles.join(', ')}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                    <button
                      onClick={() => navigate(`/admin/tenants`)}
                      className="flex items-center gap-2 text-left hover:text-primary-600 transition-colors group"
                    >
                      <Building2 className="h-4 w-4 text-gray-400 group-hover:text-primary-600" />
                      <div>
                        <div className="text-xs sm:text-sm text-gray-900 group-hover:text-primary-600 font-medium">
                          {user.tenantName || 'N/A'}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500 font-mono">{user.tenantCode}</div>
                      </div>
                    </button>
                  </td>
                  <td className="px-3 sm:px-6 py-4 hidden lg:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((role) => (
                        <span
                          key={role}
                          className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 flex items-center gap-1"
                        >
                          <Shield className="h-3 w-3" />
                          {role}
                        </span>
                      ))}
                    </div>
                  </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    {user.isActive ? (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 flex items-center gap-1 w-fit">
                        <CheckCircle className="h-3 w-3" />
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 flex items-center gap-1 w-fit">
                        <XCircle className="h-3 w-3" />
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden lg:table-cell">
                    {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-xs sm:text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setEditingUser(user)}
                      className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                      title="Edit User"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setPasswordUserId(user.id)}
                      className="text-purple-600 hover:text-purple-900 p-1 rounded hover:bg-purple-50 transition-colors"
                      title="Set Password"
                    >
                      <Key className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleToggleActive(user.id, !user.isActive)}
                      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                        user.isActive
                          ? 'text-red-600 hover:text-red-900 hover:bg-red-50'
                          : 'text-green-600 hover:text-green-900 hover:bg-green-50'
                      }`}
                    >
                      {user.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>
        {filteredUsers.length === 0 && (
          <div className="text-center py-12 text-gray-500">No users found</div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingUser) && (
        <UserModal
          user={editingUser}
          roles={roles}
          tenants={tenants}
          preSelectedTenantId={selectedTenant?.id}
          onClose={() => {
            setShowCreateModal(false)
            setEditingUser(null)
          }}
          onSubmit={editingUser ? (data) => handleUpdate(editingUser.id, data) : handleCreate}
        />
      )}

      {/* Password Set Modal */}
      {passwordUserId && (
        <PasswordModal
          userId={passwordUserId}
          userEmail={users.find(u => u.id === passwordUserId)?.email || ''}
          onClose={() => setPasswordUserId(null)}
          onSubmit={(password) => handleSetPassword(passwordUserId, password)}
        />
      )}
    </div>
  )
}

const UserModal = ({
  user,
  roles,
  tenants,
  preSelectedTenantId,
  onClose,
  onSubmit,
}: {
  user?: User | null
  roles: Role[]
  tenants?: any[]
  preSelectedTenantId?: number
  onClose: () => void
  onSubmit: (data: any) => void
}) => {
  const [formData, setFormData] = useState({
    tenantId: user?.tenantId || preSelectedTenantId || 0,
    email: user?.email || '',
    password: '',
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    isActive: user?.isActive ?? true,
    roleIds: user?.roles.map(r => roles.find(role => role.name === r)?.id).filter(Boolean) || [],
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!user && !formData.password) {
      alert('Password is required for new users')
      return
    }
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">{user ? 'Edit User' : 'Create User'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tenant *</label>
              <select
                required
                value={formData.tenantId}
                onChange={(e) => setFormData({ ...formData, tenantId: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={!!user}
              >
                <option value="0">Select Tenant</option>
                {tenants?.map(tenant => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.name} ({tenant.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                disabled={!!user}
              />
            </div>
            {!user && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formData.isActive ? 'true' : 'false'}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Roles</label>
            <div className="grid grid-cols-3 gap-2">
              {roles.map((role) => (
                <label key={role.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.roleIds.includes(role.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({ ...formData, roleIds: [...formData.roleIds, role.id] })
                      } else {
                        setFormData({ ...formData, roleIds: formData.roleIds.filter(id => id !== role.id) })
                      }
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm">{role.name}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              {user ? 'Update' : 'Create'} User
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const PasswordModal = ({
  userId: _userId,
  userEmail,
  onClose,
  onSubmit,
}: {
  userId: number
  userEmail: string
  onClose: () => void
  onSubmit: (password: string) => void
}) => {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({})

  const validatePassword = () => {
    const newErrors: { password?: string; confirmPassword?: string } = {}
    
    if (!password) {
      newErrors.password = 'Password is required'
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }
    
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validatePassword()) {
      onSubmit(password)
      setPassword('')
      setConfirmPassword('')
      setErrors({})
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white rounded-lg p-6 w-full max-w-md animate-scale-in shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-purple-600" />
            <h2 className="text-2xl font-bold">Set Password</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>
        
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <span className="font-medium">User:</span> {userEmail}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (errors.password) setErrors({ ...errors, password: undefined })
                }}
                className={`w-full px-3 py-2 border rounded-lg pr-10 ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                } focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Password must be at least 6 characters long
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password *
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value)
                if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined })
              }}
              className={`w-full px-3 py-2 border rounded-lg ${
                errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
              } focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
              placeholder="Confirm new password"
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Set Password
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default UserManagement

