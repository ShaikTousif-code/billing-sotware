import { useEffect, useState } from 'react'
import api from '../services/api'
import { Search, Pill, Eye, Receipt, User, Calendar, Plus, X } from 'lucide-react'
import { MedicalRecord, Prescription, Patient, Product, InvoiceItem } from '../types'
import { useToast } from '../hooks/useToast'
import { TableSkeleton } from '../components/LoadingSkeleton'
import ConfirmationDialog from '../components/ConfirmationDialog'
import { format } from 'date-fns'

interface AdhocBillItem {
  productId: number | null
  productName: string
  quantity: number
  unitPrice: number
  totalAmount: number
}

const Pharmacy = () => {
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null)
  const [showViewModal, setShowViewModal] = useState<boolean>(false)
  
  // Ad-hoc bill states
  const [showAdhocBillModal, setShowAdhocBillModal] = useState<boolean>(false)
  const [patients, setPatients] = useState<Patient[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedPatientId, setSelectedPatientId] = useState<string>('')
  const [adhocBillItems, setAdhocBillItems] = useState<AdhocBillItem[]>([])
  const [notes, setNotes] = useState<string>('')
  const [showBillConfirm, setShowBillConfirm] = useState<boolean>(false)
  const [billToGenerate, setBillToGenerate] = useState<{ type: 'prescription' | 'adhoc', id?: number, data?: any } | null>(null)
  
  const { showToast, ToastContainer } = useToast()

  useEffect(() => {
    fetchPendingRecords()
    if (showAdhocBillModal) {
      fetchPatientsAndProducts()
    }
  }, [showAdhocBillModal])

  const fetchPendingRecords = async (): Promise<void> => {
    try {
      setLoading(true)
      const response = await api.get<{ data: { data: MedicalRecord[] } }>('/medical-records/pharmacy/pending')
      const records = response.data.data?.data || response.data.data || []
      setMedicalRecords(records)
    } catch (error) {
      console.error('Error fetching pending records:', error)
      showToast('Failed to fetch pending prescriptions', 'error')
      setMedicalRecords([])
    } finally {
      setLoading(false)
    }
  }

  const fetchPatientsAndProducts = async (): Promise<void> => {
    try {
      // Fetch all products (use large pageSize to get all products for dropdown)
      const [patientsRes, productsRes] = await Promise.all([
        api.get<{ data: { data: Patient[] } }>('/patients'),
        api.get<{ data: { data: Product[], pageNumber: number, pageSize: number, totalCount: number } }>('/products?pageSize=1000') // Get all products
      ])
      
      // Handle different response structures
      const patientsData = patientsRes.data?.data?.data || patientsRes.data?.data || patientsRes.data || []
      
      // Handle paginated response from Products API
      // Response structure: ApiResponse<PaginatedResponse<Product>>
      // So: response.data.data.data contains the Product[] array
      let productsData: Product[] = []
      if (productsRes.data?.data) {
        if (productsRes.data.data.data && Array.isArray(productsRes.data.data.data)) {
          // Paginated response: { data: { data: Product[], pageNumber, pageSize, totalCount } }
          productsData = productsRes.data.data.data
        } else if (Array.isArray(productsRes.data.data)) {
          // Direct array (fallback)
          productsData = productsRes.data.data
        }
      } else if (Array.isArray(productsRes.data)) {
        // Direct array response (fallback)
        productsData = productsRes.data
      }
      
      setPatients(Array.isArray(patientsData) ? patientsData : [])
      setProducts(Array.isArray(productsData) ? productsData : [])
      
      console.log('Fetched products from Products API:', productsData.length, 'products')
      if (productsData.length === 0) {
        console.warn('No products found. Make sure products exist in the Products page.')
        showToast('No products found. Please add products from the Products page first.', 'warning')
      }
    } catch (error) {
      console.error('Error fetching patients/products:', error)
      showToast('Failed to fetch patients or products', 'error')
      setPatients([])
      setProducts([])
    }
  }

  const handleGenerateBill = async (medicalRecordId: number): Promise<void> => {
    setBillToGenerate({ type: 'prescription', id: medicalRecordId })
    setShowBillConfirm(true)
  }

  const confirmGenerateBill = async (): Promise<void> => {
    if (!billToGenerate) return

    try {
      if (billToGenerate.type === 'prescription' && billToGenerate.id) {
        const response = await api.post(`/medical-workflow/medical-records/${billToGenerate.id}/generate-medicine-bill`, {})
        console.log('Bill generation response:', response)
        
        // Handle different response structures
        const message = response.data?.message || response.data?.data?.message || 'Medicine bill generated successfully'
        showToast(message, 'success')
        
        // Wait a bit before refreshing to ensure backend has processed
        setTimeout(() => {
          fetchPendingRecords() // Refresh list
        }, 500)
      } else if (billToGenerate.type === 'adhoc' && billToGenerate.data) {
        await handleCreateAdhocBillInternal(billToGenerate.data)
      }
    } catch (error: any) {
      console.error('Error generating bill:', error)
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.data?.message || 
                          error.response?.data?.errors?.join(', ') ||
                          error.message || 
                          'Failed to generate bill'
      showToast(errorMessage, 'error')
    } finally {
      setShowBillConfirm(false)
      setBillToGenerate(null)
    }
  }

  const handleCreateAdhocBill = async (): Promise<void> => {
    if (adhocBillItems.length === 0) {
      showToast('Please add at least one item', 'error')
      return
    }

    // Calculate totals
    const subTotal = adhocBillItems.reduce((sum, item) => sum + item.totalAmount, 0)
    const totalAmount = subTotal

    // Prepare bill data
    const selectedPatient = selectedPatientId ? patients.find(p => p.id.toString() === selectedPatientId) : null
    const billData = {
      patientId: selectedPatientId ? parseInt(selectedPatientId) : null,
      customerName: selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : 'Walk-in Customer',
      invoiceDate: new Date().toISOString(),
      status: 'Completed', // Mark as completed immediately - cannot be undone
      notes: notes || 'Ad-hoc medicine bill from pharmacy',
      items: adhocBillItems.map(item => ({
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
      balanceAmount: 0, // Mark as fully paid since it's completed
      paidAmount: totalAmount
    }

    setBillToGenerate({ type: 'adhoc', data: billData })
    setShowBillConfirm(true)
  }

  const handleCreateAdhocBillInternal = async (billData: any): Promise<void> => {
    try {
      const response = await api.post<{ data: { data: any } }>('/invoices', billData)
      console.log('Ad-hoc bill creation response:', response)
      showToast('Ad-hoc bill created successfully. This bill cannot be undone.', 'success')
      setShowAdhocBillModal(false)
      resetAdhocBillForm()
    } catch (error: any) {
      console.error('Error creating ad-hoc bill:', error)
      const errorMessage = error.response?.data?.message || error.response?.data?.data?.message || error.message || 'Failed to create ad-hoc bill'
      showToast(errorMessage, 'error')
      throw error // Re-throw to be caught by confirmGenerateBill
    }
  }

  const resetAdhocBillForm = (): void => {
    setSelectedPatientId('')
    setAdhocBillItems([])
    setNotes('')
  }

  const addAdhocBillItem = (): void => {
    setAdhocBillItems([...adhocBillItems, {
      productId: null,
      productName: '',
      quantity: 1,
      unitPrice: 0,
      totalAmount: 0
    }])
  }

  const removeAdhocBillItem = (index: number): void => {
    setAdhocBillItems(adhocBillItems.filter((_, i) => i !== index))
  }

  const updateAdhocBillItem = (index: number, field: keyof AdhocBillItem, value: any): void => {
    const updated = [...adhocBillItems]
    
    // Handle different field types
    if (field === 'productId') {
      updated[index] = { ...updated[index], productId: value ? parseInt(value) : null }
      
      // If product is selected, update product name and price
      if (value) {
        const product = products.find(p => p.id === parseInt(value))
        if (product) {
          updated[index].productName = product.name
          updated[index].unitPrice = product.sellingPrice || 0
        }
      } else {
        // Clear product name if no product selected
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
    
    // Recalculate total
    updated[index].totalAmount = updated[index].quantity * updated[index].unitPrice
    
    setAdhocBillItems(updated)
  }

  const handleView = async (record: MedicalRecord): Promise<void> => {
    try {
      // Fetch full record with prescriptions
      const response = await api.get<{ data: { data: MedicalRecord } }>(`/medical-records/${record.id}`)
      const fullRecord = response.data.data?.data || response.data.data
      setSelectedRecord(fullRecord)
      setShowViewModal(true)
    } catch (error) {
      console.error('Error fetching record details:', error)
      showToast('Failed to fetch record details', 'error')
    }
  }

  const calculateTotal = (prescriptions: Prescription[]): number => {
    return prescriptions
      .filter(p => p.totalPrice && p.totalPrice > 0)
      .reduce((sum, p) => sum + (p.totalPrice || 0), 0)
  }

  const filteredRecords = medicalRecords.filter((record) => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      record.visitNumber?.toLowerCase().includes(search) ||
      record.patient?.firstName?.toLowerCase().includes(search) ||
      record.patient?.lastName?.toLowerCase().includes(search) ||
      record.patient?.patientId?.toLowerCase().includes(search)
    )
  })

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
          <h1 className="text-2xl font-bold text-gray-900">Pharmacy - Pending Medicines</h1>
          <p className="mt-1 text-sm text-gray-500">
            View and bill medicines for completed consultations
          </p>
        </div>
        <button
          onClick={() => {
            setShowAdhocBillModal(true)
            fetchPatientsAndProducts()
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          <Plus className="h-5 w-5" />
          <span>Create Ad-hoc Bill</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by visit number, patient name, or patient ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Visit Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Visit Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prescriptions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Amount
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No pending prescriptions found. All consultations have been billed.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => {
                  const prescriptions = (record as any).prescriptions || []
                  const billablePrescriptions = prescriptions.filter((p: Prescription) => p.totalPrice && p.totalPrice > 0)
                  const totalAmount = calculateTotal(billablePrescriptions)

                  return (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {record.visitNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.patient ? (
                          <div>
                            <div className="font-medium">
                              {record.patient.firstName} {record.patient.lastName}
                            </div>
                            <div className="text-xs text-gray-500">ID: {record.patient.patientId}</div>
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.visitDate ? format(new Date(record.visitDate), 'MMM dd, yyyy') : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {billablePrescriptions.length} item(s)
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ₹{totalAmount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleView(record)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Details"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                          {billablePrescriptions.length > 0 && (
                            <button
                              onClick={() => handleGenerateBill(record.id)}
                              className="text-green-600 hover:text-green-900 flex items-center space-x-1"
                              title="Generate Medicine Bill"
                            >
                              <Receipt className="h-5 w-5" />
                              <span className="text-xs">Bill</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Details Modal */}
      {showViewModal && selectedRecord && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Prescriptions - Visit {selectedRecord.visitNumber}
              </h3>
              <button
                onClick={() => {
                  setShowViewModal(false)
                  setSelectedRecord(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            {/* Patient Info */}
            {selectedRecord.patient && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Patient</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedRecord.patient.firstName} {selectedRecord.patient.lastName}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Patient ID</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedRecord.patient.patientId}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Prescriptions List */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Prescriptions</h4>
              {(selectedRecord as any).prescriptions && ((selectedRecord as any).prescriptions as Prescription[]).length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Medication</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dosage</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Frequency</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {((selectedRecord as any).prescriptions as Prescription[]).map((prescription) => (
                        <tr key={prescription.id}>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {prescription.medicationName}
                            {prescription.genericName && (
                              <div className="text-xs text-gray-500">({prescription.genericName})</div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">{prescription.dosage}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{prescription.frequency}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{prescription.quantity}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {prescription.unitPrice ? `₹${prescription.unitPrice.toFixed(2)}` : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {prescription.totalPrice ? `₹${prescription.totalPrice.toFixed(2)}` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={5} className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                          Total:
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-gray-900">
                          ₹{calculateTotal((selectedRecord as any).prescriptions || []).toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No prescriptions found.</p>
              )}
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowViewModal(false)
                  setSelectedRecord(null)
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              {selectedRecord && calculateTotal((selectedRecord as any).prescriptions || []) > 0 && (
                <button
                  onClick={() => {
                    handleGenerateBill(selectedRecord.id)
                    setShowViewModal(false)
                    setSelectedRecord(null)
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 flex items-center space-x-2"
                >
                  <Receipt className="h-4 w-4" />
                  <span>Generate Medicine Bill</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Ad-hoc Bill Modal */}
      {showAdhocBillModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Create Ad-hoc Medicine Bill</h3>
              <button
                onClick={() => {
                  setShowAdhocBillModal(false)
                  resetAdhocBillForm()
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Patient Selection - Optional */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Patient (Optional)
                </label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Walk-in Customer (No Patient)</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id.toString()}>
                      {patient.firstName} {patient.lastName} ({patient.patientId})
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Leave blank for walk-in customers without patient records
                </p>
              </div>

              {/* Bill Items */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">Items</label>
                  <button
                    onClick={addAdhocBillItem}
                    className="flex items-center space-x-1 px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Item</span>
                  </button>
                </div>

                {adhocBillItems.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500 mb-2">No items added. Click "Add Item" to add medicines.</p>
                    {products.length === 0 && (
                      <p className="text-xs text-yellow-600">Loading products... If this persists, check if products exist in the system.</p>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                          <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Action</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {adhocBillItems.map((item, index) => (
                          <tr key={index}>
                            <td className="px-3 py-2">
                              <select
                                value={item.productId?.toString() || ''}
                                onChange={(e) => {
                                  const value = e.target.value
                                  updateAdhocBillItem(index, 'productId', value)
                                }}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              >
                                <option value="">Select Product</option>
                                {products.length > 0 ? (
                                  products.map((product) => (
                                    <option key={product.id} value={product.id.toString()}>
                                      {product.name} - ₹{product.sellingPrice?.toFixed(2) || '0.00'}
                                    </option>
                                  ))
                                ) : (
                                  <option value="" disabled>No products available</option>
                                )}
                              </select>
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateAdhocBillItem(index, 'quantity', parseInt(e.target.value) || 1)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.unitPrice}
                                onChange={(e) => updateAdhocBillItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                            </td>
                            <td className="px-3 py-2 text-sm font-medium">
                              ₹{item.totalAmount.toFixed(2)}
                            </td>
                            <td className="px-3 py-2 text-center">
                              <button
                                onClick={() => removeAdhocBillItem(index)}
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
                            ₹{adhocBillItems.reduce((sum, item) => sum + item.totalAmount, 0).toFixed(2)}
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
                  setShowAdhocBillModal(false)
                  resetAdhocBillForm()
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAdhocBill}
                disabled={adhocBillItems.length === 0}
                className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Receipt className="h-4 w-4" />
                <span>Create Bill</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bill Generation Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showBillConfirm}
        onCancel={() => {
          setShowBillConfirm(false)
          setBillToGenerate(null)
        }}
        onConfirm={confirmGenerateBill}
        title="Confirm Bill Generation"
        message={
          billToGenerate?.type === 'prescription'
            ? "Are you sure you want to generate this medicine bill? Once generated, this bill cannot be undone."
            : "Are you sure you want to create this ad-hoc bill? Once created, this bill will be marked as completed and cannot be undone."
        }
        confirmText="Generate Bill"
        cancelText="Cancel"
        variant="warning"
      />

      <ToastContainer />
    </div>
  )
}

export default Pharmacy

