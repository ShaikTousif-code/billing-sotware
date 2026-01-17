import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { Plus, Edit, Trash2, Search } from 'lucide-react'
import { SizeChart } from '../types'
import { useToast } from '../hooks/useToast'

const SizeCharts = () => {
  const navigate = useNavigate()
  const { showToast, ToastContainer } = useToast()
  const [sizeCharts, setSizeCharts] = useState<SizeChart[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [showModal, setShowModal] = useState<boolean>(false)
  const [editingChart, setEditingChart] = useState<SizeChart | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    sizeValues: '',
    description: '',
    isDefault: false,
  })

  useEffect(() => {
    fetchSizeCharts()
  }, [])

  const fetchSizeCharts = async (): Promise<void> => {
    try {
      const response = await api.get<{ success: boolean; data: SizeChart[] }>('/size-charts')
      if (response.data.success) {
        setSizeCharts(response.data.data)
      } else {
        setSizeCharts([])
      }
    } catch (error) {
      console.error('Error fetching size charts:', error)
      setSizeCharts([])
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (chart?: SizeChart): void => {
    if (chart) {
      setEditingChart(chart)
      setFormData({
        name: chart.name,
        sizeValues: chart.sizeValues,
        description: chart.description || '',
        isDefault: chart.isDefault,
      })
    } else {
      setEditingChart(null)
      setFormData({
        name: '',
        sizeValues: '',
        description: '',
        isDefault: false,
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = (): void => {
    setShowModal(false)
    setEditingChart(null)
    setFormData({
      name: '',
      sizeValues: '',
      description: '',
      isDefault: false,
    })
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      showToast('Name is required', 'error')
      return
    }

    if (!formData.sizeValues.trim()) {
      showToast('Size values are required', 'error')
      return
    }

    try {
      // Validate JSON format
      try {
        JSON.parse(formData.sizeValues)
      } catch {
        // If not valid JSON, treat as comma-separated and convert
        const sizes = formData.sizeValues.split(',').map(s => s.trim()).filter(s => s)
        formData.sizeValues = JSON.stringify(sizes)
      }

      if (editingChart) {
        await api.put(`/size-charts/${editingChart.id}`, {
          ...editingChart,
          ...formData,
        })
        showToast('Size chart updated successfully', 'success')
      } else {
        await api.post('/size-charts', formData)
        showToast('Size chart created successfully', 'success')
      }
      
      handleCloseModal()
      fetchSizeCharts()
    } catch (error: any) {
      console.error('Error saving size chart:', error)
      showToast(error.response?.data?.message || 'Failed to save size chart', 'error')
    }
  }

  const handleDelete = async (id: number): Promise<void> => {
    if (!window.confirm('Are you sure you want to delete this size chart?')) return

    try {
      await api.delete(`/size-charts/${id}`)
      showToast('Size chart deleted successfully', 'success')
      fetchSizeCharts()
    } catch (error: any) {
      console.error('Error deleting size chart:', error)
      showToast(error.response?.data?.message || 'Failed to delete size chart', 'error')
    }
  }

  const loadPredefinedChart = (type: string): void => {
    let sizes: string[] = []
    switch (type) {
      case 'Indian':
        sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']
        break
      case 'US':
        sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
        break
      case 'UK':
        sizes = ['8', '10', '12', '14', '16', '18', '20', '22']
        break
      case 'EU':
        sizes = ['38', '40', '42', '44', '46', '48', '50', '52']
        break
      case 'Numeric':
        sizes = ['28', '30', '32', '34', '36', '38', '40', '42']
        break
    }
    setFormData({ ...formData, sizeValues: JSON.stringify(sizes), name: `${type} Size Chart` })
  }

  const filteredCharts = sizeCharts.filter((chart) =>
    chart.name.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Size Charts</h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-500">Manage size charts for RMG products</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-transparent rounded-md shadow-sm text-xs sm:text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
        >
          <Plus className="h-4 w-4 sm:h-5 sm:w-5 sm:mr-2" />
          <span className="hidden sm:inline">New Size Chart</span>
          <span className="sm:hidden">New</span>
        </button>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="p-3 sm:p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search size charts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 sm:pl-10 w-full px-4 py-2 text-sm border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Sizes
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                  Default
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                  Status
                </th>
                <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCharts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    No size charts found
                  </td>
                </tr>
              ) : (
                filteredCharts.map((chart) => {
                  let sizes: string[] = []
                  try {
                    sizes = JSON.parse(chart.sizeValues)
                  } catch {
                    sizes = chart.sizeValues.split(',').map(s => s.trim())
                  }
                  
                  return (
                    <tr key={chart.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {chart.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="flex flex-wrap gap-1">
                          {sizes.map((size, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800"
                            >
                              {size}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {chart.isDefault ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Yes
                          </span>
                        ) : (
                          <span className="text-gray-400">No</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {chart.isActive ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleOpenModal(chart)}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(chart.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingChart ? 'Edit Size Chart' : 'New Size Chart'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Size Values (JSON array or comma-separated) *
                </label>
                <div className="mb-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => loadPredefinedChart('Indian')}
                    className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                  >
                    Indian
                  </button>
                  <button
                    type="button"
                    onClick={() => loadPredefinedChart('US')}
                    className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                  >
                    US
                  </button>
                  <button
                    type="button"
                    onClick={() => loadPredefinedChart('UK')}
                    className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                  >
                    UK
                  </button>
                  <button
                    type="button"
                    onClick={() => loadPredefinedChart('EU')}
                    className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                  >
                    EU
                  </button>
                  <button
                    type="button"
                    onClick={() => loadPredefinedChart('Numeric')}
                    className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                  >
                    Numeric
                  </button>
                </div>
                <textarea
                  value={formData.sizeValues}
                  onChange={(e) => setFormData({ ...formData, sizeValues: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  rows={3}
                  placeholder='["S","M","L","XL"] or S, M, L, XL'
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  rows={2}
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-900">
                  Set as default size chart
                </label>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                >
                  {editingChart ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  )
}

export default SizeCharts

