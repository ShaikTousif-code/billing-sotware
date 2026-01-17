import React, { useEffect, useState } from 'react'
import api from '../services/api'
import { Save, Check } from 'lucide-react'

interface Permission {
  id: number
  name: string
  description?: string
  category: string
}

interface Role {
  id: number
  name: string
  description?: string
}

interface RolePermission {
  roleId: number
  permissionId: number
  hasPermission: boolean
}

const Permissions = () => {
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [rolePermissions, setRolePermissions] = useState<Map<string, boolean>>(new Map())
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async (): Promise<void> => {
    try {
      const [permsRes, rolesRes, rolePermsRes] = await Promise.all([
        api.get<Permission[]>('/permissions'),
        api.get<Role[]>('/roles'),
        api.get<RolePermission[]>('/role-permissions'),
      ])

      setPermissions(permsRes.data)
      setRoles(rolesRes.data)

      const map = new Map<string, boolean>()
      rolePermsRes.data.forEach((rp) => {
        map.set(`${rp.roleId}-${rp.permissionId}`, rp.hasPermission)
      })
      setRolePermissions(map)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const togglePermission = (roleId: number, permissionId: number): void => {
    const key = `${roleId}-${permissionId}`
    const newMap = new Map(rolePermissions)
    newMap.set(key, !newMap.get(key))
    setRolePermissions(newMap)
  }

  const handleSave = async (): Promise<void> => {
    try {
      const updates: RolePermission[] = []
      rolePermissions.forEach((hasPermission, key) => {
        const [roleId, permissionId] = key.split('-').map(Number)
        updates.push({ roleId, permissionId, hasPermission })
      })

      await api.post('/role-permissions/bulk-update', updates)
      alert('Permissions updated successfully')
    } catch (error) {
      console.error('Error updating permissions:', error)
      alert('Failed to update permissions')
    }
  }

  const groupedPermissions = permissions.reduce((acc, perm) => {
    if (!acc[perm.category]) {
      acc[perm.category] = []
    }
    acc[perm.category].push(perm)
    return acc
  }, {} as Record<string, Permission[]>)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Permission Management</h1>
          <p className="mt-1 text-sm text-gray-500">Manage role-based permissions</p>
        </div>
        <button
          onClick={handleSave}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
        >
          <Save className="h-5 w-5 mr-2" />
          Save Changes
        </button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Permission</th>
                {roles.map((role) => (
                  <th key={role.id} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    {role.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.entries(groupedPermissions).map(([category, perms]) => (
                <React.Fragment key={category}>
                  <tr className="bg-gray-100">
                    <td colSpan={roles.length + 1} className="px-6 py-2 text-sm font-semibold text-gray-700">
                      {category}
                    </td>
                  </tr>
                  {perms.map((permission) => (
                    <tr key={permission.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{permission.name}</div>
                        {permission.description && (
                          <div className="text-sm text-gray-500">{permission.description}</div>
                        )}
                      </td>
                      {roles.map((role) => {
                        const key = `${role.id}-${permission.id}`
                        const hasPermission = rolePermissions.get(key) || false
                        return (
                          <td key={role.id} className="px-6 py-4 whitespace-nowrap text-center">
                            <button
                              onClick={() => togglePermission(role.id, permission.id)}
                              className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                                hasPermission
                                  ? 'bg-primary-600 border-primary-600'
                                  : 'bg-white border-gray-300'
                              }`}
                            >
                              {hasPermission && <Check className="h-4 w-4 text-white" />}
                            </button>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Permissions

