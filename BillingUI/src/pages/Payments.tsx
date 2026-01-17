import { useEffect, useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import api from '../services/api'
import { format } from 'date-fns'
import { Plus, Trash2, DollarSign, CreditCard, Search } from 'lucide-react'
import { Payment, Invoice } from '../types'
import { getLocalDate, formatToLocalTime } from '../utils/dateUtils'
import { TableSkeleton } from '../components/LoadingSkeleton'
import EmptyState from '../components/EmptyState'
import Pagination from '../components/Pagination'
import FilterPanel from '../components/FilterPanel'
import { useToast } from '../hooks/useToast'

const Payments = () => {
  const { invoiceId } = useParams<{ invoiceId?: string }>()
  const { showToast, ToastContainer } = useToast()
  const [payments, setPayments] = useState<Payment[]>([])
  const [allPayments, setAllPayments] = useState<Payment[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [showModal, setShowModal] = useState<boolean>(false)
  const [searchTerm, setSearchTerm] = useState<string>('')
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(25)
  const [totalCount, setTotalCount] = useState<number>(0)
  const [totalPages, setTotalPages] = useState<number>(0)
  
  // Filter state
  const [showFilters, setShowFilters] = useState<boolean>(false)
  const [filterPaymentMode, setFilterPaymentMode] = useState<string>('all') // all, Cash, UPI, Card, BankTransfer
  const [filterInvoice, setFilterInvoice] = useState<number | ''>('')
  const [filterDateFrom, setFilterDateFrom] = useState<string>('')
  const [filterDateTo, setFilterDateTo] = useState<string>('')
  const [filterAmountMin, setFilterAmountMin] = useState<string>('')
  const [filterAmountMax, setFilterAmountMax] = useState<string>('')

  const [formData, setFormData] = useState({
    amount: '',
    paymentMode: 'Cash',
    transactionId: '',
    notes: '',
  })

  useEffect(() => {
    fetchPayments()
    if (!invoiceId) {
      fetchInvoices()
    }
  }, [invoiceId])

  useEffect(() => {
    applyFiltersAndPagination()
  }, [allPayments, currentPage, pageSize, filterPaymentMode, filterInvoice, filterDateFrom, filterDateTo, filterAmountMin, filterAmountMax, searchTerm])

  const fetchInvoices = async (): Promise<void> => {
    try {
      const response = await api.get<Invoice[]>('/invoices')
      setInvoices(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error('Error fetching invoices:', error)
    }
  }

  const fetchPayments = async (): Promise<void> => {
    try {
      setLoading(true)
      const url = invoiceId ? `/payments?invoiceId=${invoiceId}` : '/payments'
      const response = await api.get<Payment[]>(url)
      const paymentsData = Array.isArray(response.data) ? response.data : []
      setAllPayments(paymentsData)
    } catch (error) {
      console.error('Error fetching payments:', error)
      showToast('Failed to fetch payments', 'error')
      setAllPayments([])
    } finally {
      setLoading(false)
    }
  }

  const applyFiltersAndPagination = (): void => {
    let filtered = [...allPayments]
    
    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(p =>
        p.transactionId?.toLowerCase().includes(term) ||
        p.invoiceId?.toString().includes(term) ||
        p.notes?.toLowerCase().includes(term)
      )
    }
    
    // Apply filters
    if (filterPaymentMode !== 'all') {
      filtered = filtered.filter(p => p.paymentMode === filterPaymentMode)
    }
    
    if (filterInvoice) {
      filtered = filtered.filter(p => p.invoiceId === filterInvoice)
    }
    
    if (filterDateFrom) {
      const fromDate = new Date(filterDateFrom)
      filtered = filtered.filter(p => {
        const paymentDate = getLocalDate(p.paymentDate)
        return paymentDate >= fromDate
      })
    }
    
    if (filterDateTo) {
      const toDate = new Date(filterDateTo)
      toDate.setHours(23, 59, 59, 999)
      filtered = filtered.filter(p => {
        const paymentDate = getLocalDate(p.paymentDate)
        return paymentDate <= toDate
      })
    }
    
    if (filterAmountMin) {
      const minAmount = parseFloat(filterAmountMin)
      filtered = filtered.filter(p => p.amount >= minAmount)
    }
    
    if (filterAmountMax) {
      const maxAmount = parseFloat(filterAmountMax)
      filtered = filtered.filter(p => p.amount <= maxAmount)
    }
    
    // Pagination
    const total = filtered.length
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    const paginatedData = filtered.slice(startIndex, endIndex)
    
    setPayments(paginatedData)
    setTotalCount(total)
    setTotalPages(Math.ceil(total / pageSize))
  }

  const getActiveFilterCount = (): number => {
    let count = 0
    if (filterPaymentMode !== 'all') count++
    if (filterInvoice) count++
    if (filterDateFrom) count++
    if (filterDateTo) count++
    if (filterAmountMin || filterAmountMax) count++
    return count
  }

  const resetFilters = (): void => {
    setFilterPaymentMode('all')
    setFilterInvoice('')
    setFilterDateFrom('')
    setFilterDateTo('')
    setFilterAmountMin('')
    setFilterAmountMax('')
    setCurrentPage(1)
  }

  // Calculate payment summaries (use allPayments, not filtered payments)
  const paymentSummary = useMemo(() => {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const todayPayments = allPayments.filter((p) => {
      const paymentDate = getLocalDate(p.paymentDate)
      return paymentDate >= todayStart
    })

    const monthlyPayments = allPayments.filter((p) => {
      const paymentDate = getLocalDate(p.paymentDate)
      return paymentDate >= monthStart
    })

    const calculateTotals = (paymentList: Payment[]) => {
      const cash = paymentList
        .filter((p) => p.paymentMode === 'Cash')
        .reduce((sum, p) => sum + p.amount, 0)
      const upi = paymentList
        .filter((p) => p.paymentMode === 'UPI')
        .reduce((sum, p) => sum + p.amount, 0)
      return { cash, upi }
    }

    const today = calculateTotals(todayPayments)
    const monthly = calculateTotals(monthlyPayments)

    return { today, monthly }
  }, [allPayments])

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    try {
      await api.post('/payments', {
        invoiceId: invoiceId ? parseInt(invoiceId) : 0,
        ...formData,
        amount: parseFloat(formData.amount),
      })
      setShowModal(false)
      setFormData({ amount: '', paymentMode: 'Cash', transactionId: '', notes: '' })
      fetchPayments()
    } catch (error) {
      console.error('Error creating payment:', error)
      alert('Failed to create payment')
    }
  }

  const handleDelete = async (id: number): Promise<void> => {
    if (window.confirm('Are you sure you want to delete this payment?')) {
      try {
        await api.delete(`/payments/${id}`)
        fetchPayments()
      } catch (error) {
        console.error('Error deleting payment:', error)
        alert('Failed to delete payment')
      }
    }
  }

  if (loading && payments.length === 0) {
    return (
      <div className="space-y-6">
        <TableSkeleton rows={8} columns={5} />
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Payments</h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-500">Manage payment transactions</p>
        </div>
        {!invoiceId && (
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-transparent rounded-md shadow-sm text-xs sm:text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
          >
            <Plus className="h-4 w-4 sm:h-5 sm:w-5 sm:mr-2" />
            <span className="hidden sm:inline">Add Payment</span>
            <span className="sm:hidden">Add</span>
          </button>
        )}
      </div>

      {/* Search and Filters */}
      {!invoiceId && (
        <div className="space-y-4">
          <div className="bg-white shadow rounded-lg p-3 sm:p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by transaction ID, invoice number, or notes..."
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
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
              <select
                value={filterPaymentMode}
                onChange={(e) => {
                  setFilterPaymentMode(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Modes</option>
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Card">Card</option>
                <option value="BankTransfer">Bank Transfer</option>
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Invoice</label>
              <select
                value={filterInvoice}
                onChange={(e) => {
                  setFilterInvoice(e.target.value ? Number(e.target.value) : '')
                  setCurrentPage(1)
                }}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Invoices</option>
                {invoices.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.invoiceNumber}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Date From</label>
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => {
                  setFilterDateFrom(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Date To</label>
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => {
                  setFilterDateTo(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
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
      )}

      {/* Payment Summary Cards */}
      {!invoiceId && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Today's Cash */}
          <div className="bg-white shadow rounded-lg p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Today's Cash</p>
                <p className="mt-1 text-lg sm:text-2xl font-bold text-gray-900">
                  ₹{paymentSummary.today.cash.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Today's UPI */}
          <div className="bg-white shadow rounded-lg p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Today's UPI</p>
                <p className="mt-1 text-lg sm:text-2xl font-bold text-gray-900">
                  ₹{paymentSummary.today.upi.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Monthly Cash */}
          <div className="bg-white shadow rounded-lg p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Monthly Cash</p>
                <p className="mt-1 text-lg sm:text-2xl font-bold text-gray-900">
                  ₹{paymentSummary.monthly.cash.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Monthly UPI */}
          <div className="bg-white shadow rounded-lg p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Monthly UPI</p>
                <p className="mt-1 text-lg sm:text-2xl font-bold text-gray-900">
                  ₹{paymentSummary.monthly.upi.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mode
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                  Transaction ID
                </th>
                <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4">
                    <EmptyState
                      icon={DollarSign}
                      title={searchTerm || getActiveFilterCount() > 0 ? "No payments found" : "No payments yet"}
                      description={searchTerm || getActiveFilterCount() > 0
                        ? `No payments match your filters. Try adjusting your search or filters.`
                        : "No payment transactions found."}
                    />
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                      {formatToLocalTime(payment.paymentDate, 'MMM dd, yyyy hh:mm a')}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                      ₹{payment.amount.toFixed(2)}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                      {payment.paymentMode}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden sm:table-cell">
                      {payment.transactionId || '-'}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-xs sm:text-sm font-medium">
                      <button
                        onClick={() => handleDelete(payment.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete payment"
                      >
                        <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
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

      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add Payment</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Payment Mode *</label>
                <select
                  value={formData.paymentMode}
                  onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Card">Card</option>
                  <option value="BankTransfer">Bank Transfer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Transaction ID</label>
                <input
                  type="text"
                  value={formData.transactionId}
                  onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  )
}

export default Payments

