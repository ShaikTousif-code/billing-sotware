import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'
import { FeePayment, Fee } from '../types'
import { ArrowLeft, Download, Send, Printer, CheckCircle, X, FileText } from 'lucide-react'
import { useToast } from '../hooks/useToast'
import usePrintReceipt from '../components/PrintReceipt'
import { formatDateTimeIndian } from '../utils/dateUtils'

const ViewFeeReceipt = () => {
  const navigate = useNavigate()
  const { paymentId } = useParams()
  const { showToast, ToastContainer } = useToast()
  const [payment, setPayment] = useState<FeePayment | null>(null)
  const [fee, setFee] = useState<Fee | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const printReceipt = usePrintReceipt()

  useEffect(() => {
    if (paymentId) {
      fetchPaymentDetails()
    }
  }, [paymentId])

  const fetchPaymentDetails = async (): Promise<void> => {
    try {
      setLoading(true)
      const response = await api.get<FeePayment>(`/fees/payment/${paymentId}`)
      setPayment(response.data)

      // Also fetch the associated fee details
      if (response.data.feeId) {
        const feeResponse = await api.get<Fee>(`/fees/${response.data.feeId}`)
        setFee(feeResponse.data)
      }
    } catch (error: any) {
      console.error('Error fetching payment details:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch payment details'
      showToast(errorMessage, 'error')
      navigate('/fees')
    } finally {
      setLoading(false)
    }
  }

  const handlePrintReceipt = async (): Promise<void> => {
    if (!payment) return
    await printReceipt({
      receiptType: 'fee-payment',
      id: payment.id,
      receiptNumber: payment.receiptNumber
    })
  }

  const handleShareViaWhatsApp = async (): Promise<void> => {
    if (!payment || !payment.student) return

    try {
      // Get student phone number if available
      const phoneNumber = payment.student.phone?.replace(/\D/g, '') || ''

      // Generate receipt message
      const receiptMessage = `*Fee Payment Receipt*\n\n` +
        `Receipt #: ${payment?.receiptNumber || 'N/A'}\n` +
        `Date: ${payment?.paymentDate ? formatDateTimeIndian(payment.paymentDate) : 'N/A'}\n` +
        `Student: ${payment?.student?.firstName || 'N/A'} ${payment?.student?.lastName || ''}\n` +
        `Student ID: ${payment?.student?.studentId || 'N/A'}\n` +
        `Fee Type: ${fee?.feeType || payment?.fee?.feeType || 'N/A'}\n` +
        `Amount Paid: ₹${(payment?.amount || 0).toFixed(2)}\n` +
        `Payment Mode: ${payment?.paymentMode || 'N/A'}\n` +
        `Transaction ID: ${payment?.transactionId || 'N/A'}\n\n` +
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
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!payment) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <h2 className="mt-2 text-lg font-medium text-gray-900">Payment not found</h2>
        <p className="mt-1 text-gray-500">The payment receipt you're looking for doesn't exist.</p>
        <button
          onClick={() => navigate('/fees')}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Fees
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/fees')}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Fees
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Fee Payment Receipt</h1>
            <p className="mt-1 text-sm text-gray-500">
              Receipt #{payment.receiptNumber}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={handlePrintReceipt}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Printer className="h-5 w-5 mr-2" />
            Print Receipt
          </button>
          <button
            onClick={handleShareViaWhatsApp}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
          >
            <Send className="h-5 w-5 mr-2" />
            Share via WhatsApp
          </button>
        </div>
      </div>

      {/* Payment Status */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <h2 className="text-lg font-medium text-gray-900">Payment Status</h2>
              <div className="flex items-center mt-1">
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {payment?.paymentStatus || 'Completed'}
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Amount Paid</div>
            <div className="text-2xl font-bold text-green-600">₹{(payment?.amount || 0).toFixed(2)}</div>
            <div className="text-sm text-gray-500">{payment?.paymentMode}</div>
          </div>
        </div>
      </div>

      {/* Receipt Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student & Payment Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Student Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Student Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Student ID</label>
                <p className="mt-1 text-sm text-gray-900">{payment?.student?.studentId}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <p className="mt-1 text-sm text-gray-900">{payment?.student?.firstName} {payment?.student?.lastName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Class</label>
                <p className="mt-1 text-sm text-gray-900">{payment?.student?.class?.name || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <p className="mt-1 text-sm text-gray-900">{payment?.paymentDate ? formatDateTimeIndian(payment.paymentDate) : 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Fee Details */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Fee Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Fee Type</span>
                <span className="text-sm font-medium">{fee?.feeType || payment.fee?.feeType || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Academic Year</span>
                <span className="text-sm font-medium">{fee?.academicYear || 'N/A'}</span>
              </div>
              {fee?.term && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Term</span>
                  <span className="text-sm font-medium">{fee.term}</span>
                </div>
              )}
              {fee?.month && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Month</span>
                  <span className="text-sm font-medium">{fee.month}</span>
                </div>
              )}
              {fee?.installmentNumber && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Installment Number</span>
                  <span className="text-sm font-medium">#{fee.installmentNumber}</span>
                </div>
              )}
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Receipt Number</span>
                <span className="text-sm font-medium">{payment?.receiptNumber || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Payment Date</span>
                <span className="text-sm font-medium">{payment?.paymentDate ? formatDateTimeIndian(payment.paymentDate) : 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Payment Mode</span>
                <span className="text-sm font-medium">{payment?.paymentMode}</span>
              </div>
              {payment?.transactionId && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Transaction ID</span>
                  <span className="text-sm font-medium">{payment.transactionId}</span>
                </div>
              )}
              {payment?.chequeNumber && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Cheque Number</span>
                  <span className="text-sm font-medium">{payment.chequeNumber}</span>
                </div>
              )}
              {payment?.upiId && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">UPI ID</span>
                  <span className="text-sm font-medium">{payment.upiId}</span>
                </div>
              )}
              {payment?.notes && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Notes</span>
                  <span className="text-sm font-medium">{payment.notes}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Summary Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg p-6 sticky top-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Amount Paid</span>
                <span className="font-semibold text-green-600">₹{payment.amount.toFixed(2)}</span>
              </div>

              {fee && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fee Amount</span>
                    <span className="font-medium">₹{(fee?.netAmount || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Previously Paid</span>
                    <span className="font-medium">₹{((fee?.paidAmount || 0) - (payment?.amount || 0)).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Remaining Balance</span>
                    <span className={`font-medium ${(fee?.balanceAmount || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      ₹{(fee?.balanceAmount || 0).toFixed(2)}
                    </span>
                  </div>
                </>
              )}

              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between text-base font-bold">
                  <span>Total Paid</span>
                  <span className="text-green-600">₹{(payment?.amount || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ToastContainer />
    </div>
  )
}

export default ViewFeeReceipt
