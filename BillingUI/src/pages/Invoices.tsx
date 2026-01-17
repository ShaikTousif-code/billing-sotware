import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { formatDate, formatDateTime } from '../utils/dateUtils'
import { Eye, Download, CreditCard, Edit, Search, FileText, Calendar } from 'lucide-react'
import { Invoice, Customer } from '../types'
import { TableSkeleton } from '../components/LoadingSkeleton'
import EmptyState from '../components/EmptyState'
import Pagination from '../components/Pagination'
import FilterPanel from '../components/FilterPanel'
import { useToast } from '../hooks/useToast'

interface PaginatedResponse<T> {
  data: T[]
  pageNumber: number
  pageSize: number
  totalCount: number
  totalPages: number
}

const Invoices = () => {
  const { showToast, ToastContainer } = useToast()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [searchTerm, setSearchTerm] = useState<string>('')
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(25)
  const [totalCount, setTotalCount] = useState<number>(0)
  const [totalPages, setTotalPages] = useState<number>(0)
  
  // Filter state
  const [showFilters, setShowFilters] = useState<boolean>(false)
  const [filterStatus, setFilterStatus] = useState<string>('all') // all, Draft, Completed, Cancelled, Hold
  const [filterCustomer, setFilterCustomer] = useState<number | ''>('')
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>('all') // all, paid, partial, unpaid
  const [filterDateFrom, setFilterDateFrom] = useState<string>('')
  const [filterDateTo, setFilterDateTo] = useState<string>('')
  const [filterAmountMin, setFilterAmountMin] = useState<string>('')
  const [filterAmountMax, setFilterAmountMax] = useState<string>('')

  useEffect(() => {
    fetchCustomers()
  }, [])

  useEffect(() => {
    fetchInvoices()
  }, [currentPage, pageSize, filterStatus, filterCustomer, filterPaymentStatus, filterDateFrom, filterDateTo, filterAmountMin, filterAmountMax, searchTerm])

  const fetchCustomers = async (): Promise<void> => {
    try {
      const response = await api.get<{ success: boolean; data: { data: Customer[] } }>('/customers', {
        params: { page: 1, pageSize: 1000 }
      })
      const customersData = response.data?.data?.data || response.data?.data || []
      setCustomers(Array.isArray(customersData) ? customersData : [])
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
  }

  const fetchInvoices = async (): Promise<void> => {
    try {
      setLoading(true)
      const response = await api.get<Invoice[]>('/invoices')
      let invoicesData = Array.isArray(response.data) ? response.data : []
      
      // Apply filters
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        invoicesData = invoicesData.filter(inv =>
          inv.invoiceNumber.toLowerCase().includes(term) ||
          (inv.customerName || '').toLowerCase().includes(term) ||
          (inv.customer?.name || '').toLowerCase().includes(term)
        )
      }
      
      if (filterStatus !== 'all') {
        invoicesData = invoicesData.filter(inv => inv.status === filterStatus)
      }
      
      if (filterCustomer) {
        invoicesData = invoicesData.filter(inv => inv.customerId === filterCustomer)
      }
      
      if (filterPaymentStatus === 'paid') {
        invoicesData = invoicesData.filter(inv => inv.balanceAmount <= 0)
      } else if (filterPaymentStatus === 'partial') {
        invoicesData = invoicesData.filter(inv => inv.balanceAmount > 0 && inv.balanceAmount < inv.totalAmount)
      } else if (filterPaymentStatus === 'unpaid') {
        invoicesData = invoicesData.filter(inv => inv.balanceAmount >= inv.totalAmount)
      }
      
      if (filterDateFrom) {
        const fromDate = new Date(filterDateFrom)
        fromDate.setHours(0, 0, 0, 0)
        invoicesData = invoicesData.filter(inv => {
          const invDate = new Date(inv.invoiceDate)
          invDate.setHours(0, 0, 0, 0)
          return invDate >= fromDate
        })
      }
      
      if (filterDateTo) {
        const toDate = new Date(filterDateTo)
        toDate.setHours(23, 59, 59, 999)
        invoicesData = invoicesData.filter(inv => {
          const invDate = new Date(inv.invoiceDate)
          return invDate <= toDate
        })
      }
      
      if (filterAmountMin) {
        const minAmount = parseFloat(filterAmountMin)
        invoicesData = invoicesData.filter(inv => inv.totalAmount >= minAmount)
      }
      
      if (filterAmountMax) {
        const maxAmount = parseFloat(filterAmountMax)
        invoicesData = invoicesData.filter(inv => inv.totalAmount <= maxAmount)
      }
      
      // Pagination
      const total = invoicesData.length
      const startIndex = (currentPage - 1) * pageSize
      const endIndex = startIndex + pageSize
      const paginatedData = invoicesData.slice(startIndex, endIndex)
      
      setInvoices(paginatedData)
      setTotalCount(total)
      setTotalPages(Math.ceil(total / pageSize))
    } catch (error) {
      console.error('Error fetching invoices:', error)
      showToast('Failed to fetch invoices', 'error')
      setInvoices([])
      setTotalCount(0)
      setTotalPages(0)
    } finally {
      setLoading(false)
    }
  }

  const getActiveFilterCount = (): number => {
    let count = 0
    if (filterStatus !== 'all') count++
    if (filterCustomer) count++
    if (filterPaymentStatus !== 'all') count++
    if (filterDateFrom) count++
    if (filterDateTo) count++
    if (filterAmountMin || filterAmountMax) count++
    return count
  }

  const resetFilters = (): void => {
    setFilterStatus('all')
    setFilterCustomer('')
    setFilterPaymentStatus('all')
    setFilterDateFrom('')
    setFilterDateTo('')
    setFilterAmountMin('')
    setFilterAmountMax('')
    setCurrentPage(1)
  }

  const applyDatePreset = (preset: string): void => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    let fromDate = ''
    let toDate = ''

    switch (preset) {
      case 'today':
        fromDate = today.toISOString().split('T')[0]
        toDate = today.toISOString().split('T')[0]
        break
      case 'yesterday':
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        fromDate = yesterday.toISOString().split('T')[0]
        toDate = yesterday.toISOString().split('T')[0]
        break
      case 'thisWeek':
        const weekStart = new Date(today)
        weekStart.setDate(today.getDate() - today.getDay()) // Start of week (Sunday)
        fromDate = weekStart.toISOString().split('T')[0]
        toDate = today.toISOString().split('T')[0]
        break
      case 'last7Days':
        const last7Days = new Date(today)
        last7Days.setDate(today.getDate() - 7)
        fromDate = last7Days.toISOString().split('T')[0]
        toDate = today.toISOString().split('T')[0]
        break
      case 'last30Days':
        const last30Days = new Date(today)
        last30Days.setDate(today.getDate() - 30)
        fromDate = last30Days.toISOString().split('T')[0]
        toDate = today.toISOString().split('T')[0]
        break
      case 'thisMonth':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
        fromDate = monthStart.toISOString().split('T')[0]
        toDate = today.toISOString().split('T')[0]
        break
      case 'lastMonth':
        const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1)
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0)
        fromDate = lastMonthStart.toISOString().split('T')[0]
        toDate = lastMonthEnd.toISOString().split('T')[0]
        break
      case 'thisYear':
        const yearStart = new Date(today.getFullYear(), 0, 1)
        fromDate = yearStart.toISOString().split('T')[0]
        toDate = today.toISOString().split('T')[0]
        break
      case 'all':
        fromDate = ''
        toDate = ''
        break
    }

    setFilterDateFrom(fromDate)
    setFilterDateTo(toDate)
    setCurrentPage(1)
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800'
      case 'Draft':
        return 'bg-yellow-100 text-yellow-800'
      case 'Cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading && invoices.length === 0) {
    return (
      <div className="space-y-6">
        <TableSkeleton rows={8} columns={7} />
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-500">
            View and manage all your invoices
          </p>
        </div>
        <Link
          to="/invoices/new"
          className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-transparent rounded-md shadow-sm text-xs sm:text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
        >
          <span className="mr-1 sm:mr-2">+</span>
          <span className="hidden sm:inline">Create Invoice</span>
          <span className="sm:hidden">Create</span>
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="bg-white shadow rounded-lg p-3 sm:p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by invoice number or customer name..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full pl-8 sm:pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        {/* Filter Panel */}
        <FilterPanel
          isOpen={showFilters}
          onToggle={() => setShowFilters(!showFilters)}
          onReset={resetFilters}
          activeFilterCount={getActiveFilterCount()}
        >
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Status</option>
              <option value="Draft">Draft</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Hold">Hold</option>
            </select>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Customer</label>
            <select
              value={filterCustomer}
              onChange={(e) => {
                setFilterCustomer(e.target.value ? Number(e.target.value) : '')
                setCurrentPage(1)
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Customers</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Payment Status</label>
            <select
              value={filterPaymentStatus}
              onChange={(e) => {
                setFilterPaymentStatus(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All</option>
              <option value="paid">Fully Paid</option>
              <option value="partial">Partially Paid</option>
              <option value="unpaid">Unpaid</option>
            </select>
          </div>

          <div className="sm:col-span-2 lg:col-span-3 xl:col-span-4">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline h-4 w-4 mr-1" />
              Invoice Date Range
            </label>
            
            {/* Quick Date Presets */}
            <div className="flex flex-wrap gap-2 mb-3">
              <button
                type="button"
                onClick={() => applyDatePreset('today')}
                className={`px-2 py-1 text-xs rounded-md transition-colors ${
                  filterDateFrom && filterDateTo && filterDateFrom === filterDateTo && filterDateFrom === new Date().toISOString().split('T')[0]
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => applyDatePreset('yesterday')}
                className="px-2 py-1 text-xs rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Yesterday
              </button>
              <button
                type="button"
                onClick={() => applyDatePreset('thisWeek')}
                className="px-2 py-1 text-xs rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                This Week
              </button>
              <button
                type="button"
                onClick={() => applyDatePreset('last7Days')}
                className="px-2 py-1 text-xs rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Last 7 Days
              </button>
              <button
                type="button"
                onClick={() => applyDatePreset('last30Days')}
                className="px-2 py-1 text-xs rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Last 30 Days
              </button>
              <button
                type="button"
                onClick={() => applyDatePreset('thisMonth')}
                className="px-2 py-1 text-xs rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                This Month
              </button>
              <button
                type="button"
                onClick={() => applyDatePreset('lastMonth')}
                className="px-2 py-1 text-xs rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Last Month
              </button>
              <button
                type="button"
                onClick={() => applyDatePreset('thisYear')}
                className="px-2 py-1 text-xs rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                This Year
              </button>
              <button
                type="button"
                onClick={() => applyDatePreset('all')}
                className="px-2 py-1 text-xs rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                All Time
              </button>
            </div>

            {/* Custom Date Range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">From Date</label>
                <input
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => {
                    setFilterDateFrom(e.target.value)
                    setCurrentPage(1)
                  }}
                  max={filterDateTo || undefined}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">To Date</label>
                <input
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => {
                    setFilterDateTo(e.target.value)
                    setCurrentPage(1)
                  }}
                  min={filterDateFrom || undefined}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
            
            {/* Display selected range */}
            {(filterDateFrom || filterDateTo) && (
              <div className="mt-2 text-xs text-gray-600">
                <span className="font-medium">Selected:</span>{' '}
                {filterDateFrom ? formatDate(filterDateFrom) : 'Start'} - {filterDateTo ? formatDate(filterDateTo) : 'End'}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Amount Range</label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                value={filterAmountMin}
                onChange={(e) => {
                  setFilterAmountMin(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
              <input
                type="number"
                placeholder="Max"
                value={filterAmountMax}
                onChange={(e) => {
                  setFilterAmountMax(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        </FilterPanel>
      </div>

      {/* Invoices Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Invoice #
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                Date
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                Status
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                Balance
              </th>
              <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4">
                  <EmptyState
                    icon={FileText}
                    title={searchTerm || getActiveFilterCount() > 0 ? "No invoices found" : "No invoices yet"}
                    description={searchTerm || getActiveFilterCount() > 0
                      ? `No invoices match your filters. Try adjusting your search or filters.`
                      : "Get started by creating your first invoice."}
                    action={!searchTerm && getActiveFilterCount() === 0 ? {
                      label: "Create Invoice",
                      onClick: () => window.location.href = '/invoices/new'
                    } : undefined}
                  />
                </td>
              </tr>
            ) : (
              invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-3 sm:px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {invoice.invoiceNumber}
                    </div>
                    <div className="sm:hidden text-xs text-gray-500 mt-1">
                      {formatDateTime(invoice.invoiceDate)}
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                    {formatDateTime(invoice.invoiceDate)}
                  </td>
                  <td className="px-3 sm:px-6 py-4 text-sm text-gray-900">
                    {invoice.customerName || invoice.customer?.name || 'Walk-in'}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                        invoice.status
                      )}`}
                    >
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ₹{invoice.totalAmount.toFixed(2)}
                    {invoice.status !== 'Completed' && invoice.balanceAmount > 0 && (
                      <div className="sm:hidden text-xs text-red-600 mt-1">
                        Balance: ₹{invoice.balanceAmount.toFixed(2)}
                      </div>
                    )}
                    {invoice.status === 'Completed' && (
                      <div className="sm:hidden text-xs text-green-600 mt-1">
                        Paid
                      </div>
                    )}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                    {invoice.status === 'Completed' ? (
                      <span className="text-green-600">Paid</span>
                    ) : invoice.balanceAmount > 0 ? (
                      <span className="text-red-600">
                        ₹{invoice.balanceAmount.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-green-600">Paid</span>
                    )}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      {invoice.status === 'Draft' && (
                        <Link
                          to={`/invoices/${invoice.id}/edit`}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit Invoice"
                        >
                          <Edit className="h-4 w-4 sm:h-5 sm:w-5" />
                        </Link>
                      )}
                      <Link
                        to={`/invoices/${invoice.id}/view`}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="View Invoice"
                      >
                        <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                      </Link>
                      <a
                        href={`/api/export/invoices/${invoice.id}/pdf`}
                        target="_blank"
                        className="text-primary-600 hover:text-primary-900"
                        title="Download PDF"
                      >
                        <Download className="h-5 w-5" />
                      </a>
                      <Link
                        to={`/invoices/${invoice.id}/payments`}
                        className="text-green-600 hover:text-green-900"
                        title="View Payments"
                      >
                        <CreditCard className="h-5 w-5" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 0 && (
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
      )}

      <ToastContainer />
    </div>
  )
}

export default Invoices

