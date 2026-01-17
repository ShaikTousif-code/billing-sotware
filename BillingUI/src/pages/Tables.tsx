import { useEffect, useState } from 'react'
import api from '../services/api'
import { Plus, Check, X } from 'lucide-react'

interface Table {
  id: number
  tableNumber: string
  capacity: number
  status: string
  location?: string
  currentInvoiceId?: number
}

const Tables = () => {
  const [tables, setTables] = useState<Table[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [showModal, setShowModal] = useState<boolean>(false)
  const [formData, setFormData] = useState({
    tableNumber: '',
    capacity: '',
    location: '',
  })

  useEffect(() => {
    fetchTables()
  }, [])

  const fetchTables = async (): Promise<void> => {
    try {
      const response = await api.get<Table[]>('/tables')
      setTables(response.data)
    } catch (error) {
      console.error('Error fetching tables:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    try {
      await api.post('/tables', {
        ...formData,
        capacity: parseInt(formData.capacity),
      })
      setShowModal(false)
      setFormData({ tableNumber: '', capacity: '', location: '' })
      fetchTables()
    } catch (error) {
      console.error('Error creating table:', error)
      alert('Failed to create table')
    }
  }

  const handleRelease = async (id: number): Promise<void> => {
    try {
      await api.post(`/tables/${id}/release`)
      fetchTables()
    } catch (error) {
      console.error('Error releasing table:', error)
      alert('Failed to release table')
    }
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'Available':
        return 'bg-green-100 text-green-800'
      case 'Occupied':
        return 'bg-red-100 text-red-800'
      case 'Reserved':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Table Management</h1>
          <p className="mt-1 text-sm text-gray-500">Manage restaurant tables</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Table
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {tables.map((table) => (
          <div
            key={table.id}
            className={`bg-white shadow rounded-lg p-6 border-2 ${
              table.status === 'Occupied' ? 'border-red-300' : 'border-gray-200'
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Table {table.tableNumber}</h3>
                <p className="text-sm text-gray-500">Capacity: {table.capacity}</p>
                {table.location && <p className="text-sm text-gray-500">{table.location}</p>}
              </div>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(table.status)}`}>
                {table.status}
              </span>
            </div>
            {table.status === 'Occupied' && (
              <button
                onClick={() => handleRelease(table.id)}
                className="w-full mt-4 inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
              >
                <Check className="h-5 w-5 mr-2" />
                Release Table
              </button>
            )}
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add Table</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Table Number *</label>
                <input
                  type="text"
                  required
                  value={formData.tableNumber}
                  onChange={(e) => setFormData({ ...formData, tableNumber: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Capacity *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
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

export default Tables

