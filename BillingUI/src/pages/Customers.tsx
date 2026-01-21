import { useEffect, useState, FormEvent } from 'react'
import api from '../services/api'
import { Link } from 'react-router-dom'
import { Edit, Trash2, Search, Phone, Mail } from 'lucide-react'
import { Customer, CustomerFormData } from '../types'
import { useDebounce } from '../hooks/useDebounce'
import { useToast } from '../hooks/useToast'
import ConfirmationDialog from '../components/ConfirmationDialog'
import FormField from '../components/FormField'
import { TableSkeleton } from '../components/LoadingSkeleton'

const Customers = () => {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [showModal, setShowModal] = useState<boolean>(false)
  const [formData, setFormData] = useState<any>({
    name: '',
    email: '',
    phone: '',
    address: '',
    gstin: '',
    customerType: 'B2C',
    customerGroupId: '',
    paymentTerms: '',
    creditDays: '',
    creditLimit: 0,
  })
  const [customerGroups, setCustomerGroups] = useState<any[]>([])
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false)

  const { showToast, ToastContainer } = useToast()
  const debouncedSearch = useDebounce(searchTerm, 500)

  useEffect(() => {
    fetchCustomers()
    fetchCustomerGroups()
  }, [])

  const fetchCustomerGroups = async (): Promise<void> => {
    try {
      const response = await api.get<{ success: boolean; data: any[] }>('/customer-groups')
      const groups = response.data?.data || response.data || []
      setCustomerGroups(Array.isArray(groups) ? groups : [])
    } catch (error) {
      console.error('Error fetching customer groups:', error)
    }
  }

  useEffect(() => {
    if (debouncedSearch !== undefined) {
      fetchCustomers()
    }
  }, [debouncedSearch])

  const fetchCustomers = async (): Promise<void> => {
    try {
      const params: any = debouncedSearch ? { search: debouncedSearch } : {}
      // Request a large page size to get all customers (or use pagination if needed)
      params.page = 1
      params.pageSize = 10000
      
      const response = await api.get<{ success: boolean; data: { data: Customer[]; totalCount: number } }>('/customers', { params })
      
      // Handle paginated response structure: ApiResponse<PaginatedResponse<Customer>>
      let customersData: Customer[] = []
      if (response.data) {
        // Check for nested paginated response structure
        if (response.data.data && response.data.data.data && Array.isArray(response.data.data.data)) {
          customersData = response.data.data.data // Nested: ApiResponse<PaginatedResponse<Customer>>
        } else if (response.data.data && Array.isArray(response.data.data)) {
          customersData = response.data.data // PaginatedResponse.Data
        } else if (Array.isArray(response.data)) {
          customersData = response.data // Direct array (fallback)
        }
      }
      
      setCustomers(Array.isArray(customersData) ? customersData : [])
    } catch (error) {
      console.error('Error fetching customers:', error)
      showToast('Failed to fetch customers', 'error')
      setCustomers([]) // Ensure customers is always an array
    } finally {
      setLoading(false)
    }
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required'
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email address'
    }
    
    if (formData.phone && !/^[0-9+\-\s()]+$/.test(formData.phone)) {
      errors.phone = 'Invalid phone number'
    }
    
    // GSTIN validation for B2B customers (if provided)
    if (formData.customerType === 'B2B' && formData.gstin && formData.gstin.trim()) {
      const gstinPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
      if (!gstinPattern.test(formData.gstin.trim().toUpperCase())) {
        errors.gstin = 'Invalid GSTIN format. Format: 22AAAAA0000A1Z5'
      }
    }
    
    // Credit limit validation
    if (formData.creditLimit && parseFloat(formData.creditLimit) < 0) {
      errors.creditLimit = 'Credit limit cannot be negative'
    }
    
    // Credit days validation
    if (formData.creditDays && (isNaN(parseInt(formData.creditDays)) || parseInt(formData.creditDays) < 0)) {
      errors.creditDays = 'Credit days must be a positive number'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    
    if (!validateForm()) {
      showToast('Please fix validation errors', 'error')
      return
    }
    
    try {
      // Prepare payload with proper null/undefined handling for optional fields
      const payload: any = {
        name: formData.name.trim(),
        email: formData.email?.trim() || null,
        phone: formData.phone?.trim() || null,
        address: formData.address?.trim() || null,
        gstin: formData.gstin?.trim() ? formData.gstin.trim().toUpperCase() : null,
        customerType: formData.customerType || 'B2C',
        customerGroupId: formData.customerType === 'B2C' && formData.customerGroupId ? parseInt(formData.customerGroupId) : null,
        paymentTerms: formData.customerType === 'B2B' && formData.paymentTerms ? formData.paymentTerms : null,
        creditDays: formData.customerType === 'B2B' && formData.creditDays ? parseInt(formData.creditDays) : null,
        creditLimit: formData.customerType === 'B2B' ? (parseFloat(formData.creditLimit) || 0) : 0,
      }
      
      await api.post('/customers', payload)
      setShowModal(false)
      setFormData({ 
        name: '', 
        email: '', 
        phone: '', 
        address: '', 
        gstin: '',
        customerType: 'B2C',
        customerGroupId: '',
        paymentTerms: '',
        creditDays: '',
        creditLimit: 0,
      })
      setFormErrors({})
      showToast('Customer created successfully', 'success')
      fetchCustomers()
    } catch (error: any) {
      console.error('Error creating customer:', error)
      const message = error.response?.data?.message || 'Failed to create customer'
      showToast(message, 'error')
    }
  }

  const handleDeleteClick = (id: number): void => {
    setDeleteId(id)
    setShowDeleteConfirm(true)
  }

  const handleDelete = async (): Promise<void> => {
    if (!deleteId) return
    
    try {
      await api.delete(`/customers/${deleteId}`)
      showToast('Customer deleted successfully', 'success')
      setShowDeleteConfirm(false)
      setDeleteId(null)
      fetchCustomers()
    } catch (error: any) {
      console.error('Error deleting customer:', error)
      const message = error.response?.data?.message || 'Failed to delete customer'
      showToast(message, 'error')
    }
  }

  const filteredCustomers = (Array.isArray(customers) ? customers : []).filter(
    (customer) =>
      customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer?.phone?.includes(searchTerm)
  )

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
        <TableSkeleton rows={8} columns={5} />
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Customers</h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-500">
            Manage your customer database
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-transparent rounded-md shadow-sm text-xs sm:text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
        >
          <span className="mr-1 sm:mr-2">+</span>
          <span className="hidden sm:inline">Add Customer</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white shadow rounded-lg p-3 sm:p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 sm:pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredCustomers.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            No customers found
          </div>
        ) : (
          filteredCustomers.map((customer) => (
            <div
              key={customer.id}
              className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {customer.name}
                </h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleDeleteClick(customer.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                  <button className="text-primary-600 hover:text-primary-900">
                    <Edit className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                {customer.email && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="h-4 w-4 mr-2" />
                    {customer.email}
                  </div>
                )}
                {customer.phone && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="h-4 w-4 mr-2" />
                    {customer.phone}
                  </div>
                )}
                {customer.customerType === 'B2B' && customer.creditLimit > 0 && (
                  <div className="mt-2">
                    <div className="text-sm text-gray-500">Credit Limit</div>
                    <div className="text-sm font-medium text-gray-700">
                      ₹{customer.creditLimit.toFixed(2)}
                    </div>
                  </div>
                )}
                {customer.outstandingBalance > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="text-sm text-gray-500">Outstanding Balance</div>
                    <div className="text-lg font-semibold text-red-600">
                      ₹{customer.outstandingBalance.toFixed(2)}
                    </div>
                    {customer.customerType === 'B2B' && customer.creditLimit > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        Available: ₹{(customer.creditLimit - customer.outstandingBalance).toFixed(2)}
                      </div>
                    )}
                  </div>
                )}
                {customer.customerType === 'B2C' && customer.loyaltyPoints > 0 && (
                  <div className="mt-2">
                    <div className="text-sm text-gray-500">Loyalty Points</div>
                    <div className="text-lg font-semibold text-blue-600">
                      {customer.loyaltyPoints.toFixed(0)} pts
                    </div>
                  </div>
                )}
                {customer.walletBalance > 0 && (
                  <div className="mt-2">
                    <div className="text-sm text-gray-500">Wallet Balance</div>
                    <div className="text-lg font-semibold text-green-600">
                      ₹{customer.walletBalance.toFixed(2)}
                    </div>
                  </div>
                )}
                {customer.customerType && (
                  <div className="mt-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      customer.customerType === 'B2B' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {customer.customerType}
                    </span>
                  </div>
                )}
                <div className="mt-4 flex space-x-2">
                  <Link
                    to={`/wallet/customer/${customer.id}`}
                    className="text-sm text-primary-600 hover:text-primary-900"
                  >
                    View Wallet
                  </Link>
                  <Link
                    to={`/customers/${customer.id}/purchase-history`}
                    className="text-sm text-primary-600 hover:text-primary-900"
                  >
                    Purchase History
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Customer Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 p-4">
          <div className="relative top-4 sm:top-20 mx-auto p-4 sm:p-5 border w-full max-w-md sm:w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Add New Customer
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value })
                      if (formErrors.name) {
                        setFormErrors({ ...formErrors, name: '' })
                      }
                    }}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 ${
                      formErrors.name ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value })
                      if (formErrors.email) {
                        setFormErrors({ ...formErrors, email: '' })
                      }
                    }}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 ${
                      formErrors.email ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.email && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => {
                      setFormData({ ...formData, phone: e.target.value })
                      if (formErrors.phone) {
                        setFormErrors({ ...formErrors, phone: '' })
                      }
                    }}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 ${
                      formErrors.phone ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.phone && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.phone}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    rows={3}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    GSTIN
                  </label>
                  <input
                    type="text"
                    value={formData.gstin}
                    onChange={(e) => {
                      setFormData({ ...formData, gstin: e.target.value })
                      if (formErrors.gstin) {
                        setFormErrors({ ...formErrors, gstin: '' })
                      }
                    }}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 ${
                      formErrors.gstin ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="GSTIN (for B2B) - Format: 22AAAAA0000A1Z5"
                  />
                  {formErrors.gstin && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.gstin}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Customer Type *
                  </label>
                  <select
                    value={formData.customerType}
                    onChange={(e) =>
                      setFormData({ ...formData, customerType: e.target.value })
                    }
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="B2C">B2C (Retail Customer)</option>
                    <option value="B2B">B2B (Business Customer)</option>
                  </select>
                </div>
                {formData.customerType === 'B2C' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Customer Group
                    </label>
                    <select
                      value={formData.customerGroupId}
                      onChange={(e) =>
                        setFormData({ ...formData, customerGroupId: e.target.value })
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">None</option>
                      {customerGroups.map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {formData.customerType === 'B2B' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Payment Terms
                      </label>
                      <select
                        value={formData.paymentTerms}
                        onChange={(e) =>
                          setFormData({ ...formData, paymentTerms: e.target.value })
                        }
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="">Select Payment Terms</option>
                        <option value="COD">COD (Cash on Delivery)</option>
                        <option value="Net 15">Net 15</option>
                        <option value="Net 30">Net 30</option>
                        <option value="Net 45">Net 45</option>
                        <option value="Net 60">Net 60</option>
                        <option value="Net 90">Net 90</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Credit Days
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.creditDays}
                        onChange={(e) => {
                          setFormData({ ...formData, creditDays: e.target.value })
                          if (formErrors.creditDays) {
                            setFormErrors({ ...formErrors, creditDays: '' })
                          }
                        }}
                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 ${
                          formErrors.creditDays ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Number of credit days"
                      />
                      {formErrors.creditDays && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.creditDays}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Credit Limit (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.creditLimit}
                        onChange={(e) => {
                          setFormData({ ...formData, creditLimit: e.target.value })
                          if (formErrors.creditLimit) {
                            setFormErrors({ ...formErrors, creditLimit: '' })
                          }
                        }}
                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 ${
                          formErrors.creditLimit ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="0.00"
                      />
                      {formErrors.creditLimit && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.creditLimit}</p>
                      )}
                    </div>
                  </>
                )}
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        title="Delete Customer"
        message="Are you sure you want to delete this customer? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => {
          setShowDeleteConfirm(false)
          setDeleteId(null)
        }}
      />

      <ToastContainer />
    </div>
  )
}

export default Customers


