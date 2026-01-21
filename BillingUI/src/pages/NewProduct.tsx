import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'
import { ArrowLeft, Save, X, Plus } from 'lucide-react'
import { Product, ProductCategory, SizeChart } from '../types'
import { useToast } from '../hooks/useToast'

const NewProduct = () => {
  const navigate = useNavigate()
  const { productId } = useParams<{ productId?: string }>()
  const isEditMode = !!productId
  const { showToast, ToastContainer } = useToast()
  const [loading, setLoading] = useState<boolean>(false)
  const [loadingProduct, setLoadingProduct] = useState<boolean>(false)
  const [productTenantId, setProductTenantId] = useState<number | null>(null)
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [showCategoryModal, setShowCategoryModal] = useState<boolean>(false)
  const [newCategoryName, setNewCategoryName] = useState<string>('')
  const [newCategoryDescription, setNewCategoryDescription] = useState<string>('')
  const [creatingCategory, setCreatingCategory] = useState<boolean>(false)
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    hsnCode: '',
    sacCode: '',
    description: '',
    categoryId: '',
    costPrice: '',
    sellingPrice: '',
    taxRate: '',
    taxType: 'GST',
    stockQuantity: '',
    lowStockAlert: '',
    unit: 'PCS',
    barcode: '',
    type: 'Product' as 'Product' | 'Service',
    trackInventory: true,
    isActive: true,
    // Expiry configuration
    expiryType: 'FIXED_DATE' as 'FIXED_DATE' | 'DURATION',
    expireAfterValue: '',
    expireAfterUnit: 'MONTHS' as 'DAYS' | 'MONTHS' | 'YEARS',
    alertBeforeValue: '30',
    alertBeforeUnit: 'DAYS' as 'DAYS' | 'MONTHS',
    isExpiryEnabled: false,
    // Manufacturing and expiry dates
    manufacturingDate: '',
    expiryDate: '',
    // RMG fields
    styleCode: '',
    season: '',
    collection: '',
    gender: '',
    fabricType: '',
    sizeChartId: '',
  })
  const [sizeCharts, setSizeCharts] = useState<{ id: number; name: string }[]>([])

  useEffect(() => {
    fetchCategories()
    fetchSizeCharts()
    if (isEditMode && productId) {
      fetchProduct(parseInt(productId))
    }
  }, [isEditMode, productId])

  const fetchCategories = async (): Promise<void> => {
    try {
      // Fetch categories from the API
      const response = await api.get<{ data: ProductCategory[] }>('/products/categories')
      const categoriesData = response.data?.data || response.data || []
      setCategories(Array.isArray(categoriesData) ? categoriesData : [])
    } catch (error) {
      console.log('Categories endpoint not available or error:', error)
      // Categories are optional, so we continue without them
      setCategories([])
    }
  }

  const fetchSizeCharts = async (): Promise<void> => {
    try {
      const response = await api.get<{ success: boolean; data: SizeChart[] }>('/size-charts')
      const charts = response.data?.data || response.data || []
      setSizeCharts(Array.isArray(charts) ? charts.map(chart => ({ id: chart.id, name: chart.name })) : [])
    } catch (error) {
      console.error('Error fetching size charts:', error)
      // Size charts are optional, so we continue without them
      setSizeCharts([])
    }
  }

  const fetchProduct = async (id: number): Promise<void> => {
    setLoadingProduct(true)
    try {
      const response = await api.get<{ success: boolean; data: Product }>(`/products/${id}`)
      const product = response.data?.data
      if (product) {
        // Store tenantId for update
        setProductTenantId(product.tenantId)
        
        // Convert stock quantity back to display unit if needed
        let displayStockQuantity = product.stockQuantity?.toString() || ''
        if (product.unit === 'KG' && product.stockQuantity) {
          // If stored in KG, display as-is
          displayStockQuantity = product.stockQuantity.toString()
        } else if (product.unit === 'GRAM' || product.unit === 'G') {
          // Convert from KG to GRAM for display
          displayStockQuantity = ((product.stockQuantity || 0) * 1000).toString()
        } else if (product.unit === 'LTR' || product.unit === 'L') {
          displayStockQuantity = product.stockQuantity?.toString() || ''
        } else if (product.unit === 'ML') {
          displayStockQuantity = ((product.stockQuantity || 0) * 1000).toString()
        }

        setFormData({
          name: product.name || '',
          sku: product.sku || '',
          hsnCode: product.hsnCode || '',
          sacCode: product.sacCode || '',
          description: product.description || '',
          categoryId: product.categoryId?.toString() || '',
          costPrice: product.costPrice?.toString() || '',
          sellingPrice: product.sellingPrice?.toString() || '',
          taxRate: product.taxRate?.toString() || '',
          taxType: product.taxType || 'GST',
          stockQuantity: displayStockQuantity,
          lowStockAlert: product.lowStockAlert?.toString() || '',
          unit: product.unit || 'PCS',
          barcode: product.barcode || '',
          type: product.type === 2 ? 'Service' : 'Product',
          trackInventory: product.trackInventory ?? true,
          isActive: product.isActive ?? true,
          // Expiry configuration
          expiryType: product.expiryType || 'FIXED_DATE',
          expireAfterValue: product.expireAfterValue?.toString() || '',
          expireAfterUnit: product.expireAfterUnit || 'MONTHS',
          alertBeforeValue: product.alertBeforeValue?.toString() || '30',
          alertBeforeUnit: product.alertBeforeUnit || 'DAYS',
          isExpiryEnabled: product.isExpiryEnabled || false,
          // Manufacturing and expiry dates
          manufacturingDate: product.manufacturingDate ? new Date(product.manufacturingDate).toISOString().slice(0, 10) : '',
          expiryDate: product.expiryDate ? new Date(product.expiryDate).toISOString().slice(0, 10) : '',
          // RMG fields
          styleCode: product.styleCode || '',
          season: product.season || '',
          collection: product.collection || '',
          gender: product.gender || '',
          fabricType: product.fabricType || '',
          sizeChartId: product.sizeChartId?.toString() || '',
        })
      }
    } catch (error: any) {
      console.error('Error fetching product:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load product'
      showToast(errorMessage, 'error')
      navigate('/products')
    } finally {
      setLoadingProduct(false)
    }
  }

  const handleCreateCategory = async (): Promise<void> => {
    if (!newCategoryName.trim()) {
      showToast('Category name is required', 'error')
      return
    }

    setCreatingCategory(true)
    try {
      const response = await api.post<{ data: ProductCategory }>('/products/categories', {
        name: newCategoryName.trim(),
        description: newCategoryDescription.trim() || undefined,
        isActive: true
      })
      
      const newCategory = response.data?.data || response.data
      setCategories([...categories, newCategory])
      setFormData(prev => ({ ...prev, categoryId: newCategory.id.toString() }))
      setShowCategoryModal(false)
      setNewCategoryName('')
      setNewCategoryDescription('')
      showToast('Category created successfully', 'success')
    } catch (error: any) {
      console.error('Error creating category:', error)
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.data?.message ||
                          error.message || 
                          'Failed to create category'
      showToast(errorMessage, 'error')
    } finally {
      setCreatingCategory(false)
    }
  }

  const calculateExpiryDate = (manufacturingDate: string, expireAfterValue: string, expireAfterUnit: string): string => {
    if (!manufacturingDate || !expireAfterValue || !expireAfterUnit) {
      return ''
    }

    const mfgDate = new Date(manufacturingDate)
    if (isNaN(mfgDate.getTime())) {
      return ''
    }

    const value = parseInt(expireAfterValue)
    if (isNaN(value) || value <= 0) {
      return ''
    }

    const expiryDate = new Date(mfgDate)
    
    switch (expireAfterUnit.toUpperCase()) {
      case 'DAYS':
        expiryDate.setDate(expiryDate.getDate() + value)
        break
      case 'MONTHS':
        expiryDate.setMonth(expiryDate.getMonth() + value)
        break
      case 'YEARS':
        expiryDate.setFullYear(expiryDate.getFullYear() + value)
        break
      default:
        return ''
    }

    return expiryDate.toISOString().slice(0, 10)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>): void => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else if (name === 'costPrice' || name === 'sellingPrice' || name === 'taxRate' || name === 'stockQuantity' || name === 'lowStockAlert' || name === 'expireAfterValue' || name === 'alertBeforeValue') {
      setFormData(prev => {
        const updated = { ...prev, [name]: value === '' ? '' : value }
        // Auto-calculate expiry date if DURATION type and manufacturing date + expire after are provided
        if (prev.expiryType === 'DURATION' && prev.isExpiryEnabled) {
          const manufacturingDate = name === 'manufacturingDate' ? value : prev.manufacturingDate
          const expireAfterValue = name === 'expireAfterValue' ? value : updated.expireAfterValue
          const expireAfterUnit = name === 'expireAfterUnit' ? value : prev.expireAfterUnit
          const calculatedExpiry = calculateExpiryDate(manufacturingDate, expireAfterValue, expireAfterUnit)
          if (calculatedExpiry) {
            updated.expiryDate = calculatedExpiry
          } else {
            updated.expiryDate = ''
          }
        }
        return updated
      })
    } else {
      setFormData(prev => {
        const updated = { ...prev, [name]: value }
        // Auto-calculate expiry date if DURATION type and manufacturing date + expire after are provided
        if (prev.expiryType === 'DURATION' && prev.isExpiryEnabled && 
            (name === 'manufacturingDate' || name === 'expireAfterValue' || name === 'expireAfterUnit')) {
          const manufacturingDate = name === 'manufacturingDate' ? value : prev.manufacturingDate
          const expireAfterValue = name === 'expireAfterValue' ? value : prev.expireAfterValue
          const expireAfterUnit = name === 'expireAfterUnit' ? value : prev.expireAfterUnit
          const calculatedExpiry = calculateExpiryDate(manufacturingDate, expireAfterValue, expireAfterUnit)
          if (calculatedExpiry) {
            updated.expiryDate = calculatedExpiry
          } else {
            updated.expiryDate = ''
          }
        } else if (name === 'expiryType' && value === 'FIXED_DATE') {
          // Clear auto-calculated expiry date when switching to FIXED_DATE
          if (prev.expiryType === 'DURATION') {
            updated.expiryDate = ''
          }
        }
        return updated
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    
    // Validation
    if (!formData.name.trim()) {
      showToast('Product name is required', 'error')
      return
    }
    if (!formData.costPrice || parseFloat(formData.costPrice) < 0) {
      showToast('Valid cost price is required', 'error')
      return
    }
    if (!formData.sellingPrice || parseFloat(formData.sellingPrice) < 0) {
      showToast('Valid selling price is required', 'error')
      return
    }
    if (formData.trackInventory && formData.stockQuantity && parseFloat(formData.stockQuantity) < 0) {
      showToast('Stock quantity cannot be negative', 'error')
      return
    }
    if (formData.trackInventory && !formData.unit) {
      showToast('Unit is required when tracking inventory', 'error')
      return
    }

    setLoading(true)
    try {
      // Build product payload, removing undefined values
      const productPayload: any = {
        name: formData.name.trim(),
        costPrice: parseFloat(formData.costPrice),
        sellingPrice: parseFloat(formData.sellingPrice),
        type: formData.type === 'Service' ? 2 : 1, // Convert to enum integer: Product = 1, Service = 2
        trackInventory: formData.trackInventory,
        isActive: formData.isActive,
      }

      // Add optional fields only if they have values
      if (formData.sku.trim()) productPayload.sku = formData.sku.trim()
      if (formData.hsnCode.trim()) productPayload.hsnCode = formData.hsnCode.trim()
      if (formData.sacCode.trim()) productPayload.sacCode = formData.sacCode.trim()
      if (formData.description.trim()) productPayload.description = formData.description.trim()
      if (formData.categoryId) productPayload.categoryId = parseInt(formData.categoryId)
      if (formData.taxRate) productPayload.taxRate = parseFloat(formData.taxRate)
      if (formData.taxType) productPayload.taxType = formData.taxType
      if (formData.barcode.trim()) productPayload.barcode = formData.barcode.trim()
      if (formData.unit) productPayload.unit = formData.unit
      if (formData.lowStockAlert) productPayload.lowStockAlert = parseInt(formData.lowStockAlert)
      
      // Expiry configuration
      if (formData.isExpiryEnabled) {
        productPayload.expiryType = formData.expiryType
        if (formData.expireAfterValue) {
          productPayload.expireAfterValue = parseInt(formData.expireAfterValue)
        }
        if (formData.expireAfterUnit) {
          productPayload.expireAfterUnit = formData.expireAfterUnit
        }
        if (formData.alertBeforeValue) {
          productPayload.alertBeforeValue = parseInt(formData.alertBeforeValue)
        }
        if (formData.alertBeforeUnit) {
          productPayload.alertBeforeUnit = formData.alertBeforeUnit
        }
        productPayload.isExpiryEnabled = true
      } else {
        productPayload.isExpiryEnabled = false
      }
      
      // Manufacturing and expiry dates
      if (formData.manufacturingDate) {
        productPayload.manufacturingDate = new Date(formData.manufacturingDate).toISOString()
      }
      // Save expiry date (either fixed or auto-calculated from DURATION)
      if (formData.expiryDate) {
        productPayload.expiryDate = new Date(formData.expiryDate).toISOString()
      }
      
      // RMG fields
      if (formData.styleCode.trim()) productPayload.styleCode = formData.styleCode.trim()
      if (formData.season.trim()) productPayload.season = formData.season.trim()
      if (formData.collection.trim()) productPayload.collection = formData.collection.trim()
      if (formData.gender.trim()) productPayload.gender = formData.gender.trim()
      if (formData.fabricType.trim()) productPayload.fabricType = formData.fabricType.trim()
      if (formData.sizeChartId) productPayload.sizeChartId = parseInt(formData.sizeChartId)

      // Handle stock quantity with unit conversion
      if (formData.trackInventory && formData.stockQuantity) {
        const qty = parseFloat(formData.stockQuantity)
        if (formData.unit === 'GRAM' || formData.unit === 'G') {
          productPayload.stockQuantity = qty / 1000 // Convert grams to kg (base unit)
        } else if (formData.unit === 'ML') {
          productPayload.stockQuantity = qty / 1000 // Convert ml to L (base unit)
        } else if (formData.unit === 'CM') {
          productPayload.stockQuantity = qty / 100 // Convert cm to m (base unit)
        } else if (formData.unit === 'MG') {
          productPayload.stockQuantity = qty / 1000000 // Convert mg to kg (base unit)
        } else if (formData.unit === 'INCH') {
          productPayload.stockQuantity = qty / 39.37 // Convert inch to m (base unit, approximate)
        } else if (formData.unit === 'KG' || formData.unit === 'LTR' || formData.unit === 'L' || formData.unit === 'MTR' || formData.unit === 'M' || formData.unit === 'FT') {
          productPayload.stockQuantity = qty // Already in base unit
        } else {
          productPayload.stockQuantity = Math.floor(qty) // Count-based units (PCS, BOX, etc.) - integer only
        }
      }

      if (isEditMode && productId && productTenantId) {
        // Update existing product
        productPayload.id = parseInt(productId)
        productPayload.tenantId = productTenantId
        const response = await api.put<{ success: boolean; data: Product }>(`/products/${productId}`, productPayload)
        showToast('Product updated successfully', 'success')
      } else {
        // Create new product
        const response = await api.post<{ data: Product }>('/products', productPayload)
        showToast('Product created successfully', 'success')
      }
      setTimeout(() => {
        navigate('/products')
      }, 1000)
    } catch (error: any) {
      console.error('Error creating product:', error)
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.data?.message ||
                          error.response?.data?.errors?.join(', ') ||
                          error.message || 
                          'Failed to create product'
      showToast(errorMessage, 'error')
    } finally {
      setLoading(false)
    }
  }

  if (loadingProduct) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/products')}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{isEditMode ? 'Edit Product' : 'New Product'}</h1>
              <p className="mt-1 text-sm text-gray-500">{isEditMode ? 'Update product details' : 'Create a new retail product'}</p>
            </div>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center gap-2 sm:gap-4">
        <button
          onClick={() => navigate('/products')}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
        >
          <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{isEditMode ? 'Edit Product' : 'New Product'}</h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-500">{isEditMode ? 'Update product details' : 'Create a new retail product'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg">
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Basic Information */}
          <div>
            <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter product name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SKU (Stock Keeping Unit)
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleChange}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter SKU or leave blank for auto-generation"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      // Auto-generate SKU based on product name
                      const sku = formData.name
                        .toUpperCase()
                        .replace(/[^A-Z0-9]/g, '')
                        .substring(0, 10)
                        .padEnd(6, '0')
                      setFormData(prev => ({ ...prev, sku: sku || `PROD-${Date.now().toString().slice(-6)}` }))
                    }}
                    className="px-3 py-2 text-sm text-primary-600 bg-primary-50 border border-primary-200 rounded-md hover:bg-primary-100 whitespace-nowrap"
                    title="Auto-generate SKU from product name"
                  >
                    Auto
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Unique product identifier. Leave blank to auto-generate, or enter your own SKU.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Type</label>
                <div className="flex space-x-2">
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="Product">Product</option>
                    <option value="Service">Service</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      // For now, product types are limited to enum values
                      // In future, this could open a modal to add custom types
                      showToast('Product types are currently limited to Product and Service. Contact admin to add custom types.', 'info')
                    }}
                    className="px-3 py-2 text-sm text-primary-600 bg-primary-50 border border-primary-200 rounded-md hover:bg-primary-100 flex items-center space-x-1"
                    title="Product types are predefined (Product/Service)"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Product: Physical items | Service: Non-physical services
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <div className="flex space-x-2">
                  <select
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleChange}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select Category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id.toString()}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowCategoryModal(true)}
                    className="px-3 py-2 text-sm text-primary-600 bg-primary-50 border border-primary-200 rounded-md hover:bg-primary-100 flex items-center space-x-1"
                    title="Add New Category"
                  >
                    <Plus className="h-4 w-4" />
                    <span>New</span>
                  </button>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter product description"
                />
              </div>
            </div>
          </div>

          {/* Pricing Information */}
          <div>
            <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Pricing Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cost Price <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="costPrice"
                  value={formData.costPrice}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Selling Price <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="sellingPrice"
                  value={formData.sellingPrice}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
                <input
                  type="number"
                  name="taxRate"
                  value={formData.taxRate}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tax Type</label>
                <select
                  name="taxType"
                  value={formData.taxType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="GST">GST</option>
                  <option value="Non-GST">Non-GST</option>
                  <option value="Exempt">Exempt</option>
                </select>
              </div>
            </div>
          </div>

          {/* Inventory Information */}
          <div>
            <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Inventory Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="trackInventory"
                  id="trackInventory"
                  checked={formData.trackInventory}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="trackInventory" className="ml-2 block text-sm text-gray-700">
                  Track Inventory
                </label>
              </div>

              {formData.trackInventory && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stock Quantity (in {formData.unit || 'Base Unit'})
                    </label>
                    <input
                      type="number"
                      name="stockQuantity"
                      value={formData.stockQuantity}
                      onChange={handleChange}
                      min="0"
                      step={formData.unit === 'KG' || formData.unit === 'LTR' || formData.unit === 'MTR' || formData.unit === 'GRAM' || formData.unit === 'G' || formData.unit === 'ML' || formData.unit === 'CM' ? "0.01" : "1"}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      placeholder="0"
                    />
                    {formData.unit && formData.stockQuantity && parseFloat(formData.stockQuantity) > 0 && (
                      <p className="mt-1 text-xs text-gray-500">
                        {(() => {
                          const qty = parseFloat(formData.stockQuantity)
                          if ((formData.unit === 'GRAM' || formData.unit === 'G') && qty > 0) {
                            return `= ${(qty / 1000).toFixed(3)}kg (converted to base unit)`
                          } else if (formData.unit === 'ML' && qty > 0) {
                            return `= ${(qty / 1000).toFixed(3)}L (converted to base unit)`
                          } else if (formData.unit === 'CM' && qty > 0) {
                            return `= ${(qty / 100).toFixed(2)}m (converted to base unit)`
                          } else if (formData.unit === 'KG' && qty > 0) {
                            return `= ${(qty * 1000).toFixed(0)}g (in grams)`
                          } else if (formData.unit === 'LTR' && qty > 0) {
                            return `= ${(qty * 1000).toFixed(0)}ml (in milliliters)`
                          } else if (formData.unit === 'MTR' && qty > 0) {
                            return `= ${(qty * 100).toFixed(0)}cm (in centimeters)`
                          }
                          return ''
                        })()}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Alert</label>
                    <input
                      type="number"
                      name="lowStockAlert"
                      value={formData.lowStockAlert}
                      onChange={handleChange}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      placeholder="0"
                    />
                  </div>

                  {/* Expiry Configuration Section */}
                  <div className="md:col-span-2">
                    <div className="flex items-center mb-4">
                      <input
                        type="checkbox"
                        id="isExpiryEnabled"
                        checked={formData.isExpiryEnabled}
                        onChange={(e) => setFormData(prev => ({ ...prev, isExpiryEnabled: e.target.checked }))}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor="isExpiryEnabled" className="ml-2 block text-sm font-medium text-gray-700">
                        Enable Expiry Tracking
                      </label>
                    </div>

                    {formData.isExpiryEnabled && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6 border-l-2 border-gray-200">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Type *</label>
                          <select
                            name="expiryType"
                            value={formData.expiryType}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="FIXED_DATE">Fixed Expiry Date</option>
                            <option value="DURATION">Expire After (Duration)</option>
                          </select>
                        </div>

                        {formData.expiryType === 'DURATION' && (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Expire After Value *</label>
                              <input
                                type="number"
                                name="expireAfterValue"
                                value={formData.expireAfterValue}
                                onChange={handleChange}
                                min="1"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                                placeholder="e.g., 6"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Expire After Unit *</label>
                              <select
                                name="expireAfterUnit"
                                value={formData.expireAfterUnit}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                              >
                                <option value="DAYS">Days</option>
                                <option value="MONTHS">Months</option>
                                <option value="YEARS">Years</option>
                              </select>
                            </div>
                          </>
                        )}

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Alert Before Value *</label>
                          <input
                            type="number"
                            name="alertBeforeValue"
                            value={formData.alertBeforeValue}
                            onChange={handleChange}
                            min="1"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                            placeholder="e.g., 30"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Alert Before Unit *</label>
                          <select
                            name="alertBeforeUnit"
                            value={formData.alertBeforeUnit}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="DAYS">Days</option>
                            <option value="MONTHS">Months</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* Manufacturing and Expiry Date Fields */}
                    {formData.isExpiryEnabled && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6 border-l-2 border-gray-200 mt-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturing Date</label>
                          <input
                            type="date"
                            name="manufacturingDate"
                            value={formData.manufacturingDate}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            {formData.expiryType === 'DURATION' 
                              ? 'Used to calculate expiry date (required for DURATION type)'
                              : 'Manufacturing date for reference'}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Expiry Date
                            {formData.expiryType === 'DURATION' && formData.expiryDate && (
                              <span className="ml-2 text-xs text-green-600">(Auto-calculated)</span>
                            )}
                          </label>
                          <input
                            type="date"
                            name="expiryDate"
                            value={formData.expiryDate}
                            onChange={handleChange}
                            disabled={formData.expiryType === 'DURATION' && formData.manufacturingDate && formData.expireAfterValue}
                            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 ${
                              formData.expiryType === 'DURATION' && formData.manufacturingDate && formData.expireAfterValue
                                ? 'bg-gray-100 cursor-not-allowed'
                                : ''
                            }`}
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            {formData.expiryType === 'FIXED_DATE' 
                              ? 'Fixed expiry date for this product'
                              : formData.expiryType === 'DURATION' && formData.manufacturingDate && formData.expireAfterValue
                              ? 'Automatically calculated from Manufacturing Date + Expire After'
                              : 'Enter expiry date or use DURATION type to auto-calculate'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Base Unit <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="unit"
                      value={formData.unit}
                      onChange={handleChange}
                      required={formData.trackInventory}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    >
                      <optgroup label="Count-based (Pieces)">
                        <option value="PCS">PCS - Pieces</option>
                        <option value="QTY">QTY - Quantity</option>
                        <option value="NOS">NOS - Numbers</option>
                        <option value="BOX">BOX - Box</option>
                        <option value="PKT">PKT - Packet</option>
                        <option value="BTL">BTL - Bottle</option>
                        <option value="TAB">TAB - Tablet (Medical)</option>
                        <option value="CAP">CAP - Capsule</option>
                        <option value="STRIP">STRIP - Strip</option>
                      </optgroup>
                      <optgroup label="Weight-based">
                        <option value="KG">KG - Kilogram (Base Unit)</option>
                        <option value="GRAM">GRAM - Gram (1000g = 1kg)</option>
                        <option value="G">G - Gram</option>
                        <option value="MG">MG - Milligram (1000mg = 1g)</option>
                      </optgroup>
                      <optgroup label="Volume-based (Liquids)">
                        <option value="LTR">LTR - Liter (Base Unit)</option>
                        <option value="L">L - Liter</option>
                        <option value="ML">ML - Milliliter (1000ml = 1L)</option>
                      </optgroup>
                      <optgroup label="Length/Area-based">
                        <option value="MTR">MTR - Meter</option>
                        <option value="M">M - Meter</option>
                        <option value="CM">CM - Centimeter (100cm = 1m)</option>
                        <option value="FT">FT - Feet</option>
                        <option value="INCH">INCH - Inch (12in = 1ft)</option>
                        <option value="SQFT">SQFT - Square Feet</option>
                        <option value="SQM">SQM - Square Meter</option>
                      </optgroup>
                    </select>
                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                      <p className="font-medium mb-1">Unit Conversion Info:</p>
                      {formData.unit === 'KG' || formData.unit === 'GRAM' || formData.unit === 'G' ? (
                        <p>• Stock stored in: <strong>KG</strong></p>
                      ) : formData.unit === 'LTR' || formData.unit === 'L' || formData.unit === 'ML' ? (
                        <p>• Stock stored in: <strong>LTR</strong></p>
                      ) : formData.unit === 'MTR' || formData.unit === 'M' || formData.unit === 'CM' ? (
                        <p>• Stock stored in: <strong>MTR</strong></p>
                      ) : (
                        <p>• Stock stored in: <strong>{formData.unit}</strong> (No conversion needed)</p>
                      )}
                      {(formData.unit === 'GRAM' || formData.unit === 'G') && (
                        <p>• Conversion: <strong>1000g = 1kg</strong> (Auto-converted during billing)</p>
                      )}
                      {formData.unit === 'ML' && (
                        <p>• Conversion: <strong>1000ml = 1L</strong> (Auto-converted during billing)</p>
                      )}
                      {formData.unit === 'CM' && (
                        <p>• Conversion: <strong>100cm = 1m</strong> (Auto-converted during billing)</p>
                      )}
                      <p className="mt-1 text-blue-700">💡 Tip: Always enter stock quantity in the base unit (KG, LTR, MTR, or PCS)</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* RMG Information (Readymade Garments) */}
          <div>
            <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-4">RMG Information (Readymade Garments)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Style Code</label>
                <input
                  type="text"
                  name="styleCode"
                  value={formData.styleCode}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter style/design code"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Season</label>
                <select
                  name="season"
                  value={formData.season}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select Season</option>
                  <option value="Spring">Spring</option>
                  <option value="Summer">Summer</option>
                  <option value="Fall">Fall</option>
                  <option value="Winter">Winter</option>
                  <option value="All Season">All Season</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Collection</label>
                <input
                  type="text"
                  name="collection"
                  value={formData.collection}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter collection name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select Gender</option>
                  <option value="Men">Men</option>
                  <option value="Women">Women</option>
                  <option value="Kids">Kids</option>
                  <option value="Unisex">Unisex</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fabric Type</label>
                <input
                  type="text"
                  name="fabricType"
                  value={formData.fabricType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., Cotton, Polyester, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Size Chart</label>
                <select
                  name="sizeChartId"
                  value={formData.sizeChartId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select Size Chart</option>
                  {sizeCharts.map((chart) => (
                    <option key={chart.id} value={chart.id.toString()}>
                      {chart.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Select a size chart for this product. Create one in{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/size-charts')}
                    className="text-primary-600 hover:text-primary-800 underline"
                  >
                    Size Charts
                  </button>
                </p>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div>
            <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Additional Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">HSN Code</label>
                <input
                  type="text"
                  name="hsnCode"
                  value={formData.hsnCode}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter HSN code"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SAC Code</label>
                <input
                  type="text"
                  name="sacCode"
                  value={formData.sacCode}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter SAC code"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
                <input
                  type="text"
                  name="barcode"
                  value={formData.barcode}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter barcode"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isActive"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                  Active (Product will be available for sale)
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="px-4 sm:px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row justify-end gap-3 rounded-b-lg">
          <button
            type="button"
            onClick={() => navigate('/products')}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save Product</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Add Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Add New Category</h3>
                <button
                  onClick={() => {
                    setShowCategoryModal(false)
                    setNewCategoryName('')
                    setNewCategoryDescription('')
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Enter category name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newCategoryName.trim()) {
                        handleCreateCategory()
                      }
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    value={newCategoryDescription}
                    onChange={(e) => setNewCategoryDescription(e.target.value)}
                    placeholder="Enter category description"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCategoryModal(false)
                    setNewCategoryName('')
                    setNewCategoryDescription('')
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateCategory}
                  disabled={creatingCategory || !newCategoryName.trim()}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {creatingCategory ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      <span>Create Category</span>
                    </>
                  )}
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

export default NewProduct

