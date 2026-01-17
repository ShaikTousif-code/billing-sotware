import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { Printer, Eye, Search, Calendar, Filter, X, FileText, Download } from 'lucide-react'
import { FeePayment, Student } from '../types'
import { useToast } from '../hooks/useToast'
import { TableSkeleton } from '../components/LoadingSkeleton'
import usePrintReceipt from '../components/PrintReceipt'
import { formatDateTimeIndian } from '../utils/dateUtils'

const PaymentHistory = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const [payments, setPayments] = useState<FeePayment[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [loadingPayments, setLoadingPayments] = useState<boolean>(false)
  const { showToast, ToastContainer } = useToast()

  // Filter states
  const [selectedStudent, setSelectedStudent] = useState<number | null>(
    searchParams.get('studentId') ? parseInt(searchParams.get('studentId')!) : null
  )
  const [fromDate, setFromDate] = useState<string>(
    searchParams.get('fromDate') || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]
  )
  const [toDate, setToDate] = useState<string>(
    searchParams.get('toDate') || new Date().toISOString().split('T')[0]
  )
  const [paymentMode, setPaymentMode] = useState<string>(searchParams.get('paymentMode') || '')
  const [searchTerm, setSearchTerm] = useState<string>(searchParams.get('search') || '')

  useEffect(() => {
    fetchStudents()
  }, [])

  useEffect(() => {
    fetchPayments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStudent, fromDate, toDate, paymentMode, searchTerm])

  const fetchStudents = async (): Promise<void> => {
    try {
      const response = await api.get<{ success: boolean; data: Student[] }>('/students')
      setStudents(response.data?.data || [])
    } catch (error: any) {
      console.error('Error fetching students:', error)
    }
  }

  const fetchPayments = async (): Promise<void> => {
    try {
      setLoadingPayments(true)
      const params: any = {}
      if (selectedStudent) params.studentId = selectedStudent
      if (fromDate) params.fromDate = new Date(fromDate).toISOString()
      if (toDate) {
        const toDateObj = new Date(toDate)
        toDateObj.setHours(23, 59, 59, 999) // End of day
        params.toDate = toDateObj.toISOString()
      }

      const response = await api.get<{ success: boolean; data: FeePayment[] }>('/fee-receipts/payment', { params })
      let paymentsData = response.data?.data || []

      // Filter by payment mode if selected
      if (paymentMode) {
        paymentsData = paymentsData.filter(p => p.paymentMode === paymentMode)
      }

      // Filter by search term (receipt number, student name, transaction ID)
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        paymentsData = paymentsData.filter(p => 
          p.receiptNumber.toLowerCase().includes(term) ||
          `${p.student?.firstName || ''} ${p.student?.lastName || ''}`.toLowerCase().includes(term) ||
          (p.transactionId && p.transactionId.toLowerCase().includes(term)) ||
          (p.chequeNumber && p.chequeNumber.toLowerCase().includes(term)) ||
          (p.upiId && p.upiId.toLowerCase().includes(term))
        )
      }

      setPayments(paymentsData)

      // Update URL params (only if they changed to avoid infinite loop)
      const newParams = new URLSearchParams()
      if (selectedStudent) newParams.set('studentId', selectedStudent.toString())
      if (fromDate) newParams.set('fromDate', fromDate)
      if (toDate) newParams.set('toDate', toDate)
      if (paymentMode) newParams.set('paymentMode', paymentMode)
      if (searchTerm) newParams.set('search', searchTerm)
      
      // Only update if params actually changed
      const currentParams = searchParams.toString()
      const newParamsStr = newParams.toString()
      if (currentParams !== newParamsStr) {
        setSearchParams(newParams, { replace: true })
      }
    } catch (error: any) {
      console.error('Error fetching payment history:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch payment history'
      showToast(errorMessage, 'error')
      setPayments([])
    } finally {
      setLoadingPayments(false)
      setLoading(false)
    }
  }

  const printReceipt = usePrintReceipt()

  const handlePrintReceipt = async (paymentId: number, receiptNumber: string): Promise<void> => {
    await printReceipt({
      receiptType: 'fee-payment',
      id: paymentId,
      receiptNumber
    })
  }

  const handleViewStudentPayments = (studentId: number): void => {
    setSelectedStudent(studentId)
    setSearchParams({ studentId: studentId.toString() })
  }

  const clearFilters = (): void => {
    setSelectedStudent(null)
    setFromDate(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0])
    setToDate(new Date().toISOString().split('T')[0])
    setPaymentMode('')
    setSearchTerm('')
    setSearchParams({})
  }

  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0)

  if (loading) {
    return <TableSkeleton rows={8} columns={6} />
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Payment History</h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-500">View and manage all fee payments</p>
        </div>
        <button
          onClick={() => navigate('/fees')}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <X className="h-4 w-4 mr-2" />
          Back to Fees
        </button>
      </div>

      {/* Summary Card */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Total Payments</p>
            <p className="text-2xl font-bold text-gray-900">{payments.length}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Total Amount</p>
            <p className="text-2xl font-bold text-green-600">
              ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-3 sm:p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-500" />
            <h3 className="text-sm font-medium text-gray-700">Filters</h3>
          </div>
          {(selectedStudent || paymentMode || searchTerm) && (
            <button
              onClick={clearFilters}
              className="text-xs text-primary-600 hover:text-primary-800"
            >
              Clear Filters
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Student</label>
            <select
              value={selectedStudent || ''}
              onChange={(e) => setSelectedStudent(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Students</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.studentId} - {s.firstName} {s.lastName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Modes</option>
              <option value="Cash">Cash</option>
              <option value="Cheque">Cheque</option>
              <option value="Online">Online</option>
              <option value="Card">Card</option>
              <option value="UPI">UPI</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Receipt, Student, Transaction..."
                className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Receipt No</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Date</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Student</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Fee Type</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Amount</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Payment Mode</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Transaction ID</th>
                <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loadingPayments ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-sm text-gray-500">No payments found</p>
                  </td>
                </tr>
              ) : (
                payments.map((payment) => {
                  return (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                        {payment.receiptNumber}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                        {formatDateTimeIndian(payment.paymentDate)}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleViewStudentPayments(payment.studentId)}
                          className="text-xs sm:text-sm text-primary-600 hover:text-primary-900 hover:underline"
                          title="View all payments for this student"
                        >
                          {payment.student?.firstName} {payment.student?.lastName}
                        </button>
                        <br />
                        <span className="text-xs text-gray-400">
                          {payment.student?.studentId || 'N/A'}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                        {payment.fee?.feeType || 'N/A'}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-semibold text-gray-900">
                        ₹{payment.amount.toFixed(2)}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                        {payment.paymentMode}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                        {payment.transactionId || payment.chequeNumber || payment.upiId || '-'}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-xs sm:text-sm font-medium">
                        <button
                          onClick={() => handlePrintReceipt(payment.id, payment.receiptNumber)}
                          className="inline-flex items-center text-primary-600 hover:text-primary-900"
                          title="Print Receipt"
                        >
                          <Printer className="h-4 w-4 sm:h-5 sm:w-5 mr-1" />
                          <span className="hidden sm:inline">Print</span>
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
            {payments.length > 0 && (
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={4} className="px-3 sm:px-6 py-3 text-xs sm:text-sm font-semibold text-gray-900 text-right">
                    Total:
                  </td>
                  <td className="px-3 sm:px-6 py-3 text-xs sm:text-sm font-bold text-gray-900">
                    ₹{totalAmount.toFixed(2)}
                  </td>
                  <td colSpan={3}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      <ToastContainer />
    </div>
  )
}

export default PaymentHistory

