import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../services/api'
import { format } from 'date-fns'

interface PurchaseHistoryItem {
  invoiceId: number
  invoiceNumber: string
  invoiceDate: string
  amount: number
  paidAmount: number
  balanceAmount: number
  status: string
}

interface CustomerPurchaseHistory {
  customer: {
    id: number
    name: string
  }
  totalInvoices: number
  totalAmount: number
  totalPaid: number
  totalOutstanding: number
  invoices: PurchaseHistoryItem[]
}

const CustomerPurchaseHistory = () => {
  const { customerId } = useParams<{ customerId: string }>()
  const [history, setHistory] = useState<CustomerPurchaseHistory | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    if (customerId) {
      fetchHistory()
    }
  }, [customerId])

  const fetchHistory = async (): Promise<void> => {
    try {
      const response = await api.get<CustomerPurchaseHistory>(`/customer-purchase-history/customer/${customerId}`)
      setHistory(response.data)
    } catch (error) {
      console.error('Error fetching purchase history:', error)
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

  if (!history) {
    return <div className="text-center py-12 text-gray-500">No purchase history found</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Purchase History</h1>
        <p className="mt-1 text-sm text-gray-500">Customer: {history.customer.name}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-sm text-gray-600">Total Invoices</div>
          <div className="text-2xl font-bold text-gray-900">{history.totalInvoices}</div>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-sm text-gray-600">Total Amount</div>
          <div className="text-2xl font-bold text-gray-900">₹{history.totalAmount.toFixed(2)}</div>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-sm text-gray-600">Total Paid</div>
          <div className="text-2xl font-bold text-green-600">₹{history.totalPaid.toFixed(2)}</div>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-sm text-gray-600">Outstanding</div>
          <div className="text-2xl font-bold text-red-600">₹{history.totalOutstanding.toFixed(2)}</div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {history.invoices.map((invoice) => (
              <tr key={invoice.invoiceId}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {invoice.invoiceNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {format(new Date(invoice.invoiceDate), 'MMM dd, yyyy')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  ₹{invoice.amount.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                  ₹{invoice.paidAmount.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                  ₹{invoice.balanceAmount.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default CustomerPurchaseHistory

