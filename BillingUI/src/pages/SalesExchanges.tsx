import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { Plus, Search, Eye, CheckCircle } from 'lucide-react'
import { SalesExchange, Invoice, ProductVariantCombination } from '../types'
import { useToast } from '../hooks/useToast'
import { formatDate } from '../utils/dateUtils'

const SalesExchanges = () => {
  const navigate = useNavigate()
  const { showToast, ToastContainer } = useToast()
  const [exchanges, setExchanges] = useState<SalesExchange[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [showModal, setShowModal] = useState<boolean>(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [originalItems, setOriginalItems] = useState<{ [key: number]: { quantity: number } }>({})
  const [newItems, setNewItems] = useState<Array<{ productId: number; variantCombinationId?: number; size?: string; color?: string; quantity: number }>>([])
  const [exchangeReason, setExchangeReason] = useState<string>('')
  const [priceDifference, setPriceDifference] = useState<number>(0)
  const [loadingInvoices, setLoadingInvoices] = useState<boolean>(false)

  useEffect(() => {
    fetchExchanges()
    fetchCompletedInvoices()
  }, [])

  const fetchExchanges = async (): Promise<void> => {
    try {
      const response = await api.get<{ success: boolean; data: SalesExchange[] }>('/sales-exchanges')
      if (response.data.success) {
        setExchanges(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching exchanges:', error)
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

  const calculatePriceDifference = async (): Promise<void> => {
    if (!selectedInvoice || newItems.length === 0) {
      setPriceDifference(0)
      return
    }

    try {
      const originalTotal = Object.entries(originalItems).reduce((sum, [itemId, data]) => {
        const invoiceItem = selectedInvoice.items.find(i => i.id === parseInt(itemId))
        return sum + (invoiceItem ? invoiceItem.unitPrice * data.quantity : 0)
      }, 0)

      // Fetch prices for new items
      let newTotal = 0
      for (const newItem of newItems) {
        if (newItem.variantCombinationId) {
          const variantResponse = await api.get<{ success: boolean; data: ProductVariantCombination }>(
            `/product-variant-combinations/${newItem.variantCombinationId}`
          )
          if (variantResponse.data.success) {
            newTotal += (variantResponse.data.data.sellingPrice || 0) * newItem.quantity
          }
        } else {
          const productResponse = await api.get<{ success: boolean; data: { sellingPrice: number } }>(
            `/products/${newItem.productId}`
          )
          if (productResponse.data.success) {
            newTotal += productResponse.data.data.sellingPrice * newItem.quantity
          }
        }
      }

      setPriceDifference(newTotal - originalTotal)
    } catch (error) {
      console.error('Error calculating price difference:', error)
    }
  }

  useEffect(() => {
    calculatePriceDifference()
  }, [originalItems, newItems, selectedInvoice])

  const handleCreateExchange = async (): Promise<void> => {
    if (!selectedInvoice) {
      showToast('Please select an invoice', 'error')
      return
    }

    if (Object.keys(originalItems).length === 0) {
      showToast('Please select items to exchange', 'error')
      return
    }

    if (newItems.length === 0) {
      showToast('Please add new items for exchange', 'error')
      return
    }

    if (!exchangeReason.trim()) {
      showToast('Please provide an exchange reason', 'error')
      return
    }

    try {
      const items = [
        ...Object.entries(originalItems).map(([itemId, data]) => ({
          type: 'Original',
          invoiceItemId: parseInt(itemId),
          productId: selectedInvoice.items.find(i => i.id === parseInt(itemId))?.productId || 0,
          quantity: data.quantity,
        })),
        ...newItems.map(item => ({
          type: 'New',
          productId: item.productId,
          variantCombinationId: item.variantCombinationId,
          size: item.size,
          color: item.color,
          quantity: item.quantity,
        })),
      ]

      await api.post('/sales-exchanges', {
        invoiceId: selectedInvoice.id,
        reason: exchangeReason,
        items,
      })
      showToast('Sales exchange created successfully', 'success')
      setShowModal(false)
      setSelectedInvoice(null)
      setOriginalItems({})
      setNewItems([])
      setExchangeReason('')
      fetchExchanges()
    } catch (error: any) {
      console.error('Error creating exchange:', error)
      showToast(error.response?.data?.message || 'Failed to create exchange', 'error')
    }
  }

  const handleApprove = async (id: number): Promise<void> => {
    try {
      await api.post(`/sales-exchanges/${id}/approve`)
      showToast('Exchange approved successfully', 'success')
      fetchExchanges()
    } catch (error: any) {
      console.error('Error approving exchange:', error)
      showToast(error.response?.data?.message || 'Failed to approve exchange', 'error')
    }
  }

  const handleProcess = async (id: number): Promise<void> => {
    if (!window.confirm('Process this exchange? This will update inventory.')) return

    try {
      await api.post(`/sales-exchanges/${id}/process`)
      showToast('Exchange processed successfully. Inventory updated.', 'success')
      fetchExchanges()
    } catch (error: any) {
      console.error('Error processing exchange:', error)
      showToast(error.response?.data?.message || 'Failed to process exchange', 'error')
    }
  }

  const filteredExchanges = exchanges.filter((ex) =>
    ex.exchangeNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ex.invoice?.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Sales Exchanges</h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-500">Manage product exchanges (size/color changes)</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-transparent rounded-md shadow-sm text-xs sm:text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
        >
          <Plus className="h-4 w-4 sm:h-5 sm:w-5 sm:mr-2" />
          <span className="hidden sm:inline">New Exchange</span>
          <span className="sm:hidden">New</span>
        </button>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by exchange number or invoice..."
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
                  Exchange Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price Difference
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
              {filteredExchanges.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    No exchanges found
                  </td>
                </tr>
              ) : (
                filteredExchanges.map((ex) => (
                  <tr key={ex.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {ex.exchangeNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ex.invoice?.invoiceNumber || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(ex.exchangeDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {ex.priceDifference > 0 ? (
                        <span className="text-red-600">+₹{ex.priceDifference.toFixed(2)} (Customer pays)</span>
                      ) : ex.priceDifference < 0 ? (
                        <span className="text-green-600">₹{Math.abs(ex.priceDifference).toFixed(2)} (Refund)</span>
                      ) : (
                        <span className="text-gray-500">No difference</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {ex.status === 'Processed' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Processed
                        </span>
                      ) : ex.status === 'Approved' ? (
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
                          onClick={() => navigate(`/sales-exchanges/${ex.id}`)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                        {ex.status === 'Pending' && (
                          <button
                            onClick={() => handleApprove(ex.id)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Approve
                          </button>
                        )}
                        {ex.status === 'Approved' && (
                          <button
                            onClick={() => handleProcess(ex.id)}
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

      {/* Create Exchange Modal - Simplified version */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white m-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Create Sales Exchange</h3>
              <button
                onClick={() => {
                  setShowModal(false)
                  setSelectedInvoice(null)
                  setOriginalItems({})
                  setNewItems([])
                  setExchangeReason('')
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
                      setOriginalItems({})
                      setNewItems([])
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Exchange Reason *</label>
                    <textarea
                      value={exchangeReason}
                      onChange={(e) => setExchangeReason(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      rows={2}
                      placeholder="Enter exchange reason..."
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Original Items (to return)</h4>
                      <div className="border border-gray-300 rounded-md p-2 space-y-2 max-h-64 overflow-y-auto">
                        {selectedInvoice.items.map((item) => (
                          <label key={item.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={!!originalItems[item.id!]}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setOriginalItems({
                                    ...originalItems,
                                    [item.id!]: { quantity: item.quantity },
                                  })
                                } else {
                                  const newOriginal = { ...originalItems }
                                  delete newOriginal[item.id!]
                                  setOriginalItems(newOriginal)
                                }
                              }}
                              className="h-4 w-4 text-primary-600"
                            />
                            <span className="text-sm text-gray-700">
                              {item.productName} {item.size && item.color && `(${item.size}/${item.color})`} - Qty: {item.quantity}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">New Items (to exchange for)</h4>
                      <div className="border border-gray-300 rounded-md p-2 space-y-2 max-h-64 overflow-y-auto">
                        <p className="text-xs text-gray-500 mb-2">
                          Note: Add new items with different size/color variants
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setNewItems([...newItems, { productId: 0, quantity: 1 }])
                          }}
                          className="text-xs text-primary-600 hover:text-primary-800"
                        >
                          + Add New Item
                        </button>
                        {newItems.map((item, idx) => (
                          <div key={idx} className="border border-gray-200 rounded p-2 space-y-2">
                            <input
                              type="number"
                              placeholder="Product ID"
                              value={item.productId || ''}
                              onChange={(e) => {
                                const updated = [...newItems]
                                updated[idx].productId = parseInt(e.target.value) || 0
                                setNewItems(updated)
                              }}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                            />
                            <input
                              type="text"
                              placeholder="Size"
                              value={item.size || ''}
                              onChange={(e) => {
                                const updated = [...newItems]
                                updated[idx].size = e.target.value
                                setNewItems(updated)
                              }}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                            />
                            <input
                              type="text"
                              placeholder="Color"
                              value={item.color || ''}
                              onChange={(e) => {
                                const updated = [...newItems]
                                updated[idx].color = e.target.value
                                setNewItems(updated)
                              }}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                            />
                            <input
                              type="number"
                              placeholder="Quantity"
                              value={item.quantity || ''}
                              onChange={(e) => {
                                const updated = [...newItems]
                                updated[idx].quantity = parseFloat(e.target.value) || 0
                                setNewItems(updated)
                              }}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setNewItems(newItems.filter((_, i) => i !== idx))
                              }}
                              className="text-xs text-red-600 hover:text-red-800"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {priceDifference !== 0 && (
                    <div className={`p-3 rounded-md ${priceDifference > 0 ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                      <p className={`text-sm font-medium ${priceDifference > 0 ? 'text-red-800' : 'text-green-800'}`}>
                        Price Difference: {priceDifference > 0 
                          ? `Customer needs to pay ₹${priceDifference.toFixed(2)}`
                          : `Customer will receive ₹${Math.abs(priceDifference).toFixed(2)} refund`}
                      </p>
                    </div>
                  )}

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false)
                        setSelectedInvoice(null)
                        setOriginalItems({})
                        setNewItems([])
                        setExchangeReason('')
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateExchange}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                    >
                      Create Exchange
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

export default SalesExchanges

