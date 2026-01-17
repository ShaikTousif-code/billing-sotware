import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../services/api'
import { Plus, Trash2 } from 'lucide-react'

interface ProductVariant {
  id: number
  variantType: string
  variantValue: string
  sku?: string
  costPrice?: number
  sellingPrice?: number
  stockQuantity?: number
  isActive: boolean
}

const ProductVariants = () => {
  const { productId } = useParams<{ productId: string }>()
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [showModal, setShowModal] = useState<boolean>(false)
  const [formData, setFormData] = useState({
    variantType: '',
    variantValue: '',
    sku: '',
    costPrice: '',
    sellingPrice: '',
    stockQuantity: '',
  })

  useEffect(() => {
    if (productId) {
      fetchVariants()
    }
  }, [productId])

  const fetchVariants = async (): Promise<void> => {
    try {
      const response = await api.get<ProductVariant[]>(`/product-variants/product/${productId}`)
      setVariants(response.data)
    } catch (error) {
      console.error('Error fetching variants:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    try {
      await api.post('/product-variants', {
        productId: parseInt(productId!),
        ...formData,
        costPrice: formData.costPrice ? parseFloat(formData.costPrice) : null,
        sellingPrice: formData.sellingPrice ? parseFloat(formData.sellingPrice) : null,
        stockQuantity: formData.stockQuantity ? parseInt(formData.stockQuantity) : null,
      })
      setShowModal(false)
      setFormData({
        variantType: '',
        variantValue: '',
        sku: '',
        costPrice: '',
        sellingPrice: '',
        stockQuantity: '',
      })
      fetchVariants()
    } catch (error) {
      console.error('Error creating variant:', error)
      alert('Failed to create variant')
    }
  }

  const handleDelete = async (id: number): Promise<void> => {
    if (window.confirm('Are you sure you want to delete this variant?')) {
      try {
        await api.delete(`/product-variants/${id}`)
        fetchVariants()
      } catch (error) {
        console.error('Error deleting variant:', error)
        alert('Failed to delete variant')
      }
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
          <h1 className="text-2xl font-bold text-gray-900">Product Variants</h1>
          <p className="mt-1 text-sm text-gray-500">Manage product variants (size, color, etc.)</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Variant
        </button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Selling Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {variants.map((variant) => (
              <tr key={variant.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{variant.variantType}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{variant.variantValue}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{variant.sku || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {variant.sellingPrice ? `₹${variant.sellingPrice.toFixed(2)}` : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {variant.stockQuantity ?? '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleDelete(variant.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add Variant</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Variant Type *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Size, Color, Pack"
                  value={formData.variantType}
                  onChange={(e) => setFormData({ ...formData, variantType: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Variant Value *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Small, Red, 500ml"
                  value={formData.variantValue}
                  onChange={(e) => setFormData({ ...formData, variantValue: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">SKU</label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Selling Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.sellingPrice}
                  onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
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

export default ProductVariants

