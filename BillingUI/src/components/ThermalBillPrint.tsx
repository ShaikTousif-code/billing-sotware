import { useEffect, useState } from 'react'
import { Invoice } from '../types'
import { formatDate, formatTime } from '../utils/dateUtils'
import api from '../services/api'

interface ThermalBillPrintProps {
  invoice: Invoice
  onClose?: () => void
}

interface TenantInfo {
  name: string
  address?: string
  gstin?: string
  phone?: string
  email?: string
}

const ThermalBillPrint = ({ invoice, onClose }: ThermalBillPrintProps) => {
  const [tenantInfo, setTenantInfo] = useState<TenantInfo>({
    name: localStorage.getItem('tenantName') || 'Shop Name',
    address: '',
    gstin: '',
    phone: '',
    email: '',
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTenantInfo()
  }, [])

  const fetchTenantInfo = async () => {
    try {
      // Try to get tenant info from API
      const tenantId = localStorage.getItem('tenantId')
      if (tenantId) {
        try {
          const response = await api.get(`/admin/tenants/${tenantId}`)
          const tenant = response.data.data || response.data
          setTenantInfo({
            name: tenant.name || localStorage.getItem('tenantName') || 'Shop Name',
            address: tenant.address || '',
            gstin: tenant.gstin || '',
            phone: tenant.contactPhone || '',
            email: tenant.contactEmail || '',
          })
        } catch {
          // Fallback to localStorage
          setTenantInfo({
            name: localStorage.getItem('tenantName') || 'Shop Name',
            address: '',
            gstin: '',
            phone: '',
            email: '',
          })
        }
      }
    } catch (error) {
      console.error('Error fetching tenant info:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateTotals = () => {
    if (!invoice.items) return { subTotal: 0, taxAmount: 0, discountAmount: 0, totalAmount: 0 }

    const subTotal = invoice.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    )

    const taxAmount = invoice.items.reduce((sum, item) => sum + item.taxAmount, 0)
    const discountAmount = invoice.items.reduce((sum, item) => sum + item.discountAmount, 0)
    const billDiscount = invoice.billLevelDiscount || 0
    const totalDiscount = discountAmount + billDiscount
    const totalAmount = subTotal + taxAmount - totalDiscount
    const roundOff = Math.round(totalAmount) - totalAmount
    const finalTotal = totalAmount + roundOff

    return {
      subTotal,
      taxAmount,
      discountAmount: totalDiscount,
      billDiscount,
      itemDiscount: discountAmount,
      roundOff,
      totalAmount: finalTotal,
    }
  }

  const totals = calculateTotals()

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  // Software vendor information - Maqfin Technologies
  const softwareVendor = {
    name: 'Maqfin Technologies',
    contact: '+91-9948733273',
    email: 'abdulahmed81477@gmail.com'
  }

  return (
    <div className="thermal-bill-container">
      {/* Print Button - Hidden when printing */}
      <div className="no-print mb-4 flex justify-end gap-2">
        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          Print Bill
        </button>
        {onClose && (
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
          >
            Close
          </button>
        )}
      </div>

      {/* Thermal Bill Content */}
      <div className="thermal-bill bg-white p-4" style={{ maxWidth: '80mm', margin: '0 auto' }}>
        {/* Shop Header */}
        <div className="text-center mb-3">
          <h1 className="text-xl font-bold mb-1" style={{ fontSize: '18px', fontWeight: 'bold' }}>
            {tenantInfo.name.toUpperCase()}
          </h1>
          {tenantInfo.gstin && (
            <p className="text-xs mb-1" style={{ fontSize: '10px', fontWeight: 'bold' }}>
              GSTIN: {tenantInfo.gstin}
            </p>
          )}
          {tenantInfo.address && (
            <p className="text-xs mb-1" style={{ fontSize: '10px' }}>
              {tenantInfo.address}
            </p>
          )}
          {tenantInfo.phone && (
            <p className="text-xs mb-1" style={{ fontSize: '10px' }}>
              Ph: {tenantInfo.phone}
            </p>
          )}
        </div>

        <div className="border-t border-b border-gray-800 py-2 my-2">
          <div className="text-center">
            <p className="text-sm font-semibold" style={{ fontSize: '12px' }}>
              TAX INVOICE
            </p>
          </div>
        </div>

        {/* Invoice Details */}
        <div className="mb-3 text-xs" style={{ fontSize: '10px' }}>
          <div className="flex justify-between mb-1">
            <span>Invoice No:</span>
            <span className="font-semibold">{invoice.invoiceNumber || `INV-${invoice.id}`}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span>Date:</span>
            <span>{formatDate(invoice.invoiceDate)}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span>Time:</span>
            <span>{formatTime(invoice.invoiceDate)}</span>
          </div>
          {invoice.customerName && invoice.customerName !== 'Walk-in Customer' && (
            <div className="flex justify-between mb-1">
              <span>Customer:</span>
              <span>{invoice.customerName}</span>
            </div>
          )}
        </div>

        <div className="border-t border-gray-800 my-2"></div>

        {/* Items Table */}
        <div className="mb-3">
          <table className="w-full text-xs" style={{ fontSize: '10px' }}>
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left py-1" style={{ width: '40%' }}>
                  Item
                </th>
                <th className="text-center py-1" style={{ width: '15%' }}>
                  Qty
                </th>
                <th className="text-right py-1" style={{ width: '22.5%' }}>
                  Rate
                </th>
                <th className="text-right py-1" style={{ width: '22.5%' }}>
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {invoice.items?.map((item, index) => (
                <tr key={index} className="border-b border-gray-300">
                  <td className="py-1">
                    <div>{item.productName}</div>
                    {item.size && item.color && (
                      <div className="text-xs" style={{ fontSize: '9px', color: '#666' }}>
                        {item.size} / {item.color}
                      </div>
                    )}
                    {item.discountAmount > 0 && (
                      <div className="text-xs text-green-600" style={{ fontSize: '9px' }}>
                        Disc: ₹{item.discountAmount.toFixed(2)}
                      </div>
                    )}
                  </td>
                  <td className="text-center py-1">{item.quantity}</td>
                  <td className="text-right py-1">₹{item.unitPrice.toFixed(2)}</td>
                  <td className="text-right py-1">₹{item.totalAmount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-gray-800 my-2"></div>

        {/* Totals */}
        <div className="mb-3 text-xs" style={{ fontSize: '10px' }}>
          <div className="flex justify-between mb-1">
            <span>Subtotal:</span>
            <span>₹{totals.subTotal.toFixed(2)}</span>
          </div>
          {totals.itemDiscount > 0 && (
            <div className="flex justify-between mb-1 text-green-600">
              <span>Item Discount:</span>
              <span>-₹{totals.itemDiscount.toFixed(2)}</span>
            </div>
          )}
          {totals.billDiscount > 0 && (
            <div className="flex justify-between mb-1 text-green-600">
              <span>Bill Discount:</span>
              <span>-₹{totals.billDiscount.toFixed(2)}</span>
            </div>
          )}
          {totals.discountAmount > 0 && (
            <div className="flex justify-between mb-1 font-semibold text-green-600">
              <span>Total Discount:</span>
              <span>-₹{totals.discountAmount.toFixed(2)}</span>
            </div>
          )}
          {totals.taxAmount > 0 && (
            <div className="flex justify-between mb-1">
              <span>Tax:</span>
              <span>₹{totals.taxAmount.toFixed(2)}</span>
            </div>
          )}
          {Math.abs(totals.roundOff) > 0.01 && (
            <div className="flex justify-between mb-1">
              <span>Round Off:</span>
              <span>₹{totals.roundOff.toFixed(2)}</span>
            </div>
          )}
          <div className="border-t border-gray-800 pt-1 mt-1">
            <div className="flex justify-between font-bold" style={{ fontSize: '12px' }}>
              <span>TOTAL:</span>
              <span>₹{totals.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Payment Info */}
        {invoice.paidAmount > 0 && (
          <div className="mb-3 text-xs border-t border-gray-300 pt-2" style={{ fontSize: '10px' }}>
            <div className="flex justify-between mb-1">
              <span>Paid:</span>
              <span className="text-green-600">₹{invoice.paidAmount.toFixed(2)}</span>
            </div>
            {invoice.balanceAmount > 0 && (
              <div className="flex justify-between">
                <span>Balance:</span>
                <span className="text-red-600">₹{invoice.balanceAmount.toFixed(2)}</span>
              </div>
            )}
            {invoice.balanceAmount <= 0 && (
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="text-green-600 font-semibold">PAID</span>
              </div>
            )}
          </div>
        )}

        {/* Saved Amount */}
        {totals.discountAmount > 0 && (
          <div className="mb-3 text-center border-t border-b border-gray-800 py-2">
            <p className="text-xs font-semibold text-green-600" style={{ fontSize: '11px' }}>
              You Saved: ₹{totals.discountAmount.toFixed(2)}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-4 text-xs" style={{ fontSize: '9px' }}>
          <div className="border-t border-gray-800 pt-2 mb-2">
            <p className="mb-1">Thank you for your visit!</p>
            <p className="mb-1">Visit Again</p>
          </div>
          <div className="border-t border-gray-300 pt-2">
            <p className="mb-1 font-semibold">This is a Computer Generated Bill</p>
            <p className="mb-1">Software by: {softwareVendor.name}</p>
            <p className="mb-1">Support: {softwareVendor.contact}</p>
            <p>No signature required</p>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .thermal-bill-container,
          .thermal-bill-container * {
            visibility: visible;
          }
          .thermal-bill-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
          .thermal-bill {
            max-width: 80mm !important;
            width: 80mm !important;
            margin: 0 auto !important;
            padding: 10mm !important;
            background: white !important;
            box-shadow: none !important;
          }
          @page {
            size: 80mm auto;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
          }
        }

        @media screen {
          .thermal-bill {
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            border: 1px solid #e5e7eb;
          }
        }
      `}</style>
    </div>
  )
}

export default ThermalBillPrint

