import { useState } from 'react'
import api from '../services/api'
import { Download, FileSpreadsheet, FileText, Upload } from 'lucide-react'

const Export = () => {
  const [importing, setImporting] = useState<boolean>(false)
  const [importType, setImportType] = useState<'products' | 'customers'>('products')

  const handleExport = async (type: string, format: string): Promise<void> => {
    try {
      const url = `/export/${type}/${format}`
      const response = await api.get(url, { responseType: 'blob' })
      const blob = new Blob([response.data])
      const url2 = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url2
      link.download = `${type}_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'pdf'}`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url2)
    } catch (error) {
      console.error('Error exporting:', error)
      alert('Failed to export')
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      await api.post(`/export/${importType}/import`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      alert(`${importType} imported successfully!`)
      window.location.reload()
    } catch (error) {
      console.error('Error importing:', error)
      alert('Failed to import')
    } finally {
      setImporting(false)
      e.target.value = ''
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Import & Export</h1>
        <p className="mt-1 text-sm text-gray-500">Import and export data in various formats</p>
      </div>

      {/* Export Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Export Data</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Products</h3>
            <div className="space-y-2">
              <button
                onClick={() => handleExport('products', 'excel')}
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <FileSpreadsheet className="h-5 w-5 mr-2" />
                Export Excel
              </button>
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Customers</h3>
            <div className="space-y-2">
              <button
                onClick={() => handleExport('customers', 'excel')}
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <FileSpreadsheet className="h-5 w-5 mr-2" />
                Export Excel
              </button>
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Invoices</h3>
            <div className="space-y-2">
              <button
                onClick={() => handleExport('invoices', 'excel')}
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <FileSpreadsheet className="h-5 w-5 mr-2" />
                Export Excel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Import Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Import Data</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Import Type</label>
            <select
              value={importType}
              onChange={(e) => setImportType(e.target.value as 'products' | 'customers')}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="products">Products</option>
              <option value="customers">Customers</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Excel File</label>
            <label className="flex items-center justify-center w-full px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
              <Upload className="h-5 w-5 mr-2" />
              <span>{importing ? 'Importing...' : 'Choose File'}</span>
              <input type="file" accept=".xlsx,.xls" onChange={handleImport} disabled={importing} className="hidden" />
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Export

