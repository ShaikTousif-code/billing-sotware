import { useState } from 'react'
import { Upload, FileText, CheckCircle, XCircle, Loader, MapPin, Settings } from 'lucide-react'
import api from '../services/api'
import { useToast } from '../hooks/useToast'

interface ExtractedProduct {
  name: string
  quantity: number
  unitPrice: number
  totalPrice: number
  hsnCode?: string
  description?: string
  // Enhanced fields for purchase invoice processing
  unit?: string
  mrp?: number
  gstPercent?: number
  batchNo?: string
  expiryDate?: string
  manufacturer?: string
  sellingPrice?: number
  // Detection metadata
  confidence?: number
  isExistingProduct?: boolean
  existingProductId?: number
  matchedProductName?: string
  matchConfidence?: number
}

interface BulkProductData {
  id?: number
  name: string
  sku?: string
  hsnCode?: string
  description?: string
  categoryId?: number
  costPrice: number
  sellingPrice?: number
  mrp?: number
  taxRate?: number
  taxType?: string
  stockQuantity?: number
  lowStockAlert?: number
  unit?: string
  type: 'Product' | 'Service'
  isActive: boolean
  trackInventory: boolean
  // Enhanced purchase invoice fields
  batchNo?: string
  expiryDate?: string
  manufacturer?: string
  // Duplicate detection
  isExistingProduct?: boolean
  existingProductId?: number
  matchedProductName?: string
  matchConfidence?: number
  // Bill-specific data
  quantity: number
  totalPrice: number
}

interface ProductCategory {
  id: number
  name: string
  description?: string
}

interface ScannedBillData {
  supplierName?: string
  billNumber?: string
  billDate?: string
  products: ExtractedProduct[]
  totalAmount?: number
}

interface MappingSuggestion {
  sourceField: string
  suggestedTargetField: string
  detectedValue: string
  confidence: number
  alternativeMappings: string[]
}

interface RawProductLine {
  lineNumber: number
  rawText: string
  parts: string[]
  detectedFields: Record<string, string>
  isLikelyProductLine: boolean
  confidence: number
}

interface BillHeader {
  rawText: string
  lines: string[]
  detectedFields: Record<string, string>
}

interface BillFooter {
  rawText: string
  lines: string[]
  detectedFields: Record<string, string>
}

interface RawBillData {
  rawText: string
  textLines: string[]
  header: BillHeader
  productLines: RawProductLine[]
  footer: BillFooter
  detectedFields: Record<string, any>
  fieldMappings: MappingSuggestion[]
  ocrConfidence: number
  columnMapping?: Record<number, string>
  headerLineIndex?: number
}

const BillScanner = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [scannedData, setScannedData] = useState<ScannedBillData | null>(null)
  const [rawBillData, setRawBillData] = useState<RawBillData | null>(null)
  const [isCreatingProducts, setIsCreatingProducts] = useState(false)
  const [showRawData, setShowRawData] = useState(false)
  const [fieldMappings, setFieldMappings] = useState<Record<string, string>>({})
  const [bulkProducts, setBulkProducts] = useState<BulkProductData[]>([])
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [showBulkEdit, setShowBulkEdit] = useState(false)
  const [detectedColumns, setDetectedColumns] = useState<string[]>([])
  const [columnMappings, setColumnMappings] = useState<Record<string, string>>({})
  const [showColumnMapping, setShowColumnMapping] = useState(false)
  const [productLinesForMapping, setProductLinesForMapping] = useState<any[]>([])
  const { showToast, ToastContainer } = useToast()

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
      if (!allowedTypes.includes(file.type)) {
        showToast('Please select a valid image file (JPEG, PNG) or PDF', 'error')
        return
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        showToast('File size should be less than 10MB', 'error')
        return
      }

      setSelectedFile(file)
      setScannedData(null)
    }
  }

  const handleScan = async () => {
    if (!selectedFile) return

    setIsProcessing(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      // Extract raw data first
      const rawResponse = await api.post('/bill-scanner/extract-raw', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setRawBillData(rawResponse.data)

      // Also get structured data
      const structuredResponse = await api.post('/bill-scanner/scan', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setScannedData(structuredResponse.data)

      showToast('Bill scanned successfully! Review raw data and mappings.', 'success')
    } catch (error: any) {
      console.error('Error scanning bill:', error)
      const message = error.response?.data?.message || 'Failed to scan bill. Please try again.'
      showToast(message, 'error')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCreateProducts = async () => {
    if (!scannedData?.products?.length) return

    setIsCreatingProducts(true)
    try {
      const response = await api.post('/bill-scanner/create-products', {
        products: scannedData?.products || [],
        supplierName: scannedData.supplierName,
        billNumber: scannedData.billNumber,
        billDate: scannedData.billDate
      })

      showToast(`Successfully created ${response.data.createdCount} products!`, 'success')
      setScannedData(null)
      setSelectedFile(null)
    } catch (error: any) {
      console.error('Error creating products:', error)
      const message = error.response?.data?.message || 'Failed to create products. Please try again.'
      showToast(message, 'error')
    } finally {
      setIsCreatingProducts(false)
    }
  }

  const updateProduct = (index: number, field: keyof ExtractedProduct, value: string | number) => {
    if (!scannedData) return

    const updatedProducts = [...scannedData.products]
    updatedProducts[index] = { ...updatedProducts[index], [field]: value }
    setScannedData({ ...scannedData, products: updatedProducts })
  }

  const removeProduct = (index: number) => {
    if (!scannedData) return

    const updatedProducts = scannedData.products.filter((_, i) => i !== index)
    setScannedData({ ...scannedData, products: updatedProducts })
  }

  const updateFieldMapping = (sourceField: string, targetField: string) => {
    setFieldMappings(prev => ({
      ...prev,
      [sourceField]: targetField
    }))
  }

  // Helper function to extract unit from text
  const extractUnitFromText = (text: string): string => {
    const unitPatterns = [
      /\b(kg|kgs|kilogram|kilograms|kilo|kilos|g|grams|gram|l|liters|liter|litres|litre|ml|milliliters|milliliter|pcs|pieces|piece|pc|box|boxes|pack|packs|packet|packets|dozen|dozens|strip|strips|tablet|tablets|capsule|capsules|unit|units)\b/gi
    ]

    for (const pattern of unitPatterns) {
      const match = text.match(pattern)
      if (match) {
        return match[0].toUpperCase()
      }
    }
    return 'PCS' // Default unit
  }

  // Helper function to extract manufacturer from text
  const extractManufacturer = (text: string): string | undefined => {
    // Common manufacturer patterns - this could be enhanced with a database
    const manufacturerPatterns = [
      /\b(cip|bayer|pfizer|cipla|ranbaxy|dr\.? reddy|sun pharma|glaxo|novartis|abbott|johnson|merck)\b/gi
    ]

    for (const pattern of manufacturerPatterns) {
      const match = text.match(pattern)
      if (match) {
        return match[0]
      }
    }
    return undefined
  }

  // Function to check for duplicate products using fuzzy matching
  const checkForDuplicateProducts = async (products: ExtractedProduct[]): Promise<ExtractedProduct[]> => {
    try {
      // Fetch existing products for comparison
      const response = await api.get('/products')
      const existingProducts = response.data

      return products.map(product => {
        // Simple fuzzy matching - look for products with similar names
        const matches = existingProducts.filter((existing: any) => {
          const similarity = calculateStringSimilarity(
            product.name.toLowerCase(),
            existing.name.toLowerCase()
          )
          return similarity > 0.8 // 80% similarity threshold
        })

        if (matches.length > 0) {
          const bestMatch = matches[0]
          return {
            ...product,
            isExistingProduct: true,
            existingProductId: bestMatch.id,
            matchedProductName: bestMatch.name,
            matchConfidence: calculateStringSimilarity(
              product.name.toLowerCase(),
              bestMatch.name.toLowerCase()
            )
          }
        }

        return {
          ...product,
          isExistingProduct: false
        }
      })
    } catch (error) {
      console.error('Error checking for duplicate products:', error)
      // Return products as-is if duplicate check fails
      return products.map(p => ({ ...p, isExistingProduct: false }))
    }
  }

  // Simple string similarity calculation (Levenshtein distance based)
  const calculateStringSimilarity = (str1: string, str2: string): number => {
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1

    if (longer.length === 0) return 1.0

    const distance = levenshteinDistance(longer, shorter)
    return (longer.length - distance) / longer.length
  }

  // Levenshtein distance calculation
  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix = []

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          )
        }
      }
    }

    return matrix[str2.length][str1.length]
  }

  const parseQuantityWithUnits = (quantityStr: string): number => {
    if (!quantityStr) return 1

    // Remove commas and extra spaces
    const cleanStr = quantityStr.replace(/,/g, '').trim()

    // Match patterns like "10 kg", "5.5kg", "100 grams", "2.5 liters", etc.
    const unitPatterns = [
      /(\d+(?:\.\d+)?)\s*(kg|kgs|kilogram|kilograms|kilo|kilos)/i,
      /(\d+(?:\.\d+)?)\s*(g|grams|gram)/i,
      /(\d+(?:\.\d+)?)\s*(l|liters|liter|litres|litre)/i,
      /(\d+(?:\.\d+)?)\s*(ml|milliliters|milliliter)/i,
      /(\d+(?:\.\d+)?)\s*(pcs|pieces|piece|pc)/i,
      /(\d+(?:\.\d+)?)\s*(box|boxes)/i,
      /(\d+(?:\.\d+)?)\s*(pack|packs|packet|packets)/i,
      /(\d+(?:\.\d+)?)\s*(dozen|dozens)/i,
      /(\d+(?:\.\d+)?)\s*(kg\.|kgs\.|g\.|l\.|ml\.)/i
    ]

    for (const pattern of unitPatterns) {
      const match = cleanStr.match(pattern)
      if (match) {
        const quantity = parseFloat(match[1])
        const unit = match[2].toLowerCase()

        // Convert different units to base units
        switch (unit) {
          case 'kg':
          case 'kgs':
          case 'kilogram':
          case 'kilograms':
          case 'kilo':
          case 'kilos':
          case 'kg.':
          case 'kgs.':
            return quantity // kg is already a good base unit

          case 'g':
          case 'grams':
          case 'gram':
          case 'g.':
            return quantity / 1000 // convert grams to kg

          case 'l':
          case 'liters':
          case 'liter':
          case 'litres':
          case 'litre':
          case 'l.':
            return quantity // liters can be kept as is for liquids

          case 'ml':
          case 'milliliters':
          case 'milliliter':
          case 'ml.':
            return quantity / 1000 // convert ml to liters

          default:
            return quantity // for pcs, boxes, etc., keep as is
        }
      }
    }

    // If no units found, try to parse as plain number
    const parsed = parseFloat(cleanStr)
    return isNaN(parsed) ? 1 : parsed
  }

  const applySequentialMappings = async () => {
    if (!rawBillData || !scannedData) return

    const mappedProducts = rawBillData.productLines
      .filter(line => line.isLikelyProductLine)
      .map(line => {
        // Parse the raw text by splitting on spaces/tabs to get ALL columns
        const columns = line.rawText
          .split(/[\s\t]+/)
          .map(col => col.trim())
          .filter(col => col.length > 0)

        console.log('Raw line:', line.rawText)
        console.log('Columns:', columns)

        // Extract all numeric values and identify their types
        const numericValues = columns
          .map(col => col.replace(/[,₹$€£]/g, ''))
          .filter(col => /^\d+\.?\d*$/.test(col))
          .map(val => parseFloat(val))

        // Extract GST percentage from text
        const gstMatch = line.rawText.match(/(\d+(?:\.\d+)?)\s*%/i)
        const gstPercent = gstMatch ? parseFloat(gstMatch[1]) : undefined

        // Extract expiry date patterns
        const expiryPatterns = [
          /(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/, // DD/MM/YYYY, MM/DD/YYYY
          /(\d{2,4}[-\/]\d{1,2}[-\/]\d{1,2})/, // YYYY/MM/DD
          /(exp|expiry|exp\.?)\s*[:\-]?\s*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i
        ]
        let expiryDate: string | undefined
        for (const pattern of expiryPatterns) {
          const match = line.rawText.match(pattern)
          if (match) {
            expiryDate = match[1] || match[2]
            break
          }
        }

        // Extract batch number patterns
        const batchPatterns = [
          /(batch|lot|b\.?no|lot\.?no)\s*[:\-]?\s*([A-Za-z0-9\-]+)/i,
          /(batch|lot|b\.?no|lot\.?no)\s*([A-Za-z0-9\-]+)/i
        ]
        let batchNo: string | undefined
        for (const pattern of batchPatterns) {
          const match = line.rawText.match(pattern)
          if (match) {
            batchNo = match[2] || match[1]
            break
          }
        }

        // Enhanced positional mapping with intelligent field detection
        const product: ExtractedProduct = {
          name: columns[0] || line.rawText, // First column = product name
          quantity: parseQuantityWithUnits(columns[1]) || numericValues[0] || 1, // Quantity with units or first number
          unitPrice: numericValues[0] || 0, // First numeric = unit price (cost price)
          totalPrice: numericValues[1] || numericValues[0] || 0, // Second numeric = total price
          unit: extractUnitFromText(line.rawText), // Extract unit from text
          mrp: numericValues[2] || undefined, // Third numeric might be MRP
          gstPercent: gstPercent, // GST percentage
          batchNo: batchNo, // Batch number
          expiryDate: expiryDate, // Expiry date
          manufacturer: extractManufacturer(line.rawText), // Try to extract manufacturer
          hsnCode: columns.find(col => /^\d{4,8}$/.test(col)) || '', // HSN code pattern
          description: line.rawText, // Keep full raw text as description
          confidence: line.confidence || 0.5 // OCR confidence
        }

        console.log('Mapped product:', product)
        return product
      })

    // Check for duplicate products
    const productsWithDuplicates = await checkForDuplicateProducts(mappedProducts)

    setScannedData({
      ...scannedData,
      products: productsWithDuplicates
    })

    setShowRawData(false)
    showToast(`Field mappings applied! ${productsWithDuplicates.length} products ready for editing.`, 'success')
  }

  const fetchCategories = async () => {
    try {
      const response = await api.get('/products/categories')
      setCategories(response.data)
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const convertToBulkProducts = (products: ExtractedProduct[]): BulkProductData[] => {
    return products.map(product => ({
      name: product.name,
      sku: '',
      hsnCode: product.hsnCode || '',
      description: product.description || '',
      categoryId: undefined,
      costPrice: product.unitPrice,
      sellingPrice: product.sellingPrice || (product.mrp ? product.mrp * 0.9 : product.unitPrice * 1.2), // Use MRP if available, otherwise default markup
      mrp: product.mrp,
      taxRate: product.gstPercent || 18, // Use extracted GST or default
      taxType: 'GST',
      stockQuantity: Math.round(product.quantity),
      lowStockAlert: Math.round(product.quantity * 0.2), // 20% of purchase quantity
      unit: product.unit || 'PCS',
      type: 'Product' as const,
      isActive: true,
      trackInventory: true,
      // Enhanced purchase invoice fields
      batchNo: product.batchNo,
      expiryDate: product.expiryDate,
      manufacturer: product.manufacturer,
      // Duplicate detection data
      isExistingProduct: product.isExistingProduct,
      existingProductId: product.existingProductId,
      matchedProductName: product.matchedProductName,
      matchConfidence: product.matchConfidence,
      // Bill-specific data
      quantity: product.quantity,
      totalPrice: product.totalPrice
    }))
  }

  const prepareBulkProducts = () => {
    console.log('prepareBulkProducts called')
    console.log('scannedData:', scannedData)
    console.log('rawBillData:', rawBillData)

    // Try to get products from scannedData first, then fall back to rawBillData
    let products: ExtractedProduct[] = []

    if (scannedData?.products && scannedData.products.length > 0) {
      console.log('Using scannedData.products:', scannedData.products)
      products = scannedData.products
    } else if (rawBillData?.productLines) {
      console.log('Using rawBillData.productLines:', rawBillData.productLines)
      // Convert raw product lines to extracted products
      products = rawBillData.productLines
        .filter(line => line.isLikelyProductLine)
        .map(line => ({
          name: line.detectedFields.name || line.rawText,
          quantity: parseQuantityWithUnits(line.detectedFields.quantity),
          unitPrice: parseFloat(line.detectedFields.unitPrice?.replace(/,/g, '')) || 0,
          totalPrice: parseFloat(line.detectedFields.totalPrice?.replace(/,/g, '')) || 0,
          hsnCode: line.detectedFields.hsnCode,
          description: line.rawText
        }))
      console.log('Converted products:', products)
    }

    console.log('Final products array:', products)

    if (products.length === 0) {
      showToast('No products found to edit. Please apply field mappings first.', 'warning')
      return
    }

    const bulkData = convertToBulkProducts(products)
    console.log('Bulk data:', bulkData)
    setBulkProducts(bulkData)
    setShowBulkEdit(true)
    fetchCategories()
    showToast(`Loaded ${bulkData.length} products for bulk editing.`, 'success')
  }

  const updateBulkProduct = (index: number, field: keyof BulkProductData, value: any) => {
    const updatedProducts = [...bulkProducts]
    updatedProducts[index] = { ...updatedProducts[index], [field]: value }
    setBulkProducts(updatedProducts)
  }

  const addNewBulkProduct = () => {
    const newProduct: BulkProductData = {
      name: '',
      sku: '',
      hsnCode: '',
      description: '',
      categoryId: undefined,
      costPrice: 0,
      sellingPrice: 0,
      taxRate: 18,
      taxType: 'GST',
      stockQuantity: 0,
      lowStockAlert: 10,
      unit: 'PCS',
      type: 'Product',
      isActive: true,
      trackInventory: true,
      quantity: 1,
      totalPrice: 0
    }
    setBulkProducts([...bulkProducts, newProduct])
  }

  const removeBulkProduct = (index: number) => {
    const updatedProducts = bulkProducts.filter((_, i) => i !== index)
    setBulkProducts(updatedProducts)
  }

  const quickCreateProducts = async () => {
    if (!scannedData || !scannedData.products) return

    setIsCreatingProducts(true)
    try {
      // Filter out products with negative quantity (allow 0 quantity for products, but skip for invoices)
      const validProducts = scannedData.products.filter(product => product.quantity >= 0)

      if (validProducts.length === 0) {
        showToast('No products with valid quantity found. Products with negative quantity cannot be processed.', 'error')
        return
      }

      // Filter out products with 0 quantity for invoice generation
      const invoiceProducts = validProducts.filter(product => product.quantity > 0)

      if (invoiceProducts.length === 0) {
        showToast('No products with quantity > 0 found. Cannot generate invoice with 0 quantity products.', 'error')
        return
      }

      if (invoiceProducts.length < validProducts.length) {
        const skippedCount = validProducts.length - invoiceProducts.length
        showToast(`${skippedCount} products with 0 quantity were skipped from invoice generation.`, 'warning')
      }

      // Convert scanned products to bulk product format (only products with quantity > 0 for invoice generation)
      const bulkProductsData = invoiceProducts.map(product => ({
        name: product.name,
        sku: '', // Will be auto-generated
        hsnCode: product.hsnCode || '',
        description: product.description || '',
        categoryId: undefined,
        costPrice: product.unitPrice,
        sellingPrice: product.unitPrice * 1.2, // Default 20% markup
        mrp: product.mrp,
        taxRate: product.gstPercent || 18, // Use detected GST or default
        taxType: 'GST',
        stockQuantity: Math.round(product.quantity), // Use detected quantity as initial stock
        lowStockAlert: Math.round(product.quantity * 0.2), // 20% of quantity
        unit: product.unit || 'PCS',
        type: 'Product' as const,
        isActive: true,
        trackInventory: true,
        // Enhanced purchase invoice fields
        batchNo: product.batchNo,
        expiryDate: product.expiryDate,
        manufacturer: product.manufacturer,
        purchaseQuantity: product.quantity,
        purchaseTotalPrice: product.totalPrice
      }))

      // Prepare bill data
      const billData = {
        supplierName: scannedData.supplierName,
        billNumber: scannedData.billNumber,
        billDate: scannedData.billDate,
        totalAmount: scannedData.totalAmount,
        products: bulkProductsData
      }

      const response = await api.post('/bill-scanner/create-products-bulk', billData)

      // Check for partial success (some products created, some failed)
      if (response.status === 207) {
        const { createdCount, errors } = response.data
        showToast(`Created ${createdCount} products. ${errors?.length || 0} failed.`, errors?.length > 0 ? 'warning' : 'success')

        if (errors && errors.length > 0) {
          console.error('Product creation errors:', errors)
        }
      } else {
        showToast(`Successfully created ${response.data.createdCount || scannedData?.products?.length || 0} products!`, 'success')
      }

      // Reset the scanner state
      setScannedData(null)
      setBulkProducts([])
      setShowBulkEdit(false)
      setSelectedFile(null)
      setShowRawData(false)
      setShowColumnMapping(false)

    } catch (error: any) {
      console.error('Error creating products:', error)
      const message = error.response?.data?.message || 'Failed to create products. Please try again.'
      showToast(message, 'error')
      setIsCreatingProducts(false) // Reset loading state on error
    }
  }

  const detectColumns = () => {
    if (!rawBillData?.rawText) return

    // Get all product lines for analysis
    const allProductLines = rawBillData.productLines.filter(line => line.rawText.trim().length > 0)

    // Split text into lines and find potential column headers
    const lines = rawBillData.rawText.split('\n').map(line => line.trim()).filter(line => line.length > 0)

    // Look for lines that might contain column headers (typically shorter lines with multiple words)
    const potentialHeaders = lines.filter(line => {
      const words = line.split(/\s+/).filter(word => word.length > 0)
      return words.length >= 2 && words.length <= 8 && line.length < 100
    })

    let detectedCols: string[] = []

    if (potentialHeaders.length > 0) {
      // Use detected headers
      detectedCols = potentialHeaders[0].split(/\s+/).filter(word => word.length > 0)
    } else {
      // Fallback: analyze the first few product lines to detect column patterns
      const productLines = allProductLines
        .filter(line => line.isLikelyProductLine)
        .slice(0, 5) // First 5 product lines for better analysis

      if (productLines.length >= 2) {
        // Analyze column patterns by comparing multiple lines
        const lineColumns = productLines.map(line =>
          line.rawText.split(/\s+/).filter(word => word.length > 0)
        )

        // Find the most common column count
        const columnCounts = lineColumns.map(cols => cols.length)
        const avgColumnCount = Math.round(columnCounts.reduce((a, b) => a + b, 0) / columnCounts.length)

        // Create column labels based on detected patterns
        detectedCols = Array.from({ length: Math.min(avgColumnCount, 6) }, (_, i) => `Column ${i + 1}`)
      } else {
        // Basic fallback for single line
        detectedCols = ['Column 1', 'Column 2', 'Column 3', 'Column 4']
      }
    }

    setDetectedColumns(detectedCols)
    // Store product lines for use in the mapping interface
    setProductLinesForMapping(allProductLines)

    // Initialize column mappings
    const initialMappings: Record<string, string> = {}
    setColumnMappings(initialMappings)
    setShowColumnMapping(true)
  }

  const updateColumnMapping = (columnIndex: number, targetField: string) => {
    const columnName = detectedColumns[columnIndex]
    const updatedMappings = { ...columnMappings }

    // Remove previous mapping for this target field
    Object.keys(updatedMappings).forEach(key => {
      if (updatedMappings[key] === targetField) {
        delete updatedMappings[key]
      }
    })

    // Add new mapping
    updatedMappings[columnName] = targetField
    setColumnMappings(updatedMappings)
  }

  const applyColumnMappings = () => {
    if (!rawBillData || !scannedData) return

    // Validate that at least name field is mapped
    const mappedFields = Object.values(columnMappings)
    if (!mappedFields.includes('name')) {
      showToast('Please map at least one column to "Product Name" field.', 'error')
      return
    }

    // Get all product lines, including those that might not be marked as likely
    const allProductLines = rawBillData.productLines.filter(line => line.rawText.trim().length > 0)

    console.log('Total product lines found:', allProductLines.length)
    console.log('Product lines:', allProductLines.map(line => ({
      text: line.rawText,
      isLikely: line.isLikelyProductLine,
      lineNumber: line.lineNumber
    })))

    const mappedProducts = allProductLines
      .map((line, lineIndex) => {
        // Split line into columns
        const columns = line.rawText.split(/\s+/).filter(col => col.length > 0)

        console.log(`Processing line ${line.lineNumber} (index ${lineIndex}):`, line.rawText)
        console.log('Columns:', columns)

        // Initialize product with defaults
        const product: ExtractedProduct = {
          name: columns[0] || line.rawText, // Default to first column
          quantity: 1,
          unitPrice: 0,
          totalPrice: 0,
          hsnCode: '',
          description: line.rawText
        }

        // Apply user-defined mappings with flexible column handling
        detectedColumns.forEach((columnName, columnIndex) => {
          const targetField = columnMappings[columnName]
          if (targetField && targetField !== 'skip') {
            // Handle cases where lines have fewer columns than detected headers
            const rawValue = columns[columnIndex] || columns[Math.min(columnIndex, columns.length - 1)] || ''
            const cleanValue = rawValue.replace(/[,₹$€£]/g, '') // Clean currency symbols

            console.log(`Line ${lineIndex} - Mapping column ${columnIndex} (${columnName}) to ${targetField}: "${rawValue}" -> "${cleanValue}"`)

            if (rawValue && rawValue.trim()) {
              switch (targetField) {
                case 'name':
                  product.name = rawValue
                  break
                case 'quantity':
                  product.quantity = parseQuantityWithUnits(rawValue) || parseFloat(cleanValue) || 1
                  break
                case 'unitPrice':
                  const priceValue = parseFloat(cleanValue)
                  if (!isNaN(priceValue) && priceValue > 0) {
                    product.unitPrice = priceValue
                  }
                  break
                case 'totalPrice':
                  const totalValue = parseFloat(cleanValue)
                  if (!isNaN(totalValue) && totalValue > 0) {
                    product.totalPrice = totalValue
                  }
                  break
                case 'hsnCode':
                  product.hsnCode = rawValue
                  break
              }
            }
          }
        })

        // Enhanced fallback: if no unitPrice found but we have numeric values, try to extract prices
        if (product.unitPrice === 0 && columns.length > 0) {
          const numericValues = columns
            .map(col => col.replace(/[,₹$€£]/g, ''))
            .filter(col => /^\d+\.?\d*$/.test(col))
            .map(val => parseFloat(val))
            .filter(val => !isNaN(val) && val > 0)
            .sort((a, b) => b - a) // Sort descending to prefer larger values for prices

          console.log(`Line ${lineIndex} - Fallback numeric values:`, numericValues)

          if (numericValues.length >= 1) {
            product.unitPrice = numericValues[0] // Largest number as unit price
          }
          if (numericValues.length >= 2) {
            product.totalPrice = numericValues[1] // Second largest as total
          }
        }

        // If still no unit price, try to extract any number from the entire line
        if (product.unitPrice === 0) {
          const allNumbers = line.rawText.match(/\d+(?:,\d+)*(?:\.\d+)?/g)
          if (allNumbers) {
            const parsedNumbers = allNumbers
              .map(num => parseFloat(num.replace(/,/g, '')))
              .filter(num => !isNaN(num) && num > 0)
              .sort((a, b) => b - a)

            console.log(`Line ${lineIndex} - Last resort numbers from line:`, parsedNumbers)

            if (parsedNumbers.length > 0) {
              product.unitPrice = parsedNumbers[0]
              if (parsedNumbers.length > 1) {
                product.totalPrice = parsedNumbers[1]
              }
            }
          }
        }

        // Set default unit price if still zero (for products that must be added)
        if (product.unitPrice === 0) {
          product.unitPrice = 1 // Default minimum price
          console.log(`Line ${lineIndex} - Setting default unit price of 1`)
        }

        console.log(`Line ${lineIndex} - Final product:`, product)
        return product
      })
      // Less restrictive filtering - only filter out completely empty products
      .filter(product => product.name && product.name.trim().length > 0)

    // Check for duplicates and set products
    checkForDuplicateProducts(mappedProducts).then(productsWithDuplicates => {
      console.log('All mapped products:', productsWithDuplicates)
      console.log('Products summary:', productsWithDuplicates.map((p, i) => ({
        index: i,
        name: p.name,
        quantity: p.quantity,
        unitPrice: p.unitPrice,
        totalPrice: p.totalPrice
      })))

      setScannedData({
        ...scannedData,
        products: productsWithDuplicates
      })
      setShowRawData(false)
      setShowColumnMapping(false)
      showToast(`Column mappings applied! ${productsWithDuplicates.length} products ready for editing.`, 'success')
    })
  }

  const testHeaderDetection = async () => {
    if (!rawBillData?.rawText) return

    try {
      const response = await api.post('/bill-scanner/test-headers', {
        text: rawBillData.rawText
      })

      console.log('Header detection test results:', response.data)
      showToast('Header detection test completed. Check console for results.', 'info')
    } catch (error: any) {
      console.error('Error testing header detection:', error)
      showToast('Error testing header detection', 'error')
    }
  }

  const saveBulkProducts = async () => {
    if (!scannedData) return

    setIsCreatingProducts(true)
    try {
      // Separate new products from existing products
      const newProducts = bulkProducts.filter(p => !p.isExistingProduct)
      const existingProducts = bulkProducts.filter(p => p.isExistingProduct)

      let totalCreated = 0
      let totalUpdated = 0
      const errors: string[] = []

      // Create new products
      if (newProducts.length > 0) {
        const newProductsData = {
          supplierName: scannedData.supplierName,
          billNumber: scannedData.billNumber,
          billDate: scannedData.billDate,
          totalAmount: scannedData.totalAmount,
          products: newProducts.map(p => ({
            name: p.name,
            sku: p.sku,
            hsnCode: p.hsnCode,
            description: p.description,
            categoryId: p.categoryId,
            costPrice: p.costPrice,
            sellingPrice: p.sellingPrice,
            mrp: p.mrp,
            taxRate: p.taxRate,
            taxType: p.taxType,
            stockQuantity: p.stockQuantity,
            lowStockAlert: p.lowStockAlert,
            unit: p.unit,
            type: p.type,
            isActive: p.isActive,
            trackInventory: p.trackInventory,
            batchNo: p.batchNo,
            expiryDate: p.expiryDate,
            manufacturer: p.manufacturer,
            // Purchase invoice specific
            purchaseQuantity: p.quantity,
            purchaseTotalPrice: p.totalPrice
          }))
        }

        try {
          const response = await api.post('/bill-scanner/create-products-bulk', newProductsData)
          totalCreated = response.data.createdCount || newProducts.length
        } catch (error: any) {
          const message = error.response?.data?.message || 'Failed to create new products'
          errors.push(message)
        }
      }

      // Update existing products
      if (existingProducts.length > 0) {
        for (const product of existingProducts) {
          try {
            const updateData = {
              id: product.existingProductId,
              costPrice: product.costPrice,
              sellingPrice: product.sellingPrice,
              mrp: product.mrp,
              taxRate: product.taxRate,
              taxType: product.taxType,
              stockQuantity: product.stockQuantity, // Add to existing stock
              lowStockAlert: product.lowStockAlert,
              unit: product.unit,
              batchNo: product.batchNo,
              expiryDate: product.expiryDate,
              manufacturer: product.manufacturer,
              // Update purchase info
              lastPurchasePrice: product.costPrice,
              lastPurchaseQuantity: product.quantity,
              lastPurchaseDate: scannedData.billDate,
              supplierName: scannedData.supplierName
            }

            await api.put(`/products/${product.existingProductId}?billDate=${encodeURIComponent(scannedData.billDate || '')}&supplierName=${encodeURIComponent(scannedData.supplierName || '')}`, updateData)
            totalUpdated++
          } catch (error: any) {
            const message = `Failed to update ${product.name}: ${error.response?.data?.message || error.message}`
            errors.push(message)
          }
        }
      }

      // Save invoice data for reference
      try {
        const invoiceData = {
          supplierName: scannedData.supplierName,
          billNumber: scannedData.billNumber,
          billDate: scannedData.billDate,
          totalAmount: scannedData.totalAmount,
          ocrText: rawBillData?.rawText,
          processedProducts: bulkProducts.length,
          newProducts: totalCreated,
          updatedProducts: totalUpdated,
          fileName: selectedFile?.name,
          fileSize: selectedFile?.size
        }

        await api.post('/bill-scanner/save-invoice', invoiceData)
      } catch (error) {
        console.warn('Failed to save invoice data:', error)
        // Don't show error for invoice saving failure
      }

      const successMessage = `Successfully processed products: ${totalCreated} created, ${totalUpdated} updated${errors.length > 0 ? ` (${errors.length} errors)` : ''}`
      showToast(successMessage, errors.length > 0 ? 'warning' : 'success')

      if (errors.length > 0) {
        console.error('Product processing errors:', errors)
      }

      setScannedData(null)
      setBulkProducts([])
      setShowBulkEdit(false)
      setSelectedFile(null)
    } catch (error: any) {
      console.error('Error processing products:', error)
      const message = error.response?.data?.message || 'Failed to process products. Please try again.'
      showToast(message, 'error')
    } finally {
      setIsCreatingProducts(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bill Scanner</h1>
          <p className="mt-1 text-sm text-gray-500">
            Upload purchase bill images to automatically extract and create products
          </p>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Tips for better OCR results:</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Use high-resolution, clear images</li>
                <li>Ensure good lighting when taking photos</li>
                <li>Keep the bill flat and avoid shadows</li>
                <li>Supported formats: JPEG, PNG (PDF support coming soon)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* File Upload Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Bill Image or PDF
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500"
                  >
                    <span>Upload a file</span>
                          <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            className="sr-only"
                            accept="image/jpeg,image/png,image/jpg"
                            onChange={handleFileSelect}
                          />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
              </div>
            </div>
          </div>

          {selectedFile && (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-sm text-gray-900">{selectedFile.name}</span>
                <span className="text-xs text-gray-500 ml-2">
                  ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
              <button
                onClick={handleScan}
                disabled={isProcessing}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Processing with OCR...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Scan Bill with OCR
                  </>
                )}
              </button>
            </div>
          )}
        </div>

      {/* Scanned Data Review Section */}
      {scannedData && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-medium text-gray-900">
              Products Detected ({scannedData?.products?.length || 0})
            </h2>
            <div className="flex space-x-3">
              <button
                onClick={quickCreateProducts}
                disabled={isCreatingProducts || !scannedData?.products?.length}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                {isCreatingProducts ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Creating Products...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Quick Create ({scannedData?.products?.length || 0})
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-medium text-gray-900">
              {showRawData ? 'Raw Data & Field Mapping' : 'Review Extracted Data'}
            </h2>
            <div className="flex space-x-3">
              <div className="flex flex-wrap gap-3">
                {rawBillData && (
                  <button
                    onClick={() => setShowRawData(!showRawData)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    {showRawData ? 'Show Structured Data' : 'Map Raw Fields'}
                  </button>
                )}
              <button
                onClick={quickCreateProducts}
                disabled={isCreatingProducts || !scannedData?.products?.length}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                {isCreatingProducts ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Creating Products...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Quick Create ({scannedData?.products?.length || 0})
                  </>
                )}
              </button>

              <button
                  onClick={() => {
                    // Convert scanned products to bulk products for detailed editing
                    const bulkData = convertToBulkProducts(scannedData.products)
                    setBulkProducts(bulkData)
                    setShowBulkEdit(true)
                    fetchCategories()
                  }}
                  className="inline-flex items-center px-4 py-2 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Detailed Edit ({scannedData?.products?.length || 0})
                </button>
              </div>
            </div>

              <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-700">OCR Confidence:</span>
                  <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                    rawBillData.ocrConfidence > 0.8 ? 'bg-green-100 text-green-800' :
                    rawBillData.ocrConfidence > 0.6 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'}`}>
                    {(rawBillData.ocrConfidence * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={detectColumns}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Detect Columns & Map
                  </button>
                  <span className="text-xs text-gray-500">
                    Analyze invoice columns and create custom mappings
                  </span>
                </div>
              </div>

              {/* Raw Text */}
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-2">Raw Extracted Text</h3>
                <div className="bg-gray-50 p-4 rounded-lg max-h-48 overflow-y-auto">
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap">{rawBillData.rawText}</pre>
                </div>
              </div>

              {/* All Detected Lines */}
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-2">All Detected Lines</h3>
                <div className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto">
                  <div className="space-y-1 text-sm">
                    {rawBillData.rawText.split('\n').map((line, idx) => {
                      const trimmedLine = line.trim()
                      if (!trimmedLine) return null

                      const isProductLine = rawBillData.productLines.some(pl => pl.lineNumber === idx + 1)
                      const productLine = rawBillData.productLines.find(pl => pl.lineNumber === idx + 1)

                      return (
                        <div key={idx} className={`p-2 rounded border-l-4 ${
                          isProductLine
                            ? productLine?.isLikelyProductLine
                              ? 'border-l-green-500 bg-green-50'
                              : 'border-l-yellow-500 bg-yellow-50'
                            : 'border-l-gray-300 bg-white'
                        }`}>
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs text-gray-500">Line {idx + 1}:</span>
                            <div className="flex items-center space-x-2">
                              {isProductLine && productLine?.isLikelyProductLine && (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Product</span>
                              )}
                              {isProductLine && !productLine?.isLikelyProductLine && (
                                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Potential</span>
                              )}
                            </div>
                          </div>
                          <div className="mt-1 font-mono text-sm">{trimmedLine}</div>
                          {isProductLine && (
                            <div className="mt-1 text-xs text-gray-600">
                              Columns: {line.split(/\s+/).filter(col => col.length > 0).length}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Column Detection & Mapping */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-md font-medium text-gray-900">Column Detection & Mapping</h3>
                  {!showColumnMapping ? (
                    <button
                      onClick={detectColumns}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Detect Columns & Map
                    </button>
                  ) : (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setShowColumnMapping(false)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={applyColumnMappings}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Apply Mappings
                      </button>
                    </div>
                  )}
                </div>

                {!showColumnMapping ? (
                  <div className="text-center py-8 text-gray-500">
                    <Settings className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-sm">Click "Detect Columns & Map" to analyze the invoice and create custom column mappings</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Detected Columns Display */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Detected Columns from Invoice:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {detectedColumns.map((column, index) => {
                          // Analyze sample values to suggest field type
                          const sampleValues = productLinesForMapping
                            .slice(0, 3)
                            .map((line: any) => line.rawText.split(/\s+/)[index])
                            .filter((val: string) => val)
                            .slice(0, 3)

                          // Analyze samples to suggest mapping
                          const hasNumbers = sampleValues.some((val: string) => /\d/.test(val))
                          const hasCurrency = sampleValues.some((val: string) => /[₹$€£]/.test(val))
                          const hasUnits = sampleValues.some((val: string) => /\d.*(kg|g|l|ml|pcs|box|strip|tablet)/i.test(val))
                          const hasTextOnly = sampleValues.some((val: string) => !/\d/.test(val) && val.length > 2)

                          let suggestion = 'Unknown'
                          if (hasCurrency || (hasNumbers && !hasUnits)) suggestion = 'Price'
                          else if (hasUnits) suggestion = 'Quantity'
                          else if (hasTextOnly) suggestion = 'Name'
                          else if (hasNumbers && sampleValues.some(val => val.length <= 8)) suggestion = 'HSN Code'

                          return (
                            <div key={index} className="bg-white p-3 rounded-lg border border-gray-200">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-gray-900">Column {index + 1}</span>
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  suggestion === 'Name' ? 'bg-blue-100 text-blue-800' :
                                  suggestion === 'Quantity' ? 'bg-green-100 text-green-800' :
                                  suggestion === 'Price' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {suggestion}
                                </span>
                              </div>
                              <div className="text-sm text-gray-600 mb-2">
                                Label: <span className="font-mono">"{column}"</span>
                              </div>
                              <div className="text-xs text-gray-500">
                                Samples: {sampleValues.length > 0 ? sampleValues.join(', ') : 'N/A'}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      {detectedColumns.length === 0 && (
                        <p className="text-sm text-gray-500 italic">No specific columns detected. Will analyze product lines for data patterns.</p>
                      )}
                    </div>

                    {/* Column Mapping Interface */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Map Columns to Product Fields:</h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Detected Column
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Sample Values
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Map to Product Field
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Description
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {detectedColumns.map((column, index) => {
                              // Get sample values from product lines for this column position
                              const sampleValues = rawBillData.productLines
                                .filter(line => line.isLikelyProductLine)
                                .slice(0, 3) // First 3 product lines
                                .map(line => line.rawText.split(/\s+/)[index])
                                .filter(val => val)
                                .slice(0, 2) // Max 2 samples

                              return (
                                <tr key={index}>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                    Column {index + 1}: {column}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                    {sampleValues.length > 0 ? sampleValues.join(', ') : 'N/A'}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <select
                                      value={columnMappings[column] || ''}
                                      onChange={(e) => updateColumnMapping(index, e.target.value)}
                                      className="text-sm border border-gray-300 rounded px-3 py-2 w-full min-w-[160px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                      <option value="">Select field...</option>
                                      <optgroup label="Product Information">
                                        <option value="name">Product Name</option>
                                        <option value="hsnCode">HSN Code</option>
                                      </optgroup>
                                      <optgroup label="Pricing & Quantity">
                                        <option value="quantity">Quantity</option>
                                        <option value="unitPrice">Unit Price (Cost)</option>
                                        <option value="totalPrice">Total Price</option>
                                      </optgroup>
                                      <optgroup label="Skip Column">
                                        <option value="skip">Skip this column</option>
                                      </optgroup>
                                    </select>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-600 max-w-xs">
                                    {columnMappings[column] === 'name' && 'Product or item name'}
                                    {columnMappings[column] === 'quantity' && 'Purchase quantity with units'}
                                    {columnMappings[column] === 'unitPrice' && 'Cost price per unit'}
                                    {columnMappings[column] === 'totalPrice' && 'Total line amount'}
                                    {columnMappings[column] === 'hsnCode' && 'HSN/SAC tax code'}
                                    {columnMappings[column] === 'skip' && 'Ignore this column'}
                                    {!columnMappings[column] && 'Select a field to map this column to'}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Mapping Summary */}
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-blue-900 mb-2">Current Mappings:</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {Object.entries(columnMappings).map(([column, field]) => (
                          <div key={column} className="text-xs">
                            <span className="font-medium text-blue-800">"{column}"</span>
                            <span className="text-blue-600"> → </span>
                            <span className="font-medium text-blue-900">{field}</span>
                          </div>
                        ))}
                      </div>
                      {Object.keys(columnMappings).length === 0 && (
                        <p className="text-sm text-blue-700">No mappings configured yet. Select fields for each column above.</p>
                      )}
                    </div>

                    {/* Products Preview */}
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-green-900 mb-3">Products Preview (After Mapping):</h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {productLinesForMapping.map((line: any, lineIndex: number) => {
                          // Simulate mapping for preview
                          const columns = line.rawText.split(/\s+/).filter((col: string) => col.length > 0)
                          let previewName = columns[0] || line.rawText
                          let previewQuantity = 1
                          let previewUnitPrice = 0
                          let previewTotalPrice = 0

                          // Apply current mappings for preview
                          detectedColumns.forEach((columnName: string, columnIndex: number) => {
                            const targetField = columnMappings[columnName]
                            if (targetField && targetField !== 'skip') {
                              const rawValue: string = columns[columnIndex] || columns[Math.min(columnIndex, columns.length - 1)] || ''
                              const cleanValue = rawValue.replace(/[,₹$€£]/g, '')

                              if (rawValue && rawValue.trim()) {
                                switch (targetField) {
                                  case 'name':
                                    previewName = rawValue
                                    break
                                  case 'quantity':
                                    previewQuantity = parseQuantityWithUnits(rawValue) || parseFloat(cleanValue) || 1
                                    break
                                  case 'unitPrice':
                                    const price = parseFloat(cleanValue)
                                    if (!isNaN(price) && price > 0) previewUnitPrice = price
                                    break
                                  case 'totalPrice':
                                    const total = parseFloat(cleanValue)
                                    if (!isNaN(total) && total > 0) previewTotalPrice = total
                                    break
                                }
                              }
                            }
                          })

                          // Fallback for preview
                          if (previewUnitPrice === 0) {
                            const numericValues = columns
                              .map((col: string) => col.replace(/[,₹$€£]/g, ''))
                              .filter((col: string) => /^\d+\.?\d*$/.test(col))
                              .map((val: string) => parseFloat(val))
                              .filter((val: number) => !isNaN(val) && val > 0)
                              .sort((a: number, b: number) => b - a)

                            if (numericValues.length > 0) previewUnitPrice = numericValues[0]
                            if (numericValues.length > 1) previewTotalPrice = numericValues[1]
                          }

                          return (
                            <div key={lineIndex} className="bg-white p-3 rounded border text-xs">
                              <div className="grid grid-cols-4 gap-2">
                                <div>
                                  <span className="font-medium text-gray-600">Name:</span>
                                  <div className="text-gray-900 truncate" title={previewName}>{previewName}</div>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-600">Qty:</span>
                                  <div className="text-gray-900">{previewQuantity}</div>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-600">Price:</span>
                                  <div className="text-gray-900">₹{previewUnitPrice.toFixed(2)}</div>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-600">Total:</span>
                                  <div className="text-gray-900">₹{previewTotalPrice.toFixed(2)}</div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      <p className="text-xs text-green-700 mt-2">
                        These are preview values based on current mappings. Click "Apply Mappings" to proceed.
                      </p>
                    </div>
                  </div>
                )}

                {/* Debug info */}
                <div className='mt-4 p-3 bg-gray-50 rounded text-xs'>
                  <div className='font-medium mb-2'>Debug Info:</div>
                  <div>Header Fields: {Object.keys(rawBillData.header?.detectedFields || {}).length}</div>
                  <div>Field Mappings: {rawBillData.fieldMappings?.length || 0}</div>
                  <div>OCR Confidence: {Math.round((rawBillData.ocrConfidence || 0) * 100)}%</div>
                  <div>Raw Text Length: {rawBillData.rawText?.length || 0} characters</div>

                  <div className='mt-2 space-y-2'>
                    <div className='flex gap-2'>
                      <button
                        onClick={() => testHeaderDetection()}
                        className='px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600'
                      >
                        Test Header Detection
                      </button>
                      <button
                        onClick={() => {
                          const totalLines = rawBillData.productLines.length
                          const likelyLines = rawBillData.productLines.filter(l => l.isLikelyProductLine).length
                          showToast(`Total lines: ${totalLines}, Likely products: ${likelyLines}`, 'info')
                        }}
                        className='px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600'
                      >
                        Check Product Lines
                      </button>
                    </div>

                    {/* Product Lines Debug */}
                    {rawBillData.productLines && rawBillData.productLines.length > 0 && (
                      <div className='text-xs'>
                        <div className='font-medium mb-1'>Product Lines Analysis:</div>
                        <div className='max-h-32 overflow-y-auto bg-gray-100 p-2 rounded text-xs font-mono'>
                          {rawBillData.productLines.map((line, idx) => (
                            <div key={idx} className={`mb-1 ${line.isLikelyProductLine ? 'text-green-700' : 'text-gray-500'}`}>
                              Line {line.lineNumber}: {line.isLikelyProductLine ? '✓' : '✗'} "{line.rawText}"
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer Fields */}
              {Object.keys(rawBillData.footer.detectedFields).length > 0 && (
                <div>
                  <h3 className='text-md font-medium text-gray-900 mb-2'>Footer Fields</h3>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    {Object.entries(rawBillData.footer.detectedFields).map(([key, value]) => (
                      <div key={key} className='p-3 bg-gray-50 rounded-lg'>
                        <span className='text-sm font-medium text-gray-700 capitalize'>{key}:</span>
                        <p className='text-sm text-gray-900 mt-1'>{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className='space-y-6'>
              {/* Bill Header Info */}
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg'>
                <div>
                  <label className='block text-xs font-medium text-gray-700'>Supplier</label>
                  <p className='text-sm text-gray-900'>{scannedData.supplierName || 'Not detected'}</p>
                </div>
                <div>
                  <label className='block text-xs font-medium text-gray-700'>Bill Number</label>
                  <p className='text-sm text-gray-900'>{scannedData.billNumber || 'Not detected'}</p>
                </div>
                <div>
                  <label className='block text-xs font-medium text-gray-700'>Bill Date</label>
                  <p className='text-sm text-gray-900'>{scannedData.billDate || 'Not detected'}</p>
                </div>
              </div>

              {/* Products Table */}
              <div className='space-y-4'>
                <h3 className='text-md font-medium text-gray-900'>Extracted Products</h3>

                {(scannedData?.products?.length || 0) === 0 ? (
                  <div className='text-center py-8 text-gray-500'>
                    No products detected in the bill. Please try scanning again or upload a clearer image.
                  </div>
                ) : (
                  <div className='space-y-3'>
                    {scannedData?.products?.map((product, index) => (
                      <div key={index} className='border rounded-lg p-4'>
                        <div className='grid grid-cols-1 md:grid-cols-5 gap-4'>
                          <div className='md:col-span-2'>
                            <label className='block text-xs font-medium text-gray-700 mb-1'>
                              Product Name
                            </label>
                            <input
                              type='text'
                              value={product.name}
                              onChange={(e) => updateProduct(index, 'name', e.target.value)}
                              className='w-full px-2 py-1 text-sm border border-gray-300 rounded-md'
                            />
                          </div>

                          <div>
                            <label className='block text-xs font-medium text-gray-700 mb-1'>
                              Quantity (kg/L/pcs)
                            </label>
                            <input
                              type='number'
                              step='0.01'
                              value={product.quantity}
                              onChange={(e) => updateProduct(index, 'quantity', parseFloat(e.target.value) || 0)}
                              className='w-full px-2 py-1 text-sm border border-gray-300 rounded-md'
                              placeholder='e.g., 10.5 kg'
                            />
                          </div>

                          <div>
                            <label className='block text-xs font-medium text-gray-700 mb-1'>
                              Unit Price
                            </label>
                            <input
                              type='number'
                              step='0.01'
                              value={product.unitPrice}
                              onChange={(e) => updateProduct(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                              className='w-full px-2 py-1 text-sm border border-gray-300 rounded-md'
                            />
                          </div>

                          <div className='flex items-end'>
                            <button
                              onClick={() => removeProduct(index)}
                              className='text-red-600 hover:text-red-900 p-1'
                              title='Remove product'
                            >
                              <XCircle className='h-5 w-5' />
                            </button>
                          </div>
                        </div>

                        <div className='mt-2 grid grid-cols-1 md:grid-cols-2 gap-4'>
                          <div>
                            <label className='block text-xs font-medium text-gray-700 mb-1'>
                              HSN Code (Optional)
                            </label>
                            <input
                              type='text'
                              value={product.hsnCode || ''}
                              onChange={(e) => updateProduct(index, 'hsnCode', e.target.value)}
                              className='w-full px-2 py-1 text-sm border border-gray-300 rounded-md'
                              placeholder='Enter HSN code'
                            />
                          </div>

                          <div>
                            <label className='block text-xs font-medium text-gray-700 mb-1'>
                              Description (Optional)
                            </label>
                            <input
                              type='text'
                              value={product.description || ''}
                              onChange={(e) => updateProduct(index, 'description', e.target.value)}
                              className='w-full px-2 py-1 text-sm border border-gray-300 rounded-md'
                              placeholder='Enter product description'
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
          
          {/* Bulk Edit View */}
          {scannedData && showBulkEdit && (
            <div className='space-y-6'>
              <div className='flex justify-between items-center'>
                <h3 className='text-md font-medium text-gray-900'>Bulk Product Addition</h3>
                <div className='flex space-x-2'>
                  <button
                    onClick={() => setShowBulkEdit(false)}
                    className='inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50'
                  >
                    Back to Simple View
                  </button>
                  <button
                    onClick={saveBulkProducts}
                    disabled={isCreatingProducts || bulkProducts.length === 0}
                    className='inline-flex items-center px-4 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50'
                  >
                    {isCreatingProducts ? (
                      <>
                        <Loader className='h-4 w-4 mr-2 animate-spin' />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className='h-4 w-4 mr-2' />
                        Save All ({bulkProducts.length})
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className='overflow-x-auto'>
                <table className='min-w-full divide-y divide-gray-200 border border-gray-300'>
                  <thead className='bg-gray-50'>
                    <tr>
                      <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16'>#</th>
                      <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Product Details</th>
                      <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Pricing</th>
                      <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Purchase Info</th>
                      <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Tax & Stock</th>
                      <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20'>Status</th>
                      <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20'>Actions</th>
                    </tr>
                  </thead>
                  <tbody className='bg-white divide-y divide-gray-200'>
                    {bulkProducts.length === 0 ? (
                      <tr>
                        <td colSpan={7} className='px-4 py-8 text-center text-sm text-gray-500'>
                          No products loaded for bulk editing. Please apply field mappings first.
                        </td>
                      </tr>
                    ) : (
                      bulkProducts.map((product, index) => (
                        <tr key={index} className={product.isExistingProduct ? 'bg-yellow-50' : 'bg-white'}>
                          <td className='px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
                            {index + 1}
                          </td>
                          <td className='px-4 py-4'>
                            <div className='space-y-2'>
                              <div>
                                <label className='block text-xs font-medium text-gray-700 mb-1'>Name *</label>
                                <input
                                  type='text'
                                  value={product.name}
                                  onChange={(e) => updateBulkProduct(index, 'name', e.target.value)}
                                  className='w-full px-2 py-1 text-sm border border-gray-300 rounded-md'
                                  placeholder='Product name'
                                />
                              </div>
                              <div>
                                <label className='block text-xs font-medium text-gray-700 mb-1'>SKU</label>
                                <input
                                  type='text'
                                  value={product.sku}
                                  onChange={(e) => updateBulkProduct(index, 'sku', e.target.value)}
                                  className='w-full px-2 py-1 text-sm border border-gray-300 rounded-md'
                                  placeholder='Auto-generated if empty'
                                />
                              </div>
                              <div>
                                <label className='block text-xs font-medium text-gray-700 mb-1'>HSN Code</label>
                                <input
                                  type='text'
                                  value={product.hsnCode}
                                  onChange={(e) => updateBulkProduct(index, 'hsnCode', e.target.value)}
                                  className='w-full px-2 py-1 text-sm border border-gray-300 rounded-md'
                                  placeholder='HSN Code'
                                />
                              </div>
                              <div>
                                <label className='block text-xs font-medium text-gray-700 mb-1'>Unit</label>
                                <select
                                  value={product.unit}
                                  onChange={(e) => updateBulkProduct(index, 'unit', e.target.value)}
                                  className='w-full px-2 py-1 text-sm border border-gray-300 rounded-md'
                                >
                                  <option value='PCS'>PCS</option>
                                  <option value='KG'>KG</option>
                                  <option value='LTR'>LTR</option>
                                  <option value='BOX'>BOX</option>
                                  <option value='PACK'>PACK</option>
                                  <option value='STRIP'>STRIP</option>
                                  <option value='TABLET'>TABLET</option>
                                </select>
                              </div>
                            </div>
                          </td>
                          <td className='px-4 py-4'>
                            <div className='space-y-2'>
                              <div>
                                <label className='block text-xs font-medium text-gray-700 mb-1'>Cost Price *</label>
                                <input
                                  type='number'
                                  step='0.01'
                                  value={product.costPrice}
                                  onChange={(e) => updateBulkProduct(index, 'costPrice', parseFloat(e.target.value) || 0)}
                                  className='w-full px-2 py-1 text-sm border border-gray-300 rounded-md'
                                />
                              </div>
                              <div>
                                <label className='block text-xs font-medium text-gray-700 mb-1'>MRP</label>
                                <input
                                  type='number'
                                  step='0.01'
                                  value={product.mrp || ''}
                                  onChange={(e) => updateBulkProduct(index, 'mrp', parseFloat(e.target.value) || undefined)}
                                  className='w-full px-2 py-1 text-sm border border-gray-300 rounded-md'
                                  placeholder='Maximum retail price'
                                />
                              </div>
                              <div>
                                <label className='block text-xs font-medium text-gray-700 mb-1'>Selling Price</label>
                                <input
                                  type='number'
                                  step='0.01'
                                  value={product.sellingPrice || ''}
                                  onChange={(e) => updateBulkProduct(index, 'sellingPrice', parseFloat(e.target.value) || undefined)}
                                  className='w-full px-2 py-1 text-sm border border-gray-300 rounded-md'
                                  placeholder='Auto-calculated'
                                />
                              </div>
                            </div>
                          </td>
                          <td className='px-4 py-4'>
                            <div className='space-y-2'>
                              <div>
                                <label className='block text-xs font-medium text-gray-700 mb-1'>Purchase Qty</label>
                                <input
                                  type='number'
                                  step='0.01'
                                  value={product.quantity}
                                  onChange={(e) => updateBulkProduct(index, 'quantity', parseFloat(e.target.value) || 0)}
                                  className='w-full px-2 py-1 text-sm border border-gray-300 rounded-md'
                                />
                              </div>
                              <div>
                                <label className='block text-xs font-medium text-gray-700 mb-1'>Total Value</label>
                                <p className='text-sm text-gray-900'>₹{product.totalPrice?.toFixed(2)}</p>
                              </div>
                              <div>
                                <label className='block text-xs font-medium text-gray-700 mb-1'>Batch No</label>
                                <input
                                  type='text'
                                  value={product.batchNo || ''}
                                  onChange={(e) => updateBulkProduct(index, 'batchNo', e.target.value)}
                                  className='w-full px-2 py-1 text-sm border border-gray-300 rounded-md'
                                  placeholder='Batch/Lot number'
                                />
                              </div>
                              <div>
                                <label className='block text-xs font-medium text-gray-700 mb-1'>Expiry Date</label>
                                <input
                                  type='text'
                                  value={product.expiryDate || ''}
                                  onChange={(e) => updateBulkProduct(index, 'expiryDate', e.target.value)}
                                  className='w-full px-2 py-1 text-sm border border-gray-300 rounded-md'
                                  placeholder='DD/MM/YYYY'
                                />
                              </div>
                              <div>
                                <label className='block text-xs font-medium text-gray-700 mb-1'>Manufacturer</label>
                                <input
                                  type='text'
                                  value={product.manufacturer || ''}
                                  onChange={(e) => updateBulkProduct(index, 'manufacturer', e.target.value)}
                                  className='w-full px-2 py-1 text-sm border border-gray-300 rounded-md'
                                  placeholder='Manufacturer name'
                                />
                              </div>
                            </div>
                          </td>
                          <td className='px-4 py-4'>
                            <div className='space-y-2'>
                              <div>
                                <label className='block text-xs font-medium text-gray-700 mb-1'>GST Rate (%)</label>
                                <input
                                  type='number'
                                  step='0.01'
                                  value={product.taxRate}
                                  onChange={(e) => updateBulkProduct(index, 'taxRate', parseFloat(e.target.value) || 0)}
                                  className='w-full px-2 py-1 text-sm border border-gray-300 rounded-md'
                                />
                              </div>
                              <div>
                                <label className='block text-xs font-medium text-gray-700 mb-1'>Tax Type</label>
                                <select
                                  value={product.taxType}
                                  onChange={(e) => updateBulkProduct(index, 'taxType', e.target.value)}
                                  className='w-full px-2 py-1 text-sm border border-gray-300 rounded-md'
                                >
                                  <option value='GST'>GST</option>
                                  <option value='Non-GST'>Non-GST</option>
                                  <option value='Exempt'>Exempt</option>
                                </select>
                              </div>
                              <div>
                                <label className='block text-xs font-medium text-gray-700 mb-1'>Stock Qty</label>
                                <input
                                  type='number'
                                  step='1'
                                  value={product.stockQuantity}
                                  onChange={(e) => updateBulkProduct(index, 'stockQuantity', parseInt(e.target.value) || 0)}
                                  className='w-full px-2 py-1 text-sm border border-gray-300 rounded-md'
                                />
                              </div>
                              <div>
                                <label className='block text-xs font-medium text-gray-700 mb-1'>Low Stock Alert</label>
                                <input
                                  type='number'
                                  step='1'
                                  value={product.lowStockAlert}
                                  onChange={(e) => updateBulkProduct(index, 'lowStockAlert', parseInt(e.target.value) || 0)}
                                  className='w-full px-2 py-1 text-sm border border-gray-300 rounded-md'
                                />
                              </div>
                              <div className='flex items-center space-x-2'>
                                <input
                                  id={`trackInventory-${index}`}
                                  type='checkbox'
                                  checked={product.trackInventory}
                                  onChange={(e) => updateBulkProduct(index, 'trackInventory', e.target.checked)}
                                  className='h-4 w-4 text-primary-600 border-gray-300 rounded'
                                />
                                <label htmlFor={`trackInventory-${index}`} className='text-xs font-medium text-gray-700'>Track Inventory</label>
                              </div>
                              <div className='flex items-center space-x-2'>
                                <input
                                  id={`isActive-${index}`}
                                  type='checkbox'
                                  checked={product.isActive}
                                  onChange={(e) => updateBulkProduct(index, 'isActive', e.target.checked)}
                                  className='h-4 w-4 text-primary-600 border-gray-300 rounded'
                                />
                                <label htmlFor={`isActive-${index}`} className='text-xs font-medium text-gray-700'>Is Active</label>
                              </div>
                            </div>
                          </td>
                          <td className='px-4 py-4 whitespace-nowrap'>
                            {product.isExistingProduct ? (
                              <div className='space-y-1'>
                                <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800'>
                                  Existing
                                </span>
                                <div className='text-xs text-gray-600'>
                                  Match: {Math.round((product.matchConfidence || 0) * 100)}%
                                </div>
                                <div className='text-xs text-gray-500 max-w-24 truncate' title={product.matchedProductName}>
                                  {product.matchedProductName}
                                </div>
                              </div>
                            ) : (
                              <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                                New
                              </span>
                            )}
                          </td>
                          <td className='px-4 py-4 whitespace-nowrap text-right text-sm font-medium'>
                            <button
                              onClick={() => removeBulkProduct(index)}
                              className='text-red-600 hover:text-red-900 p-1'
                              title='Remove product'
                            >
                              <XCircle className='h-5 w-5' />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              </div>
              
          )}
      </div>
    

        <ToastContainer />
      </div>
  )}

export default BillScanner
