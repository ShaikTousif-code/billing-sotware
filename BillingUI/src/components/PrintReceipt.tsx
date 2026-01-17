import api from '../services/api'
import { useToast } from '../hooks/useToast'

interface PrintReceiptProps {
  receiptType: 'invoice' | 'fee-payment' | 'medical-invoice'
  id: string | number
  receiptNumber?: string
}

const usePrintReceipt = () => {
  const { showToast } = useToast()

  const printReceipt = async ({
    receiptType,
    id,
    receiptNumber
  }: PrintReceiptProps): Promise<void> => {
    const getApiEndpoint = () => {
      switch (receiptType) {
        case 'invoice':
          return `/export/invoices/${id}/pdf`
        case 'fee-payment':
          return `/fee-receipts/payment/${id}/pdf`
        case 'medical-invoice':
          return `/export/medical-invoices/${id}/pdf`
        default:
          throw new Error('Invalid receipt type')
      }
    }

    const getFileName = () => {
      switch (receiptType) {
        case 'invoice':
          return `Invoice_${id}.pdf`
        case 'fee-payment':
          return `FeeReceipt_${receiptNumber || id}.pdf`
        case 'medical-invoice':
          return `MedicalInvoice_${id}.pdf`
        default:
          return `Receipt_${id}.pdf`
      }
    }

    try {
      const response = await api.get(getApiEndpoint(), {
        responseType: 'blob',
      })

      // Create blob URL
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))

      // Open in new window for printing
      const printWindow = window.open(url, '_blank', 'width=800,height=600')

      if (printWindow) {
        printWindow.onload = () => {
          // Add comprehensive print-specific styles
          const style = printWindow.document.createElement('style')
          style.textContent = `
            @media print {
              body {
                margin: 0;
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
                print-color-adjust: exact !important;
              }

              @page {
                margin: 0.5cm;
                size: A4;
              }

              /* Hide unnecessary elements */
              .no-print,
              nav,
              aside,
              .sidebar,
              .header-actions,
              .pagination,
              .filters,
              button:not(.print-button),
              .modal,
              .toast-container {
                display: none !important;
              }

              /* Ensure content takes full width */
              .receipt-content,
              .invoice-content,
              .content {
                width: 100% !important;
                max-width: none !important;
                margin: 0 !important;
                padding: 0 !important;
              }

              /* Improve text readability */
              .text-gray-500,
              .text-gray-600,
              .text-gray-700 {
                color: #333 !important;
              }

              /* Ensure borders are visible */
              .border,
              .border-gray-200,
              .border-gray-300,
              table,
              th,
              td {
                border-color: #000 !important;
              }

              /* Hide scrollbars */
              * {
                -ms-overflow-style: none;
                scrollbar-width: none;
              }

              *::-webkit-scrollbar {
                display: none;
              }
            }

            /* Print-specific classes */
            .print-break-before {
              page-break-before: always;
            }

            .print-break-after {
              page-break-after: always;
            }

            .print-break-inside-avoid {
              page-break-inside: avoid;
            }
          `
          printWindow.document.head.appendChild(style)

          // Trigger print dialog
          printWindow.print()

          // Clean up after printing
          printWindow.onafterprint = () => {
            printWindow.close()
            window.URL.revokeObjectURL(url)
          }

          // Fallback for browsers that don't support onafterprint
          // Give users ample time (3 minutes) to complete the printing process
          // Modern browsers support onafterprint event, but this fallback ensures
          // the window closes even if the event doesn't fire
          setTimeout(() => {
            if (!printWindow.closed) {
              console.log('Print window auto-closed after timeout')
              printWindow.close()
              window.URL.revokeObjectURL(url)
            }
          }, 180000) // 3 minutes
        }

        showToast('Print dialog opened. You have 3 minutes to complete printing.', 'info')
      } else {
        // Fallback: download the PDF if popup is blocked
        const link = document.createElement('a')
        link.href = url
        link.download = getFileName()
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        showToast('Receipt downloaded (popup blocked)', 'info')
      }

    } catch (error: any) {
      console.error('Error printing receipt:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to print receipt'
      showToast(errorMessage, 'error')
    }
  }

  return printReceipt
}

export default usePrintReceipt
