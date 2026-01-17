import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'
import { Invoice, InvoiceItem } from '../types'
import { ArrowLeft, Download, Send, Printer, CheckCircle, X, Receipt } from 'lucide-react'
import { useToast } from '../hooks/useToast'
import usePrintReceipt from '../components/PrintReceipt'
import { formatDate, formatDateTime, formatTime } from '../utils/dateUtils'
import ThermalBillPrint from '../components/ThermalBillPrint'

const ViewInvoice = () => {
  const navigate = useNavigate()
  const { invoiceId } = useParams()
  const { showToast, ToastContainer } = useToast()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [showQRScanner, setShowQRScanner] = useState<boolean>(false)
  const [customerUPIId, setCustomerUPIId] = useState<string>('') // Customer's UPI ID for requesting payment
  const [qrCodeImage, setQrCodeImage] = useState<string>('')
  const [loadingQR, setLoadingQR] = useState<boolean>(false)
  const [tenantUPIId, setTenantUPIId] = useState<string>('') // Store's UPI ID for receiving payment
  const [paymentRequestMode, setPaymentRequestMode] = useState<'receive' | 'request'>('receive')
  const [showThermalBill, setShowThermalBill] = useState<boolean>(false)

  useEffect(() => {
    if (invoiceId) {
      fetchInvoice()
    }
    fetchTenantUPIId()
  }, [invoiceId])

  const fetchTenantUPIId = async (): Promise<void> => {
    try {
      const tenantId = localStorage.getItem('tenantId')
      if (tenantId) {
        const response = await api.get(`/admin/tenants/${tenantId}`)
        const tenant = response.data.data || response.data
        setTenantUPIId(tenant.upiId || '')
      }
    } catch (error) {
      console.error('Error fetching tenant UPI ID:', error)
    }
  }

  const fetchInvoice = async (): Promise<void> => {
    try {
      setLoading(true)
      const response = await api.get<Invoice>(`/invoices/${invoiceId}`)
      setInvoice(response.data)
    } catch (error: any) {
      console.error('Error fetching invoice:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch invoice'
      showToast(errorMessage, 'error')
      navigate('/invoices')
    } finally {
      setLoading(false)
    }
  }

  const generateQRCode = async (customerUPIId?: string): Promise<void> => {
    if (!invoice) return

    setLoadingQR(true)
    try {
      const amount = invoice.balanceAmount > 0 ? invoice.balanceAmount : invoice.totalAmount
      const description = `Invoice ${invoice.invoiceNumber || invoice.id}`
      
      if (paymentRequestMode === 'request' && customerUPIId) {
        // Request payment from customer's UPI ID
        const storeName = localStorage.getItem('tenantName') || 'Store'
        const upiUrl = `upi://pay?pa=${customerUPIId}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(description)}&pn=${encodeURIComponent(storeName)}`
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUrl)}`
        setQrCodeImage(qrCodeUrl)
      } else if (tenantUPIId) {
        // Generate QR code for customer to scan and pay to store
        const upiUrl = `upi://pay?pa=${tenantUPIId}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(description)}`
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUrl)}`
        setQrCodeImage(qrCodeUrl)
      } else {
        showToast('Please set your store UPI ID in tenant settings', 'error')
      }
    } catch (error: any) {
      console.error('Error generating QR code:', error)
      showToast('Failed to generate QR code', 'error')
    } finally {
      setLoadingQR(false)
    }
  }

  const printReceipt = usePrintReceipt()

  const handlePrintInvoice = async (): Promise<void> => {
    if (!invoiceId) return
    await printReceipt({
      receiptType: 'invoice',
      id: invoiceId || '',
      receiptNumber: invoice?.invoiceNumber
    })
  }

  const handleShareViaWhatsApp = async (): Promise<void> => {
    if (!invoice) return

    try {
      // Get customer phone number if available
      const customer = invoice.customer
      const phoneNumber = customer?.phone?.replace(/\D/g, '') || ''

      // Generate invoice message with item details
      let invoiceMessage = `*Invoice Details*\n\n`
      invoiceMessage += `Invoice #: ${invoice.invoiceNumber || invoiceId}\n`
      invoiceMessage += `Date: ${formatDate(invoice.invoiceDate)}\n`
      invoiceMessage += `Customer: ${invoice.customerName || 'Walk-in Customer'}\n\n`
      
      // Add items
      if (invoice.items && invoice.items.length > 0) {
        invoiceMessage += `*Items:*\n`
        invoice.items.forEach((item, index) => {
          invoiceMessage += `${index + 1}. ${item.productName || 'Item'} - Qty: ${item.quantity} x ₹${item.unitPrice.toFixed(2)} = ₹${item.totalAmount.toFixed(2)}\n`
        })
        invoiceMessage += `\n`
      }
      
      invoiceMessage += `Subtotal: ₹${invoice.subTotal?.toFixed(2) || invoice.totalAmount.toFixed(2)}\n`
      if (invoice.taxAmount && invoice.taxAmount > 0) {
        invoiceMessage += `Tax: ₹${invoice.taxAmount.toFixed(2)}\n`
      }
      if (invoice.billLevelDiscount && invoice.billLevelDiscount > 0) {
        invoiceMessage += `Discount: -₹${invoice.billLevelDiscount.toFixed(2)}\n`
      }
      invoiceMessage += `*Total: ₹${invoice.totalAmount.toFixed(2)}*\n\n`
      invoiceMessage += `Thank you for your business!`

      // Try Web Share API first (works better on mobile)
      if (navigator.share) {
        try {
          await navigator.share({
            title: `Invoice ${invoice.invoiceNumber || invoiceId}`,
            text: invoiceMessage,
            url: phoneNumber ? `https://wa.me/${phoneNumber}` : undefined
          })
          showToast('Shared successfully', 'success')
          return
        } catch (shareError: any) {
          // User cancelled or share failed, fall through to WhatsApp URL
          if (shareError.name !== 'AbortError') {
            console.log('Web Share API failed, using WhatsApp URL:', shareError)
          } else {
            // User cancelled, don't show error
            return
          }
        }
      }

      // Fallback: Use WhatsApp URL
      const whatsappUrl = phoneNumber
        ? `https://wa.me/${phoneNumber}?text=${encodeURIComponent(invoiceMessage)}`
        : `https://web.whatsapp.com/send?text=${encodeURIComponent(invoiceMessage)}`

      // For mobile PWA, use location.href instead of window.open
      if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
        window.location.href = whatsappUrl
      } else {
        // For desktop, try window.open
        const newWindow = window.open(whatsappUrl, '_blank')
        if (!newWindow) {
          // Popup blocked, fallback to location.href
          window.location.href = whatsappUrl
        }
      }

      showToast('Opening WhatsApp...', 'success')
    } catch (error: any) {
      console.error('Error sharing via WhatsApp:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to share via WhatsApp'
      showToast(errorMessage, 'error')
    }
  }

  const handleQRScan = (): void => {
    // This would integrate with a QR code scanner library
    // For now, we'll show a prompt to enter UPI ID manually
    setShowQRScanner(true)
    if (invoice) {
      generateQRCode()
    }
  }

  const calculateTotals = () => {
    if (!invoice) return { subTotal: 0, taxAmount: 0, discountAmount: 0, roundOff: 0, totalAmount: 0 }

    const subTotal = invoice.items?.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice - item.discountAmount,
      0
    ) || 0

    const taxAmount = invoice.items?.reduce((sum, item) => sum + item.taxAmount, 0) || 0
    const discountAmount = invoice.items?.reduce((sum, item) => sum + item.discountAmount, 0) || 0
    const totalAmount = subTotal + taxAmount - (invoice.billLevelDiscount || 0)
    const roundOff = Math.round(totalAmount) - totalAmount
    const finalTotal = totalAmount + roundOff

    return {
      subTotal,
      taxAmount,
      discountAmount,
      roundOff,
      totalAmount: finalTotal,
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Invoice not found</h2>
        <p className="mt-2 text-gray-600">The invoice you're looking for doesn't exist.</p>
        <button
          onClick={() => navigate('/invoices')}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Invoices
        </button>
      </div>
    )
  }

  const totals = calculateTotals()

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex items-center space-x-2 sm:space-x-4">
          <button
            onClick={() => navigate('/invoices')}
            className="inline-flex items-center px-2 sm:px-3 py-2 border border-gray-300 rounded-md shadow-sm text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 sm:mr-2" />
            <span className="hidden sm:inline">Back to Invoices</span>
            <span className="sm:hidden">Back</span>
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Invoice #{invoice.invoiceNumber}</h1>
            <p className="mt-1 text-xs sm:text-sm text-gray-500">
              Invoice details and actions
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowThermalBill(true)}
            className="inline-flex items-center px-3 sm:px-4 py-2 border border-transparent rounded-md shadow-sm text-xs sm:text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
          >
            <Receipt className="h-4 w-4 sm:h-5 sm:w-5 sm:mr-2" />
            <span className="hidden sm:inline">Print Bill</span>
            <span className="sm:hidden">Bill</span>
          </button>
          <button
            onClick={handlePrintInvoice}
            className="inline-flex items-center px-3 sm:px-4 py-2 border border-gray-300 rounded-md shadow-sm text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Download className="h-4 w-4 sm:h-5 sm:w-5 sm:mr-2" />
            <span className="hidden sm:inline">Download Invoice</span>
            <span className="sm:hidden">Download</span>
          </button>
          <button
            onClick={handleShareViaWhatsApp}
            className="inline-flex items-center px-3 sm:px-4 py-2 border border-transparent rounded-md shadow-sm text-xs sm:text-sm font-medium text-white bg-green-600 hover:bg-green-700"
          >
            <Send className="h-4 w-4 sm:h-5 sm:w-5 sm:mr-2" />
            <span className="hidden sm:inline">Send via WhatsApp</span>
            <span className="sm:hidden">WhatsApp</span>
          </button>
          {invoice.balanceAmount > 0 && invoice.status !== 'Completed' && invoice.status !== 'Cancelled' && (
            <button
              onClick={handleQRScan}
              className="inline-flex items-center px-3 sm:px-4 py-2 border border-transparent rounded-md shadow-sm text-xs sm:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <Download className="h-4 w-4 sm:h-5 sm:w-5 sm:mr-2" />
              <span className="hidden sm:inline">Pay Now</span>
              <span className="sm:hidden">Pay</span>
            </button>
          )}
        </div>
      </div>

      {/* Invoice Status */}
      <div className="bg-white shadow rounded-lg p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div>
              <h2 className="text-lg font-medium text-gray-900">Status</h2>
              <div className="flex items-center mt-1">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    invoice.status === 'Completed'
                      ? 'bg-green-100 text-green-800'
                      : invoice.status === 'Draft'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {invoice.status}
                </span>
                {invoice.balanceAmount <= 0 && (
                  <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Paid
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Total Amount</div>
            <div className="text-2xl font-bold text-gray-900">₹{invoice.totalAmount.toFixed(2)}</div>
            {invoice.status === 'Completed' ? (
              <div className="text-sm text-green-600">Fully Paid</div>
            ) : invoice.balanceAmount > 0 ? (
              <div className="text-sm text-red-600">Balance: ₹{invoice.balanceAmount.toFixed(2)}</div>
            ) : (
              <div className="text-sm text-green-600">Paid</div>
            )}
          </div>
        </div>
      </div>

      {/* Invoice Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Customer & Invoice Info */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Customer Information */}
          <div className="bg-white shadow rounded-lg p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Customer Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <p className="mt-1 text-sm text-gray-900">{invoice.customerName || 'Walk-in Customer'}</p>
                {invoice.customerPhone && (
                  <p className="mt-1 text-sm text-gray-600">Phone: {invoice.customerPhone}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <p className="mt-1 text-sm text-gray-900">{formatDate(invoice.invoiceDate)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Time</label>
                <p className="mt-1 text-sm text-gray-900">{formatTime(invoice.invoiceDate)}</p>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
              <h3 className="text-base sm:text-lg font-medium text-gray-900">Items</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Qty
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tax
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoice.items?.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.productName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ₹{item.unitPrice.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ₹{item.taxAmount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ₹{item.totalAmount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Summary Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg p-4 sm:p-6 sticky top-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">₹{totals.subTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax</span>
                <span className="font-medium">₹{totals.taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Discount</span>
                <span className="font-medium">-₹{totals.discountAmount.toFixed(2)}</span>
              </div>
              {invoice.billLevelDiscount && invoice.billLevelDiscount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Bill Discount</span>
                  <span className="font-medium">-₹{invoice.billLevelDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Round Off</span>
                <span className="font-medium">₹{totals.roundOff.toFixed(2)}</span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>₹{totals.totalAmount.toFixed(2)}</span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Paid</span>
                <span className={`font-medium ${
                  invoice.status === 'Completed' || invoice.paidAmount >= totals.totalAmount
                    ? 'text-green-600'
                    : invoice.paidAmount > 0
                    ? 'text-blue-600'
                    : 'text-gray-600'
                }`}>
                  ₹{invoice.status === 'Completed' 
                    ? totals.totalAmount.toFixed(2) 
                    : invoice.paidAmount.toFixed(2)}
                </span>
              </div>
              {invoice.status === 'Completed' ? (
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-600">Status</span>
                  <span className="font-medium text-green-600">Fully Paid</span>
                </div>
              ) : invoice.balanceAmount > 0 ? (
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-600">Balance</span>
                  <span className="font-medium text-red-600">
                    ₹{invoice.balanceAmount.toFixed(2)}
                  </span>
                </div>
              ) : (
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-600">Balance</span>
                  <span className="font-medium text-green-600">₹0.00</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Modal for Payment */}
      {showQRScanner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 my-4 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 sm:p-6 border-b flex-shrink-0">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Pay Invoice</h2>
              <button
                onClick={() => setShowQRScanner(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Amount to Pay</div>
                <div className="text-2xl font-bold text-gray-900">₹{invoice.balanceAmount.toFixed(2)}</div>
              </div>

              {/* Payment Method Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentRequestMode('receive')
                      setCustomerUPIId('')
                      generateQRCode()
                    }}
                    className={`p-3 border-2 rounded-lg text-sm font-medium ${
                      paymentRequestMode === 'receive'
                        ? 'border-primary-600 bg-primary-50 text-primary-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    Receive Payment
                    <div className="text-xs text-gray-500 mt-1">Customer scans QR</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentRequestMode('request')
                      setQrCodeImage('')
                    }}
                    className={`p-3 border-2 rounded-lg text-sm font-medium ${
                      paymentRequestMode === 'request'
                        ? 'border-primary-600 bg-primary-50 text-primary-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    Request Payment
                    <div className="text-xs text-gray-500 mt-1">Enter customer UPI</div>
                  </button>
                </div>
              </div>

              {paymentRequestMode === 'receive' && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">Scan QR Code to Pay</label>
                  {loadingQR ? (
                    <div className="flex justify-center items-center p-8 bg-gray-50 rounded-lg">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    </div>
                  ) : qrCodeImage ? (
                    <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                      <img src={qrCodeImage} alt="UPI QR Code" className="w-48 h-48 mb-3" />
                      <p className="text-xs text-gray-600 text-center">
                        {tenantUPIId ? (
                          <>Scan this QR code with any UPI app to pay ₹{invoice.balanceAmount.toFixed(2)} to {tenantUPIId}</>
                        ) : (
                          <>Scan this QR code with any UPI app to pay ₹{invoice.balanceAmount.toFixed(2)}</>
                        )}
                      </p>
                      {!tenantUPIId && (
                        <p className="text-xs text-red-600 text-center mt-1">
                          Please set store UPI ID in tenant settings
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-50 rounded-lg text-center text-sm text-gray-500">
                      {tenantUPIId ? 'QR Code will be generated here' : 'Please set store UPI ID in tenant settings'}
                    </div>
                  )}
                </div>
              )}

              {paymentRequestMode === 'request' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Enter Customer UPI ID
                    </label>
                    <input
                      type="text"
                      placeholder="Enter customer UPI ID (e.g., customer@paytm)"
                      value={customerUPIId}
                      onChange={(e) => {
                        setCustomerUPIId(e.target.value)
                        if (e.target.value) {
                          generateQRCode(e.target.value)
                        } else {
                          setQrCodeImage('')
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Enter customer's UPI ID to request payment
                    </p>
                  </div>
                  {customerUPIId && qrCodeImage && (
                    <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                      <img src={qrCodeImage} alt="UPI Payment Request" className="w-48 h-48 mb-3" />
                      <p className="text-xs text-gray-600 text-center">
                        Customer can scan this to pay ₹{invoice.balanceAmount.toFixed(2)} from {customerUPIId}
                      </p>
                    </div>
                  )}
                </div>
              )}

            </div>
            
            {/* Sticky Footer */}
            <div className="border-t bg-gray-50 p-4 sm:p-6 flex-shrink-0">
              <button
                onClick={() => setShowQRScanner(false)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Thermal Bill Print Modal */}
      {showThermalBill && invoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 my-4">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-bold text-gray-900">Thermal Bill Print</h2>
              <button
                onClick={() => setShowThermalBill(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">
              <ThermalBillPrint invoice={invoice} onClose={() => setShowThermalBill(false)} />
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  )
}

export default ViewInvoice
