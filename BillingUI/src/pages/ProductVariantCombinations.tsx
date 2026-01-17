import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { ArrowLeft, Plus, Edit, Trash2, Save, X } from 'lucide-react'
import { ProductVariantCombination, Product, SizeChart } from '../types'
import { useToast } from '../hooks/useToast'

const ProductVariantCombinations = () => {
  const { productId } = useParams<{ productId: string }>()
  const navigate = useNavigate()
  const { showToast, ToastContainer } = useToast()
  const [product, setProduct] = useState<Product | null>(null)
  const [variants, setVariants] = useState<ProductVariantCombination[]>([])
  const [sizeChart, setSizeChart] = useState<SizeChart | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [showModal, setShowModal] = useState<boolean>(false)
  const [editingVariant, setEditingVariant] = useState<ProductVariantCombination | null>(null)
  const [showBulkModal, setShowBulkModal] = useState<boolean>(false)
  const [availableSizes, setAvailableSizes] = useState<string[]>([])
  const [availableColors, setAvailableColors] = useState<string[]>([])
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [formData, setFormData] = useState({
    size: '',
    color: '',
    sku: '',
    barcode: '',
    costPrice: '',
    sellingPrice: '',
    stockQuantity: '0',
  })

  useEffect(() => {
    if (productId) {
      fetchProduct()
      fetchVariants()
    }
  }, [productId])

  const fetchProduct = async (): Promise<void> => {
    try {
      const response = await api.get<{ success: boolean; data: Product }>(`/products/${productId}`)
      if (response.data.success) {
        const productData = response.data.data
        setProduct(productData)
        
        // Fetch size chart if available
        if (productData.sizeChartId) {
          fetchSizeChart(productData.sizeChartId)
        }
      }
    } catch (error) {
      console.error('Error fetching product:', error)
    }
  }

  const fetchSizeChart = async (sizeChartId: number): Promise<void> => {
    try {
      const response = await api.get<{ success: boolean; data: SizeChart }>(`/size-charts/${sizeChartId}`)
      if (response.data.success) {
        const chart = response.data.data
        setSizeChart(chart)
        try {
          const sizes = JSON.parse(chart.sizeValues)
          setAvailableSizes(Array.isArray(sizes) ? sizes : [])
        } catch {
          setAvailableSizes(chart.sizeValues.split(',').map(s => s.trim()).filter(s => s))
        }
      }
    } catch (error) {
      console.error('Error fetching size chart:', error)
    }
  }

  const fetchVariants = async (): Promise<void> => {
    try {
      const response = await api.get<{ success: boolean; data: ProductVariantCombination[] }>(
        `/product-variant-combinations/product/${productId}`
      )
      if (response.data.success) {
        setVariants(response.data.data)
        
        // Extract unique sizes and colors
        const sizes = [...new Set(response.data.data.map(v => v.size))].sort()
        const colors = [...new Set(response.data.data.map(v => v.color))].sort()
        setAvailableSizes(prev => [...new Set([...prev, ...sizes])].sort())
        setAvailableColors(prev => [...new Set([...prev, ...colors])].sort())
      }
    } catch (error) {
      console.error('Error fetching variants:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (variant?: ProductVariantCombination): void => {
    if (variant) {
      setEditingVariant(variant)
      setFormData({
        size: variant.size,
        color: variant.color,
        sku: variant.sku || '',
        barcode: variant.barcode || '',
        costPrice: variant.costPrice?.toString() || '',
        sellingPrice: variant.sellingPrice?.toString() || '',
        stockQuantity: variant.stockQuantity.toString(),
      })
    } else {
      setEditingVariant(null)
      setFormData({
        size: '',
        color: '',
        sku: '',
        barcode: '',
        costPrice: '',
        sellingPrice: '',
        stockQuantity: '0',
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = (): void => {
    setShowModal(false)
    setEditingVariant(null)
    setFormData({
      size: '',
      color: '',
      sku: '',
      barcode: '',
      costPrice: '',
      sellingPrice: '',
      stockQuantity: '0',
    })
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    
    if (!formData.size.trim() || !formData.color.trim()) {
      showToast('Size and Color are required', 'error')
      return
    }

    try {
      const payload: any = {
        productId: parseInt(productId!),
        size: formData.size.trim(),
        color: formData.color.trim(),
        stockQuantity: parseInt(formData.stockQuantity) || 0,
      }

      if (formData.sku.trim()) payload.sku = formData.sku.trim()
      if (formData.barcode.trim()) payload.barcode = formData.barcode.trim()
      if (formData.costPrice) payload.costPrice = parseFloat(formData.costPrice)
      if (formData.sellingPrice) payload.sellingPrice = parseFloat(formData.sellingPrice)

      if (editingVariant) {
        payload.id = editingVariant.id
        await api.put(`/product-variant-combinations/${editingVariant.id}`, payload)
        showToast('Variant combination updated successfully', 'success')
      } else {
        await api.post('/product-variant-combinations', payload)
        showToast('Variant combination created successfully', 'success')
      }
      
      handleCloseModal()
      fetchVariants()
    } catch (error: any) {
      console.error('Error saving variant:', error)
      showToast(error.response?.data?.message || 'Failed to save variant combination', 'error')
    }
  }

  const handleBulkCreate = async (): Promise<void> => {
    if (selectedSizes.length === 0 || selectedColors.length === 0) {
      showToast('Please select at least one size and one color', 'error')
      return
    }

    try {
      const combinations: any[] = []
      selectedSizes.forEach(size => {
        selectedColors.forEach(color => {
          // Check if combination already exists
          const exists = variants.some(v => v.size === size && v.color === color)
          if (!exists) {
            combinations.push({
              size: size.trim(),
              color: color.trim(),
              stockQuantity: 0,
            })
          }
        })
      })

      if (combinations.length === 0) {
        showToast('All selected combinations already exist', 'info')
        return
      }

      await api.post('/product-variant-combinations/bulk', {
        productId: parseInt(productId!),
        variants: combinations,
      })

      showToast(`${combinations.length} variant combinations created successfully`, 'success')
      setShowBulkModal(false)
      setSelectedSizes([])
      setSelectedColors([])
      fetchVariants()
    } catch (error: any) {
      console.error('Error bulk creating variants:', error)
      showToast(error.response?.data?.message || 'Failed to create variants', 'error')
    }
  }

  const handleDelete = async (id: number): Promise<void> => {
    if (!window.confirm('Are you sure you want to delete this variant combination?')) return

    try {
      await api.delete(`/product-variant-combinations/${id}`)
      showToast('Variant combination deleted successfully', 'success')
      fetchVariants()
    } catch (error: any) {
      console.error('Error deleting variant:', error)
      showToast(error.response?.data?.message || 'Failed to delete variant', 'error')
    }
  }

  // Create size matrix grid
  const createSizeMatrix = (): { [key: string]: { [key: string]: ProductVariantCombination | null } } => {
    const matrix: { [key: string]: { [key: string]: ProductVariantCombination | null } } = {}
    
    availableSizes.forEach(size => {
      matrix[size] = {}
      availableColors.forEach(color => {
        const variant = variants.find(v => v.size === size && v.color === color)
        matrix[size][color] = variant || null
      })
    })
    
    return matrix
  }

  const sizeMatrix = createSizeMatrix()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-2 sm:space-x-4">
          <button
            onClick={() => navigate('/products')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              Variant Combinations - {product?.name || 'Product'}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-gray-500">
              Manage size and color combinations for this product
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowBulkModal(true)}
            className="inline-flex items-center px-3 sm:px-4 py-2 border border-gray-300 rounded-md shadow-sm text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Plus className="h-4 w-4 sm:h-5 sm:w-5 sm:mr-2" />
            <span className="hidden sm:inline">Bulk Create</span>
            <span className="sm:hidden">Bulk</span>
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center px-3 sm:px-4 py-2 border border-transparent rounded-md shadow-sm text-xs sm:text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
          >
            <Plus className="h-4 w-4 sm:h-5 sm:w-5 sm:mr-2" />
            <span className="hidden sm:inline">Add Variant</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* Size Matrix Grid */}
      {availableSizes.length > 0 && availableColors.length > 0 && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-3 sm:p-4 border-b border-gray-200">
            <h2 className="text-base sm:text-lg font-medium text-gray-900">Size Matrix</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Click on a cell to edit or add variant</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                    Size / Color
                  </th>
                  {availableColors.map(color => (
                    <th
                      key={color}
                      className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]"
                    >
                      {color}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {availableSizes.map(size => (
                  <tr key={size}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 sticky left-0 bg-white z-10">
                      {size}
                    </td>
                    {availableColors.map(color => {
                      const variant = sizeMatrix[size]?.[color]
                      return (
                        <td
                          key={`${size}-${color}`}
                          className="px-4 py-3 text-center cursor-pointer hover:bg-gray-50"
                          onClick={() => {
                            if (variant) {
                              handleOpenModal(variant)
                            } else {
                              setFormData({
                                size,
                                color,
                                sku: '',
                                barcode: '',
                                costPrice: '',
                                sellingPrice: '',
                                stockQuantity: '0',
                              })
                              setEditingVariant(null)
                              setShowModal(true)
                            }
                          }}
                        >
                          {variant ? (
                            <div className="space-y-1">
                              <div className="text-sm font-medium text-gray-900">
                                Qty: {variant.stockQuantity}
                              </div>
                              {variant.sellingPrice && (
                                <div className="text-xs text-gray-500">
                                  ₹{variant.sellingPrice.toFixed(2)}
                                </div>
                              )}
                              {variant.barcode && (
                                <div className="text-xs text-gray-400 truncate" title={variant.barcode}>
                                  {variant.barcode.substring(0, 8)}...
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-sm text-gray-400">-</div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Variants List */}
      <div className="bg-white shadow rounded-lg">
        <div className="p-3 sm:p-4 border-b border-gray-200">
          <h2 className="text-base sm:text-lg font-medium text-gray-900">All Variants</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Color
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Barcode
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {variants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                    No variant combinations found. Click "Add Variant" or "Bulk Create" to get started.
                  </td>
                </tr>
              ) : (
                variants.map((variant) => (
                  <tr key={variant.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {variant.size}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {variant.color}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {variant.sku || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {variant.barcode || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={variant.stockQuantity <= 0 ? 'text-red-600 font-medium' : ''}>
                        {variant.stockQuantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {variant.sellingPrice ? `₹${variant.sellingPrice.toFixed(2)}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleOpenModal(variant)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(variant.id)}
                          className="text-red-600 hover:text-red-900"
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
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 p-4">
          <div className="relative top-4 sm:top-20 mx-auto p-4 sm:p-5 border w-full max-w-md sm:w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingVariant ? 'Edit Variant' : 'New Variant'}
              </h3>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-500">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Size *</label>
                <input
                  type="text"
                  value={formData.size}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  required
                  list="sizes"
                />
                <datalist id="sizes">
                  {availableSizes.map(size => (
                    <option key={size} value={size} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Color *</label>
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  required
                  list="colors"
                />
                <datalist id="colors">
                  {availableColors.map(color => (
                    <option key={color} value={color} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">SKU</label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Barcode</label>
                <input
                  type="text"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Cost Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Selling Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Stock Quantity</label>
                <input
                  type="number"
                  value={formData.stockQuantity}
                  onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  min="0"
                />
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
                  {editingVariant ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Create Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 p-4">
          <div className="relative top-4 sm:top-20 mx-auto p-4 sm:p-5 border w-full max-w-md sm:w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Bulk Create Variants</h3>
              <button
                onClick={() => {
                  setShowBulkModal(false)
                  setSelectedSizes([])
                  setSelectedColors([])
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Sizes</label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                  {availableSizes.map(size => (
                    <label key={size} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedSizes.includes(size)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSizes([...selectedSizes, size])
                          } else {
                            setSelectedSizes(selectedSizes.filter(s => s !== size))
                          }
                        }}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">{size}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Colors</label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                  {availableColors.map(color => (
                    <label key={color} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedColors.includes(color)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedColors([...selectedColors, color])
                          } else {
                            setSelectedColors(selectedColors.filter(c => c !== color))
                          }
                        }}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">{color}</span>
                    </label>
                  ))}
                </div>
              </div>

              {selectedSizes.length > 0 && selectedColors.length > 0 && (
                <div className="p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                  Will create {selectedSizes.length * selectedColors.length} variant combinations
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowBulkModal(false)
                    setSelectedSizes([])
                    setSelectedColors([])
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkCreate}
                  disabled={selectedSizes.length === 0 || selectedColors.length === 0}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Create All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  )
}

export default ProductVariantCombinations

