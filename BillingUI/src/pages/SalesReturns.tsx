import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { Plus, Search, Eye, CheckCircle, XCircle } from 'lucide-react'
import { SalesReturn, Invoice } from '../types'
import { useToast } from '../hooks/useToast'
import { formatDate } from '../utils/dateUtils'

const SalesReturns = () => {
  const navigate = useNavigate()
  const { showToast, ToastContainer } = useToast()
  const [returns, setReturns] = useState<SalesReturn[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [showModal, setShowModal] = useState<boolean>(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [selectedItems, setSelectedItems] = useState<{ [key: number]: { quantity: number; reason: string } }>({})
  const [returnReason, setReturnReason] = useState<string>('')
  const [loadingInvoices, setLoadingInvoices] = useState<boolean>(false)

  useEffect(() => {
    fetchReturns()
    fetchCompletedInvoices()
  }, [])

  const fetchReturns = async (): Promise<void> => {
    try {
      const response = await api.get<{ success: boolean; data: SalesReturn[] }>('/sales-returns')
      if (response.data.success) {
        setReturns(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching returns:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCompletedInvoices = async (): Promise<void> => {
    try {
      setLoadingInvoices(true)
      const response = await api.get<Invoice[]>('/invoices')
      // Filter for completed invoices and ensure items are included
      const completedInvoices = (Array.isArray(response.data) ? response.data : [])
        .filter((inv: Invoice) => inv.status === 'Completed')
        .filter((inv: Invoice) => inv.items && inv.items.length > 0) // Only invoices with items
      setInvoices(completedInvoices)
      if (completedInvoices.length === 0) {
        showToast('No completed invoices found', 'info')
      }
    } catch (error: any) {
      console.error('Error fetching invoices:', error)
      const errorMessage = error.response?.data?.message || 'Failed to load invoices'
      showToast(errorMessage, 'error')
      setInvoices([])
    } finally {
      setLoadingInvoices(false)
    }
  }

  const handleCreateReturn = async (): Promise<void> => {
    if (!selectedInvoice) {
      showToast('Please select an invoice', 'error')
      return
    }

    const itemsToReturn = Object.entries(selectedItems)
      .filter(([_, data]) => data.quantity > 0)
      .map(([itemId, data]) => ({
        invoiceItemId: parseInt(itemId),
        quantity: data.quantity,
        reason: data.reason || 'Customer request',
      }))

    if (itemsToReturn.length === 0) {
      showToast('Please select at least one item to return', 'error')
      return
    }

    if (!returnReason.trim()) {
      showToast('Please provide a return reason', 'error')
      return
    }

    try {
      await api.post('/sales-returns', {
        invoiceId: selectedInvoice.id,
        reason: returnReason,
        items: itemsToReturn,
      })
      showToast('Sales return created successfully', 'success')
      setShowModal(false)
      setSelectedInvoice(null)
      setSelectedItems({})
      setReturnReason('')
      fetchReturns()
    } catch (error: any) {
      console.error('Error creating return:', error)
      showToast(error.response?.data?.message || 'Failed to create return', 'error')
    }
  }

  const handleApprove = async (id: number): Promise<void> => {
    try {
      await api.post(`/sales-returns/${id}/approve`)
      showToast('Return approved successfully', 'success')
      fetchReturns()
    } catch (error: any) {
      console.error('Error approving return:', error)
      showToast(error.response?.data?.message || 'Failed to approve return', 'error')
    }
  }

  const handleProcess = async (id: number): Promise<void> => {
    if (!window.confirm('Process this return? This will update inventory and create a credit note.')) return

    try {
      await api.post(`/sales-returns/${id}/process`)
      showToast('Return processed successfully. Inventory updated and credit note created.', 'success')
      fetchReturns()
    } catch (error: any) {
      console.error('Error processing return:', error)
      showToast(error.response?.data?.message || 'Failed to process return', 'error')
    }
  }

  const filteredReturns = returns.filter((ret) =>
    ret.returnNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ret.invoice?.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Sales Returns</h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-500">Manage product returns and refunds</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-transparent rounded-md shadow-sm text-xs sm:text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
        >
          <Plus className="h-4 w-4 sm:h-5 sm:w-5 sm:mr-2" />
          <span className="hidden sm:inline">New Return</span>
          <span className="sm:hidden">New</span>
        </button>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="p-3 sm:p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by return number or invoice..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Return Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReturns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    No returns found
                  </td>
                </tr>
              ) : (
                filteredReturns.map((ret) => (
                  <tr key={ret.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {ret.returnNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ret.invoice?.invoiceNumber || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(ret.returnDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{ret.totalAmount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {ret.status === 'Processed' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Processed
                        </span>
                      ) : ret.status === 'Approved' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => navigate(`/sales-returns/${ret.id}`)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                        {ret.status === 'Pending' && (
                          <button
                            onClick={() => handleApprove(ret.id)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Approve
                          </button>
                        )}
                        {ret.status === 'Approved' && (
                          <button
                            onClick={() => handleProcess(ret.id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Process
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Return Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white m-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Create Sales Return</h3>
              <button
                onClick={() => {
                  setShowModal(false)
                  setSelectedInvoice(null)
                  setSelectedItems({})
                  setReturnReason('')
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Invoice</label>
                {loadingInvoices ? (
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-2"></div>
                    <span className="text-sm text-gray-500">Loading invoices...</span>
                  </div>
                ) : (
                  <select
                    value={selectedInvoice?.id || ''}
                    onChange={(e) => {
                      const invoice = invoices.find(i => i.id === parseInt(e.target.value))
                      setSelectedInvoice(invoice || null)
                      setSelectedItems({})
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    disabled={invoices.length === 0}
                  >
                    <option value="">{invoices.length === 0 ? 'No completed invoices available' : 'Select an invoice...'}</option>
                    {invoices.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoiceNumber} - {inv.customerName || 'Walk-in'} - ₹{inv.totalAmount.toFixed(2)}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {selectedInvoice && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Return Reason *</label>
                    <textarea
                      value={returnReason}
                      onChange={(e) => setReturnReason(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      rows={2}
                      placeholder="Enter return reason..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Items to Return</label>
                    <div className="border border-gray-300 rounded-md overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Product</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Size/Color</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Qty Sold</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Return Qty</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Reason</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {selectedInvoice.items.map((item) => (
                            <tr key={item.id}>
                              <td className="px-4 py-2 text-sm text-gray-900">{item.productName}</td>
                              <td className="px-4 py-2 text-sm text-gray-500">
                                {item.size && item.color ? `${item.size} / ${item.color}` : '-'}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-500">{item.quantity}</td>
                              <td className="px-4 py-2">
                                <input
                                  type="number"
                                  min="0"
                                  max={item.quantity}
                                  value={selectedItems[item.id!]?.quantity || 0}
                                  onChange={(e) => {
                                    const qty = parseFloat(e.target.value) || 0
                                    setSelectedItems({
                                      ...selectedItems,
                                      [item.id!]: {
                                        quantity: qty,
                                        reason: selectedItems[item.id!]?.reason || '',
                                      },
                                    })
                                  }}
                                  className="w-20 px-2 py-1 border border-gray-300 rounded-md text-sm"
                                />
                              </td>
                              <td className="px-4 py-2">
                                <input
                                  type="text"
                                  value={selectedItems[item.id!]?.reason || ''}
                                  onChange={(e) => {
                                    setSelectedItems({
                                      ...selectedItems,
                                      [item.id!]: {
                                        quantity: selectedItems[item.id!]?.quantity || 0,
                                        reason: e.target.value,
                                      },
                                    })
                                  }}
                                  className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                                  placeholder="Item reason..."
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false)
                        setSelectedInvoice(null)
                        setSelectedItems({})
                        setReturnReason('')
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateReturn}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                    >
                      Create Return
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  )
}

export default SalesReturns

