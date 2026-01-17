import { useEffect, useState } from 'react'
import api from '../services/api'
import { Search, Pill, Eye, Calendar } from 'lucide-react'
import { Prescription, MedicalRecord } from '../types'
import { useDebounce } from '../hooks/useDebounce'
import { useToast } from '../hooks/useToast'
import { TableSkeleton } from '../components/LoadingSkeleton'

const Prescriptions = () => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [patientId, setPatientId] = useState<number | null>(null)
  const [showViewModal, setShowViewModal] = useState<boolean>(false)
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null)

  const { showToast, ToastContainer } = useToast()
  const debouncedSearch = useDebounce(searchTerm, 500)

  useEffect(() => {
    fetchPrescriptions()
  }, [debouncedSearch, patientId])

  const fetchPrescriptions = async (): Promise<void> => {
    try {
      setLoading(true)
      // Fetch medical records with prescriptions
      const params: any = {}
      if (patientId) params.patientId = patientId
      
      const response = await api.get<{ data: MedicalRecord[] }>('/medical-records', { params })
      const recordsData = response.data?.data || response.data || []
      const records = Array.isArray(recordsData) ? recordsData : []
      setMedicalRecords(records)
      
      // Extract all prescriptions from medical records
      const allPrescriptions: Prescription[] = []
      for (const record of records) {
        if (record.id) {
          try {
            const recordResponse = await api.get<{ data: MedicalRecord }>(`/medical-records/${record.id}`)
            const fullRecord = recordResponse.data?.data || recordResponse.data
            if (fullRecord && (fullRecord as any).prescriptions) {
              allPrescriptions.push(...(fullRecord as any).prescriptions)
            }
          } catch (error) {
            // Skip records that fail to load
            console.warn(`Failed to load prescriptions for record ${record.id}:`, error)
          }
        }
      }
      
      setPrescriptions(allPrescriptions)
    } catch (error) {
      console.error('Error fetching prescriptions:', error)
      showToast('Failed to fetch prescriptions', 'error')
      setPrescriptions([])
    } finally {
      setLoading(false)
    }
  }

  const handleView = (prescription: Prescription): void => {
    setSelectedPrescription(prescription)
    setShowViewModal(true)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse mt-2"></div>
          </div>
        </div>
        <TableSkeleton rows={8} columns={5} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prescriptions</h1>
          <p className="mt-1 text-sm text-gray-500">
            View and manage patient prescriptions
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search prescriptions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      {/* Patient Filter */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search prescriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <input
              type="number"
              placeholder="Patient ID (optional)"
              value={patientId || ''}
              onChange={(e) => setPatientId(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
      </div>

      {/* Prescriptions Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prescription Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Medication
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dosage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Frequency
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {prescriptions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    No prescriptions found. Prescriptions are added through Medical Records.
                  </td>
                </tr>
              ) : (
                prescriptions
                  .filter((prescription) => {
                    if (!searchTerm) return true
                    const search = searchTerm.toLowerCase()
                    return (
                      prescription.medicationName?.toLowerCase().includes(search) ||
                      prescription.prescriptionNumber?.toLowerCase().includes(search) ||
                      prescription.genericName?.toLowerCase().includes(search)
                    )
                  })
                  .map((prescription) => (
                    <tr key={prescription.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {prescription.prescriptionNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {prescription.medicationName}
                        {prescription.genericName && (
                          <div className="text-xs text-gray-500">({prescription.genericName})</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {prescription.dosage}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {prescription.frequency}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {prescription.duration}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          prescription.status === 'Active' ? 'bg-green-100 text-green-800' :
                          prescription.status === 'Completed' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {prescription.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {prescription.totalPrice ? `₹${prescription.totalPrice.toFixed(2)}` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleView(prescription)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Prescription Modal */}
      {showViewModal && selectedPrescription && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Prescription: {selectedPrescription.prescriptionNumber}
              </h3>
              <button
                onClick={() => {
                  setShowViewModal(false)
                  setSelectedPrescription(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Medication</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedPrescription.medicationName}</p>
                </div>
                {selectedPrescription.genericName && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Generic Name</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedPrescription.genericName}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Dosage</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedPrescription.dosage}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Frequency</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedPrescription.frequency}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Duration</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedPrescription.duration}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Quantity</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedPrescription.quantity}</p>
                </div>
                {selectedPrescription.totalPrice && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Total Price</label>
                    <p className="mt-1 text-sm text-gray-900">₹{selectedPrescription.totalPrice.toFixed(2)}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedPrescription.status}</p>
                </div>
              </div>
              {selectedPrescription.instructions && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Instructions</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedPrescription.instructions}</p>
                </div>
              )}
              {selectedPrescription.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedPrescription.notes}</p>
                </div>
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setShowViewModal(false)
                  setSelectedPrescription(null)
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  )
}

export default Prescriptions

