import { useEffect, useState } from 'react'
import api from '../services/api'
import { Plus, Edit, Trash2, Search, DollarSign, X } from 'lucide-react'
import { FeeHead } from '../types'
import { useDebounce } from '../hooks/useDebounce'
import { useToast } from '../hooks/useToast'
import ConfirmationDialog from '../components/ConfirmationDialog'
import { TableSkeleton } from '../components/LoadingSkeleton'

const FeeHeads = () => {
  const [feeHeads, setFeeHeads] = useState<FeeHead[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const debouncedSearch = useDebounce(searchTerm, 500)
  const [showModal, setShowModal] = useState<boolean>(false)
  const [showEditModal, setShowEditModal] = useState<boolean>(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false)
  const [selectedFeeHead, setSelectedFeeHead] = useState<FeeHead | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const { showToast, ToastContainer } = useToast()

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    isOptional: false,
    displayOrder: 0,
    isActive: true,
  })

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (debouncedSearch) {
      fetchFeeHeads()
    } else {
      fetchData()
    }
  }, [debouncedSearch])

  const fetchData = async (): Promise<void> => {
    try {
      setLoading(true)
      const response = await api.get<{ success: boolean; data: FeeHead[]; message?: string }>('/fee-heads')
      // ApiResponse structure: { success: true, data: FeeHead[] }
      const feeHeadsData = response.data?.data || []
      setFeeHeads(Array.isArray(feeHeadsData) ? feeHeadsData : [])
    } catch (error: any) {
      console.error('Error fetching fee heads:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch fee heads'
      showToast(errorMessage, 'error')
      setFeeHeads([])
    } finally {
      setLoading(false)
    }
  }

  const fetchFeeHeads = async (): Promise<void> => {
    try {
      const response = await api.get<{ success: boolean; data: FeeHead[]; message?: string }>('/fee-heads')
      let feeHeadsData = response.data?.data || []
      
      if (debouncedSearch) {
        feeHeadsData = feeHeadsData.filter(
          (fh) =>
            fh.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            fh.code?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            fh.description?.toLowerCase().includes(debouncedSearch.toLowerCase())
        )
      }
      
      setFeeHeads(Array.isArray(feeHeadsData) ? feeHeadsData : [])
    } catch (error: any) {
      console.error('Error fetching fee heads:', error)
      showToast('Failed to fetch fee heads', 'error')
    }
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    try {
      const response = await api.post<{ success: boolean; data: FeeHead; message?: string }>('/fee-heads', formData)
      setShowModal(false)
      resetForm()
      const message = response.data?.message || 'Fee head created successfully'
      showToast(message, 'success')
      fetchData()
    } catch (error: any) {
      console.error('Error creating fee head:', error)
      const message = error.response?.data?.message || error.response?.data?.errors?.[0] || 'Failed to create fee head'
      showToast(message, 'error')
    }
  }

  const handleEditClick = (feeHead: FeeHead): void => {
    setSelectedFeeHead(feeHead)
    setFormData({
      name: feeHead.name,
      code: feeHead.code || '',
      description: feeHead.description || '',
      isOptional: feeHead.isOptional,
      displayOrder: feeHead.displayOrder,
      isActive: feeHead.isActive,
    })
    setShowEditModal(true)
  }

  const handleUpdate = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!selectedFeeHead) return

    try {
      await api.put(`/fee-heads/${selectedFeeHead.id}`, {
        id: selectedFeeHead.id,
        tenantId: selectedFeeHead.tenantId,
        ...formData,
        createdAt: selectedFeeHead.createdAt,
      })
      setShowEditModal(false)
      setSelectedFeeHead(null)
      resetForm()
      showToast('Fee head updated successfully', 'success')
      fetchData()
    } catch (error: any) {
      console.error('Error updating fee head:', error)
      const message = error.response?.data?.message || 'Failed to update fee head'
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
      await api.delete(`/fee-heads/${deleteId}`)
      showToast('Fee head deleted successfully', 'success')
      setShowDeleteConfirm(false)
      setDeleteId(null)
      fetchData()
    } catch (error: any) {
      console.error('Error deleting fee head:', error)
      const message = error.response?.data?.message || 'Failed to delete fee head'
      showToast(message, 'error')
    }
  }

  const resetForm = (): void => {
    setFormData({
      name: '',
      code: '',
      description: '',
      isOptional: false,
      displayOrder: 0,
      isActive: true,
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <TableSkeleton rows={8} columns={6} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fee Heads</h1>
          <p className="mt-1 text-sm text-gray-500">Manage fee head categories (Tuition, Library, Transport, etc.)</p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Fee Head
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search fee heads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      {/* Fee Heads Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Display Order</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {feeHeads.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                  No fee heads found. Click "Add Fee Head" to create one.
                </td>
              </tr>
            ) : (
              feeHeads.map((feeHead) => (
                <tr key={feeHead.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <DollarSign className="h-5 w-5 text-gray-400 mr-2" />
                      <div className="text-sm font-medium text-gray-900">{feeHead.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {feeHead.code || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {feeHead.description || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        feeHead.isOptional
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {feeHead.isOptional ? 'Optional' : 'Mandatory'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {feeHead.displayOrder}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        feeHead.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {feeHead.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleEditClick(feeHead)}
                        className="text-primary-600 hover:text-primary-900"
                        title="Edit Fee Head"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(feeHead.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Fee Head"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Fee Head Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Add New Fee Head</h3>
              <button
                onClick={() => {
                  setShowModal(false)
                  resetForm()
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Tuition Fee, Library Fee"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Code</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g., TUIT, LIB, TRANS"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Fee head description..."
                  rows={3}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Display Order</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="flex items-center space-x-4 pt-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isOptional}
                      onChange={(e) => setFormData({ ...formData, isOptional: e.target.checked })}
                      className="rounded"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">Optional Fee</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="rounded"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">Active</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    resetForm()
                  }}
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

      {/* Edit Fee Head Modal */}
      {showEditModal && selectedFeeHead && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Edit Fee Head</h3>
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setSelectedFeeHead(null)
                  resetForm()
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Code</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Display Order</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="flex items-center space-x-4 pt-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isOptional}
                      onChange={(e) => setFormData({ ...formData, isOptional: e.target.checked })}
                      className="rounded"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">Optional Fee</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="rounded"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">Active</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false)
                    setSelectedFeeHead(null)
                    resetForm()
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        title="Delete Fee Head"
        message="Are you sure you want to delete this fee head? This action cannot be undone. Fee structures using this fee head will be affected."
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

export default FeeHeads

