import { useEffect, useState } from 'react'
import api from '../../services/api'
import { RotateCcw, RefreshCw, AlertTriangle, TrendingDown } from 'lucide-react'

interface ExchangeReturnStats {
  totalReturns: number
  totalExchanges: number
  returnAmount: number
  exchangeAmount: number
  mostReturnedSizes: Array<{ size: string; count: number }>
  mostReturnedColors: Array<{ color: string; count: number }>
  returnReasons: Array<{ reason: string; count: number }>
  exchangeReasons: Array<{ reason: string; count: number }>
}

const ExchangeReturnReport = () => {
  const [stats, setStats] = useState<ExchangeReturnStats>({
    totalReturns: 0,
    totalExchanges: 0,
    returnAmount: 0,
    exchangeAmount: 0,
    mostReturnedSizes: [],
    mostReturnedColors: [],
    returnReasons: [],
    exchangeReasons: [],
  })
  const [loading, setLoading] = useState<boolean>(true)
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({
    from: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    fetchExchangeReturnStats()
  }, [dateRange])

  const fetchExchangeReturnStats = async (): Promise<void> => {
    try {
      setLoading(true)
      const response = await api.get<{ success: boolean; data: ExchangeReturnStats }>(
        '/reports/exchange-return',
        {
          params: {
            fromDate: dateRange.from,
            toDate: dateRange.to,
          },
        }
      )
      if (response.data.success) {
        setStats(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching exchange/return stats:', error)
      // Mock data
      setStats({
        totalReturns: 15,
        totalExchanges: 8,
        returnAmount: 7500,
        exchangeAmount: 4000,
        mostReturnedSizes: [
          { size: 'L', count: 5 },
          { size: 'M', count: 4 },
          { size: 'XL', count: 3 },
        ],
        mostReturnedColors: [
          { color: 'Red', count: 6 },
          { color: 'Blue', count: 4 },
          { color: 'Black', count: 3 },
        ],
        returnReasons: [
          { reason: 'Size mismatch', count: 8 },
          { reason: 'Defective', count: 4 },
          { reason: 'Customer request', count: 3 },
        ],
        exchangeReasons: [
          { reason: 'Size exchange', count: 5 },
          { reason: 'Color exchange', count: 3 },
        ],
      })
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Exchange & Return Report</h1>
          <p className="mt-1 text-sm text-gray-500">Analyze returns and exchanges performance</p>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg">
              <RotateCcw className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Returns</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalReturns}</p>
            </div>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg">
              <RefreshCw className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Exchanges</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalExchanges}</p>
            </div>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <TrendingDown className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Return Amount</p>
              <p className="text-2xl font-bold text-gray-900">₹{stats.returnAmount.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Exchange Amount</p>
              <p className="text-2xl font-bold text-gray-900">₹{stats.exchangeAmount.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Returned Sizes */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Most Returned Sizes</h2>
          <div className="space-y-3">
            {stats.mostReturnedSizes.length === 0 ? (
              <p className="text-sm text-gray-500">No data available</p>
            ) : (
              stats.mostReturnedSizes.map((item, index) => (
                <div key={item.size} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-700 mr-2">#{index + 1}</span>
                    <span className="text-sm text-gray-900">Size {item.size}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{item.count} returns</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Most Returned Colors */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Most Returned Colors</h2>
          <div className="space-y-3">
            {stats.mostReturnedColors.length === 0 ? (
              <p className="text-sm text-gray-500">No data available</p>
            ) : (
              stats.mostReturnedColors.map((item, index) => (
                <div key={item.color} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-700 mr-2">#{index + 1}</span>
                    <span className="text-sm text-gray-900">{item.color}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{item.count} returns</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Return Reasons */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Return Reasons</h2>
          <div className="space-y-3">
            {stats.returnReasons.length === 0 ? (
              <p className="text-sm text-gray-500">No data available</p>
            ) : (
              stats.returnReasons.map((item) => (
                <div key={item.reason} className="flex items-center justify-between">
                  <span className="text-sm text-gray-900">{item.reason}</span>
                  <span className="text-sm font-medium text-gray-900">{item.count}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Exchange Reasons */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Exchange Reasons</h2>
          <div className="space-y-3">
            {stats.exchangeReasons.length === 0 ? (
              <p className="text-sm text-gray-500">No data available</p>
            ) : (
              stats.exchangeReasons.map((item) => (
                <div key={item.reason} className="flex items-center justify-between">
                  <span className="text-sm text-gray-900">{item.reason}</span>
                  <span className="text-sm font-medium text-gray-900">{item.count}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExchangeReturnReport

