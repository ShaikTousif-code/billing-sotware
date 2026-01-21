import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'
import { Trash2, Save, Check, Printer, CreditCard, Wallet, QrCode, X, MessageCircle, Search, Plus } from 'lucide-react'
import { Product, Customer, InvoiceItemForm, Invoice, ProductVariantCombination } from '../types'
import { useToast } from '../hooks/useToast'
import { formatDate } from '../utils/dateUtils'
import useKeyboardShortcut from '../hooks/useKeyboardShortcut'
import Tooltip from '../components/Tooltip'

interface InvoiceItem {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  discountAmount: number
  taxRate: number
  taxAmount: number
  totalAmount: number
}

interface InvoiceTotals {
  subTotal: number
  taxAmount: number
  discountAmount: number
  roundOff: number
  totalAmount: number
}

const CreateInvoice = () => {
  const navigate = useNavigate()
  const { invoiceId } = useParams()
  const { showToast, ToastContainer } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null)
  const [items, setItems] = useState<InvoiceItemForm[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [billLevelDiscount, setBillLevelDiscount] = useState<number>(0)
  const [showSplitPayment, setShowSplitPayment] = useState<boolean>(false)
  const [createdInvoiceId, setCreatedInvoiceId] = useState<number | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false)
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI' | 'Card'>('Cash')
  const [showQRScanner, setShowQRScanner] = useState<boolean>(false)
  const [upiId, setUpiId] = useState<string>('') // Customer's UPI ID for requesting payment
  const [transactionId, setTransactionId] = useState<string>('')
  const [qrCodeImage, setQrCodeImage] = useState<string>('')
  const [loadingQR, setLoadingQR] = useState<boolean>(false)
  const [tenantUPIId, setTenantUPIId] = useState<string>('') // Store's UPI ID for receiving payment
  const [paymentRequestMode, setPaymentRequestMode] = useState<'receive' | 'request'>('receive') // receive = QR code, request = customer UPI ID
  const [createdInvoice, setCreatedInvoice] = useState<Invoice | null>(null)
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [existingInvoice, setExistingInvoice] = useState<Invoice | null>(null)
  const [productDropdowns, setProductDropdowns] = useState<{[key: number]: {isOpen: boolean, searchTerm: string}}>({})
  const [selectedCustomerData, setSelectedCustomerData] = useState<Customer | null>(null)
  const [loyaltyPointsToRedeem, setLoyaltyPointsToRedeem] = useState<number>(0)
  const [showLoyaltyRedeem, setShowLoyaltyRedeem] = useState<boolean>(false)
  const [productVariants, setProductVariants] = useState<{ [productId: number]: ProductVariantCombination[] }>({})
  const [barcodeInput, setBarcodeInput] = useState<string>('')
  const [walkInCustomerPhone, setWalkInCustomerPhone] = useState<string>('') // Mobile number for walk-in customers

  useEffect(() => {
    fetchData()
    fetchTenantUPIId()
  }, [])

  // Keyboard shortcuts
  useKeyboardShortcut([
    {
      key: 'n',
      ctrlKey: true,
      callback: () => {
        if (items.length === 0) {
          // Focus on product search if no items
          const productInput = document.querySelector('input[placeholder*="product" i]') as HTMLInputElement
          productInput?.focus()
        }
      },
      description: 'Focus product search'
    },
    {
      key: 's',
      ctrlKey: true,
      callback: () => {
        if (items.length > 0) {
          handleSave('Draft')
        }
      },
      description: 'Save as draft'
    },
  ])

  const fetchTenantUPIId = async (): Promise<void> => {
    try {
      const tenantId = localStorage.getItem('tenantId')
      if (tenantId) {
        const response = await api.get(`/admin/tenants/${tenantId}`)
        const tenant = response.data.data || response.data
        setTenantUPIId(tenant.upiId || '')
      }
    } catch (error) {
      console.error('Error fetching tenant UPI ID:', error)
    }
  }

  useEffect(() => {
    if (invoiceId) {
      setIsEditing(true)
      fetchExistingInvoice()
    }
  }, [invoiceId])

  // Close dropdowns when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.product-dropdown')) {
        setProductDropdowns({})
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setProductDropdowns({})
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const fetchExistingInvoice = async (): Promise<void> => {
    if (!invoiceId) return

    try {
      setLoading(true)
      const response = await api.get<Invoice>(`/invoices/${invoiceId}`)
      const invoice = response.data

      // Pre-populate form with existing invoice data
      setSelectedCustomer(invoice.customerId || null)
      const customer = customers.find(c => c.id === invoice.customerId)
      setSelectedCustomerData(customer || null)
      setWalkInCustomerPhone(invoice.customerPhone || '')
      setBillLevelDiscount(invoice.billLevelDiscount || 0)
      setLoyaltyPointsToRedeem(invoice.loyaltyPointsRedeemed || 0)

      // Convert invoice items to form format
      const formItems: InvoiceItemForm[] = invoice.items?.map(item => ({
        productId: item.productId.toString(),
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountAmount: item.discountAmount,
        taxRate: item.taxRate,
        taxAmount: item.taxAmount,
        totalAmount: item.totalAmount,
        variantCombinationId: item.variantCombinationId,
        size: item.size,
        color: item.color,
      })) || []
      
      // Fetch variants for products with variants
      formItems.forEach(formItem => {
        if (formItem.productId) {
          fetchProductVariants(parseInt(formItem.productId))
        }
      })

      setItems(formItems)
      setExistingInvoice(invoice)
    } catch (error: any) {
      console.error('Error fetching invoice:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch invoice'
      showToast(errorMessage, 'error')
      navigate('/invoices')
    } finally {
      setLoading(false)
    }
  }

  const fetchData = async (): Promise<void> => {
    try {
      const [productsRes, customersRes] = await Promise.all([
        api.get<{ success: boolean; data: { data: Product[]; pageNumber: number; pageSize: number; totalCount: number } }>('/products', {
          params: { page: 1, pageSize: 1000, includeInactive: true }
        }),
        api.get<Customer[]>('/customers'),
      ])
      // Handle paginated response structure: ApiResponse<PaginatedResponse<Product>>
      // Path: response.data.data.data (ApiResponse -> data -> PaginatedResponse -> data -> Product[])
      const productsData = productsRes.data?.data?.data || productsRes.data?.data || []
      setProducts(Array.isArray(productsData) ? productsData : [])
      setCustomers(Array.isArray(customersRes.data) ? customersRes.data : [])
    } catch (error: any) {
      console.error('Error fetching data:', error)
      // If it's a critical error, navigate back
      if (error?.response?.status >= 500 || error?.message?.includes('Network')) {
        console.error('Critical error fetching data, navigating back')
        showToast('Failed to load data. Redirecting...', 'error')
        setTimeout(() => {
          if (window.history.length > 1) {
            navigate(-1)
          } else {
            navigate('/invoices', { replace: true })
          }
        }, 1500)
      }
      setProducts([])
      setCustomers([])
    }
  }

  const addItem = (): void => {
    setItems([
      ...items,
      {
        productId: '',
        productName: '',
        quantity: 1,
        unitPrice: 0,
        discountAmount: 0,
        taxRate: 0,
        taxAmount: 0,
        totalAmount: 0,
        variantCombinationId: undefined,
        size: undefined,
        color: undefined,
      },
    ])
  }

  const fetchProductVariants = async (productId: number): Promise<void> => {
    if (productVariants[productId]) return // Already fetched

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

  const handleBarcodeScan = async (barcode: string): Promise<void> => {
    if (!barcode.trim()) return

    try {
      const response = await api.get<{ success: boolean; data: ProductVariantCombination }>(
        `/product-variant-combinations/barcode/${barcode}`
      )
      if (response.data?.success && response.data.data) {
        const variant = response.data.data
        if (!variant || !variant.productId) {
          throw new Error('Invalid variant data')
        }
        
        const product = products.find(p => p.id === variant.productId)
        if (product) {
          // Check expiry
          const isExpired = product.isExpiryEnabled && product.expiryDate 
            ? new Date(product.expiryDate) < new Date()
            : false
          if (isExpired) {
            showToast(`Cannot add expired product: ${product.name}`, 'error')
            setBarcodeInput('')
            return
          }
          
          // Add item with variant
          const newItem: InvoiceItemForm = {
            productId: product.id.toString(),
            productName: product.name,
            quantity: 1,
            unitPrice: variant.sellingPrice || product.sellingPrice || 0,
            discountAmount: 0,
            taxRate: product.taxRate || 0,
            taxAmount: 0,
            totalAmount: 0,
            variantCombinationId: variant.id,
            size: variant.size,
            color: variant.color,
          }
          const subtotal = newItem.quantity * newItem.unitPrice - newItem.discountAmount
          newItem.taxAmount = (subtotal * newItem.taxRate) / 100
          newItem.totalAmount = subtotal + newItem.taxAmount
          
          setItems([...items, newItem])
          setBarcodeInput('')
          const variantInfo = variant.size && variant.color 
            ? ` - ${variant.size}/${variant.color}` 
            : ''
          showToast(`Added ${product.name}${variantInfo}`, 'success')
        } else {
          // Product not found for variant, try regular product barcode
          const regularProduct = products.find(p => p.barcode === barcode)
          if (regularProduct) {
            // Check expiry
            const isExpired = regularProduct.isExpiryEnabled && regularProduct.expiryDate 
              ? new Date(regularProduct.expiryDate) < new Date()
              : false
            if (isExpired) {
              showToast(`Cannot add expired product: ${regularProduct.name}`, 'error')
              setBarcodeInput('')
              return
            }
            
            const newItem: InvoiceItemForm = {
              productId: regularProduct.id.toString(),
              productName: regularProduct.name,
              quantity: 1,
              unitPrice: regularProduct.sellingPrice || 0,
              discountAmount: 0,
              taxRate: regularProduct.taxRate || 0,
              taxAmount: 0,
              totalAmount: 0,
            }
            const subtotal = newItem.quantity * newItem.unitPrice - newItem.discountAmount
            newItem.taxAmount = (subtotal * newItem.taxRate) / 100
            newItem.totalAmount = subtotal + newItem.taxAmount
            
            setItems([...items, newItem])
            setBarcodeInput('')
            showToast(`Added ${regularProduct.name}`, 'success')
          } else {
            showToast('Product not found for barcode', 'error')
          }
        }
      } else {
        // Try regular product barcode
        const regularProduct = products.find(p => p.barcode === barcode)
        if (regularProduct) {
          // Check expiry
          const isExpired = regularProduct.isExpiryEnabled && regularProduct.expiryDate 
            ? new Date(regularProduct.expiryDate) < new Date()
            : false
          if (isExpired) {
            showToast(`Cannot add expired product: ${regularProduct.name}`, 'error')
            setBarcodeInput('')
            return
          }
          
          const newItem: InvoiceItemForm = {
            productId: regularProduct.id.toString(),
            productName: regularProduct.name,
            quantity: 1,
            unitPrice: regularProduct.sellingPrice || 0,
            discountAmount: 0,
            taxRate: regularProduct.taxRate || 0,
            taxAmount: 0,
            totalAmount: 0,
          }
          const subtotal = newItem.quantity * newItem.unitPrice - newItem.discountAmount
          newItem.taxAmount = (subtotal * newItem.taxRate) / 100
          newItem.totalAmount = subtotal + newItem.taxAmount
          
          setItems([...items, newItem])
          setBarcodeInput('')
          showToast(`Added ${regularProduct.name}`, 'success')
        } else {
          showToast('Product not found for barcode', 'error')
        }
      }
    } catch (error: any) {
      console.error('Barcode scan error:', error)
      
      // If it's a critical error, navigate back
      if (error?.response?.status >= 500 || error?.message?.includes('Network')) {
        console.error('Critical error during barcode scan, navigating back')
        showToast('Error scanning barcode. Redirecting...', 'error')
        setTimeout(() => {
          if (window.history.length > 1) {
            navigate(-1)
          } else {
            navigate('/invoices', { replace: true })
          }
        }, 1500)
        return
      }
      
      // Try regular product barcode
      const regularProduct = products.find(p => p.barcode === barcode)
      if (regularProduct) {
        const newItem: InvoiceItemForm = {
          productId: regularProduct.id.toString(),
          productName: regularProduct.name,
          quantity: 1,
          unitPrice: regularProduct.sellingPrice || 0,
          discountAmount: 0,
          taxRate: regularProduct.taxRate || 0,
          taxAmount: 0,
          totalAmount: 0,
        }
        const subtotal = newItem.quantity * newItem.unitPrice - newItem.discountAmount
        newItem.taxAmount = (subtotal * newItem.taxRate) / 100
        newItem.totalAmount = subtotal + newItem.taxAmount
        
        setItems([...items, newItem])
        setBarcodeInput('')
        showToast(`Added ${regularProduct.name}`, 'success')
      } else {
        showToast('Product not found for barcode', 'error')
      }
    }
  }

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number): void => {
    const newItems = [...items]
    const item = newItems[index]

    if (field === 'productId') {
      const product = products.find((p) => p.id === parseInt(value as string))
      if (product) {
        item.productId = product.id.toString()
        item.productName = product.name
        item.unitPrice = product.sellingPrice
        item.taxRate = product.taxRate || 0
        // Reset variant fields
        item.variantCombinationId = undefined
        item.size = undefined
        item.color = undefined
        // Fetch variants if available
        fetchProductVariants(product.id)
        // Reset quantity if it exceeds available stock
        if (product.trackInventory && product.stockQuantity !== undefined) {
          if (item.quantity > product.stockQuantity) {
            item.quantity = product.stockQuantity
            showToast(`Stock limited to ${product.stockQuantity} ${product.unit || 'units'}`, 'warning')
          }
        }
      }
    } else if (field === 'variantCombinationId') {
      const variantId = parseInt(value as string)
      const productId = parseInt(item.productId)
      const variants = productVariants[productId] || []
      const variant = variants.find(v => v.id === variantId)
      if (variant) {
        item.variantCombinationId = variant.id
        item.size = variant.size
        item.color = variant.color
        item.unitPrice = variant.sellingPrice || item.unitPrice
        // Validate variant stock
        if (variant.stockQuantity < item.quantity) {
          item.quantity = variant.stockQuantity
          showToast(`Stock limited to ${variant.stockQuantity} for ${variant.size}/${variant.color}`, 'warning')
        }
      }
      } else if (field === 'quantity') {
      const quantity = parseFloat(value as string) || 0
      const product = products.find((p) => p.id === parseInt(item.productId))
      
      // Validate variant stock if variant is selected
      if (item.variantCombinationId) {
        const productId = parseInt(item.productId)
        const variants = productVariants[productId] || []
        const variant = variants.find(v => v.id === item.variantCombinationId)
        if (variant && quantity > variant.stockQuantity) {
          showToast(`Insufficient stock for ${item.size}/${item.color}. Available: ${variant.stockQuantity}`, 'error')
          item.quantity = variant.stockQuantity
        } else {
          item.quantity = quantity
        }
      } else if (product?.trackInventory && product.stockQuantity !== undefined) {
        // Validate product-level stock
        if (quantity > product.stockQuantity) {
          showToast(`Insufficient stock. Available: ${product.stockQuantity} ${product.unit || 'units'}`, 'error')
          item.quantity = product.stockQuantity
        } else {
          item.quantity = quantity
        }
      } else {
        item.quantity = quantity
      }
    } else {
      ;(item[field] as number) = parseFloat(value as string) || 0
    }

    // Calculate totals
    const subtotal = item.quantity * item.unitPrice - item.discountAmount
    item.taxAmount = (subtotal * item.taxRate) / 100
    item.totalAmount = subtotal + item.taxAmount

    newItems[index] = item
    setItems(newItems)
  }

  const removeItem = (index: number): void => {
    setItems(items.filter((_, i) => i !== index))
  }

  const calculateTotals = (): InvoiceTotals => {
    const subTotal = items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice - item.discountAmount,
      0
    )
    const taxAmount = items.reduce((sum, item) => sum + item.taxAmount, 0)
    const discountAmount = items.reduce((sum, item) => sum + item.discountAmount, 0)
    const totalAmount = subTotal + taxAmount - billLevelDiscount
    const roundOff = Math.round(totalAmount) - totalAmount
    const finalTotal = totalAmount + roundOff

    return {
      subTotal,
      taxAmount,
      discountAmount,
      roundOff,
      totalAmount: finalTotal,
    }
  }

  const validateStockAvailability = (): boolean => {
    if (items.length === 0) {
      showToast('Please add at least one item', 'error')
      return false
    }

      // Validate stock availability for completed invoices
      for (const item of items) {
        if (!item.productId) continue
        
        const product = products.find((p) => p.id === parseInt(item.productId))
        if (product?.trackInventory) {
          // Check variant stock if variant is selected
          if (item.variantCombinationId) {
            const variants = productVariants[product.id] || []
            const variant = variants.find(v => v.id === item.variantCombinationId)
            if (variant && variant.stockQuantity < item.quantity) {
              showToast(
                `Insufficient stock for ${product.name} (${item.size}/${item.color}). Available: ${variant.stockQuantity}, Required: ${item.quantity}`,
                'error'
              )
              return false
            }
          } else if (product.stockQuantity !== undefined) {
            // Check product-level stock
            if (item.quantity > product.stockQuantity) {
              showToast(
                `Insufficient stock for ${product.name}. Available: ${product.stockQuantity} ${product.unit || 'units'}, Required: ${item.quantity}`,
                'error'
              )
              return false
            }
          }
        }
      }
    return true
  }

  const handleSave = async (status: 'Draft' | 'Completed'): Promise<void> => {
    if (items.length === 0) {
      showToast('Please add at least one item', 'error')
      return
    }

    // Validate credit limit for B2B customers
    if (status === 'Completed' && selectedCustomerData?.customerType === 'B2B') {
      const invoiceTotal = totals.totalAmount
      const newOutstanding = (selectedCustomerData.outstandingBalance || 0) + invoiceTotal - (status === 'Completed' ? invoiceTotal : 0)
      if (selectedCustomerData.creditLimit > 0 && newOutstanding > selectedCustomerData.creditLimit) {
        showToast(
          `Credit limit exceeded! Credit Limit: ₹${selectedCustomerData.creditLimit.toFixed(2)}, ` +
          `Current Outstanding: ₹${selectedCustomerData.outstandingBalance.toFixed(2)}, ` +
          `Invoice Amount: ₹${invoiceTotal.toFixed(2)}, ` +
          `Total After Invoice: ₹${newOutstanding.toFixed(2)}`,
          'error'
        )
        return
      }
    }

    // Validate stock availability before completing invoice
    if (status === 'Completed' && !validateStockAvailability()) {
      return
    }

    setLoading(true)
    try {
      const totals = calculateTotals()
      
      // If status is 'Completed', create as 'Draft' first
      // Invoice will be marked as 'Completed' only after payment is processed
      const invoiceStatus = status === 'Completed' ? 'Draft' : status
      
      const invoiceData: Partial<Invoice> = {
        ...(isEditing && existingInvoice && { id: existingInvoice.id }),
        customerId: selectedCustomer || undefined,
        customerName: customers.find((c) => c.id === selectedCustomer)?.name || undefined,
        customerPhone: !selectedCustomer && walkInCustomerPhone ? walkInCustomerPhone : undefined,
        invoiceDate: isEditing && existingInvoice ? existingInvoice.invoiceDate : new Date().toISOString(),
        status: invoiceStatus, // Use 'Draft' if user clicked 'Complete Invoice'
        items: items
          .filter((item) => item.productId)
          .map((item) => ({
            productId: parseInt(item.productId),
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discountAmount: item.discountAmount,
            taxRate: item.taxRate,
            taxAmount: item.taxAmount,
            totalAmount: item.totalAmount,
          })),
        ...totals,
        billLevelDiscount,
        paymentTerms: selectedCustomerData?.paymentTerms,
        isTaxInvoice: selectedCustomerData?.customerType === 'B2B' && !!selectedCustomerData?.gstin,
        loyaltyPointsRedeemed: loyaltyPointsToRedeem > 0 ? loyaltyPointsToRedeem : undefined,
        paidAmount: 0, // Set to 0 initially, will be updated after payment
        balanceAmount: totals.totalAmount, // Set balance to total amount initially
      }

      let response: any
      if (isEditing && invoiceId) {
        // Update existing invoice
        response = await api.put<{ success: boolean; data: Invoice }>(`/invoices/${invoiceId}`, invoiceData)
        showToast('Invoice updated successfully', 'success')
        setTimeout(() => {
          navigate('/invoices')
        }, 1000)
      } else {
        // Create new invoice
        response = await api.post<{ success: boolean; data: Invoice }>('/invoices', invoiceData)
        const createdInvoiceData = response.data?.data || response.data

        // If user clicked "Complete Invoice", create as Draft first and open payment modal
        // Invoice will be marked as Completed only after payment is completed
        if (status === 'Completed' && createdInvoiceData?.id) {
          setCreatedInvoiceId(createdInvoiceData.id)
          setCreatedInvoice(createdInvoiceData)
          // Close all product dropdowns before opening payment modal
          setProductDropdowns({})
          setShowPaymentModal(true)
        } else {
          showToast('Invoice created successfully', 'success')
          setTimeout(() => {
            navigate('/invoices')
          }, 1000)
        }
      }
    } catch (error: any) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} invoice:`, error)
      let errorMessage = error.response?.data?.message || error.message || `Failed to ${isEditing ? 'update' : 'create'} invoice`
      
      // Check if it's a stock availability error
      if (errorMessage.includes('Insufficient stock') || errorMessage.includes('stock')) {
        // Extract product name and stock details from error message
        showToast(errorMessage, 'error')
      } else {
        showToast(errorMessage, 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  const handlePrintInvoice = async (): Promise<void> => {
    if (!createdInvoiceId) return
    
    try {
      const response = await api.get(`/export/invoices/${createdInvoiceId}/pdf`, {
        responseType: 'blob',
      })
      
      // Create blob and open in new window for printing
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const printWindow = window.open(url, '_blank')
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print()
        }
      }
      
      showToast('Invoice opened for printing', 'success')
    } catch (error: any) {
      console.error('Error printing invoice:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to print invoice'
      showToast(errorMessage, 'error')
    }
  }

  const handleShareViaWhatsApp = async (): Promise<void> => {
    if (!createdInvoiceId || !createdInvoice) return
    
    try {
      // Get customer phone number if available
      const customer = customers.find(c => c.id === selectedCustomer)
      const phoneNumber = customer?.phone?.replace(/\D/g, '') || ''
      
      // Generate invoice message
      const invoiceMessage = `*Invoice Details*\n\n` +
        `Invoice #: ${createdInvoice.invoiceNumber || createdInvoiceId}\n` +
        `Date: ${formatDate(createdInvoice.invoiceDate)}\n` +
        `Customer: ${createdInvoice.customerName || 'Walk-in Customer'}\n` +
        `Total Amount: ₹${totals.totalAmount.toFixed(2)}\n\n` +
        `Thank you for your business!`
      
      // Create WhatsApp share URL
      const whatsappUrl = phoneNumber
        ? `https://wa.me/${phoneNumber}?text=${encodeURIComponent(invoiceMessage)}`
        : `https://web.whatsapp.com/send?text=${encodeURIComponent(invoiceMessage)}`
      
      // Open WhatsApp
      window.open(whatsappUrl, '_blank')
      
      showToast('Opening WhatsApp...', 'success')
    } catch (error: any) {
      console.error('Error sharing via WhatsApp:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to share via WhatsApp'
      showToast(errorMessage, 'error')
    }
  }

  const generateQRCode = async (invoice?: Invoice, customerUPIIdParam?: string): Promise<void> => {
    const invoiceData = invoice || createdInvoice
    if (!invoiceData) return
    
    setLoadingQR(true)
    try {
      const amount = invoiceData.totalAmount || totals.totalAmount
      const description = `Invoice ${invoiceData.invoiceNumber || invoiceData.id}`
      const customerUPI = customerUPIIdParam || upiId
      
      if (paymentRequestMode === 'request' && customerUPI) {
        // Request payment from customer's UPI ID
        // Format: upi://pay?pa=<CUSTOMER_UPI_ID>&am=<AMOUNT>&cu=INR&tn=<DESCRIPTION>&pn=<PAYEE_NAME>
        const storeName = localStorage.getItem('tenantName') || 'Store'
        const upiUrl = `upi://pay?pa=${customerUPI}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(description)}&pn=${encodeURIComponent(storeName)}`
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUrl)}`
        setQrCodeImage(qrCodeUrl)
      } else if (paymentRequestMode === 'receive' && tenantUPIId) {
        // Generate QR code for customer to scan and pay to store
        // Format: upi://pay?pa=<STORE_UPI_ID>&am=<AMOUNT>&cu=INR&tn=<DESCRIPTION>
        const upiUrl = `upi://pay?pa=${tenantUPIId}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(description)}`
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUrl)}`
        setQrCodeImage(qrCodeUrl)
      } else if (paymentRequestMode === 'receive' && !tenantUPIId) {
        showToast('Please set your store UPI ID in tenant settings', 'error')
        setQrCodeImage('')
      }
    } catch (error: any) {
      console.error('Error generating QR code:', error)
      showToast('Failed to generate QR code', 'error')
    } finally {
      setLoadingQR(false)
    }
  }

  const handlePaymentComplete = async (): Promise<void> => {
    if (!createdInvoiceId || !createdInvoice) return

    try {
      // Record payment via API
      const paymentPayload = {
        invoiceId: createdInvoiceId,
        amount: totals.totalAmount,
        paymentMode: paymentMode,
        transactionId: transactionId || undefined,
        notes: paymentMode === 'UPI' && upiId ? `UPI ID: ${upiId}` : undefined,
      }

      await api.post('/payments', paymentPayload)

      // Update invoice status to 'Completed' after payment is recorded
      try {
        await api.put(`/invoices/${createdInvoiceId}`, {
          status: 'Completed',
          paidAmount: totals.totalAmount,
          balanceAmount: 0,
        })
      } catch (updateError) {
        console.error('Error updating invoice status:', updateError)
        // Continue even if status update fails, as payment is already recorded
      }

      showToast('Payment recorded and invoice completed successfully', 'success')

      // Redirect to view invoice page
      setTimeout(() => {
        navigate(`/invoices/${createdInvoiceId}/view`)
      }, 1000)
    } catch (error: any) {
      console.error('Error recording payment:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to record payment'
      showToast(errorMessage, 'error')
    }
  }

  const handleQRScan = (): void => {
    // This would integrate with a QR code scanner library
    // For now, we'll show a prompt to enter UPI ID manually
    setShowQRScanner(true)
    // In a real implementation, you would use a library like html5-qrcode
    // For now, we'll use a simple input field
  }

  // Product dropdown handlers
  const openProductDropdown = (index: number) => {
    setProductDropdowns(prev => ({
      ...prev,
      [index]: { isOpen: true, searchTerm: '' }
    }))
  }

  const closeProductDropdown = (index: number) => {
    setProductDropdowns(prev => ({
      ...prev,
      [index]: { isOpen: false, searchTerm: '' }
    }))
  }

  const updateProductSearch = (index: number, searchTerm: string) => {
    setProductDropdowns(prev => ({
      ...prev,
      [index]: { ...prev[index], searchTerm }
    }))
  }

  const getFilteredProducts = (index: number) => {
    const searchTerm = productDropdowns[index]?.searchTerm || ''
    return products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  const totals = calculateTotals()

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit Invoice' : 'Create Invoice'}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {isEditing ? 'Update the invoice details' : 'Create a new invoice for your customer'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Main Invoice Form */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Customer Selection */}
          <div className="bg-white shadow rounded-lg p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer
              </label>
              <select
                value={selectedCustomer || ''}
                onChange={(e) => {
                  const customerId = parseInt(e.target.value) || null
                  setSelectedCustomer(customerId)
                  const customer = customers.find(c => c.id === customerId)
                  setSelectedCustomerData(customer || null)
                  if (customer?.customerType === 'B2C') {
                    setShowLoyaltyRedeem(true)
                  } else {
                    setShowLoyaltyRedeem(false)
                    setLoyaltyPointsToRedeem(0)
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Walk-in Customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} {customer.customerType && `(${customer.customerType})`}
                  </option>
                ))}
              </select>
              {!selectedCustomer && (
                <div className="mt-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mobile Number (Optional)
                  </label>
                  <input
                    type="tel"
                    value={walkInCustomerPhone}
                    onChange={(e) => setWalkInCustomerPhone(e.target.value)}
                    placeholder="Enter mobile number (optional)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    maxLength={15}
                  />
                  <p className="mt-1 text-xs text-gray-500">Optional: Enter mobile number for walk-in customer</p>
                </div>
              )}
              {selectedCustomerData && (
                <div className="mt-2 p-3 bg-gray-50 rounded-md border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      selectedCustomerData.customerType === 'B2B' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {selectedCustomerData.customerType}
                    </span>
                    {selectedCustomerData.customerType === 'B2B' && selectedCustomerData.creditLimit > 0 && (
                      <div className="text-xs text-gray-600">
                        Credit Limit: ₹{selectedCustomerData.creditLimit.toFixed(2)} | 
                        Outstanding: ₹{selectedCustomerData.outstandingBalance.toFixed(2)} | 
                        Available: ₹{(selectedCustomerData.creditLimit - selectedCustomerData.outstandingBalance).toFixed(2)}
                      </div>
                    )}
                    {selectedCustomerData.customerType === 'B2C' && selectedCustomerData.loyaltyPoints > 0 && (
                      <div className="text-xs text-blue-600">
                        Loyalty Points: {selectedCustomerData.loyaltyPoints.toFixed(0)} pts
                      </div>
                    )}
                  </div>
                  {selectedCustomerData.customerType === 'B2B' && selectedCustomerData.paymentTerms && (
                    <div className="text-xs text-gray-600">
                      Payment Terms: {selectedCustomerData.paymentTerms}
                      {selectedCustomerData.creditDays && ` (${selectedCustomerData.creditDays} days)`}
                    </div>
                  )}
                </div>
              )}
              {selectedCustomerData?.customerType === 'B2C' && showLoyaltyRedeem && selectedCustomerData.loyaltyPoints > 0 && (
                <div className="mt-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Redeem Loyalty Points (Available: {selectedCustomerData.loyaltyPoints.toFixed(0)} pts)
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      min="0"
                      max={selectedCustomerData.loyaltyPoints}
                      step="1"
                      value={loyaltyPointsToRedeem}
                      onChange={(e) => {
                        const points = parseInt(e.target.value) || 0
                        setLoyaltyPointsToRedeem(Math.min(points, selectedCustomerData.loyaltyPoints))
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Points to redeem"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        // Calculate discount: 1 point = ₹1 (configurable)
                        const discountAmount = loyaltyPointsToRedeem
                        setBillLevelDiscount(prev => prev + discountAmount)
                        setLoyaltyPointsToRedeem(0)
                        showToast(`Redeemed ${loyaltyPointsToRedeem} points for ₹${discountAmount} discount`, 'success')
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                    >
                      Apply
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">1 point = ₹1 discount</p>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bill Level Discount (₹)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={billLevelDiscount}
                onChange={(e) => setBillLevelDiscount(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {/* Invoice Items */}
          <div className="bg-white shadow rounded-lg p-6" style={{ overflow: 'visible', position: 'relative', zIndex: 'auto' }}>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
              <h2 className="text-base sm:text-lg font-medium text-gray-900">Items</h2>
              <div className="flex flex-wrap gap-2">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Scan barcode..."
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && barcodeInput.trim()) {
                        handleBarcodeScan(barcodeInput.trim())
                      }
                    }}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleBarcodeScan(barcodeInput.trim())}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-primary-600 hover:text-primary-800"
                    title="Scan Barcode"
                  >
                    <QrCode className="h-4 w-4" />
                  </button>
                </div>
                <button
                  onClick={addItem}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                >
                  <span className="mr-2">+</span>
                  Add Item
                </button>
              </div>
            </div>


            <div className="space-y-4" style={{ overflow: 'visible', position: 'relative', zIndex: 'auto' }}>
              {items.map((item, index) => (
                <div key={index} className="border rounded-lg p-4" style={{ overflow: 'visible', position: 'relative', zIndex: 'auto' }}>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4" style={{ overflow: 'visible' }}>
                    <div className="sm:col-span-5" style={{ overflow: 'visible', position: 'relative', zIndex: 'auto' }}>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Product
                      </label>
                      <div className="relative product-dropdown" style={{ zIndex: showPaymentModal ? 1 : 1000 + index, overflow: 'visible', isolation: 'isolate' }}>
                        <button
                          type="button"
                          onClick={() => {
                            if (showPaymentModal) return // Prevent opening when payment modal is open
                            if (productDropdowns[index]?.isOpen) {
                              closeProductDropdown(index)
                            } else {
                              openProductDropdown(index)
                            }
                          }}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md text-left flex justify-between items-center"
                          disabled={showPaymentModal}
                        >
                          <span className={item.productId ? 'text-gray-900' : 'text-gray-500'}>
                            {item.productId ? products.find(p => p.id === parseInt(item.productId))?.name + ` - ₹${products.find(p => p.id === parseInt(item.productId))?.sellingPrice}` : 'Select Product'}
                          </span>
                          <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {productDropdowns[index]?.isOpen && !showPaymentModal && (
                          <div 
                            className="absolute bg-white shadow-xl rounded-md text-base ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm flex flex-col" 
                            style={{ 
                              position: 'absolute', 
                              top: '100%', 
                              left: 0,
                              right: 0,
                              zIndex: showPaymentModal ? 1 : 99999,
                              width: '100%',
                              minWidth: '200px',
                              maxHeight: '240px',
                              marginTop: '2px',
                              overflow: 'hidden',
                              transform: 'translateZ(0)'
                            }}
                          >
                            <div className="flex-shrink-0 bg-white border-b sticky top-0 z-10">
                              <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                  <Search className="h-4 w-4 text-gray-400" />
                                </div>
                                <input
                                  type="text"
                                  placeholder="Search products..."
                                  value={productDropdowns[index]?.searchTerm || ''}
                                  onChange={(e) => updateProductSearch(index, e.target.value)}
                                  className="w-full pl-10 pr-4 py-2 text-sm border-0 focus:ring-0 focus:outline-none"
                                  onClick={(e) => e.stopPropagation()}
                                  onFocus={(e) => e.stopPropagation()}
                                />
                              </div>
                            </div>
                            <div className="py-1 overflow-y-auto flex-1" style={{ overflowX: 'hidden', minHeight: 0 }}>
                              {getFilteredProducts(index).length === 0 ? (
                                <div className="px-3 py-2 text-sm text-gray-500">No products found</div>
                              ) : (
                                getFilteredProducts(index).map((product) => {
                                  const availableStock = product.trackInventory && product.stockQuantity !== undefined
                                    ? product.stockQuantity
                                    : null
                                  const isLowStock = availableStock !== null && product.lowStockAlert !== undefined
                                    ? availableStock <= product.lowStockAlert
                                    : false
                                  const isOutOfStock = availableStock === 0
                                  
                                  // Check expiry status
                                  const isExpired = product.isExpiryEnabled && product.expiryDate 
                                    ? new Date(product.expiryDate) < new Date()
                                    : false
                                  const isNearExpiry = product.isExpiryEnabled && product.expiryDate && !isExpired
                                    ? (() => {
                                        const expiryDate = new Date(product.expiryDate)
                                        const today = new Date()
                                        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                                        const alertDays = product.alertBeforeValue || 30
                                        return daysUntilExpiry <= alertDays && daysUntilExpiry >= 0
                                      })()
                                    : false

                                  return (
                                    <button
                                      key={product.id}
                                      type="button"
                                      onClick={() => {
                                        if (isExpired) {
                                          showToast('Cannot add expired product to invoice', 'error')
                                          return
                                        }
                                        updateItem(index, 'productId', product.id.toString())
                                        closeProductDropdown(index)
                                        if (isNearExpiry) {
                                          showToast(`Warning: ${product.name} is expiring soon`, 'warning')
                                        }
                                      }}
                                      className={`w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none ${
                                        isOutOfStock || isExpired ? 'opacity-50 cursor-not-allowed' : ''
                                      }`}
                                      disabled={isOutOfStock || isExpired}
                                    >
                                      <div className="text-sm">
                                        <div className="font-medium text-gray-900 flex items-center justify-between">
                                          <span>{product.name}</span>
                                          {isExpired && (
                                            <span className="text-xs text-red-600 font-semibold">Expired</span>
                                          )}
                                          {isNearExpiry && !isExpired && (
                                            <span className="text-xs text-orange-600 font-semibold">Near Expiry</span>
                                          )}
                                          {isOutOfStock && !isExpired && (
                                            <span className="text-xs text-red-600 font-semibold">Out of Stock</span>
                                          )}
                                        </div>
                                        <div className="text-gray-500">₹{product.sellingPrice}</div>
                                        {availableStock !== null && (
                                          <div className={`text-xs mt-1 ${
                                            isOutOfStock || isExpired
                                              ? 'text-red-600' 
                                              : isLowStock || isNearExpiry
                                                ? 'text-yellow-600' 
                                                : 'text-green-600'
                                          }`}>
                                            Stock: {availableStock} {product.unit || 'units'}
                                            {isLowStock && !isOutOfStock && !isExpired && ' (Low Stock)'}
                                            {isNearExpiry && !isExpired && product.expiryDate && (
                                              <span> | Expires: {new Date(product.expiryDate).toLocaleDateString()}</span>
                                            )}
                                            {isExpired && product.expiryDate && (
                                              <span> | Expired: {new Date(product.expiryDate).toLocaleDateString()}</span>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </button>
                                  )
                                })
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Size/Color Selectors for RMG Products */}
                    {item.productId && productVariants[parseInt(item.productId)]?.length > 0 && (
                      <>
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Size
                          </label>
                          <select
                            value={item.size || ''}
                            onChange={(e) => {
                              const size = e.target.value
                              const productId = parseInt(item.productId)
                              const variants = productVariants[productId] || []
                              const variant = variants.find(v => v.size === size && v.color === (item.color || ''))
                              if (variant) {
                                updateItem(index, 'variantCombinationId', variant.id.toString())
                              } else {
                                const newItems = [...items]
                                newItems[index].size = size || undefined
                                setItems(newItems)
                              }
                            }}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                          >
                            <option value="">Select Size</option>
                            {[...new Set(productVariants[parseInt(item.productId)]?.map(v => v.size) || [])].map(size => (
                              <option key={size} value={size}>{size}</option>
                            ))}
                          </select>
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Color
                          </label>
                          <select
                            value={item.color || ''}
                            onChange={(e) => {
                              const color = e.target.value
                              const productId = parseInt(item.productId)
                              const variants = productVariants[productId] || []
                              const variant = variants.find(v => v.size === (item.size || '') && v.color === color)
                              if (variant) {
                                updateItem(index, 'variantCombinationId', variant.id.toString())
                              } else {
                                const newItems = [...items]
                                newItems[index].color = color || undefined
                                setItems(newItems)
                              }
                            }}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                          >
                            <option value="">Select Color</option>
                            {[...new Set(productVariants[parseInt(item.productId)]?.map(v => v.color) || [])].map(color => (
                              <option key={color} value={color}>{color}</option>
                            ))}
                          </select>
                        </div>
                        {item.variantCombinationId && (
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Variant Stock
                            </label>
                            <div className="px-2 py-1 text-sm bg-gray-50 border border-gray-200 rounded-md">
                              {(() => {
                                const variant = productVariants[parseInt(item.productId)]?.find(v => v.id === item.variantCombinationId)
                                return variant ? (
                                  <span className={variant.stockQuantity <= 0 ? 'text-red-600 font-medium' : variant.stockQuantity <= 5 ? 'text-yellow-600' : 'text-green-600'}>
                                    {variant.stockQuantity} available
                                  </span>
                                ) : '-'
                              })()}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Qty
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Price
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Discount
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.discountAmount}
                        onChange={(e) => updateItem(index, 'discountAmount', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                      />
                    </div>
                    <div className="sm:col-span-1">
                      <button
                        onClick={() => removeItem(index)}
                        className="mt-6 text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    Tax ({item.taxRate}%): ₹{item.taxAmount.toFixed(2)} | Total: ₹
                    {item.totalAmount.toFixed(2)}
                  </div>
                  {item.productId && (() => {
                    const product = products.find((p) => p.id === parseInt(item.productId))
                    if (product?.trackInventory && product.stockQuantity !== undefined) {
                      const availableStock = product.stockQuantity
                      const isLowStock = product.lowStockAlert !== undefined && availableStock <= product.lowStockAlert
                      const isInsufficient = item.quantity > availableStock
                      
                      return (
                        <div className={`mt-1 text-xs ${
                          isInsufficient 
                            ? 'text-red-600 font-semibold' 
                            : isLowStock 
                              ? 'text-yellow-600' 
                              : 'text-green-600'
                        }`}>
                          {isInsufficient ? (
                            <span>⚠️ Insufficient stock! Available: {availableStock} {product.unit || 'units'}</span>
                          ) : isLowStock ? (
                            <span>⚠️ Low stock: {availableStock} {product.unit || 'units'} remaining</span>
                          ) : (
                            <span>✓ Stock available: {availableStock} {product.unit || 'units'}</span>
                          )}
                        </div>
                      )
                    }
                    return null
                  })()}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Summary Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg p-4 sm:p-6 sticky top-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">₹{totals.subTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax</span>
                <span className="font-medium">₹{totals.taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Discount</span>
                <span className="font-medium">-₹{totals.discountAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Round Off</span>
                <span className="font-medium">₹{totals.roundOff.toFixed(2)}</span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>₹{totals.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Customer Info Summary */}
            {selectedCustomerData && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="text-xs font-semibold text-blue-900 mb-2">Customer Information</h3>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-blue-700">Type:</span>
                    <span className="font-medium">{selectedCustomerData.customerType}</span>
                  </div>
                  {selectedCustomerData.customerType === 'B2B' && (
                    <>
                      {selectedCustomerData.paymentTerms && (
                        <div className="flex justify-between">
                          <span className="text-blue-700">Payment Terms:</span>
                          <span className="font-medium">{selectedCustomerData.paymentTerms}</span>
                        </div>
                      )}
                      {selectedCustomerData.creditLimit > 0 && (
                        <div className="flex justify-between">
                          <span className="text-blue-700">Credit Available:</span>
                          <span className={`font-medium ${
                            (selectedCustomerData.creditLimit - selectedCustomerData.outstandingBalance) < totals.totalAmount
                              ? 'text-red-600'
                              : 'text-green-600'
                          }`}>
                            ₹{(selectedCustomerData.creditLimit - selectedCustomerData.outstandingBalance).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                  {selectedCustomerData.customerType === 'B2C' && selectedCustomerData.loyaltyPoints > 0 && (
                    <div className="flex justify-between">
                      <span className="text-blue-700">Loyalty Points:</span>
                      <span className="font-medium text-blue-600">{selectedCustomerData.loyaltyPoints.toFixed(0)} pts</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Stock Availability Summary */}
            {items.some(item => {
              if (!item.productId) return false
              const product = products.find((p) => p.id === parseInt(item.productId))
              return product?.trackInventory && product.stockQuantity !== undefined
            }) && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="text-xs font-semibold text-gray-700 mb-2">Stock Availability</h3>
                <div className="space-y-1">
                  {items.map((item, idx) => {
                    if (!item.productId) return null
                    const product = products.find((p) => p.id === parseInt(item.productId))
                    if (!product?.trackInventory || product.stockQuantity === undefined) return null
                    
                    const availableStock = product.stockQuantity
                    const isInsufficient = item.quantity > availableStock
                    const isLowStock = product.lowStockAlert !== undefined && availableStock <= product.lowStockAlert
                    
                    return (
                      <div key={idx} className={`text-xs flex justify-between ${
                        isInsufficient ? 'text-red-600 font-semibold' : isLowStock ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        <span>{product.name}:</span>
                        <span>
                          {isInsufficient ? (
                            <span>⚠️ Need {item.quantity}, Have {availableStock}</span>
                          ) : (
                            <span>✓ {availableStock} {product.unit || 'units'} available</span>
                          )}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="mt-6 space-y-3">
              <button
                onClick={() => handleSave('Draft')}
                disabled={loading || items.length === 0}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                <Save className="h-5 w-5 mr-2" />
                {isEditing ? 'Update Draft' : 'Save Draft'}
              </button>
              <button
                onClick={() => handleSave('Completed')}
                disabled={loading || items.length === 0}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
              >
                <Check className="h-5 w-5 mr-2" />
                {isEditing ? 'Update & Complete Invoice' : 'Complete Invoice'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4 overflow-y-auto" 
             onClick={(e) => {
               // Close any open dropdowns when clicking outside
               if (e.target === e.currentTarget) {
                 setProductDropdowns({})
               }
             }}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 my-4 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 sm:p-6 border-b flex-shrink-0">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Payment</h2>
              <button
                onClick={() => {
                  setShowPaymentModal(false)
                  // Invoice remains as Draft since payment was not completed
                  showToast('Invoice saved as Draft. You can complete payment later.', 'info')
                  navigate('/invoices')
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Total Amount</div>
                <div className="text-2xl font-bold text-gray-900">₹{totals.totalAmount.toFixed(2)}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Mode
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => {
                      setPaymentMode('Cash')
                      setShowQRScanner(false)
                    }}
                    className={`p-3 border-2 rounded-lg flex flex-col items-center ${
                      paymentMode === 'Cash'
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <Wallet className="h-6 w-6 mb-1" />
                    <span className="text-sm font-medium">Cash</span>
                  </button>
                  <button
                    onClick={() => {
                      setPaymentMode('UPI')
                      setShowQRScanner(true)
                      if (createdInvoice) {
                        generateQRCode(createdInvoice)
                      }
                    }}
                    className={`p-3 border-2 rounded-lg flex flex-col items-center ${
                      paymentMode === 'UPI'
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <QrCode className="h-6 w-6 mb-1" />
                    <span className="text-sm font-medium">UPI</span>
                  </button>
                  <button
                    onClick={() => {
                      setPaymentMode('Card')
                      setShowQRScanner(false)
                    }}
                    className={`p-3 border-2 rounded-lg flex flex-col items-center ${
                      paymentMode === 'Card'
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <CreditCard className="h-6 w-6 mb-1" />
                    <span className="text-sm font-medium">Card</span>
                  </button>
                </div>
              </div>
                <>
                  {paymentMode === 'UPI' && (
                    <div className="space-y-3">
                      {/* Payment Method Selection */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Payment Method
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              setPaymentRequestMode('receive')
                              setUpiId('')
                              if (createdInvoice) {
                                generateQRCode(createdInvoice)
                              }
                            }}
                            className={`p-3 border-2 rounded-lg text-sm font-medium ${
                              paymentRequestMode === 'receive'
                                ? 'border-primary-600 bg-primary-50 text-primary-700'
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                          >
                            Receive Payment
                            <div className="text-xs text-gray-500 mt-1">Customer scans QR</div>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPaymentRequestMode('request')
                              setQrCodeImage('')
                            }}
                            className={`p-3 border-2 rounded-lg text-sm font-medium ${
                              paymentRequestMode === 'request'
                                ? 'border-primary-600 bg-primary-50 text-primary-700'
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                          >
                            Request Payment
                            <div className="text-xs text-gray-500 mt-1">Enter customer UPI</div>
                          </button>
                        </div>
                      </div>

                      {paymentRequestMode === 'receive' && (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Scan QR Code to Pay
                            </label>
                          </div>
                          {showQRScanner && (
                            <div className="space-y-3">
                              {loadingQR ? (
                                <div className="flex justify-center items-center p-8 bg-gray-50 rounded-lg">
                                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                                </div>
                              ) : qrCodeImage ? (
                                <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                                  <img src={qrCodeImage} alt="UPI QR Code" className="w-48 h-48 mb-3" />
                                  <p className="text-xs text-gray-600 text-center">
                                    {tenantUPIId ? (
                                      <>Scan this QR code with any UPI app to pay ₹{totals.totalAmount.toFixed(2)} to {tenantUPIId}</>
                                    ) : (
                                      <>Scan this QR code with any UPI app to pay ₹{totals.totalAmount.toFixed(2)}</>
                                    )}
                                  </p>
                                  {!tenantUPIId && (
                                    <p className="text-xs text-red-600 text-center mt-1">
                                      Please set store UPI ID in tenant settings
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <div className="p-4 bg-gray-50 rounded-lg text-center text-sm text-gray-500">
                                  {tenantUPIId ? 'QR Code will be generated here' : 'Please set store UPI ID in tenant settings'}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {paymentRequestMode === 'request' && (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Enter Customer UPI ID
                            </label>
                            <input
                              type="text"
                              placeholder="Enter customer UPI ID (e.g., customer@paytm)"
                              value={upiId}
                              onChange={(e) => {
                                setUpiId(e.target.value)
                                if (e.target.value && createdInvoice) {
                                  generateQRCode(createdInvoice, e.target.value)
                                } else {
                                  setQrCodeImage('')
                                }
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Enter customer's UPI ID to request payment
                            </p>
                          </div>
                          {upiId && qrCodeImage && (
                            <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                              <img src={qrCodeImage} alt="UPI Payment Request" className="w-48 h-48 mb-3" />
                              <p className="text-xs text-gray-600 text-center">
                                Customer can scan this to pay ₹{totals.totalAmount.toFixed(2)} from {upiId}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      <input
                        type="text"
                        placeholder="Transaction ID (optional)"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  )}

                  {paymentMode === 'Card' && (
                    <div>
                      <input
                        type="text"
                        placeholder="Card Last 4 digits (optional)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  )}
                </>

            </div>
            
            {/* Sticky Footer with Action Buttons */}
            <div className="border-t bg-white p-4 sm:p-6 flex-shrink-0 sticky bottom-0 z-10">
              <div className="flex flex-row gap-3">
                <button
                  onClick={() => {
                    setShowPaymentModal(false)
                    // Invoice remains as Draft since payment was not completed
                    showToast('Invoice saved as Draft. You can complete payment later.', 'info')
                    navigate('/invoices')
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  Skip Payment
                </button>
                <button
                  onClick={handlePaymentComplete}
                  className="flex-1 px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors"
                >
                  Complete Payment
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

export default CreateInvoice

