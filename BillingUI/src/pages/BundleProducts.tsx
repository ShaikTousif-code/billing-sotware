import { useEffect, useState } from 'react'
import api from '../services/api'
import { Plus, Trash2, Edit } from 'lucide-react'

interface BundleProduct {
  id: number
  name: string
  description?: string
  bundlePrice: number
  discountPercentage?: number
  isActive: boolean
  items: BundleItem[]
}

interface BundleItem {
  id: number
  productId: number
  productName: string
  quantity: number
  discountPercentage?: number
}

const BundleProducts = () => {
  const [bundles, setBundles] = useState<BundleProduct[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [showModal, setShowModal] = useState<boolean>(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    bundlePrice: '',
    discountPercentage: '',
    items: [] as Array<{ productId: string; quantity: string }>,
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async (): Promise<void> => {
    try {
      const [bundlesRes, productsRes] = await Promise.all([
        api.get<{ success: boolean; data: BundleProduct[] }>('/bundle-products'),
        api.get<{ success: boolean; data: { data: any[] } }>('/products'),
      ])
      // Handle wrapped response structure
      const productsData = productsRes.data?.data?.data || productsRes.data?.data || []
      const bundlesData = bundlesRes.data?.data || bundlesRes.data || []
      setBundles(Array.isArray(bundlesData) ? bundlesData : [])
      setProducts(Array.isArray(productsData) ? productsData : [])
    } catch (error) {
      console.error('Error fetching data:', error)
      setBundles([])
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    try {
      await api.post('/bundle-products', {
        ...formData,
        bundlePrice: parseFloat(formData.bundlePrice),
        discountPercentage: formData.discountPercentage ? parseFloat(formData.discountPercentage) : null,
        items: formData.items.map((item) => ({
          productId: parseInt(item.productId),
          quantity: parseFloat(item.quantity),
        })),
      })
      setShowModal(false)
      setFormData({ name: '', description: '', bundlePrice: '', discountPercentage: '', items: [] })
      fetchData()
    } catch (error) {
      console.error('Error creating bundle:', error)
      alert('Failed to create bundle')
    }
  }

  const addItem = (): void => {
    setFormData({
      ...formData,
      items: [...formData.items, { productId: '', quantity: '' }],
    })
  }

  const removeItem = (index: number): void => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    })
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
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Bundle Products</h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-500">Create combo/bundle products</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-transparent rounded-md shadow-sm text-xs sm:text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 touch-manipulation"
        >
          <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Create Bundle</span>
          <span className="sm:hidden">Create</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {bundles.map((bundle) => (
          <div key={bundle.id} className="bg-white shadow rounded-lg p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">{bundle.name}</h3>
            {bundle.description && <p className="text-xs sm:text-sm text-gray-500 mt-1">{bundle.description}</p>}
            <div className="mt-3 sm:mt-4">
              <div className="text-xl sm:text-2xl font-bold text-primary-600">₹{bundle.bundlePrice.toFixed(2)}</div>
              {bundle.discountPercentage && (
                <div className="text-xs sm:text-sm text-green-600">{bundle.discountPercentage}% off</div>
              )}
            </div>
            <div className="mt-3 sm:mt-4">
              <div className="text-xs sm:text-sm font-medium text-gray-700">Includes:</div>
              <ul className="mt-2 space-y-1">
                {bundle.items.map((item) => (
                  <li key={item.id} className="text-xs sm:text-sm text-gray-600">
                    {item.productName} x {item.quantity}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 p-4">
          <div className="relative top-4 sm:top-10 mx-auto p-4 sm:p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Create Bundle Product</h3>
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
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
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700">Bundle Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.bundlePrice}
                    onChange={(e) => setFormData({ ...formData, bundlePrice: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700">Discount %</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.discountPercentage}
                    onChange={(e) => setFormData({ ...formData, discountPercentage: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">Items *</label>
                  <button
                    type="button"
                    onClick={addItem}
                    className="text-sm text-primary-600 hover:text-primary-900"
                  >
                    + Add Item
                  </button>
                </div>
                {formData.items.map((item, index) => (
                  <div key={index} className="flex flex-col sm:flex-row gap-2 mb-2">
                    <select
                      required
                      value={item.productId}
                      onChange={(e) => {
                        const newItems = [...formData.items]
                        newItems[index].productId = e.target.value
                        setFormData({ ...formData, items: newItems })
                      }}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md"
                    >
                      <option value="">Select Product</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="0.01"
                        required
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => {
                          const newItems = [...formData.items]
                          newItems[index].quantity = e.target.value
                          setFormData({ ...formData, items: newItems })
                        }}
                        className="w-24 sm:w-24 px-3 py-2 text-sm border border-gray-300 rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-red-600 hover:text-red-900 p-2 touch-manipulation"
                        title="Remove"
                      >
                        <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                    </div>
                  </div>
                ))}
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

export default BundleProducts

