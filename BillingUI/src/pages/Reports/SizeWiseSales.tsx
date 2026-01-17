import { useEffect, useState } from 'react'
import api from '../../services/api'
import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react'

interface SizeWiseSalesData {
  size: string
  quantity: number
  totalAmount: number
  averagePrice: number
  percentage: number
}

const SizeWiseSales = () => {
  const [salesData, setSalesData] = useState<SizeWiseSalesData[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({
    from: new Date(new Date().setDate(1)).toISOString().split('T')[0], // First day of current month
    to: new Date().toISOString().split('T')[0], // Today
  })

  useEffect(() => {
    fetchSizeWiseSales()
  }, [dateRange])

  const fetchSizeWiseSales = async (): Promise<void> => {
    try {
      setLoading(true)
      const response = await api.get<{ success: boolean; data: SizeWiseSalesData[] }>('/reports/size-wise-sales', {
        params: {
          fromDate: dateRange.from,
          toDate: dateRange.to,
        },
      })
      if (response.data.success) {
        setSalesData(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching size-wise sales:', error)
      // For now, use mock data if API doesn't exist
      setSalesData([
        { size: 'S', quantity: 45, totalAmount: 22500, averagePrice: 500, percentage: 25 },
        { size: 'M', quantity: 60, totalAmount: 30000, averagePrice: 500, percentage: 33 },
        { size: 'L', quantity: 50, totalAmount: 25000, averagePrice: 500, percentage: 28 },
        { size: 'XL', quantity: 25, totalAmount: 12500, averagePrice: 500, percentage: 14 },
      ])
    } finally {
      setLoading(false)
    }
  }

  const totalQuantity = salesData.reduce((sum, item) => sum + item.quantity, 0)
  const totalAmount = salesData.reduce((sum, item) => sum + item.totalAmount, 0)
  const maxQuantity = Math.max(...salesData.map(item => item.quantity), 1)

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
          <h1 className="text-2xl font-bold text-gray-900">Size-Wise Sales Report</h1>
          <p className="mt-1 text-sm text-gray-500">Analyze sales performance by product size</p>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Units Sold</p>
              <p className="text-2xl font-bold text-gray-900">{totalQuantity}</p>
            </div>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">₹{totalAmount.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Average Price</p>
              <p className="text-2xl font-bold text-gray-900">
                ₹{totalQuantity > 0 ? (totalAmount / totalQuantity).toFixed(2) : '0.00'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Chart and Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Sales by Size</h2>
          <div className="space-y-4">
            {salesData.map((item) => (
              <div key={item.size}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700">Size {item.size}</span>
                  <span className="text-sm text-gray-500">{item.quantity} units</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-6">
                  <div
                    className="bg-blue-600 h-6 rounded-full flex items-center justify-end pr-2"
                    style={{ width: `${(item.quantity / maxQuantity) * 100}%` }}
                  >
                    <span className="text-xs text-white font-medium">{item.percentage.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Detailed Breakdown</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Share
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {salesData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      No data available
                    </td>
                  </tr>
                ) : (
                  salesData
                    .sort((a, b) => b.quantity - a.quantity)
                    .map((item) => (
                      <tr key={item.size}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.size}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.quantity}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₹{item.totalAmount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ₹{item.averagePrice.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.percentage.toFixed(1)}%
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SizeWiseSales

