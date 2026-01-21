import { useEffect, useState } from 'react'
import api from '../services/api'
import { AlertTriangle, Package } from 'lucide-react'

interface LowStockAlert {
  productId: number
  productName: string
  currentStock: number
  lowStockThreshold: number
  unit: string
  isLowStock?: boolean
  hasAlertConfigured?: boolean
}

interface ExpiryAlert {
  batchId: number
  productId: number
  productName: string
  batchNumber: string
  expiryDate: string
  daysUntilExpiry: number
  quantity: number
  alertThresholdDays: number
  status?: string // "ACTIVE", "NEAR_EXPIRY", "EXPIRED"
}

const Alerts = () => {
  const [lowStockAlerts, setLowStockAlerts] = useState<LowStockAlert[]>([])
  const [expiryAlerts, setExpiryAlerts] = useState<ExpiryAlert[]>([])
  const [allExpiryAlerts, setAllExpiryAlerts] = useState<ExpiryAlert[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [expiryFilter, setExpiryFilter] = useState<'all' | 30 | 60 | 90>('all')

  useEffect(() => {
    fetchAlerts()
  }, [])

  useEffect(() => {
    filterExpiryAlerts()
  }, [expiryFilter, allExpiryAlerts])

  const fetchAlerts = async (): Promise<void> => {
    try {
      const [lowStockRes, expiryRes] = await Promise.all([
        api.get<LowStockAlert[]>('/alerts/low-stock'),
        api.get<ExpiryAlert[]>('/alerts/expiry?daysAhead=365'), // Fetch all alerts (1 year ahead to include all)
      ])
      setLowStockAlerts(lowStockRes.data)
      setAllExpiryAlerts(expiryRes.data)
    } catch (error) {
      console.error('Error fetching alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterExpiryAlerts = (): void => {
    if (expiryFilter === 'all') {
      setExpiryAlerts(allExpiryAlerts)
      return
    }

    const filtered = allExpiryAlerts.filter(alert => {
      // Always include expired products
      if (alert.daysUntilExpiry < 0) {
        return true
      }
      // Include products expiring within the selected timeline (0 to N days)
      return alert.daysUntilExpiry >= 0 && alert.daysUntilExpiry <= expiryFilter
    })
    setExpiryAlerts(filtered)
  }

  const getExpiryFilterLabel = (): string => {
    if (expiryFilter === 'all') return 'All Expiry Alerts'
    return `Expiring Within ${expiryFilter} Days`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Alerts</h1>
        <p className="mt-1 text-sm text-gray-500">Low stock and expiry alerts</p>
      </div>

      {/* Low Stock Alerts */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Package className="h-6 w-6 text-yellow-600 mr-2" />
          <h2 className="text-lg font-medium text-gray-900">Inventory Alerts ({lowStockAlerts.length})</h2>
        </div>
        {lowStockAlerts.length === 0 ? (
          <p className="text-gray-500">No products with inventory tracking</p>
        ) : (
          <div className="space-y-2">
            {lowStockAlerts.map((alert) => (
              <div key={alert.productId} className={`flex justify-between items-center p-3 rounded-lg ${
                alert.isLowStock ? 'bg-red-50 border border-red-200' :
                alert.hasAlertConfigured ? 'bg-yellow-50' : 'bg-blue-50'
              }`}>
                <div>
                  <div className="font-medium text-gray-900">{alert.productName}</div>
                  <div className="text-sm text-gray-500">
                    Current: {alert.currentStock} {alert.unit} | Threshold: {alert.lowStockThreshold} {alert.unit}
                  </div>
                  {alert.isLowStock ? (
                    <div className="text-sm font-medium text-red-600 mt-1">
                      ⚠️ Low stock alert - below threshold!
                    </div>
                  ) : alert.hasAlertConfigured ? (
                    <div className="text-sm font-medium text-green-600 mt-1">
                      ✓ Low stock alerts configured (threshold: {alert.lowStockThreshold})
                    </div>
                  ) : (
                    <div className="text-sm font-medium text-blue-600 mt-1">
                      ℹ️ No low stock alerts configured
                    </div>
                  )}
                </div>
                <AlertTriangle className={`h-5 w-5 ${
                  alert.isLowStock ? 'text-red-600' :
                  alert.hasAlertConfigured ? 'text-green-600' : 'text-blue-600'
                }`} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Expiry Alerts */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <AlertTriangle className="h-6 w-6 text-red-600 mr-2" />
            <div>
              <h2 className="text-lg font-medium text-gray-900">{getExpiryFilterLabel()} ({expiryAlerts.length})</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {allExpiryAlerts.length > 0 && (
                  <>
                    {allExpiryAlerts.filter(a => a.daysUntilExpiry < 0).length} expired, {' '}
                    {allExpiryAlerts.filter(a => a.daysUntilExpiry >= 0 && a.daysUntilExpiry <= 30).length} within 30 days, {' '}
                    {allExpiryAlerts.filter(a => a.daysUntilExpiry >= 0 && a.daysUntilExpiry <= 60).length} within 60 days, {' '}
                    {allExpiryAlerts.filter(a => a.daysUntilExpiry >= 0 && a.daysUntilExpiry <= 90).length} within 90 days
                  </>
                )}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setExpiryFilter('all')}
              className={`px-3 py-1 text-sm rounded-md font-medium transition-colors ${
                expiryFilter === 'all'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setExpiryFilter(30)}
              className={`px-3 py-1 text-sm rounded-md font-medium transition-colors ${
                expiryFilter === 30
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Within 30 Days
            </button>
            <button
              onClick={() => setExpiryFilter(60)}
              className={`px-3 py-1 text-sm rounded-md font-medium transition-colors ${
                expiryFilter === 60
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Within 60 Days
            </button>
            <button
              onClick={() => setExpiryFilter(90)}
              className={`px-3 py-1 text-sm rounded-md font-medium transition-colors ${
                expiryFilter === 90
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Within 90 Days
            </button>
          </div>
        </div>
        {expiryAlerts.length === 0 ? (
          <p className="text-gray-500">No expiry alerts</p>
        ) : (
          <div className="space-y-2">
            {expiryAlerts.map((alert) => {
              const status = alert.status || (alert.daysUntilExpiry < 0 ? 'EXPIRED' : alert.daysUntilExpiry <= alert.alertThresholdDays ? 'NEAR_EXPIRY' : 'ACTIVE')
              const statusColors = {
                EXPIRED: 'bg-red-50 border-red-200',
                NEAR_EXPIRY: 'bg-orange-50 border-orange-200',
                ACTIVE: 'bg-yellow-50 border-yellow-200'
              }
              const statusText = {
                EXPIRED: 'text-red-600',
                NEAR_EXPIRY: 'text-orange-600',
                ACTIVE: 'text-yellow-600'
              }
              
              return (
                <div
                  key={alert.batchId}
                  className={`flex justify-between items-center p-3 rounded-lg border ${statusColors[status as keyof typeof statusColors] || 'bg-gray-50'}`}
                >
                  <div>
                    <div className="font-medium text-gray-900">{alert.productName}</div>
                    <div className="text-sm text-gray-500">
                      Batch: {alert.batchNumber} | Qty: {alert.quantity} | Expires: {new Date(alert.expiryDate).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Alert threshold: {alert.alertThresholdDays} days
                    </div>
                    <div className={`text-sm font-medium mt-1 ${statusText[status as keyof typeof statusText] || 'text-gray-600'}`}>
                      {status === 'EXPIRED' 
                        ? `❌ Expired ${Math.abs(alert.daysUntilExpiry)} days ago`
                        : status === 'NEAR_EXPIRY'
                        ? `⚠️ ${alert.daysUntilExpiry} days until expiry (Near Expiry)`
                        : `✓ ${alert.daysUntilExpiry} days until expiry`}
                    </div>
                  </div>
                  <AlertTriangle className={`h-5 w-5 ${statusText[status as keyof typeof statusText] || 'text-gray-600'}`} />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default Alerts

