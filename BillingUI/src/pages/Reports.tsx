import { useEffect, useState } from 'react'
import api from '../services/api'
import { format } from 'date-fns'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { SalesReport, ProductSalesReport, StockSummaryReport } from '../types'

interface DateRange {
  fromDate: string
  toDate: string
}

const Reports = () => {
  const [salesReport, setSalesReport] = useState<SalesReport | null>(null)
  const [productSalesReport, setProductSalesReport] = useState<ProductSalesReport | null>(null)
  const [stockReport, setStockReport] = useState<StockSummaryReport | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [products, setProducts] = useState<any[]>([])
  const [selectedProductId, setSelectedProductId] = useState<number | ''>('')
  const [dateRange, setDateRange] = useState<DateRange>({
    fromDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    fetchProducts()
  }, [])

  useEffect(() => {
    fetchReports()
  }, [dateRange, selectedProductId])

  const fetchProducts = async (): Promise<void> => {
    try {
      const response = await api.get<{ success: boolean; data: { data: any[] } }>('/products', { params: { page: 1, pageSize: 10000 } })
      let productsData: any[] = []
      if (response.data?.data?.data && Array.isArray(response.data.data.data)) {
        productsData = response.data.data.data
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        productsData = response.data.data
      }
      setProducts(productsData)
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const fetchReports = async (): Promise<void> => {
    setLoading(true)
    try {
      const productSalesUrl = `/reports/product-sales?fromDate=${dateRange.fromDate}&toDate=${dateRange.toDate}${selectedProductId ? `&productId=${selectedProductId}` : ''}`
      
      const [sales, productSales, stock] = await Promise.all([
        api.get<SalesReport>(
          `/reports/sales?fromDate=${dateRange.fromDate}&toDate=${dateRange.toDate}`
        ),
        api.get<ProductSalesReport>(productSalesUrl),
        api.get<StockSummaryReport>('/reports/stock-summary'),
      ])

      setSalesReport(sales.data)
      setProductSalesReport(productSales.data)
      setStockReport(stock.data)
    } catch (error) {
      console.error('Error fetching reports:', error)
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
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-0">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Reports</h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-500">
            View detailed analytics and reports
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:space-x-4">
          <input
            type="date"
            value={dateRange.fromDate}
            onChange={(e) =>
              setDateRange({ ...dateRange, fromDate: e.target.value })
            }
            className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
          <input
            type="date"
            value={dateRange.toDate}
            onChange={(e) =>
              setDateRange({ ...dateRange, toDate: e.target.value })
            }
            className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        </div>
      </div>

      {/* Sales Summary */}
      {salesReport && (
        <div className="bg-white shadow rounded-lg p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-4">
            Sales Summary
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
              <div className="text-xs sm:text-sm text-gray-600">Total Sales</div>
              <div className="text-lg sm:text-2xl font-bold text-gray-900">
                ₹{salesReport.totalSales?.toFixed(2) || '0.00'}
              </div>
            </div>
            <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
              <div className="text-xs sm:text-sm text-gray-600">Total Tax</div>
              <div className="text-lg sm:text-2xl font-bold text-gray-900">
                ₹{salesReport.totalTax?.toFixed(2) || '0.00'}
              </div>
            </div>
            <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
              <div className="text-xs sm:text-sm text-gray-600">Total Discount</div>
              <div className="text-lg sm:text-2xl font-bold text-gray-900">
                ₹{salesReport.totalDiscount?.toFixed(2) || '0.00'}
              </div>
            </div>
            <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
              <div className="text-xs sm:text-sm text-gray-600">Total Invoices</div>
              <div className="text-lg sm:text-2xl font-bold text-gray-900">
                {salesReport.totalInvoices || 0}
              </div>
            </div>
            <div className="bg-green-50 p-3 sm:p-4 rounded-lg">
              <div className="text-xs sm:text-sm text-gray-600">Total Profit</div>
              <div className={`text-lg sm:text-2xl font-bold ${
                (salesReport.totalProfit ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                ₹{(salesReport.totalProfit ?? 0).toFixed(2)}
              </div>
            </div>
          </div>

          {salesReport.dailySales && salesReport.dailySales.length > 0 && (
            <div className="w-full overflow-x-auto">
              <ResponsiveContainer width="100%" height={250} minWidth={300}>
              <LineChart data={salesReport.dailySales}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value: string) => format(new Date(value), 'MMM dd')}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  name="Sales (₹)"
                />
              </LineChart>
            </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Product Sales */}
      {productSalesReport && productSalesReport.items && (
        <div className="bg-white shadow rounded-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
            <h2 className="text-base sm:text-lg font-medium text-gray-900">
              Product Sales Report
            </h2>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value ? Number(e.target.value) : '')}
                className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Products</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Product
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Quantity
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Total Sales
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Total Cost
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Profit
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {productSalesReport.items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                      No sales data found for the selected period{selectedProductId ? ' and product' : ''}
                    </td>
                  </tr>
                ) : (
                  productSalesReport.items.map((item) => (
                    <tr key={item.productId} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                        {item.productName}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                        {item.quantity}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                        ₹{item.totalAmount.toFixed(2)}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                        ₹{(item.totalCost || 0).toFixed(2)}
                      </td>
                      <td className={`px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-medium ${
                        (item.profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        ₹{(item.profit || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {productSalesReport.items.length > 0 && (
                <tfoot className="bg-gray-50">
                  <tr>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-bold text-gray-900">
                      Total
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-bold text-gray-900">
                      {productSalesReport.items.reduce((sum, item) => sum + item.quantity, 0).toFixed(2)}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-bold text-gray-900">
                      ₹{productSalesReport.items.reduce((sum, item) => sum + item.totalAmount, 0).toFixed(2)}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-bold text-gray-900">
                      ₹{productSalesReport.items.reduce((sum, item) => sum + (item.totalCost || 0), 0).toFixed(2)}
                    </td>
                    <td className={`px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-bold ${
                      productSalesReport.items.reduce((sum, item) => sum + (item.profit || 0), 0) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ₹{productSalesReport.items.reduce((sum, item) => sum + (item.profit || 0), 0).toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* Stock Summary */}
      {stockReport && (
        <div className="bg-white shadow rounded-lg p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-4">
            Stock Summary
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
              <div className="text-xs sm:text-sm text-gray-600">Total Products</div>
              <div className="text-lg sm:text-2xl font-bold text-gray-900">
                {stockReport.items?.length || 0}
              </div>
            </div>
            <div className="bg-yellow-50 p-3 sm:p-4 rounded-lg">
              <div className="text-xs sm:text-sm text-gray-600">Low Stock Items</div>
              <div className="text-lg sm:text-2xl font-bold text-yellow-600">
                {stockReport.lowStockCount || 0}
              </div>
            </div>
            <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
              <div className="text-xs sm:text-sm text-gray-600">Total Inventory Value</div>
              <div className="text-lg sm:text-2xl font-bold text-gray-900">
                ₹{stockReport.totalValue?.toFixed(2) || '0.00'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Reports

