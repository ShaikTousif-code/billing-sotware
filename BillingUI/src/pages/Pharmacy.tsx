import { useEffect, useState } from 'react'
import api from '../services/api'
import { Search, Pill, Plus, QrCode, Package, TrendingUp, TrendingDown, X, Receipt, Edit } from 'lucide-react'
import { Product, StockTransaction } from '../types'
import { useToast } from '../hooks/useToast'
import { TableSkeleton } from '../components/LoadingSkeleton'
import ConfirmationDialog from '../components/ConfirmationDialog'
import { formatDate } from '../utils/dateUtils'
import { scanBarcode } from '../utils/barcode'

interface MedicineItem {
  productId: number | null
  productName: string
  quantity: number
  unitPrice: number
  totalAmount: number
}

interface ManualStockForm {
  productId: string
  name: string
  batchNo: string
  manufacturer: string
  hsnCode: string
  barcode: string
  sku: string
  unit: string
  unitCost: string
  sellingPrice: string
  mrp: string
  manufacturingDate: string
  expiryDate: string
  quantity: string
  supplierName: string
  notes: string
  // Expiry configuration
  expiryType: 'FIXED_DATE' | 'DURATION'
  expireAfterValue: string
  expireAfterUnit: 'DAYS' | 'MONTHS' | 'YEARS'
  alertBeforeValue: string
  alertBeforeUnit: 'DAYS' | 'MONTHS'
  isExpiryEnabled: boolean
}

const Pharmacy = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [inventory, setInventory] = useState<any[]>([])
  const [transactions, setTransactions] = useState<StockTransaction[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'stock' | 'transactions' | 'manual'>('stock')
  const [expiryFilter, setExpiryFilter] = useState<'all' | 'expired' | '90' | '60' | '30'>('all')
  
  // Stock In/Out states
  const [showStockModal, setShowStockModal] = useState<boolean>(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [stockQuantity, setStockQuantity] = useState<string>('')
  const [stockUnitCost, setStockUnitCost] = useState<string>('')
  const [stockType, setStockType] = useState<'in' | 'out'>('in')
  const [processingStock, setProcessingStock] = useState<boolean>(false)

  // Manual stock-in states
  const [showManualStockModal, setShowManualStockModal] = useState<boolean>(false)
  const [manualStockMode, setManualStockMode] = useState<'stock-in' | 'edit'>('stock-in')
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [manualStockForm, setManualStockForm] = useState<ManualStockForm>({
    productId: '',
    name: '',
    batchNo: '',
    manufacturer: '',
    hsnCode: '',
    barcode: '',
    sku: '',
    unit: '',
    unitCost: '',
    sellingPrice: '',
    mrp: '',
    manufacturingDate: '',
    expiryDate: '',
    quantity: '',
    supplierName: '',
    notes: '',
    // Expiry configuration
    expiryType: 'FIXED_DATE',
    expireAfterValue: '',
    expireAfterUnit: 'MONTHS',
    alertBeforeValue: '30',
    alertBeforeUnit: 'DAYS',
    isExpiryEnabled: false
  })
  
  // Manual bill states
  const [showManualBillModal, setShowManualBillModal] = useState<boolean>(false)
  const [medicineItems, setMedicineItems] = useState<MedicineItem[]>([])
  const [notes, setNotes] = useState<string>('')
  const [showBillConfirm, setShowBillConfirm] = useState<boolean>(false)
  const [billToGenerate, setBillToGenerate] = useState<any>(null)
  
  // Barcode scan state
  const [barcodeInput, setBarcodeInput] = useState<string>('')
  
  const { showToast, ToastContainer } = useToast()

  // Calculate expiry date from manufacturing date + duration
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

  // Update expiry date when manufacturing date or duration changes
  const updateExpiryDateIfNeeded = (updatedForm: ManualStockForm, previousType?: 'FIXED_DATE' | 'DURATION'): ManualStockForm => {
    if (updatedForm.expiryType === 'DURATION' && updatedForm.isExpiryEnabled && 
        updatedForm.manufacturingDate && updatedForm.expireAfterValue && updatedForm.expireAfterUnit) {
      const calculatedExpiry = calculateExpiryDate(
        updatedForm.manufacturingDate,
        updatedForm.expireAfterValue,
        updatedForm.expireAfterUnit
      )
      if (calculatedExpiry) {
        updatedForm.expiryDate = calculatedExpiry
      }
    } else if (updatedForm.expiryType === 'FIXED_DATE' && previousType === 'DURATION') {
      // Clear auto-calculated expiry when switching to FIXED_DATE
      updatedForm.expiryDate = ''
    }
    return updatedForm
  }

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async (): Promise<void> => {
    setLoading(true)
    try {
      await Promise.all([
        fetchProducts(),
        fetchInventory(),
        fetchTransactions()
      ])
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async (): Promise<void> => {
    try {
      const response = await api.get<{ data: { data: Product[], pageNumber: number, pageSize: number, totalCount: number } }>('/products?pageSize=1000')
      let productsData: Product[] = []
      if (response.data?.data) {
        if (response.data.data.data && Array.isArray(response.data.data.data)) {
          productsData = response.data.data.data
        } else if (Array.isArray(response.data.data)) {
          productsData = response.data.data
        }
      } else if (Array.isArray(response.data)) {
        productsData = response.data
      }
      setProducts(productsData)
    } catch (error) {
      console.error('Error fetching products:', error)
      showToast('Failed to fetch products', 'error')
      setProducts([])
    }
  }

  const fetchInventory = async (): Promise<void> => {
    try {
      const response = await api.get('/inventory')
      const inventoryData = response.data?.data || response.data || []
      setInventory(Array.isArray(inventoryData) ? inventoryData : [])
    } catch (error) {
      console.error('Error fetching inventory:', error)
      setInventory([])
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

  const getExpiryDate = (product?: Product): Date | null => {
    if (!product?.expiryDate) return null
    const date = new Date(product.expiryDate)
    return Number.isNaN(date.getTime()) ? null : date
  }

  const getDaysToExpiry = (product?: Product): number | null => {
    const expiry = getExpiryDate(product)
    if (!expiry) return null
    const now = new Date()
    const diff = expiry.getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    return Math.floor(diff / (1000 * 60 * 60 * 24))
  }

  const isExpired = (product?: Product): boolean => {
    const days = getDaysToExpiry(product)
    return days !== null && days < 0
  }

  const matchesExpiryFilter = (product?: Product): boolean => {
    if (expiryFilter === 'all') return true
    const days = getDaysToExpiry(product)
    if (expiryFilter === 'expired') {
      return days !== null && days < 0
    }
    const threshold = parseInt(expiryFilter, 10)
    return days !== null && days >= 0 && days <= threshold
  }

  const handleBarcodeScan = async (barcode: string): Promise<void> => {
    if (!barcode.trim()) return

    try {
      const scanResult = await scanBarcode(barcode, api)
      
      if (scanResult?.type === 'product' && scanResult.data) {
        const product = scanResult.data
          if (activeTab === 'stock') {
            openManualStockModal(product)
            showToast(`Found: ${product.name}`, 'success')
          } else if (activeTab === 'manual') {
            if (isExpired(product)) {
              showToast('This medicine is expired and cannot be billed', 'error')
              setBarcodeInput('')
              return
            }
            addMedicineItem(product)
            showToast(`Added: ${product.name}`, 'success')
          }
        setBarcodeInput('')
      } else if (scanResult?.type === 'variant' && scanResult.data) {
        const variant = scanResult.data
        const product = products.find(p => p.id === variant.productId)
        if (product) {
          if (activeTab === 'stock') {
            openManualStockModal(product)
            showToast(`Found: ${product.name}`, 'success')
          } else if (activeTab === 'manual') {
            if (isExpired(product)) {
              showToast('This medicine is expired and cannot be billed', 'error')
              setBarcodeInput('')
              return
            }
            addMedicineItem(product)
            showToast(`Added: ${product.name}`, 'success')
          }
          setBarcodeInput('')
        }
      } else {
        showToast('Product not found', 'error')
      }
    } catch (error: any) {
      console.error('Error scanning barcode:', error)
      showToast('Failed to scan barcode', 'error')
    }
  }

  const handleStockAdjustment = async (): Promise<void> => {
    if (!selectedProduct) return

    const quantity = parseInt(stockQuantity)
    if (isNaN(quantity) || quantity <= 0) {
      showToast('Please enter a valid quantity', 'error')
      return
    }

    setProcessingStock(true)
    try {
      await api.post('/inventory/adjust', {
        productId: selectedProduct.id,
        quantity: stockType === 'in' ? quantity : -quantity,
        unitCost: stockUnitCost ? parseFloat(stockUnitCost) : undefined,
        addToExisting: stockType === 'in'
      })
      
      showToast(`Stock ${stockType === 'in' ? 'added' : 'removed'} successfully`, 'success')
      setShowStockModal(false)
      setSelectedProduct(null)
      setStockQuantity('')
      setStockUnitCost('')
      setStockType('in')
      fetchData()
    } catch (error: any) {
      console.error('Error adjusting stock:', error)
      const errorMessage = error.response?.data?.message || 'Failed to adjust stock'
      showToast(errorMessage, 'error')
    } finally {
      setProcessingStock(false)
    }
  }

  const openStockModal = (product: Product, type: 'in' | 'out'): void => {
    setSelectedProduct(product)
    setStockQuantity('')
    setStockUnitCost(product.costPrice?.toString() || '')
    setStockType(type)
    setShowStockModal(true)
  }

  const resetManualStockForm = (): void => {
    setManualStockForm({
      productId: '',
      name: '',
      batchNo: '',
      manufacturer: '',
      hsnCode: '',
      barcode: '',
      sku: '',
      unit: '',
      unitCost: '',
      sellingPrice: '',
      mrp: '',
      manufacturingDate: '',
      expiryDate: '',
      quantity: '',
      supplierName: '',
      notes: '',
      expiryType: 'FIXED_DATE',
      expireAfterValue: '',
      expireAfterUnit: 'MONTHS',
      alertBeforeValue: '30',
      alertBeforeUnit: 'DAYS',
      isExpiryEnabled: false
    })
  }

  const openManualStockModal = (product?: Product): void => {
    setManualStockMode('stock-in')
    setEditProduct(null)
    if (product) {
      setManualStockForm({
        productId: product.id.toString(),
        name: product.name || '',
        batchNo: product.batchNo || '',
        manufacturer: product.manufacturer || '',
        hsnCode: product.hsnCode || '',
        barcode: product.barcode || '',
        sku: product.sku || '',
        unit: product.unit || '',
        unitCost: product.costPrice?.toString() || '',
        sellingPrice: product.sellingPrice?.toString() || '',
        mrp: product.mrp?.toString() || '',
        manufacturingDate: '',
        expiryDate: product.expiryDate ? new Date(product.expiryDate).toISOString().slice(0, 10) : '',
        quantity: '1',
        supplierName: product.supplierName || '',
        notes: '',
        expiryType: product.expiryType || 'FIXED_DATE',
        expireAfterValue: product.expireAfterValue?.toString() || '',
        expireAfterUnit: product.expireAfterUnit || 'MONTHS',
        alertBeforeValue: product.alertBeforeValue?.toString() || '30',
        alertBeforeUnit: product.alertBeforeUnit || 'DAYS',
        isExpiryEnabled: product.isExpiryEnabled || false
      })
    } else {
      resetManualStockForm()
    }
    setShowManualStockModal(true)
  }

  const openEditProductModal = async (productId: number): Promise<void> => {
    try {
      const response = await api.get<{ success: boolean; data: Product }>(`/products/${productId}`)
      const product = response.data?.data
      if (!product) {
        showToast('Failed to load product details', 'error')
        return
      }
      setEditProduct(product)
      setManualStockMode('edit')
      setManualStockForm({
        productId: product.id.toString(),
        name: product.name || '',
        batchNo: product.batchNo || '',
        manufacturer: product.manufacturer || '',
        hsnCode: product.hsnCode || '',
        barcode: product.barcode || '',
        sku: product.sku || '',
        unit: product.unit || '',
        unitCost: product.costPrice?.toString() || '',
        sellingPrice: product.sellingPrice?.toString() || '',
        mrp: product.mrp?.toString() || '',
        manufacturingDate: '',
        expiryDate: product.expiryDate ? new Date(product.expiryDate).toISOString().slice(0, 10) : '',
        quantity: '',
        supplierName: product.supplierName || '',
        notes: ''
      })
      setShowManualStockModal(true)
    } catch (error: any) {
      console.error('Error loading product:', error)
      const message = error.response?.data?.message || 'Failed to load product details'
      showToast(message, 'error')
    }
  }

  const handleManualStockProductChange = (value: string): void => {
    if (!value) {
      resetManualStockForm()
      return
    }
    const product = products.find(p => p.id === parseInt(value))
    if (!product) {
      return
    }
    setManualStockForm(prev => ({
      ...prev,
      productId: value,
      name: product.name || '',
      batchNo: product.batchNo || '',
      manufacturer: product.manufacturer || '',
      hsnCode: product.hsnCode || '',
      barcode: product.barcode || '',
      sku: product.sku || '',
      unit: product.unit || '',
      unitCost: product.costPrice?.toString() || '',
      sellingPrice: product.sellingPrice?.toString() || '',
      mrp: product.mrp?.toString() || '',
      expiryDate: product.expiryDate ? new Date(product.expiryDate).toISOString().slice(0, 10) : ''
    }))
  }

  const handleManualStockSubmit = async (): Promise<void> => {
    if (!manualStockForm.productId && !manualStockForm.name.trim()) {
      showToast('Medicine name is required', 'error')
      return
    }

    if (manualStockMode === 'stock-in') {
      const quantity = parseInt(manualStockForm.quantity)
      if (isNaN(quantity) || quantity <= 0) {
        showToast('Please enter a valid quantity', 'error')
        return
      }

      const payload: any = {
        productId: manualStockForm.productId ? parseInt(manualStockForm.productId) : undefined,
        name: manualStockForm.name.trim() || undefined,
        sku: manualStockForm.sku || undefined,
        hsnCode: manualStockForm.hsnCode || undefined,
        barcode: manualStockForm.barcode || undefined,
        manufacturer: manualStockForm.manufacturer || undefined,
        batchNo: manualStockForm.batchNo || undefined,
        manufacturingDate: manualStockForm.manufacturingDate ? new Date(manualStockForm.manufacturingDate).toISOString() : undefined,
        expiryDate: manualStockForm.expiryDate ? new Date(manualStockForm.expiryDate).toISOString() : undefined,
        unit: manualStockForm.unit || undefined,
        unitCost: manualStockForm.unitCost ? parseFloat(manualStockForm.unitCost) : undefined,
        sellingPrice: manualStockForm.sellingPrice ? parseFloat(manualStockForm.sellingPrice) : undefined,
        mrp: manualStockForm.mrp ? parseFloat(manualStockForm.mrp) : undefined,
        quantity,
        supplierName: manualStockForm.supplierName || undefined,
        notes: manualStockForm.notes || undefined,
        // Expiry configuration
        expiryType: manualStockForm.isExpiryEnabled ? manualStockForm.expiryType : undefined,
        expireAfterValue: manualStockForm.isExpiryEnabled && manualStockForm.expireAfterValue ? parseInt(manualStockForm.expireAfterValue) : undefined,
        expireAfterUnit: manualStockForm.isExpiryEnabled && manualStockForm.expireAfterUnit ? manualStockForm.expireAfterUnit : undefined,
        alertBeforeValue: manualStockForm.isExpiryEnabled && manualStockForm.alertBeforeValue ? parseInt(manualStockForm.alertBeforeValue) : undefined,
        alertBeforeUnit: manualStockForm.isExpiryEnabled && manualStockForm.alertBeforeUnit ? manualStockForm.alertBeforeUnit : undefined,
        isExpiryEnabled: manualStockForm.isExpiryEnabled
      }

      try {
        await api.post('/inventory/stock-in', payload)
        showToast('Stock added successfully', 'success')
        setShowManualStockModal(false)
        resetManualStockForm()
        fetchData()
      } catch (error: any) {
        console.error('Error adding stock:', error)
        const message = error.response?.data?.message || error.response?.data?.data?.message || 'Failed to add stock'
        showToast(message, 'error')
      }
      return
    }

    if (manualStockMode === 'edit' && editProduct) {
      const payload: Product = {
        ...editProduct,
        name: manualStockForm.name.trim(),
        sku: manualStockForm.sku || undefined,
        hsnCode: manualStockForm.hsnCode || undefined,
        barcode: manualStockForm.barcode || undefined,
        manufacturer: manualStockForm.manufacturer || undefined,
        batchNo: manualStockForm.batchNo || undefined,
        expiryDate: manualStockForm.expiryDate ? new Date(manualStockForm.expiryDate).toISOString() : undefined,
        unit: manualStockForm.unit || undefined,
        costPrice: manualStockForm.unitCost ? parseFloat(manualStockForm.unitCost) : editProduct.costPrice,
        sellingPrice: manualStockForm.sellingPrice ? parseFloat(manualStockForm.sellingPrice) : editProduct.sellingPrice,
        mrp: manualStockForm.mrp ? parseFloat(manualStockForm.mrp) : editProduct.mrp,
        supplierName: manualStockForm.supplierName || undefined,
        lastPurchasePrice: manualStockForm.unitCost ? parseFloat(manualStockForm.unitCost) : editProduct.lastPurchasePrice,
        expiryType: manualStockForm.isExpiryEnabled ? manualStockForm.expiryType : undefined,
        expireAfterValue: manualStockForm.isExpiryEnabled && manualStockForm.expireAfterValue ? parseInt(manualStockForm.expireAfterValue) : undefined,
        expireAfterUnit: manualStockForm.isExpiryEnabled && manualStockForm.expireAfterUnit ? manualStockForm.expireAfterUnit : undefined,
        alertBeforeValue: manualStockForm.isExpiryEnabled && manualStockForm.alertBeforeValue ? parseInt(manualStockForm.alertBeforeValue) : undefined,
        alertBeforeUnit: manualStockForm.isExpiryEnabled && manualStockForm.alertBeforeUnit ? manualStockForm.alertBeforeUnit : undefined,
        isExpiryEnabled: manualStockForm.isExpiryEnabled,
        updatedAt: new Date().toISOString()
      }

      try {
        await api.put(`/products/${editProduct.id}`, payload)
        showToast('Medicine updated successfully', 'success')
        setShowManualStockModal(false)
        setEditProduct(null)
        resetManualStockForm()
        fetchData()
      } catch (error: any) {
        console.error('Error updating product:', error)
        const message = error.response?.data?.message || error.response?.data?.data?.message || 'Failed to update medicine'
        showToast(message, 'error')
      }
    }
  }

  const addMedicineItem = (product?: Product): void => {
    if (product) {
      if (isExpired(product)) {
        showToast('This medicine is expired and cannot be billed', 'error')
        return
      }
      setMedicineItems([...medicineItems, {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: product.sellingPrice || 0,
        totalAmount: product.sellingPrice || 0
      }])
    } else {
      setMedicineItems([...medicineItems, {
        productId: null,
        productName: '',
        quantity: 1,
        unitPrice: 0,
        totalAmount: 0
      }])
    }
  }

  const removeMedicineItem = (index: number): void => {
    setMedicineItems(medicineItems.filter((_, i) => i !== index))
  }

  const updateMedicineItem = (index: number, field: keyof MedicineItem, value: any): void => {
    const updated = [...medicineItems]
    
    if (field === 'productId') {
      updated[index] = { ...updated[index], productId: value ? parseInt(value) : null }
      
      if (value) {
        const product = products.find(p => p.id === parseInt(value))
        if (product) {
          updated[index].productName = product.name
          updated[index].unitPrice = product.sellingPrice || 0
        }
      } else {
        updated[index].productName = ''
        updated[index].unitPrice = 0
      }
    } else if (field === 'quantity') {
      updated[index] = { ...updated[index], quantity: value || 1 }
    } else if (field === 'unitPrice') {
      updated[index] = { ...updated[index], unitPrice: value || 0 }
    } else {
      updated[index] = { ...updated[index], [field]: value }
    }
    
    updated[index].totalAmount = updated[index].quantity * updated[index].unitPrice
    setMedicineItems(updated)
  }

  const handleCreateManualBill = async (): Promise<void> => {
    if (medicineItems.length === 0) {
      showToast('Please add at least one medicine', 'error')
      return
    }

    const subTotal = medicineItems.reduce((sum, item) => sum + item.totalAmount, 0)
    const totalAmount = subTotal

    const billData = {
      customerName: 'Walk-in Customer',
      invoiceDate: new Date().toISOString(),
      status: 'Completed',
      notes: notes || 'Manual medicine bill from pharmacy',
      items: medicineItems.map(item => ({
        productId: item.productId || 0,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountAmount: 0,
        taxRate: 0,
        taxAmount: 0,
        totalAmount: item.totalAmount
      })),
      subTotal,
      taxAmount: 0,
      discountAmount: 0,
      totalAmount,
      balanceAmount: 0,
      paidAmount: totalAmount
    }

    setBillToGenerate(billData)
    setShowBillConfirm(true)
  }

  const confirmCreateBill = async (): Promise<void> => {
    if (!billToGenerate) return

    try {
      await api.post('/invoices', billToGenerate)
      showToast('Medicine bill created successfully', 'success')
      setShowManualBillModal(false)
      setMedicineItems([])
      setNotes('')
      setShowBillConfirm(false)
      setBillToGenerate(null)
    } catch (error: any) {
      console.error('Error creating bill:', error)
      const errorMessage = error.response?.data?.message || error.response?.data?.data?.message || error.message || 'Failed to create bill'
      showToast(errorMessage, 'error')
    }
  }

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      item.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product?.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch && matchesExpiryFilter(item.product)
  })

  const filteredTransactions = transactions.filter(
    (transaction) =>
      transaction.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.product?.sku?.toLowerCase().includes(searchTerm.toLowerCase())
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pharmacy - Medicine Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage medicine stock in/out, scan barcodes, and create manual bills
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => openManualStockModal()}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            <TrendingUp className="h-5 w-5" />
            <span>Manual Stock In</span>
          </button>
          <button
            onClick={() => {
              setShowManualBillModal(true)
              setMedicineItems([])
              setNotes('')
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            <Plus className="h-5 w-5" />
            <span>Manual Bill</span>
          </button>
        </div>
      </div>

      {/* Barcode Scanner */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <QrCode className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Scan barcode or enter barcode manually..."
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && barcodeInput.trim()) {
                  handleBarcodeScan(barcodeInput.trim())
                }
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <button
            onClick={() => handleBarcodeScan(barcodeInput.trim())}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Scan
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('stock')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'stock'
                  ? 'border-b-2 border-primary-500 text-primary-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Package className="inline h-4 w-4 mr-2" />
              Stock
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'transactions'
                  ? 'border-b-2 border-primary-500 text-primary-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <TrendingUp className="inline h-4 w-4 mr-2" />
              Transactions
            </button>
            <button
              onClick={() => setActiveTab('manual')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'manual'
                  ? 'border-b-2 border-primary-500 text-primary-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Receipt className="inline h-4 w-4 mr-2" />
              Manual Bills
            </button>
          </nav>
        </div>

        {/* Search + Expiry Filter */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-3 md:space-y-0">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search medicines..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            {activeTab === 'stock' && (
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-600">Expiry within</label>
                <select
                  value={expiryFilter}
                  onChange={(e) => setExpiryFilter(e.target.value as 'all' | 'expired' | '90' | '60' | '30')}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="all">All</option>
                  <option value="expired">Expired</option>
                  <option value="90">90 days</option>
                  <option value="60">60 days</option>
                  <option value="30">30 days</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Stock Tab */}
        {activeTab === 'stock' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Medicine</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiry</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInventory.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      No medicines found
                    </td>
                  </tr>
                ) : (
                  filteredInventory.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.product?.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.product?.sku || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.quantity || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {(() => {
                          const days = getDaysToExpiry(item.product)
                          if (days === null) return '-'
                          if (days < 0) return <span className="text-red-600 font-medium">Expired</span>
                          if (days <= 30) return <span className="text-yellow-600 font-medium">{days} days</span>
                          return <span className="text-green-600 font-medium">{days} days</span>
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.product?.unit || 'units'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => openEditProductModal(item.product!.id)}
                            className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                            title="Edit Medicine"
                          >
                            <Edit className="h-4 w-4" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => openStockModal(item.product!, 'in')}
                            className="text-green-600 hover:text-green-900 flex items-center space-x-1"
                            title="Stock In"
                          >
                            <TrendingUp className="h-4 w-4" />
                            <span>In</span>
                          </button>
                          <button
                            onClick={() => openStockModal(item.product!, 'out')}
                            className="text-red-600 hover:text-red-900 flex items-center space-x-1"
                            title="Stock Out"
                          >
                            <TrendingDown className="h-4 w-4" />
                            <span>Out</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Medicine</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Cost</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {transaction.transactionDate ? formatDate(new Date(transaction.transactionDate)) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {transaction.product?.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          transaction.transactionType === 'In'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {transaction.transactionType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {transaction.unitCost ? `₹${transaction.unitCost.toFixed(2)}` : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Manual Bills Tab */}
        {activeTab === 'manual' && (
          <div className="p-4">
            <div className="text-center py-8 text-gray-500">
              <Receipt className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>Use the "Manual Bill" button above to create medicine bills</p>
              <p className="text-sm mt-2">Or scan barcodes to add medicines to a bill</p>
            </div>
          </div>
        )}
      </div>

      {/* Stock In/Out Modal */}
      {showStockModal && selectedProduct && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Stock {stockType === 'in' ? 'In' : 'Out'} - {selectedProduct.name}
              </h3>
              <button
                onClick={() => {
                  setShowStockModal(false)
                  setSelectedProduct(null)
                  setStockQuantity('')
                  setStockUnitCost('')
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Enter quantity"
                />
              </div>
              {stockType === 'in' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit Cost (Optional)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={stockUnitCost}
                    onChange={(e) => setStockUnitCost(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Enter unit cost"
                  />
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowStockModal(false)
                  setSelectedProduct(null)
                  setStockQuantity('')
                  setStockUnitCost('')
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleStockAdjustment}
                disabled={processingStock || !stockQuantity}
                className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {stockType === 'in' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                <span>Confirm {stockType === 'in' ? 'Stock In' : 'Stock Out'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Stock In Modal */}
      {showManualStockModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {manualStockMode === 'edit' ? 'Edit Medicine' : 'Manual Stock In'}
              </h3>
              <button
                onClick={() => {
                  setShowManualStockModal(false)
                  resetManualStockForm()
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Existing Medicine</label>
                <select
                  value={manualStockForm.productId}
                  onChange={(e) => handleManualStockProductChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  disabled={manualStockMode === 'edit'}
                >
                  <option value="">New Medicine</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id.toString()}>
                      {product.name} {product.sku ? `(${product.sku})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Medicine Name *</label>
                  <input
                    type="text"
                    value={manualStockForm.name}
                    onChange={(e) => setManualStockForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Enter medicine name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">HSN Code</label>
                  <input
                    type="text"
                    value={manualStockForm.hsnCode}
                    onChange={(e) => setManualStockForm(prev => ({ ...prev, hsnCode: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="HSN code"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Batch No.</label>
                  <input
                    type="text"
                    value={manualStockForm.batchNo}
                    onChange={(e) => setManualStockForm(prev => ({ ...prev, batchNo: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Batch number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer</label>
                  <input
                    type="text"
                    value={manualStockForm.manufacturer}
                    onChange={(e) => setManualStockForm(prev => ({ ...prev, manufacturer: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Manufacturer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">MFG Date</label>
                  <input
                    type="date"
                    value={manualStockForm.manufacturingDate}
                    onChange={(e) => {
                      const updated = { ...manualStockForm, manufacturingDate: e.target.value }
                      setManualStockForm(updateExpiryDateIfNeeded(updated, manualStockForm.expiryType))
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    EXP Date
                    {manualStockForm.expiryType === 'DURATION' && manualStockForm.expiryDate && 
                     manualStockForm.manufacturingDate && manualStockForm.expireAfterValue && (
                      <span className="ml-2 text-xs text-green-600">(Auto-calculated)</span>
                    )}
                  </label>
                  <input
                    type="date"
                    value={manualStockForm.expiryDate}
                    onChange={(e) => setManualStockForm(prev => ({ ...prev, expiryDate: e.target.value }))}
                    disabled={manualStockForm.expiryType === 'DURATION' && 
                             manualStockForm.manufacturingDate && 
                             manualStockForm.expireAfterValue}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                      manualStockForm.expiryType === 'DURATION' && 
                      manualStockForm.manufacturingDate && 
                      manualStockForm.expireAfterValue
                        ? 'bg-gray-100 cursor-not-allowed'
                        : ''
                    }`}
                  />
                  {manualStockForm.expiryType === 'DURATION' && manualStockForm.manufacturingDate && manualStockForm.expireAfterValue && (
                    <p className="mt-1 text-xs text-gray-500">Automatically calculated from MFG Date + Expire After</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                  <input
                    type="text"
                    value={manualStockForm.sku}
                    onChange={(e) => setManualStockForm(prev => ({ ...prev, sku: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="SKU"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
                  <input
                    type="text"
                    value={manualStockForm.barcode}
                    onChange={(e) => setManualStockForm(prev => ({ ...prev, barcode: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Barcode"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                  <input
                    type="text"
                    value={manualStockForm.unit}
                    onChange={(e) => setManualStockForm(prev => ({ ...prev, unit: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="PCS / KG / LTR"
                  />
                </div>
                {manualStockMode === 'stock-in' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                    <input
                      type="number"
                      min="1"
                      value={manualStockForm.quantity}
                      onChange={(e) => setManualStockForm(prev => ({ ...prev, quantity: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Quantity"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {manualStockMode === 'edit' ? 'Cost Price' : 'Unit Cost (Purchase)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={manualStockForm.unitCost}
                    onChange={(e) => setManualStockForm(prev => ({ ...prev, unitCost: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Purchase cost"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={manualStockForm.sellingPrice}
                    onChange={(e) => setManualStockForm(prev => ({ ...prev, sellingPrice: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Selling price"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">MRP</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={manualStockForm.mrp}
                    onChange={(e) => setManualStockForm(prev => ({ ...prev, mrp: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="MRP"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name</label>
                  <input
                    type="text"
                    value={manualStockForm.supplierName}
                    onChange={(e) => setManualStockForm(prev => ({ ...prev, supplierName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Supplier name"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={manualStockForm.notes}
                    onChange={(e) => setManualStockForm(prev => ({ ...prev, notes: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Notes (optional)"
                  />
                </div>
              </div>

              {/* Expiry Configuration Section */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    id="isExpiryEnabled"
                    checked={manualStockForm.isExpiryEnabled}
                    onChange={(e) => setManualStockForm(prev => ({ ...prev, isExpiryEnabled: e.target.checked }))}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isExpiryEnabled" className="ml-2 block text-sm font-medium text-gray-700">
                    Enable Expiry Tracking
                  </label>
                </div>

                {manualStockForm.isExpiryEnabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Type *</label>
                      <select
                        value={manualStockForm.expiryType}
                        onChange={(e) => {
                          const previousType = manualStockForm.expiryType
                          const updated = { ...manualStockForm, expiryType: e.target.value as 'FIXED_DATE' | 'DURATION' }
                          setManualStockForm(updateExpiryDateIfNeeded(updated, previousType))
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="FIXED_DATE">Fixed Expiry Date</option>
                        <option value="DURATION">Expire After (Duration)</option>
                      </select>
                    </div>

                    {manualStockForm.expiryType === 'DURATION' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Expire After Value</label>
                          <input
                            type="number"
                            min="1"
                            value={manualStockForm.expireAfterValue}
                            onChange={(e) => {
                              const updated = { ...manualStockForm, expireAfterValue: e.target.value }
                              setManualStockForm(updateExpiryDateIfNeeded(updated, manualStockForm.expiryType))
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="e.g., 6"
                          />
                          <p className="mt-1 text-xs text-gray-500">Leave empty to disable duration-based expiry</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Expire After Unit</label>
                          <select
                            value={manualStockForm.expireAfterUnit}
                            onChange={(e) => {
                              const updated = { ...manualStockForm, expireAfterUnit: e.target.value as 'DAYS' | 'MONTHS' | 'YEARS' }
                              setManualStockForm(updateExpiryDateIfNeeded(updated, manualStockForm.expiryType))
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                        min="1"
                        value={manualStockForm.alertBeforeValue}
                        onChange={(e) => setManualStockForm(prev => ({ ...prev, alertBeforeValue: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="e.g., 30"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Alert Before Unit *</label>
                      <select
                        value={manualStockForm.alertBeforeUnit}
                        onChange={(e) => setManualStockForm(prev => ({ ...prev, alertBeforeUnit: e.target.value as 'DAYS' | 'MONTHS' }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="DAYS">Days</option>
                        <option value="MONTHS">Months</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowManualStockModal(false)
                  resetManualStockForm()
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleManualStockSubmit}
                className={`px-4 py-2 text-white rounded-md text-sm font-medium hover:opacity-90 ${
                  manualStockMode === 'edit' ? 'bg-blue-600' : 'bg-green-600'
                }`}
              >
                {manualStockMode === 'edit' ? 'Save Changes' : 'Add Stock'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Bill Modal */}
      {showManualBillModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Create Manual Medicine Bill</h3>
              <button
                onClick={() => {
                  setShowManualBillModal(false)
                  setMedicineItems([])
                  setNotes('')
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Bill Items */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">Medicines</label>
                  <button
                    onClick={() => addMedicineItem()}
                    className="flex items-center space-x-1 px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Medicine</span>
                  </button>
                </div>

                {medicineItems.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500 mb-2">No medicines added. Click "Add Medicine" or scan barcodes.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Medicine</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                          <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Action</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {medicineItems.map((item, index) => (
                          <tr key={index}>
                            <td className="px-3 py-2">
                              <select
                                value={item.productId?.toString() || ''}
                                onChange={(e) => {
                                  const value = e.target.value
                                  updateMedicineItem(index, 'productId', value)
                                }}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              >
                                <option value="">Select Medicine</option>
                                {products.map((product) => {
                                  const expired = isExpired(product)
                                  const label = `${product.name} - ₹${product.sellingPrice?.toFixed(2) || '0.00'}${expired ? ' (Expired)' : ''}`
                                  return (
                                    <option key={product.id} value={product.id.toString()} disabled={expired}>
                                      {label}
                                    </option>
                                  )
                                })}
                              </select>
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateMedicineItem(index, 'quantity', parseInt(e.target.value) || 1)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.unitPrice}
                                onChange={(e) => updateMedicineItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                            </td>
                            <td className="px-3 py-2 text-sm font-medium">
                              ₹{item.totalAmount.toFixed(2)}
                            </td>
                            <td className="px-3 py-2 text-center">
                              <button
                                onClick={() => removeMedicineItem(index)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50">
                        <tr>
                          <td colSpan={3} className="px-3 py-2 text-right text-sm font-medium">
                            Total:
                          </td>
                          <td className="px-3 py-2 text-sm font-bold">
                            ₹{medicineItems.reduce((sum, item) => sum + item.totalAmount, 0).toFixed(2)}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Optional notes for this bill..."
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowManualBillModal(false)
                  setMedicineItems([])
                  setNotes('')
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateManualBill}
                disabled={medicineItems.length === 0}
                className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Receipt className="h-4 w-4" />
                <span>Create Bill</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bill Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showBillConfirm}
        onCancel={() => {
          setShowBillConfirm(false)
          setBillToGenerate(null)
        }}
        onConfirm={confirmCreateBill}
        title="Confirm Bill Creation"
        message="Are you sure you want to create this medicine bill? Once created, this bill will be marked as completed and cannot be undone."
        confirmText="Create Bill"
        cancelText="Cancel"
        variant="warning"
      />

      <ToastContainer />
    </div>
  )
}

export default Pharmacy
