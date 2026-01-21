import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { format } from 'date-fns'
import { Activity, Eye, Filter, X, Calendar, User, FileText } from 'lucide-react'
import Pagination from '../components/Pagination'
import FilterPanel from '../components/FilterPanel'
import EmptyState from '../components/EmptyState'
import { formatToLocalTime } from '../utils/dateUtils'

interface ActivityLog {
  id: number
  action: string
  entityType: string
  entityId?: number
  entityName?: string
  oldValues?: string
  newValues?: string
  ipAddress?: string
  userAgent?: string
  createdAt: string
  user?: {
    firstName: string
    lastName: string
    email?: string
  }
}

interface ActivityLogsResponse {
  data: ActivityLog[]
  pageNumber: number
  pageSize: number
  totalCount: number
}

interface Filters {
  entityType?: string
  entityId?: number
  userId?: number
  action?: string
  fromDate?: string
  toDate?: string
}

const ActivityLogs = () => {
  const navigate = useNavigate()
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [filtersOpen, setFiltersOpen] = useState<boolean>(false)
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null)
  const [filters, setFilters] = useState<Filters>({})
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(50)
  const [totalCount, setTotalCount] = useState<number>(0)

  useEffect(() => {
    fetchLogs()
  }, [filters, currentPage, pageSize])

  const fetchLogs = async (): Promise<void> => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      if (filters.entityType) params.append('entityType', filters.entityType)
      if (filters.entityId) params.append('entityId', filters.entityId.toString())
      if (filters.userId) params.append('userId', filters.userId.toString())
      if (filters.action) params.append('action', filters.action)
      if (filters.fromDate) params.append('fromDate', filters.fromDate)
      if (filters.toDate) params.append('toDate', filters.toDate)
      params.append('page', currentPage.toString())
      params.append('pageSize', pageSize.toString())

      const response = await api.get<ActivityLogsResponse>(`/activity-logs?${params.toString()}`)
      
      // Ensure logs is always an array
      let logsArray: ActivityLog[] = []
      let total = 0
      
      if (response.data) {
        // Check if response has paginated structure
        if ('data' in response.data && Array.isArray(response.data.data)) {
          logsArray = response.data.data
          total = response.data.totalCount || response.data.data.length
        } 
        // Check if response.data itself is an array
        else if (Array.isArray(response.data)) {
          logsArray = response.data
          total = response.data.length
        }
        // Check if response.data.data exists but might be an object
        else if (response.data.data && Array.isArray(response.data.data)) {
          logsArray = response.data.data
          total = response.data.totalCount || response.data.data.length
        }
        // Last resort: try to extract from nested structure
        else if (typeof response.data === 'object') {
          const data = (response.data as any).data
          if (Array.isArray(data)) {
            logsArray = data
            total = (response.data as any).totalCount || data.length
          }
        }
      }
      
      setLogs(logsArray)
      setTotalCount(total)
    } catch (error: any) {
      console.error('Error fetching activity logs:', error)
      // If it's a critical error, navigate back
      if (error?.response?.status >= 500 || error?.message?.includes('Network')) {
        console.error('Critical error, navigating back')
        setTimeout(() => {
          if (window.history.length > 1) {
            navigate(-1)
          } else {
            navigate('/dashboard', { replace: true })
          }
        }, 1000)
      }
      setLogs([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key: keyof Filters, value: string | number | undefined) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1) // Reset to first page when filters change
  }

  const handleResetFilters = () => {
    setFilters({})
    setCurrentPage(1)
  }

  const getActiveFilterCount = () => {
    return Object.values(filters).filter(v => v !== undefined && v !== '').length
  }

  const getActionColor = (action: string) => {
    switch (action.toUpperCase()) {
      case 'CREATE':
      case 'POST':
        return 'bg-green-100 text-green-800'
      case 'UPDATE':
      case 'PUT':
      case 'PATCH':
        return 'bg-blue-100 text-blue-800'
      case 'DELETE':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatAction = (action: string) => {
    switch (action.toUpperCase()) {
      case 'POST':
        return 'Create'
      case 'PUT':
      case 'PATCH':
        return 'Update'
      case 'DELETE':
        return 'Delete'
      default:
        return action
    }
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  if (loading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="h-6 w-6 sm:h-7 sm:w-7 text-primary-600" />
            Activity Logs
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-500">
            View system activity and audit trail
          </p>
        </div>
      </div>

      {/* Filters */}
      <FilterPanel
        isOpen={filtersOpen}
        onToggle={() => setFiltersOpen(!filtersOpen)}
        onReset={handleResetFilters}
        activeFilterCount={getActiveFilterCount()}
      >
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Entity Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Entity Type
              </label>
              <select
                value={filters.entityType || ''}
                onChange={(e) => handleFilterChange('entityType', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Types</option>
                <option value="Invoice">Invoice</option>
                <option value="Product">Product</option>
                <option value="Customer">Customer</option>
                <option value="Payment">Payment</option>
                <option value="Inventory">Inventory</option>
                <option value="User">User</option>
                <option value="Tenant">Tenant</option>
              </select>
            </div>

            {/* Action */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Action
              </label>
              <select
                value={filters.action || ''}
                onChange={(e) => handleFilterChange('action', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Actions</option>
                <option value="Create">Create</option>
                <option value="Update">Update</option>
                <option value="Delete">Delete</option>
              </select>
            </div>

            {/* Entity ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Entity ID
              </label>
              <input
                type="number"
                value={filters.entityId || ''}
                onChange={(e) => handleFilterChange('entityId', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Enter entity ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* From Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Date
              </label>
              <input
                type="date"
                value={filters.fromDate || ''}
                onChange={(e) => handleFilterChange('fromDate', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* To Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To Date
              </label>
              <input
                type="date"
                value={filters.toDate || ''}
                onChange={(e) => handleFilterChange('toDate', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        </div>
      </FilterPanel>

      {/* Logs Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {!Array.isArray(logs) || logs.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="No activity logs found"
            description="There are no activity logs matching your filters."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                      User
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                      Entity
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Array.isArray(logs) && logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <div className="text-xs sm:text-sm text-gray-900">
                          {formatToLocalTime(log.createdAt, 'MMM dd, yyyy')}
                        </div>
                        <div className="text-xs text-gray-500 sm:hidden">
                          {formatToLocalTime(log.createdAt, 'HH:mm:ss')}
                        </div>
                        <div className="text-xs text-gray-500 hidden sm:block">
                          {formatToLocalTime(log.createdAt, 'HH:mm:ss')}
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 hidden sm:table-cell">
                        {log.user ? (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span>{log.user.firstName} {log.user.lastName}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">System</span>
                        )}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getActionColor(log.action)}`}
                        >
                          {formatAction(log.action)}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <span>{log.entityType}</span>
                          {log.entityId && (
                            <span className="text-gray-400">#{log.entityId}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm text-gray-500">
                        <div className="max-w-xs truncate">
                          {log.entityName || '-'}
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-xs sm:text-sm font-medium">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="text-primary-600 hover:text-primary-900 touch-manipulation p-1"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-200">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalCount}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={(size) => {
                    setPageSize(size)
                    setCurrentPage(1)
                  }}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Activity Log Details</h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500">Date & Time</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {formatToLocalTime(selectedLog.createdAt, 'MMM dd, yyyy HH:mm:ss')}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">User</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedLog.user 
                      ? `${selectedLog.user.firstName} ${selectedLog.user.lastName}`
                      : 'System'}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Action</label>
                  <p className="mt-1">
                    <span className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full ${getActionColor(selectedLog.action)}`}>
                      {formatAction(selectedLog.action)}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Entity Type</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedLog.entityType}</p>
                </div>
                {selectedLog.entityId && (
                  <div>
                    <label className="text-xs font-medium text-gray-500">Entity ID</label>
                    <p className="mt-1 text-sm text-gray-900">#{selectedLog.entityId}</p>
                  </div>
                )}
                {selectedLog.entityName && (
                  <div>
                    <label className="text-xs font-medium text-gray-500">Entity Name</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedLog.entityName}</p>
                  </div>
                )}
                {selectedLog.ipAddress && (
                  <div>
                    <label className="text-xs font-medium text-gray-500">IP Address</label>
                    <p className="mt-1 text-sm text-gray-900 font-mono">{selectedLog.ipAddress}</p>
                  </div>
                )}
              </div>
              
              {selectedLog.newValues && (
                <div>
                  <label className="text-xs font-medium text-gray-500">New Values</label>
                  <pre className="mt-1 p-3 bg-gray-50 rounded-md text-xs overflow-x-auto">
                    {(() => {
                      try {
                        const parsed = JSON.parse(selectedLog.newValues)
                        return JSON.stringify(parsed, null, 2)
                      } catch (e) {
                        return selectedLog.newValues
                      }
                    })()}
                  </pre>
                </div>
              )}
              
              {selectedLog.oldValues && (
                <div>
                  <label className="text-xs font-medium text-gray-500">Old Values</label>
                  <pre className="mt-1 p-3 bg-gray-50 rounded-md text-xs overflow-x-auto">
                    {(() => {
                      try {
                        const parsed = JSON.parse(selectedLog.oldValues)
                        return JSON.stringify(parsed, null, 2)
                      } catch (e) {
                        return selectedLog.oldValues
                      }
                    })()}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ActivityLogs
