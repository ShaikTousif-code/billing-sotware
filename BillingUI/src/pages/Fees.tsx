import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import {
  Plus,
  Search,
  Calendar,
  DollarSign,
  CreditCard,
  X,
  AlertCircle,
  FileText,
  Printer,
  Eye,
  History,
  CheckCircle,
  Send
} from 'lucide-react'
import { Fee, Student, FeePayment } from '../types'
import { useToast } from '../hooks/useToast'
import { TableSkeleton } from '../components/LoadingSkeleton'
import usePrintReceipt from '../components/PrintReceipt'
import { formatDateTimeIndian } from '../utils/dateUtils'

const Fees = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [fees, setFees] = useState<Fee[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const studentIdFromUrl = searchParams.get('studentId')
  const [selectedStudent, setSelectedStudent] = useState<number | null>(
    studentIdFromUrl ? parseInt(studentIdFromUrl) : null
  )
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [showInstallmentsOnly, setShowInstallmentsOnly] = useState<boolean>(false)
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false)
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false)
  const [showPaymentHistoryModal, setShowPaymentHistoryModal] = useState<boolean>(false)
  const [lastPayment, setLastPayment] = useState<FeePayment | null>(null)
  const [selectedFee, setSelectedFee] = useState<Fee | null>(null)
  const [paymentHistory, setPaymentHistory] = useState<FeePayment[]>([])
  const [loadingPayments, setLoadingPayments] = useState<boolean>(false)
  const [totalFeesCollected, setTotalFeesCollected] = useState<number>(0)
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentMode: 'Cash',
    transactionId: '',
    chequeNumber: '',
    chequeDate: '',
    bankName: '',
    upiId: '',
    notes: '',
    markAsFullyPaid: false,
    printReceipt: true, // Default to printing receipt
  })
  const { showToast, ToastContainer } = useToast()

  useEffect(() => {
    fetchData()
  }, [selectedStudent, statusFilter])

  const fetchData = async (): Promise<void> => {
    try {
      setLoading(true)
      const params: any = {}
      if (selectedStudent) params.studentId = selectedStudent
      if (statusFilter) params.status = statusFilter

      const [feesRes, studentsRes] = await Promise.all([
        api.get<{ success: boolean; data: Fee[]; message?: string }>('/fees', { params }),
        api.get<{ success: boolean; data: Student[]; message?: string }>('/students'),
      ])

      // ApiResponse structure: { success: true, data: Fee[], message?: string }
      const feesData = feesRes.data?.data || []
      const studentsData = studentsRes.data?.data || []

      setFees(Array.isArray(feesData) ? feesData : [])
      setStudents(Array.isArray(studentsData) ? studentsData : [])
      
      // Calculate total fees collected
      const totalCollected = Array.isArray(feesData) 
        ? feesData.reduce((sum, fee) => sum + (fee.paidAmount || 0), 0)
        : 0
      setTotalFeesCollected(totalCollected)
    } catch (error: any) {
      console.error('Error fetching data:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch data'
      showToast(errorMessage, 'error')
      setFees([])
      setStudents([])
    } finally {
      setLoading(false)
    }
  }

  const fetchPaymentHistory = async (): Promise<void> => {
    try {
      setLoadingPayments(true)
      const params: any = {}
      if (selectedStudent) params.studentId = selectedStudent

      const response = await api.get<{ success: boolean; data: FeePayment[] }>('/fee-receipts/payment', { params })
      setPaymentHistory(response.data?.data || [])
    } catch (error: any) {
      console.error('Error fetching payment history:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch payment history'
      showToast(errorMessage, 'error')
      setPaymentHistory([])
    } finally {
      setLoadingPayments(false)
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

  const handleShareViaWhatsApp = async (payment: FeePayment): Promise<void> => {
    if (!payment.student) return

    try {
      // Get student phone number if available
      const phoneNumber = payment.student.phone?.replace(/\D/g, '') || ''

      // Generate receipt message
      const receiptMessage = `*Fee Payment Receipt*\n\n` +
        `Receipt #: ${payment.receiptNumber || 'N/A'}\n` +
        `Date: ${payment.paymentDate ? formatDateTimeIndian(payment.paymentDate) : 'N/A'}\n` +
        `Student: ${payment.student?.firstName || 'N/A'} ${payment.student?.lastName || ''}\n` +
        `Student ID: ${payment.student?.studentId || 'N/A'}\n` +
        `Fee Type: ${payment.fee?.feeType || 'N/A'}\n` +
        `Amount Paid: ₹${(payment.amount || 0).toFixed(2)}\n` +
        `Payment Mode: ${payment.paymentMode}\n` +
        `Transaction ID: ${payment.transactionId || 'N/A'}\n\n` +
        `Thank you for your payment!`

      // Create WhatsApp share URL
      const whatsappUrl = phoneNumber
        ? `https://wa.me/${phoneNumber}?text=${encodeURIComponent(receiptMessage)}`
        : `https://web.whatsapp.com/send?text=${encodeURIComponent(receiptMessage)}`

      // Open WhatsApp
      window.open(whatsappUrl, '_blank')

      showToast('Opening WhatsApp...', 'success')
    } catch (error: any) {
      console.error('Error sharing via WhatsApp:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to share via WhatsApp'
      showToast(errorMessage, 'error')
    }
  }

  if (loading) {
    return <TableSkeleton rows={8} columns={6} />
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Fee Management</h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-500">Manage student fees and payments</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white shadow rounded-lg p-4">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-gray-500">Total Fees Collected</p>
              <p className="text-xl font-bold text-gray-900">
                ₹{totalFeesCollected.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-gray-500">Total Fees</p>
              <p className="text-xl font-bold text-gray-900">
                ₹{fees.reduce((sum, fee) => sum + (fee.netAmount || 0), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-8 w-8 text-red-600 mr-3" />
            <div>
              <p className="text-sm text-gray-500">Outstanding</p>
              <p className="text-xl font-bold text-gray-900">
                ₹{fees.reduce((sum, fee) => sum + (fee.balanceAmount || 0), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-3 sm:p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Student</label>
            <select
              value={selectedStudent || ''}
              onChange={(e) => {
                const studentId = e.target.value ? parseInt(e.target.value) : null
                setSelectedStudent(studentId)
                // Update URL params
                if (studentId) {
                  setSearchParams({ studentId: studentId.toString() })
                } else {
                  setSearchParams({})
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Partial">Partial</option>
              <option value="Paid">Paid</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showInstallmentsOnly}
                onChange={(e) => setShowInstallmentsOnly(e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="text-sm font-medium text-gray-700">Show Installments Only</span>
            </label>
          </div>
          <div className="flex items-end">
            <div className="flex items-end gap-2">
              <button
                onClick={async () => {
                  setShowPaymentHistoryModal(true)
                  await fetchPaymentHistory()
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Eye className="h-4 w-4 mr-2" />
                Quick View
              </button>
              <button
                onClick={() => navigate('/payment-history')}
                className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
              >
                <History className="h-4 w-4 mr-2" />
                Payment History
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Fees Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Fee Number</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Student</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Fee Type</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Installment</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Net Amount</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Paid</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Balance</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Due Date</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Status</th>
              <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {fees.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-6 py-4 text-center text-sm text-gray-500">
                  No fees found. {selectedStudent || statusFilter ? 'Try adjusting your filters.' : 'Fees will appear here once assigned to students.'}
                </td>
              </tr>
            ) : (
              fees
                .filter((fee) => !showInstallmentsOnly || fee.installmentNumber)
                .map((fee) => (
                <tr key={fee.id} className={fee.installmentNumber ? 'bg-blue-50' : ''}>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                    {fee.feeNumber || 'N/A'}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                    {fee.student?.firstName} {fee.student?.lastName}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">{fee.feeType}</td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm">
                    {fee.installmentNumber ? (
                      <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Inst #{fee.installmentNumber}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                    ₹{(fee.netAmount || 0).toFixed(2)}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-green-600 font-medium">
                    ₹{(fee.paidAmount || 0).toFixed(2)}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-red-600 font-medium">
                    ₹{(fee.balanceAmount || 0).toFixed(2)}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                    {fee.dueDate ? new Date(fee.dueDate).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        fee.status === 'Paid'
                          ? 'bg-green-100 text-green-800'
                          : fee.status === 'Overdue'
                          ? 'bg-red-100 text-red-800'
                          : fee.status === 'Partial'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {fee.status || 'Pending'}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-xs sm:text-sm font-medium">
                    {(fee.balanceAmount || 0) > 0 && (
                      <button
                        onClick={() => {
                          setSelectedFee(fee)
                          setPaymentData({
                            amount: (fee.balanceAmount || 0).toString(),
                            paymentMode: 'Cash',
                            transactionId: '',
                            chequeNumber: '',
                            chequeDate: '',
                            bankName: '',
                            upiId: '',
                            notes: '',
                            markAsFullyPaid: false,
                            printReceipt: true,
                          })
                          setShowPaymentModal(true)
                        }}
                        className="text-primary-600 hover:text-primary-900 flex items-center gap-1"
                        title={fee.installmentNumber ? `Pay Installment #${fee.installmentNumber}` : 'Pay Fee'}
                      >
                        <CreditCard className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">{fee.installmentNumber ? `Pay Installment` : 'Pay'}</span>
                        <span className="sm:hidden">Pay</span>
                      </button>
                    )}
                    {(fee.balanceAmount || 0) <= 0 && fee.installmentNumber && (
                      <span className="text-green-600 text-xs font-medium">✓ Paid</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedFee && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 p-4">
          <div className="relative top-4 sm:top-20 mx-auto p-4 sm:p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Record Payment</h3>
              <button
                onClick={() => {
                  setShowPaymentModal(false)
                  setSelectedFee(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded">
              <p className="text-sm text-gray-600">Student: {selectedFee.student?.firstName} {selectedFee.student?.lastName}</p>
              <p className="text-sm text-gray-600">Fee: {selectedFee.feeType}</p>
              {selectedFee.installmentNumber && (
                <p className="text-sm font-medium text-blue-600">Installment #{selectedFee.installmentNumber}</p>
              )}
              <p className="text-sm text-gray-600">Net Amount: ₹{(selectedFee.netAmount || 0).toFixed(2)}</p>
              <p className="text-sm text-gray-600">Paid: ₹{(selectedFee.paidAmount || 0).toFixed(2)}</p>
              <p className="text-sm font-semibold text-red-600">Balance: ₹{(selectedFee.balanceAmount || 0).toFixed(2)}</p>
              {selectedFee.dueDate && (
                <p className="text-sm text-gray-600">Due Date: {new Date(selectedFee.dueDate).toLocaleDateString()}</p>
              )}
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault()
                try {
                  let paymentAmount = parseFloat(paymentData.amount)
                  if (paymentAmount <= 0) {
                    showToast('Payment amount must be greater than 0', 'error')
                    return
                  }
                  
                  // If mark as fully paid is checked, ensure amount equals balance
                  if (paymentData.markAsFullyPaid && selectedFee.installmentNumber) {
                    paymentAmount = selectedFee.balanceAmount || 0
                    if (paymentAmount <= 0) {
                      showToast('This installment is already fully paid', 'error')
                      return
                    }
                  }
                  
                  if (paymentAmount > (selectedFee.balanceAmount || 0)) {
                    showToast('Payment amount cannot exceed balance', 'error')
                    return
                  }

                  const paymentPayload = {
                    feeId: selectedFee.id,
                    studentId: selectedFee.studentId,
                    amount: paymentAmount,
                    paymentMode: paymentData.paymentMode,
                    transactionId: paymentData.transactionId || null,
                    chequeNumber: paymentData.chequeNumber || null,
                    chequeDate: paymentData.chequeDate ? new Date(paymentData.chequeDate).toISOString() : null,
                    bankName: paymentData.bankName || null,
                    upiId: paymentData.upiId || null,
                    notes: paymentData.notes || (paymentData.markAsFullyPaid ? `Installment #${selectedFee.installmentNumber} marked as fully paid` : null),
                    paymentStatus: 'Success',
                  }

                  const response = await api.post<{ success: boolean; data: FeePayment }>('/fees/payment', paymentPayload)
                  const payment = response.data?.data

                  showToast('Payment recorded successfully', 'success')

                  setShowPaymentModal(false)
                  setSelectedFee(null)

                  if (payment && payment.id) {
                    // Fetch complete payment details and show receipt modal
                    try {
                      const paymentDetails = await api.get<FeePayment>(`/fees/payment/${payment.id}`)
                      setLastPayment(paymentDetails.data)
                      setShowReceiptModal(true)
                    } catch (error) {
                      console.error('Error fetching payment details:', error)
                    }
                  }

                  fetchData()
                  setPaymentData({
                    amount: '',
                    paymentMode: 'Cash',
                    transactionId: '',
                    chequeNumber: '',
                    chequeDate: '',
                    bankName: '',
                    upiId: '',
                    notes: '',
                    markAsFullyPaid: false,
                    printReceipt: true,
                  })
                  fetchData()
                } catch (error: any) {
                  console.error('Error recording payment:', error)
                  const errorMessage = error.response?.data?.message || error.message || 'Failed to record payment'
                  showToast(errorMessage, 'error')
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Amount (₹) *</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0.01"
                  max={selectedFee.balanceAmount || 0}
                  value={paymentData.amount}
                  onChange={(e) => {
                    const newAmount = e.target.value
                    setPaymentData({ 
                      ...paymentData, 
                      amount: newAmount,
                      markAsFullyPaid: parseFloat(newAmount) >= (selectedFee.balanceAmount || 0)
                    })
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
                <p className="mt-1 text-xs text-gray-500">Max: ₹{(selectedFee.balanceAmount || 0).toFixed(2)}</p>
                {selectedFee.installmentNumber && (
                  <div className="mt-2 flex items-center">
                    <input
                      type="checkbox"
                      id="markAsFullyPaid"
                      checked={paymentData.markAsFullyPaid}
                      onChange={(e) => {
                        setPaymentData({ 
                          ...paymentData, 
                          markAsFullyPaid: e.target.checked,
                          amount: e.target.checked ? (selectedFee.balanceAmount || 0).toString() : paymentData.amount
                        })
                      }}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="markAsFullyPaid" className="ml-2 text-sm text-gray-700">
                      Mark Installment #{selectedFee.installmentNumber} as Fully Paid
                    </label>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode *</label>
                <select
                  required
                  value={paymentData.paymentMode}
                  onChange={(e) => setPaymentData({ ...paymentData, paymentMode: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Online">Online</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="UPI">UPI</option>
                  <option value="Card">Card (Debit/Credit)</option>
                </select>
              </div>

              {paymentData.paymentMode === 'UPI' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">UPI ID</label>
                  <input
                    type="text"
                    value={paymentData.upiId}
                    onChange={(e) => setPaymentData({ ...paymentData, upiId: e.target.value })}
                    placeholder="e.g., user@paytm"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              )}

              {paymentData.paymentMode === 'Cheque' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cheque Number</label>
                    <input
                      type="text"
                      value={paymentData.chequeNumber}
                      onChange={(e) => setPaymentData({ ...paymentData, chequeNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cheque Date</label>
                    <input
                      type="date"
                      value={paymentData.chequeDate}
                      onChange={(e) => setPaymentData({ ...paymentData, chequeDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={paymentData.bankName}
                      onChange={(e) => setPaymentData({ ...paymentData, bankName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </>
              )}

              {(paymentData.paymentMode === 'Online' || paymentData.paymentMode === 'Card') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID</label>
                  <input
                    type="text"
                    value={paymentData.transactionId}
                    onChange={(e) => setPaymentData({ ...paymentData, transactionId: e.target.value })}
                    placeholder="Payment gateway transaction ID"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={paymentData.notes}
                  onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                  rows={3}
                  placeholder="Additional notes (optional)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* Print Receipt Option */}
              <div className="flex items-center pt-2">
                <input
                  type="checkbox"
                  id="printReceipt"
                  checked={paymentData.printReceipt}
                  onChange={(e) => setPaymentData({ ...paymentData, printReceipt: e.target.checked })}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="printReceipt" className="ml-2 text-sm text-gray-700">
                  Print receipt after payment
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentModal(false)
                    setSelectedFee(null)
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment History Modal */}
      {showPaymentHistoryModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 p-4">
          <div className="relative top-4 sm:top-20 mx-auto p-4 sm:p-6 border w-full max-w-6xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">Payment History</h3>
                {selectedStudent && (
                  <p className="text-sm text-gray-500 mt-1">
                    {students.find(s => s.id === selectedStudent)?.firstName} {students.find(s => s.id === selectedStudent)?.lastName}
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  setShowPaymentHistoryModal(false)
                  setPaymentHistory([])
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loadingPayments ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-500">Loading payments...</p>
                </div>
              ) : paymentHistory.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-500">No payments found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
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
                      {paymentHistory.map((payment) => {
                        return (
                          <tr key={payment.id}>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                              {payment.receiptNumber}
                            </td>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                              {formatDateTimeIndian(payment.paymentDate)}
                            </td>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                              {payment.student?.firstName} {payment.student?.lastName}
                            </td>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                              {payment.fee?.feeType || 'N/A'}
                            </td>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-semibold text-gray-900">
                              ₹{(payment.amount || 0).toFixed(2)}
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
                      })}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={4} className="px-3 sm:px-6 py-3 text-xs sm:text-sm font-semibold text-gray-900 text-right">
                          Total:
                        </td>
                        <td className="px-3 sm:px-6 py-3 text-xs sm:text-sm font-bold text-gray-900">
                          ₹{paymentHistory.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
                        </td>
                        <td colSpan={3}></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Receipt Modal */}
      {showReceiptModal && lastPayment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 p-4">
          <div className="relative top-4 sm:top-20 mx-auto p-4 sm:p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Payment Receipt</h3>
                <p className="text-sm text-gray-500 mt-1">Receipt #{lastPayment.receiptNumber}</p>
              </div>
              <button
                onClick={() => {
                  setShowReceiptModal(false)
                  setLastPayment(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Success Message */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <div>
                  <h4 className="text-sm font-medium text-green-800">Payment Successful!</h4>
                  <p className="text-sm text-green-700">Your payment has been recorded successfully.</p>
                </div>
              </div>
            </div>

            {/* Receipt Content */}
            <div className="space-y-6">
              {/* Student & Payment Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Student Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Student Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Student ID:</span>
                      <span className="font-medium">{lastPayment.student?.studentId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">{lastPayment.student?.firstName} {lastPayment.student?.lastName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Class:</span>
                      <span className="font-medium">{lastPayment.student?.class?.name || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Payment Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount Paid:</span>
                      <span className="font-medium text-green-600">₹{(lastPayment.amount || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Mode:</span>
                      <span className="font-medium">{lastPayment.paymentMode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date:</span>
                      <span className="font-medium">{lastPayment.paymentDate ? formatDateTimeIndian(lastPayment.paymentDate) : 'N/A'}</span>
                    </div>
                    {lastPayment.transactionId && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Transaction ID:</span>
                        <span className="font-medium">{lastPayment.transactionId}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Fee Details */}
              {lastPayment.fee && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Fee Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Fee Type:</span>
                      <p className="font-medium">{lastPayment.fee.feeType}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Academic Year:</span>
                      <p className="font-medium">{lastPayment.fee.academicYear}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Amount:</span>
                      <p className="font-medium">₹{(lastPayment.fee.netAmount || 0).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                <button
                  onClick={() => handlePrintReceipt(lastPayment.id, lastPayment.receiptNumber)}
                  className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print Receipt
                </button>
                <button
                  onClick={() => {
                    handleShareViaWhatsApp(lastPayment)
                    setShowReceiptModal(false)
                    setLastPayment(null)
                  }}
                  className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Share via WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  )
}

export default Fees

