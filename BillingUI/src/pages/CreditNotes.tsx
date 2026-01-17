import { useEffect, useState } from 'react'
import api from '../services/api'
import { format } from 'date-fns'
import { Plus, Eye, Check } from 'lucide-react'

interface CreditNote {
  id: number
  creditNoteNumber: string
  creditNoteDate: string
  invoiceId: number
  reason: string
  totalAmount: number
  status: string
}

const CreditNotes = () => {
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    fetchCreditNotes()
  }, [])

  const fetchCreditNotes = async (): Promise<void> => {
    try {
      const response = await api.get<CreditNote[]>('/credit-notes')
      setCreditNotes(response.data)
    } catch (error) {
      console.error('Error fetching credit notes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleProcess = async (id: number): Promise<void> => {
    try {
      await api.post(`/credit-notes/${id}/process`)
      fetchCreditNotes()
    } catch (error) {
      console.error('Error processing credit note:', error)
      alert('Failed to process credit note')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-0">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Credit Notes</h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-500">Manage credit notes and returns</p>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Credit Note #</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Date</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Reason</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {creditNotes.map((cn) => (
                <tr key={cn.id}>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <div className="text-xs sm:text-sm font-medium text-gray-900">
                      {cn.creditNoteNumber}
                    </div>
                    <div className="sm:hidden text-xs text-gray-500 mt-1">
                      {format(new Date(cn.creditNoteDate), 'MMM dd, yyyy')}
                    </div>
                    <div className="md:hidden text-xs text-gray-500 mt-1">
                      {cn.reason}
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden sm:table-cell">
                    {format(new Date(cn.creditNoteDate), 'MMM dd, yyyy')}
                  </td>
                  <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm text-gray-500 hidden md:table-cell">{cn.reason}</td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                    ₹{cn.totalAmount.toFixed(2)}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        cn.status === 'Processed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {cn.status}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-xs sm:text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      {cn.status === 'Pending' && (
                        <button
                          onClick={() => handleProcess(cn.id)}
                          className="text-green-600 hover:text-green-900 touch-manipulation p-1"
                          title="Process"
                        >
                          <Check className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                      )}
                      <a
                        href={`/api/export/credit-notes/${cn.id}/pdf`}
                        target="_blank"
                        className="text-primary-600 hover:text-primary-900 touch-manipulation p-1"
                        title="View"
                      >
                        <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                      </a>
                    </div>
                  </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  )
}

export default CreditNotes

