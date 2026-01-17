import { useEffect, useState } from 'react'
import api from '../services/api'
import { Plus, Edit, Trash2, Search, Building2 } from 'lucide-react'
import { OfficeClient } from '../types'
import { useDebounce } from '../hooks/useDebounce'
import { useToast } from '../hooks/useToast'
import ConfirmationDialog from '../components/ConfirmationDialog'
import { TableSkeleton } from '../components/LoadingSkeleton'

const OfficeClients = () => {
  const [clients, setClients] = useState<OfficeClient[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const debouncedSearch = useDebounce(searchTerm, 500)
  const [showModal, setShowModal] = useState<boolean>(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const { showToast, ToastContainer } = useToast()

  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    gstin: '',
    clientType: 'Corporate',
  })

  useEffect(() => {
    fetchClients()
  }, [debouncedSearch])

  const fetchClients = async (): Promise<void> => {
    try {
      const params = debouncedSearch ? { search: debouncedSearch } : {}
      const response = await api.get<{ data: { data: OfficeClient[] } }>('/office-clients', { params })
      setClients(response.data.data?.data || response.data.data || [])
    } catch (error) {
      console.error('Error fetching clients:', error)
      showToast('Failed to fetch clients', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    try {
      await api.post('/office-clients', formData)
      setShowModal(false)
      setFormData({
        companyName: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: '',
        gstin: '',
        clientType: 'Corporate',
      })
      showToast('Client created successfully', 'success')
      fetchClients()
    } catch (error: any) {
      console.error('Error creating client:', error)
      const message = error.response?.data?.message || 'Failed to create client'
      showToast(message, 'error')
    }
  }

  const handleDeleteClick = (id: number): void => {
    setDeleteId(id)
    setShowDeleteConfirm(true)
  }

  const handleDelete = async (): Promise<void> => {
    if (!deleteId) return

    try {
      await api.delete(`/office-clients/${deleteId}`)
      showToast('Client deleted successfully', 'success')
      setShowDeleteConfirm(false)
      setDeleteId(null)
      fetchClients()
    } catch (error: any) {
      console.error('Error deleting client:', error)
      const message = error.response?.data?.message || 'Failed to delete client'
      showToast(message, 'error')
    }
  }

  if (loading) {
    return <TableSkeleton rows={8} columns={6} />
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Office Clients</h1>
          <p className="mt-1 text-sm text-gray-500">Manage client relationships</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Client
        </button>
      </div>

      {/* Search */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {clients.map((client) => (
          <div key={client.id} className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center">
                <Building2 className="h-6 w-6 text-primary-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">{client.companyName}</h3>
              </div>
              <div className="flex space-x-2">
                <button className="text-primary-600 hover:text-primary-900">
                  <Edit className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDeleteClick(client.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              {client.contactPerson && (
                <div className="text-gray-600">Contact: {client.contactPerson}</div>
              )}
              {client.email && <div className="text-gray-600">Email: {client.email}</div>}
              {client.phone && <div className="text-gray-600">Phone: {client.phone}</div>}
              <div className="mt-4 pt-4 border-t">
                <div className="text-sm text-gray-500">Outstanding Balance</div>
                <div className="text-lg font-semibold text-red-600">
                  ₹{client.outstandingBalance.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Client Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Client</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Company Name *</label>
                <input
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Contact Person</label>
                <input
                  type="text"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Client Type</label>
                <select
                  value={formData.clientType}
                  onChange={(e) => setFormData({ ...formData, clientType: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="Corporate">Corporate</option>
                  <option value="Individual">Individual</option>
                  <option value="Government">Government</option>
                </select>
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

      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        title="Delete Client"
        message="Are you sure you want to delete this client? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => {
          setShowDeleteConfirm(false)
          setDeleteId(null)
        }}
      />

      <ToastContainer />
    </div>
  )
}

export default OfficeClients

