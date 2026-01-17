import { useEffect, useState } from 'react'
import { Link,useLocation, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { Download, Upload, Receipt, Package, Plus } from 'lucide-react'
import { TableSkeleton } from '../components/LoadingSkeleton'
import { Edit, Trash2, Search } from 'lucide-react'
import { Product, ProductCategory } from '../types'
import EmptyState from '../components/EmptyState'
import Tooltip from '../components/Tooltip'
import { useToast } from '../hooks/useToast'
import Pagination from '../components/Pagination'
import FilterPanel from '../components/FilterPanel'

interface PaginatedResponse<T> {
  data: T[]
  pageNumber: number
  pageSize: number
  totalCount: number
  totalPages: number
}

const Products = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { showToast, ToastContainer } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [searchTerm, setSearchTerm] = useState<string>('')
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(25)
  const [totalCount, setTotalCount] = useState<number>(0)
  const [totalPages, setTotalPages] = useState<number>(0)
  
  // Filter state
  const [showFilters, setShowFilters] = useState<boolean>(false)
  const [filterCategory, setFilterCategory] = useState<number | ''>('')
  const [filterStatus, setFilterStatus] = useState<string>('all') // all, active, inactive
  const [filterStock, setFilterStock] = useState<string>('all') // all, inStock, lowStock, outOfStock
  const [filterPriceRange, setFilterPriceRange] = useState<{ min: string; max: string }>({ min: '', max: '' })

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [location.pathname, currentPage, pageSize, filterCategory, filterStatus, filterStock, filterPriceRange, searchTerm])

  const fetchCategories = async (): Promise<void> => {
    try {
      const response = await api.get<{ success: boolean; data: ProductCategory[] }>('/product-categories')
      const categoriesData = response.data?.data || response.data || []
      setCategories(Array.isArray(categoriesData) ? categoriesData : [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchProducts = async (): Promise<void> => {
    try {
      setLoading(true)
      // Fetch a larger dataset for filtering
      const params: any = {
        page: 1,
        pageSize: 1000, // Get all products for client-side filtering
        includeInactive: filterStatus === 'all' || filterStatus === 'inactive'
      }

      const response = await api.get<{ success: boolean; data: PaginatedResponse<Product> }>('/products', { params })
      
      const paginatedData = response.data?.data
      if (paginatedData) {
        let productsData = paginatedData.data || []
        
        // Apply search filter first
        if (searchTerm) {
          const term = searchTerm.toLowerCase()
          productsData = productsData.filter(p =>
            p.name?.toLowerCase().includes(term) ||
            p.sku?.toLowerCase().includes(term)
          )
        }
        
        // Apply client-side filters
        if (filterCategory) {
          productsData = productsData.filter(p => p.categoryId === filterCategory)
        }
        
        if (filterStatus === 'active') {
          productsData = productsData.filter(p => p.isActive)
        } else if (filterStatus === 'inactive') {
          productsData = productsData.filter(p => !p.isActive)
        }
        
        if (filterStock === 'inStock') {
          productsData = productsData.filter(p => p.trackInventory && (p.stockQuantity || 0) > 0)
        } else if (filterStock === 'lowStock') {
          productsData = productsData.filter(p => {
            if (!p.trackInventory) return false
            const stock = p.stockQuantity || 0
            const alert = p.lowStockAlert || 0
            return stock > 0 && stock <= alert
          })
        } else if (filterStock === 'outOfStock') {
          productsData = productsData.filter(p => p.trackInventory && (p.stockQuantity || 0) <= 0)
        }
        
        if (filterPriceRange.min) {
          const minPrice = parseFloat(filterPriceRange.min)
          productsData = productsData.filter(p => p.sellingPrice >= minPrice)
        }
        
        if (filterPriceRange.max) {
          const maxPrice = parseFloat(filterPriceRange.max)
          productsData = productsData.filter(p => p.sellingPrice <= maxPrice)
        }
        
        // Apply pagination after all filters
        const total = productsData.length
        const startIndex = (currentPage - 1) * pageSize
        const endIndex = startIndex + pageSize
        const paginatedProducts = productsData.slice(startIndex, endIndex)
        
        setProducts(paginatedProducts)
        setTotalCount(total)
        setTotalPages(Math.ceil(total / pageSize))
      } else {
        setProducts([])
        setTotalCount(0)
        setTotalPages(0)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      setProducts([])
      setTotalCount(0)
      setTotalPages(0)
    } finally {
      setLoading(false)
    }
  }

  const getActiveFilterCount = (): number => {
    let count = 0
    if (filterCategory) count++
    if (filterStatus !== 'all') count++
    if (filterStock !== 'all') count++
    if (filterPriceRange.min || filterPriceRange.max) count++
    return count
  }

  const resetFilters = (): void => {
    setFilterCategory('')
    setFilterStatus('all')
    setFilterStock('all')
    setFilterPriceRange({ min: '', max: '' })
    setCurrentPage(1)
  }

  const handleDelete = async (id: number): Promise<void> => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await api.delete(`/products/${id}`)
        showToast('Product deleted successfully', 'success')
        fetchProducts() // Refetch products
      } catch (error: any) {
        console.error('Error deleting product:', error)
        showToast(error.response?.data?.message || 'Failed to delete product', 'error')
      }
    }
  }


  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse mt-2"></div>
          </div>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <TableSkeleton rows={8} columns={6} />
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Products</h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-500">
            Manage your products and inventory. Use "Scan Bill" to automatically create products from purchase invoices.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              const link = document.createElement('a')
              link.href = '/api/export/products/excel'
              link.download = 'products.xlsx'
              link.click()
            }}
            className="inline-flex items-center px-3 sm:px-4 py-2 border border-gray-300 rounded-md shadow-sm text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Download className="h-4 w-4 sm:h-5 sm:w-5 sm:mr-2" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <Tooltip content="Scan purchase bills to automatically create products">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Scan Bill button clicked');
                try {
                  navigate('/bill-scanner');
                  console.log('Navigation called successfully');
                } catch (error) {
                  console.error('Navigation error:', error);
                  window.location.href = '/bill-scanner';
                }
              }}
              className="inline-flex items-center px-3 sm:px-4 py-2 border border-gray-300 rounded-md shadow-sm text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:shadow-md cursor-pointer relative z-10 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200 transform hover:-translate-y-0.5 active:scale-95"
            >
              <Receipt className="h-4 w-4 sm:h-5 sm:w-5 sm:mr-2" />
              <span className="hidden sm:inline">Scan Bill</span>
              <span className="sm:hidden">Scan</span>
            </button>
          </Tooltip>
          <Tooltip content="Create a new product (Ctrl+N)">
            <Link
              to="/products/new"
              className="inline-flex items-center px-3 sm:px-4 py-2 border border-transparent rounded-md shadow-sm text-xs sm:text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 hover:shadow-md transition-all duration-200 transform hover:-translate-y-0.5 active:scale-95"
            >
              <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Add Product</span>
              <span className="sm:hidden">Add</span>
            </Link>
          </Tooltip>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="bg-white shadow rounded-lg p-3 sm:p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search products by name or SKU..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full pl-8 sm:pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        {/* Filter Panel */}
        <FilterPanel
          isOpen={showFilters}
          onToggle={() => setShowFilters(!showFilters)}
          onReset={resetFilters}
          activeFilterCount={getActiveFilterCount()}
        >
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={filterCategory}
              onChange={(e) => {
                setFilterCategory(e.target.value ? Number(e.target.value) : '')
                setCurrentPage(1)
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Stock Status</label>
            <select
              value={filterStock}
              onChange={(e) => {
                setFilterStock(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Stock</option>
              <option value="inStock">In Stock</option>
              <option value="lowStock">Low Stock</option>
              <option value="outOfStock">Out of Stock</option>
            </select>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Price Range</label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                value={filterPriceRange.min}
                onChange={(e) => {
                  setFilterPriceRange({ ...filterPriceRange, min: e.target.value })
                  setCurrentPage(1)
                }}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
              <input
                type="number"
                placeholder="Max"
                value={filterPriceRange.max}
                onChange={(e) => {
                  setFilterPriceRange({ ...filterPriceRange, max: e.target.value })
                  setCurrentPage(1)
                }}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        </FilterPanel>
      </div>

      {/* Products Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                SKU
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                Category
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                Cost Price
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Selling Price
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                Stock
              </th>
              <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4">
                  <EmptyState
                    icon={Package}
                    title={searchTerm || getActiveFilterCount() > 0 ? "No products found" : "No products yet"}
                    description={searchTerm || getActiveFilterCount() > 0
                      ? `No products match your filters. Try adjusting your search or filters.`
                      : "Get started by adding your first product. You can also scan purchase bills to automatically create products."}
                    action={!searchTerm && getActiveFilterCount() === 0 ? {
                      label: "Add Product",
                      onClick: () => navigate('/products/new'),
                      icon: Plus
                    } : undefined}
                  />
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors duration-150 cursor-pointer" onClick={() => navigate(`/products/${product.id}`)}>
                  <td className="px-3 sm:px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {product.name}
                    </div>
                    {product.description && (
                      <div className="text-xs sm:text-sm text-gray-500 mt-1">
                        {product.description.substring(0, 50)}...
                      </div>
                    )}
                    <div className="sm:hidden mt-1 text-xs text-gray-500">
                      SKU: {product.sku || '-'} | Stock: {product.trackInventory
                        ? `${product.stockQuantity || 0} ${product.unit || 'pcs'}`
                        : 'N/A'}
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                    {product.sku || '-'}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                    {product.category?.name || '-'}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                    ₹{product.costPrice.toFixed(2)}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ₹{product.sellingPrice.toFixed(2)}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                    {product.trackInventory
                      ? `${product.stockQuantity || 0} ${product.unit || 'pcs'}`
                      : 'N/A'}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                      <Tooltip content="Edit Product">
                        <Link
                          to={`/products/${product.id}/edit`}
                          className="text-primary-600 hover:text-primary-900 p-2 rounded-lg hover:bg-primary-50 transition-all duration-200 hover:scale-110 active:scale-95 inline-block"
                          title="Edit Product"
                        >
                          <Edit className="h-4 w-4 sm:h-5 sm:w-5" />
                        </Link>
                      </Tooltip>
                      <Tooltip content="Delete Product">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(product.id)
                          }}
                          className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-all duration-200 hover:scale-110 active:scale-95"
                          title="Delete Product"
                        >
                          <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                      </Tooltip>
                      <div className="hidden lg:flex gap-2">
                        <Tooltip content="View Product Variants">
                          <Link
                            to={`/products/${product.id}/variants`}
                            className="text-primary-600 hover:text-primary-900 text-xs px-2 py-1 rounded hover:bg-primary-50 transition-colors"
                            title="View Variants"
                          >
                            Variants
                          </Link>
                        </Tooltip>
                        <Tooltip content="Manage Size/Color Combinations for RMG">
                          <Link
                            to={`/products/${product.id}/variant-combinations`}
                            className="text-primary-600 hover:text-primary-900 text-xs px-2 py-1 rounded hover:bg-primary-50 transition-colors"
                            title="Manage Size/Color Combinations (RMG)"
                          >
                            Size/Color
                          </Link>
                        </Tooltip>
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalCount}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setPageSize(size)
            setCurrentPage(1)
          }}
        />
      )}

      <ToastContainer />
    </div>
  )
}

export default Products

