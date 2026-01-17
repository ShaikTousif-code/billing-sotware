import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../services/api'
import { format } from 'date-fns'
import { Plus, Minus } from 'lucide-react'

interface WalletTransaction {
  id: number
  transactionType: string
  amount: number
  balanceAfter: number
  transactionDate: string
  notes?: string
}

const Wallet = () => {
  const { customerId } = useParams<{ customerId: string }>()
  const [transactions, setTransactions] = useState<WalletTransaction[]>([])
  const [balance, setBalance] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)
  const [showModal, setShowModal] = useState<boolean>(false)
  const [transactionType, setTransactionType] = useState<'Credit' | 'Debit'>('Credit')
  const [formData, setFormData] = useState({ amount: '', notes: '' })

  useEffect(() => {
    if (customerId) {
      fetchWalletData()
    }
  }, [customerId])

  const fetchWalletData = async (): Promise<void> => {
    try {
      const response = await api.get(`/wallet/customer/${customerId}`)
      setTransactions(response.data.transactions)
      setBalance(response.data.balance)
    } catch (error) {
      console.error('Error fetching wallet data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    try {
      const endpoint = transactionType === 'Credit' ? 'credit' : 'debit'
      await api.post(`/wallet/customer/${customerId}/${endpoint}`, {
        amount: parseFloat(formData.amount),
        notes: formData.notes,
      })
      setShowModal(false)
      setFormData({ amount: '', notes: '' })
      fetchWalletData()
    } catch (error) {
      console.error('Error processing transaction:', error)
      alert('Failed to process transaction')
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
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Wallet Management</h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-500">Manage customer wallet transactions</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-transparent rounded-md shadow-sm text-xs sm:text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 touch-manipulation"
        >
          <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Add Transaction</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg p-4 sm:p-6 text-white">
        <div className="text-xs sm:text-sm font-medium opacity-90">Current Balance</div>
        <div className="text-3xl sm:text-4xl font-bold mt-2">₹{balance.toFixed(2)}</div>
      </div>

      {/* Transactions */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Balance After</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Notes</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <div className="text-xs sm:text-sm text-gray-500">
                      {format(new Date(transaction.transactionDate), 'MMM dd, yyyy')}
                    </div>
                    <div className="sm:hidden text-xs text-gray-400">
                      {format(new Date(transaction.transactionDate), 'HH:mm')}
                    </div>
                    <div className="md:hidden text-xs text-gray-500 mt-1">
                      Balance: ₹{transaction.balanceAfter.toFixed(2)}
                    </div>
                    <div className="lg:hidden text-xs text-gray-500 mt-1">
                      {transaction.notes}
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        transaction.transactionType === 'Credit'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {transaction.transactionType}
                    </span>
                  </td>
                  <td
                    className={`px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-medium ${
                      transaction.transactionType === 'Credit' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {transaction.transactionType === 'Credit' ? '+' : '-'}₹{transaction.amount.toFixed(2)}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 hidden md:table-cell">
                    ₹{transaction.balanceAfter.toFixed(2)}
                  </td>
                  <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm text-gray-500 hidden lg:table-cell">{transaction.notes || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {/* Add Transaction Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 p-4">
          <div className="relative top-4 sm:top-20 mx-auto p-4 sm:p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Add Wallet Transaction</h3>
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700">Transaction Type</label>
                <select
                  value={transactionType}
                  onChange={(e) => setTransactionType(e.target.value as 'Credit' | 'Debit')}
                  className="mt-1 block w-full px-3 py-2.5 sm:py-2 text-sm border border-gray-300 rounded-md"
                >
                  <option value="Credit">Credit (Add Money)</option>
                  <option value="Debit">Debit (Deduct Money)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700">Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="mt-1 block w-full px-3 py-2.5 sm:py-2 text-sm border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="mt-1 block w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                />
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-full sm:w-auto px-4 py-2.5 sm:py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 touch-manipulation"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-4 py-2.5 sm:py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 touch-manipulation"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Wallet

