import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { Inventory, StockTransaction, Product, ProductVariantCombination } from '../types'
import { TableSkeleton } from '../components/LoadingSkeleton'
import { Search, Plus, Minus, Edit, AlertTriangle, Package, TrendingUp, TrendingDown, Grid } from 'lucide-react'
import { formatDate } from '../utils/dateUtils'

const InventoryPage = () => {
  const [inventory, setInventory] = useState<Inventory[]>([])
  const [transactions, setTransactions] = useState<StockTransaction[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'inventory' | 'transactions' | 'variants'>('inventory')
  const [showAdjustModal, setShowAdjustModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [adjustQuantity, setAdjustQuantity] = useState<string>('')
  const [adjustUnitCost, setAdjustUnitCost] = useState<string>('')
  const [adjustType, setAdjustType] = useState<'add' | 'set'>('add')
  const [adjusting, setAdjusting] = useState(false)
  const [productVariants, setProductVariants] = useState<{ [productId: number]: ProductVariantCombination[] }>({})
  const [selectedProductForVariants, setSelectedProductForVariants] = useState<Product | null>(null)

  useEffect(() => {
    fetchInventory()
    fetchTransactions()
  }, [])

  const fetchProductVariants = async (productId: number): Promise<void> => {
    if (productVariants[productId]) return

    try {
      const response = await api.get<{ success: boolean; data: ProductVariantCombination[] }>(
        `/product-variant-combinations/product/${productId}`
      )
      if (response.data.success) {
        setProductVariants(prev => ({
          ...prev,
          [productId]: response.data.data,
        }))
      }
    } catch (error) {
      console.error('Error fetching variants:', error)
      setProductVariants(prev => ({
        ...prev,
        [productId]: [],
      }))
    }
  }

  useEffect(() => {
    if (activeTab === 'variants' && selectedProductForVariants) {
      fetchProductVariants(selectedProductForVariants.id)
    }
  }, [activeTab, selectedProductForVariants])

  const fetchInventory = async (): Promise<void> => {
    try {
      const response = await api.get('/inventory')
      const inventoryData = response.data?.data || response.data || []
      setInventory(Array.isArray(inventoryData) ? inventoryData : [])
    } catch (error) {
      console.error('Error fetching inventory:', error)
      setInventory([])
    } finally {
      setLoading(false)
    }
  }

  const fetchTransactions = async (): Promise<void> => {
    try {
      const response = await api.get('/inventory/transactions')
      const transactionsData = response.data?.data || response.data || []
      setTransactions(Array.isArray(transactionsData) ? transactionsData : [])
    } catch (error) {
      console.error('Error fetching transactions:', error)
      setTransactions([])
    }
  }

  const handleAdjustInventory = async (): Promise<void> => {
    if (!selectedProduct) return

    const quantity = parseInt(adjustQuantity)
    if (isNaN(quantity) || quantity <= 0) {
      alert('Please enter a valid quantity')
      return
    }

    setAdjusting(true)
    try {
      await api.post('/inventory/adjust', {
        productId: selectedProduct.id,
        quantity: adjustType === 'add' ? quantity : quantity,
        unitCost: adjustUnitCost ? parseFloat(adjustUnitCost) : undefined,
        addToExisting: adjustType === 'add'
      })
      
      setShowAdjustModal(false)
      setSelectedProduct(null)
      setAdjustQuantity('')
      setAdjustUnitCost('')
      setAdjustType('add')
      fetchInventory()
      fetchTransactions()
      alert('Inventory adjusted successfully')
    } catch (error: any) {
      console.error('Error adjusting inventory:', error)
      alert(error.response?.data?.message || 'Failed to adjust inventory')
    } finally {
      setAdjusting(false)
    }
  }

  const openAdjustModal = (item: Inventory): void => {
    setSelectedProduct(item.product || null)
    setAdjustQuantity('')
    setAdjustUnitCost(item.averageCost.toString())
    setAdjustType('add')
    setShowAdjustModal(true)
  }

  const filteredInventory = inventory.filter(
    (item) =>
      item.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product?.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredTransactions = transactions.filter(
    (transaction) =>
      transaction.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.product?.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const lowStockItems = inventory.filter(
    (item) => item.product && item.product.lowStockAlert && item.quantity > 0 && item.quantity <= item.product.lowStockAlert
  )
  
  const negativeStockItems = inventory.filter(
    (item) => item.quantity < 0
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse mt-2"></div>
          </div>
        </div>
        <TableSkeleton rows={8} columns={6} />
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            View and manage your inventory levels and stock transactions
          </p>
        </div>
        {(negativeStockItems.length > 0 || lowStockItems.length > 0) && (
          <div className="flex items-center space-x-4">
            {negativeStockItems.length > 0 && (
              <div className="flex items-center space-x-2 text-red-600 bg-red-50 px-4 py-2 rounded-lg">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-medium">{negativeStockItems.length} Negative Stock Item(s)</span>
              </div>
            )}
            {lowStockItems.length > 0 && (
              <div className="flex items-center space-x-2 text-orange-600 bg-orange-50 px-4 py-2 rounded-lg">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-medium">{lowStockItems.length} Low Stock Item(s)</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'inventory'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Inventory ({inventory.length})
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'transactions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Stock Transactions ({transactions.length})
          </button>
          <button
            onClick={() => setActiveTab('variants')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'variants'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Grid className="h-4 w-4 inline mr-1" />
            Variant Inventory
          </button>
        </nav>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          type="text"
          placeholder="Search by product name or SKU..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Inventory Tab */}
      {activeTab === 'inventory' && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Average Cost
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInventory.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                      No inventory items found
                    </td>
                  </tr>
                ) : (
                  filteredInventory.map((item) => {
                    const isLowStock = item.product && item.product.lowStockAlert && item.quantity > 0 && item.quantity <= item.product.lowStockAlert
                    const isNegativeStock = item.quantity < 0
                    const isOutOfStock = item.quantity === 0
                    const stockValue = item.quantity * item.averageCost
                    return (
                      <tr key={item.id} className={isNegativeStock ? 'bg-red-50' : isLowStock ? 'bg-orange-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Package className="h-5 w-5 text-gray-400 mr-2" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {item.product?.name || 'N/A'}
                              </div>
                              {item.product?.category && (
                                <div className="text-sm text-gray-500">{item.product.category.name}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.product?.sku || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-medium ${isNegativeStock ? 'text-red-600' : 'text-gray-900'}`}>
                            {item.quantity}
                          </div>
                          {item.product?.unit && (
                            <div className="text-xs text-gray-500">{item.product.unit}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ₹{item.averageCost.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-medium ${isNegativeStock ? 'text-red-600' : 'text-gray-900'}`}>
                            ₹{stockValue.toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isNegativeStock ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Negative Stock
                            </span>
                          ) : isOutOfStock ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Out of Stock
                            </span>
                          ) : isLowStock ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Low Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              In Stock
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => openAdjustModal(item)}
                            className="text-blue-600 hover:text-blue-900 flex items-center"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Adjust
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit Cost
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                      No stock transactions found
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(transaction.transactionDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {transaction.product?.name || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">{transaction.product?.sku || ''}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {transaction.transactionType === 'In' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Stock In
                          </span>
                        ) : transaction.transactionType === 'Out' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <TrendingDown className="h-3 w-3 mr-1" />
                            Stock Out
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <Edit className="h-3 w-3 mr-1" />
                            Adjustment
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {transaction.transactionType === 'Out' ? '-' : '+'}{transaction.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {transaction.unitCost ? `₹${transaction.unitCost.toFixed(2)}` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {transaction.referenceType && transaction.referenceId
                          ? `${transaction.referenceType} #${transaction.referenceId}`
                          : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {transaction.notes || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Variants Tab */}
      {activeTab === 'variants' && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Product to View Variant Inventory
            </label>
            <select
              value={selectedProductForVariants?.id || ''}
              onChange={(e) => {
                const product = inventory.find(i => i.product?.id === parseInt(e.target.value))?.product
                setSelectedProductForVariants(product || null)
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a product...</option>
              {inventory
                .filter(item => item.product)
                .map(item => (
                  <option key={item.product!.id} value={item.product!.id}>
                    {item.product!.name}
                  </option>
                ))}
            </select>
          </div>

          {selectedProductForVariants && productVariants[selectedProductForVariants.id] && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Variant Inventory - {selectedProductForVariants.name}
              </h3>
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
                        Stock Quantity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Selling Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {productVariants[selectedProductForVariants.id].length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                          No variants found for this product
                        </td>
                      </tr>
                    ) : (
                      productVariants[selectedProductForVariants.id].map((variant) => {
                        const isLowStock = variant.stockQuantity > 0 && variant.stockQuantity <= 5
                        const isOutOfStock = variant.stockQuantity === 0
                        const isNegativeStock = variant.stockQuantity < 0
                        return (
                          <tr
                            key={variant.id}
                            className={isNegativeStock ? 'bg-red-50' : isLowStock ? 'bg-orange-50' : ''}
                          >
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
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className={`text-sm font-medium ${
                                isNegativeStock ? 'text-red-600' : 'text-gray-900'
                              }`}>
                                {variant.stockQuantity}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {variant.sellingPrice ? `₹${variant.sellingPrice.toFixed(2)}` : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {isNegativeStock ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Negative
                                </span>
                              ) : isOutOfStock ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  Out of Stock
                                </span>
                              ) : isLowStock ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Low Stock
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  In Stock
                                </span>
                              )}
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Adjust Inventory Modal */}
      {showAdjustModal && selectedProduct && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Adjust Inventory - {selectedProduct.name}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adjustment Type
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="add"
                        checked={adjustType === 'add'}
                        onChange={(e) => setAdjustType(e.target.value as 'add' | 'set')}
                        className="mr-2"
                      />
                      <span className="text-sm">Add to Existing</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="set"
                        checked={adjustType === 'set'}
                        onChange={(e) => setAdjustType(e.target.value as 'add' | 'set')}
                        className="mr-2"
                      />
                      <span className="text-sm">Set Quantity</span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity {adjustType === 'add' ? '(to add)' : '(new quantity)'}
                  </label>
                  <input
                    type="number"
                    value={adjustQuantity}
                    onChange={(e) => setAdjustQuantity(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter quantity"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unit Cost (optional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={adjustUnitCost}
                    onChange={(e) => setAdjustUnitCost(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter unit cost"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => {
                      setShowAdjustModal(false)
                      setSelectedProduct(null)
                      setAdjustQuantity('')
                      setAdjustUnitCost('')
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAdjustInventory}
                    disabled={adjusting}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {adjusting ? 'Adjusting...' : 'Adjust Inventory'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default InventoryPage

