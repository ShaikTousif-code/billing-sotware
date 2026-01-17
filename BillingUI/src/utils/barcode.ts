/**
 * Barcode utilities for RMG variant combinations
 */

export interface BarcodeConfig {
  prefix?: string
  includeProductId?: boolean
  includeSize?: boolean
  includeColor?: boolean
  separator?: string
  length?: number
  padding?: boolean
}

/**
 * Generate a barcode for a product variant combination
 */
export const generateVariantBarcode = (
  productId: number,
  size: string,
  color: string,
  config: BarcodeConfig = {}
): string => {
  const {
    prefix = '',
    includeProductId = true,
    includeSize = true,
    includeColor = true,
    separator = '-',
    length = 0,
    padding = false,
  } = config

  const parts: string[] = []

  if (prefix) {
    parts.push(prefix)
  }

  if (includeProductId) {
    parts.push(padding ? productId.toString().padStart(6, '0') : productId.toString())
  }

  if (includeSize) {
    parts.push(size.toUpperCase().replace(/\s+/g, ''))
  }

  if (includeColor) {
    parts.push(color.toUpperCase().replace(/\s+/g, ''))
  }

  let barcode = parts.join(separator)

  // Pad to desired length if specified
  if (length > 0 && barcode.length < length) {
    barcode = barcode.padEnd(length, '0')
  } else if (length > 0 && barcode.length > length) {
    barcode = barcode.substring(0, length)
  }

  return barcode
}

/**
 * Parse a barcode to extract product ID, size, and color
 */
export const parseVariantBarcode = (
  barcode: string,
  config: BarcodeConfig = {}
): { productId?: number; size?: string; color?: string } | null => {
  const {
    prefix = '',
    separator = '-',
    includeProductId = true,
    includeSize = true,
    includeColor = true,
  } = config

  try {
    let barcodeToParse = barcode

    // Remove prefix if present
    if (prefix && barcodeToParse.startsWith(prefix)) {
      barcodeToParse = barcodeToParse.substring(prefix.length)
    }

    const parts = barcodeToParse.split(separator)
    let index = 0

    const result: { productId?: number; size?: string; color?: string } = {}

    if (includeProductId && parts.length > index) {
      const productIdStr = parts[index].replace(/^0+/, '') // Remove leading zeros
      const productId = parseInt(productIdStr, 10)
      if (!isNaN(productId)) {
        result.productId = productId
      }
      index++
    }

    if (includeSize && parts.length > index) {
      result.size = parts[index]
      index++
    }

    if (includeColor && parts.length > index) {
      result.color = parts[index]
    }

    return Object.keys(result).length > 0 ? result : null
  } catch (error) {
    console.error('Error parsing barcode:', error)
    return null
  }
}

/**
 * Validate barcode format
 */
export const validateBarcode = (barcode: string, minLength: number = 3, maxLength: number = 50): boolean => {
  if (!barcode || barcode.trim().length === 0) {
    return false
  }

  const trimmed = barcode.trim()
  return trimmed.length >= minLength && trimmed.length <= maxLength
}

/**
 * Format barcode for display (add spaces/hyphens for readability)
 */
export const formatBarcodeForDisplay = (barcode: string, groupSize: number = 4): string => {
  if (!barcode) return ''

  const cleaned = barcode.replace(/[^A-Z0-9]/gi, '')
  const groups: string[] = []

  for (let i = 0; i < cleaned.length; i += groupSize) {
    groups.push(cleaned.substring(i, i + groupSize))
  }

  return groups.join(' ')
}

/**
 * Generate EAN-13 compatible barcode (simplified)
 * Note: This is a simplified version. For production, use a proper barcode library
 */
export const generateEAN13 = (productId: number, size: string, color: string): string => {
  // Simplified EAN-13 generation
  // Format: 2-digit country code (20 for India) + 5-digit product + 3-digit variant + 2-digit check
  const countryCode = '20'
  const productCode = productId.toString().padStart(5, '0')
  const sizeCode = size.charCodeAt(0).toString().padStart(2, '0')
  const colorCode = color.charCodeAt(0).toString().padStart(2, '0')
  const variantCode = sizeCode + colorCode

  const partial = countryCode + productCode + variantCode
  const checkDigit = calculateEANCheckDigit(partial)

  return partial + checkDigit
}

/**
 * Calculate EAN check digit
 */
const calculateEANCheckDigit = (code: string): string => {
  let sum = 0
  for (let i = 0; i < code.length; i++) {
    const digit = parseInt(code[i], 10)
    sum += i % 2 === 0 ? digit : digit * 3
  }
  const remainder = sum % 10
  return remainder === 0 ? '0' : (10 - remainder).toString()
}

/**
 * Generate Code128 compatible barcode string
 */
export const generateCode128 = (
  productId: number,
  size: string,
  color: string,
  prefix: string = 'RMG'
): string => {
  return `${prefix}${productId.toString().padStart(6, '0')}${size.toUpperCase().padStart(2, '0')}${color.toUpperCase().padStart(2, '0')}`
}

/**
 * Barcode scanning helper - handles various barcode formats
 */
export const scanBarcode = async (
  barcode: string,
  api: any
): Promise<{ type: 'variant' | 'product' | 'unknown'; data: any } | null> => {
  if (!barcode || !validateBarcode(barcode)) {
    return null
  }

  try {
    // Try variant barcode first
    try {
      const variantResponse = await api.get(`/product-variant-combinations/barcode/${barcode}`)
      if (variantResponse.data?.success && variantResponse.data.data) {
        return {
          type: 'variant',
          data: variantResponse.data.data,
        }
      }
    } catch (variantError) {
      // Not a variant barcode, try product barcode
    }

    // Try product barcode
    try {
      const productsResponse = await api.get('/products', {
        params: { barcode, page: 1, pageSize: 1 },
      })
      const products = productsResponse.data?.data?.data || productsResponse.data?.data || []
      if (products.length > 0) {
        return {
          type: 'product',
          data: products[0],
        }
      }
    } catch (productError) {
      // Not found
    }

    return {
      type: 'unknown',
      data: null,
    }
  } catch (error) {
    console.error('Error scanning barcode:', error)
    return null
  }
}

/**
 * Print barcode label (opens print dialog with formatted label)
 */
export const printBarcodeLabel = (
  productName: string,
  barcode: string,
  size?: string,
  color?: string,
  price?: number
): void => {
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    alert('Please allow popups to print barcode labels')
    return
  }

  const labelHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Barcode Label - ${productName}</title>
        <style>
          @media print {
            @page {
              size: 4in 2in;
              margin: 0.1in;
            }
            body {
              margin: 0;
              padding: 0;
            }
          }
          body {
            font-family: Arial, sans-serif;
            padding: 10px;
            width: 3.8in;
            height: 1.8in;
            border: 1px solid #000;
            box-sizing: border-box;
          }
          .product-name {
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 5px;
            text-align: center;
          }
          .variant-info {
            font-size: 10px;
            text-align: center;
            margin-bottom: 5px;
          }
          .barcode {
            text-align: center;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            letter-spacing: 2px;
            margin: 10px 0;
            font-weight: bold;
          }
          .price {
            font-size: 11px;
            text-align: center;
            margin-top: 5px;
          }
        </style>
      </head>
      <body>
        <div class="product-name">${productName}</div>
        ${size || color ? `<div class="variant-info">${size || ''} ${color || ''}</div>` : ''}
        <div class="barcode">${barcode}</div>
        ${price ? `<div class="price">₹${price.toFixed(2)}</div>` : ''}
      </body>
    </html>
  `

  printWindow.document.write(labelHTML)
  printWindow.document.close()
  printWindow.focus()

  // Wait for content to load, then print
  setTimeout(() => {
    printWindow.print()
    printWindow.close()
  }, 250)
}

