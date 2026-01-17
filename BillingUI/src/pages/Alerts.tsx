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
}

const Alerts = () => {
  const [lowStockAlerts, setLowStockAlerts] = useState<LowStockAlert[]>([])
  const [expiryAlerts, setExpiryAlerts] = useState<ExpiryAlert[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    fetchAlerts()
  }, [])

  const fetchAlerts = async (): Promise<void> => {
    try {
      const [lowStockRes, expiryRes] = await Promise.all([
        api.get<LowStockAlert[]>('/alerts/low-stock'),
        api.get<ExpiryAlert[]>('/alerts/expiry'),
      ])
      setLowStockAlerts(lowStockRes.data)
      setExpiryAlerts(expiryRes.data)
    } catch (error) {
      console.error('Error fetching alerts:', error)
    } finally {
      setLoading(false)
    }
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
        <div className="flex items-center mb-4">
          <AlertTriangle className="h-6 w-6 text-red-600 mr-2" />
          <h2 className="text-lg font-medium text-gray-900">Expiry Alerts ({expiryAlerts.length})</h2>
        </div>
        {expiryAlerts.length === 0 ? (
          <p className="text-gray-500">No expiry alerts</p>
        ) : (
          <div className="space-y-2">
            {expiryAlerts.map((alert) => (
              <div
                key={alert.batchId}
                className={`flex justify-between items-center p-3 rounded-lg ${
                  alert.daysUntilExpiry < 0 ? 'bg-red-50' : alert.daysUntilExpiry <= 7 ? 'bg-orange-50' : 'bg-yellow-50'
                }`}
              >
                <div>
                  <div className="font-medium text-gray-900">{alert.productName}</div>
                  <div className="text-sm text-gray-500">
                    Batch: {alert.batchNumber} | Qty: {alert.quantity} | Expires: {new Date(alert.expiryDate).toLocaleDateString()}
                  </div>
                  <div className="text-sm font-medium text-red-600">
                    {alert.daysUntilExpiry < 0
                      ? `Expired ${Math.abs(alert.daysUntilExpiry)} days ago`
                      : `${alert.daysUntilExpiry} days until expiry`}
                  </div>
                </div>
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Alerts

