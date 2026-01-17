import { useEffect, useState } from 'react'
import api from '../services/api'
import { Search, FileText, Calendar, Edit, Trash2, Eye, Plus, Pill } from 'lucide-react'
import { MedicalRecord, Patient, User as UserType, Prescription } from '../types'
import { useDebounce } from '../hooks/useDebounce'
import { useToast } from '../hooks/useToast'
import { TableSkeleton } from '../components/LoadingSkeleton'
import ConfirmationDialog from '../components/ConfirmationDialog'

const MedicalRecords = () => {
  const [records, setRecords] = useState<MedicalRecord[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [providers, setProviders] = useState<UserType[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [patientId, setPatientId] = useState<number | null>(null)
  const [fromDate, setFromDate] = useState<string>('')
  const [toDate, setToDate] = useState<string>('')
  const [showModal, setShowModal] = useState<boolean>(false)
  const [showViewModal, setShowViewModal] = useState<boolean>(false)
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false)
  const [showPrescriptionModal, setShowPrescriptionModal] = useState<boolean>(false)
  const [editingPrescription, setEditingPrescription] = useState<Prescription | null>(null)
  const [deletePrescriptionId, setDeletePrescriptionId] = useState<number | null>(null)
  const [showDeletePrescriptionConfirm, setShowDeletePrescriptionConfirm] = useState<boolean>(false)
  const [prescriptionFormData, setPrescriptionFormData] = useState({
    medicationName: '',
    genericName: '',
    dosage: '',
    frequency: '',
    duration: '',
    quantity: '',
    unitPrice: '',
    instructions: '',
    schedule: '',
    prescribedDate: new Date().toISOString().split('T')[0],
    startDate: '',
    endDate: '',
    status: 'Active',
    notes: ''
  })
  const [formData, setFormData] = useState({
    patientId: '',
    providerId: '',
    visitDate: new Date().toISOString().split('T')[0],
    visitType: 'Consultation',
    chiefComplaint: '',
    historyOfPresentIllness: '',
    reviewOfSystems: '',
    physicalExamination: '',
    assessment: '',
    plan: '',
    notes: '',
    height: '',
    weight: '',
    bloodPressureSystolic: '',
    bloodPressureDiastolic: '',
    temperature: '',
    pulse: '',
    respiratoryRate: '',
    oxygenSaturation: '',
    status: 'Active'
  })

  const { showToast, ToastContainer } = useToast()
  const debouncedSearch = useDebounce(searchTerm, 500)

  useEffect(() => {
    fetchData()
  }, [patientId, fromDate, toDate])

  const fetchData = async (): Promise<void> => {
    try {
      setLoading(true)
      const params: any = {}
      if (patientId) params.patientId = patientId
      if (fromDate) params.fromDate = fromDate
      if (toDate) params.toDate = toDate
      
      const [recordsRes, patientsRes, providersRes] = await Promise.all([
        api.get<{ data: MedicalRecord[] }>('/medical-records', { params }),
        api.get<{ data: Patient[] }>('/patients').catch(() => ({ data: { data: [] } })),
        api.get<{ data: UserType[] }>('/auth/users').catch(() => ({ data: { data: [] } }))
      ])
      
      const recordsData = recordsRes.data?.data || recordsRes.data || []
      setRecords(Array.isArray(recordsData) ? recordsData : [])
      
      const patientsData = patientsRes.data?.data || patientsRes.data || []
      setPatients(Array.isArray(patientsData) ? patientsData : [])
      
      const providersData = providersRes.data?.data || providersRes.data || []
      setProviders(Array.isArray(providersData) ? providersData : [])
    } catch (error) {
      console.error('Error fetching medical records:', error)
      showToast('Failed to fetch medical records', 'error')
      setRecords([])
    } finally {
      setLoading(false)
    }
  }

  const handleView = async (record: MedicalRecord): Promise<void> => {
    try {
      const response = await api.get<{ data: MedicalRecord }>(`/medical-records/${record.id}`)
      const recordData = response.data?.data || response.data
      setSelectedRecord(recordData)
      setShowViewModal(true)
    } catch (error) {
      console.error('Error fetching medical record:', error)
      showToast('Failed to fetch medical record details', 'error')
    }
  }

  const handleEdit = async (record: MedicalRecord): Promise<void> => {
    try {
      const response = await api.get<{ data: MedicalRecord }>(`/medical-records/${record.id}`)
      const recordData = response.data?.data || response.data
      setSelectedRecord(recordData)
      
      // Populate form with record data
      setFormData({
        patientId: recordData.patientId?.toString() || '',
        providerId: recordData.providerId?.toString() || '',
        visitDate: recordData.visitDate ? new Date(recordData.visitDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        visitType: recordData.visitType || 'Consultation',
        chiefComplaint: recordData.chiefComplaint || '',
        historyOfPresentIllness: recordData.historyOfPresentIllness || '',
        reviewOfSystems: recordData.reviewOfSystems || '',
        physicalExamination: recordData.physicalExamination || '',
        assessment: recordData.assessment || '',
        plan: recordData.plan || '',
        notes: recordData.notes || '',
        height: recordData.height?.toString() || '',
        weight: recordData.weight?.toString() || '',
        bloodPressureSystolic: recordData.bloodPressureSystolic?.toString() || '',
        bloodPressureDiastolic: recordData.bloodPressureDiastolic?.toString() || '',
        temperature: recordData.temperature?.toString() || '',
        pulse: recordData.pulse?.toString() || '',
        respiratoryRate: recordData.respiratoryRate?.toString() || '',
        oxygenSaturation: recordData.oxygenSaturation?.toString() || '',
        status: recordData.status || 'Active'
      })
      setShowModal(true)
    } catch (error) {
      console.error('Error fetching medical record:', error)
      showToast('Failed to fetch medical record details', 'error')
    }
  }

  const resetForm = (): void => {
    setFormData({
      patientId: '',
      providerId: '',
      visitDate: new Date().toISOString().split('T')[0],
      visitType: 'Consultation',
      chiefComplaint: '',
      historyOfPresentIllness: '',
      reviewOfSystems: '',
      physicalExamination: '',
      assessment: '',
      plan: '',
      notes: '',
      height: '',
      weight: '',
      bloodPressureSystolic: '',
      bloodPressureDiastolic: '',
      temperature: '',
      pulse: '',
      respiratoryRate: '',
      oxygenSaturation: '',
      status: 'Active'
    })
    setSelectedRecord(null)
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    try {
      const payload: any = {
        patientId: parseInt(formData.patientId),
        providerId: formData.providerId ? parseInt(formData.providerId) : null,
        visitDate: new Date(formData.visitDate).toISOString(),
        visitType: formData.visitType,
        chiefComplaint: formData.chiefComplaint || null,
        historyOfPresentIllness: formData.historyOfPresentIllness || null,
        reviewOfSystems: formData.reviewOfSystems || null,
        physicalExamination: formData.physicalExamination || null,
        assessment: formData.assessment || null,
        plan: formData.plan || null,
        notes: formData.notes || null,
        height: formData.height ? parseFloat(formData.height) : null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        bloodPressureSystolic: formData.bloodPressureSystolic ? parseFloat(formData.bloodPressureSystolic) : null,
        bloodPressureDiastolic: formData.bloodPressureDiastolic ? parseFloat(formData.bloodPressureDiastolic) : null,
        temperature: formData.temperature ? parseFloat(formData.temperature) : null,
        pulse: formData.pulse ? parseInt(formData.pulse) : null,
        respiratoryRate: formData.respiratoryRate ? parseInt(formData.respiratoryRate) : null,
        oxygenSaturation: formData.oxygenSaturation ? parseFloat(formData.oxygenSaturation) : null,
        status: formData.status
      }

      if (selectedRecord) {
        // Update existing record
        await api.put(`/medical-records/${selectedRecord.id}`, payload)
        showToast('Medical record updated successfully', 'success')
      } else {
        // Create new record
        await api.post('/medical-records', payload)
        showToast('Medical record created successfully', 'success')
      }
      
      setShowModal(false)
      resetForm()
      fetchData()
    } catch (error: any) {
      console.error('Error saving medical record:', error)
      const message = error.response?.data?.message || 'Failed to save medical record'
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
      await api.delete(`/medical-records/${deleteId}`)
      showToast('Medical record deleted successfully', 'success')
      setShowDeleteConfirm(false)
      setDeleteId(null)
      fetchData()
    } catch (error: any) {
      console.error('Error deleting medical record:', error)
      const message = error.response?.data?.message || 'Failed to delete medical record'
      showToast(message, 'error')
    }
  }

  const resetPrescriptionForm = (): void => {
    setPrescriptionFormData({
      medicationName: '',
      genericName: '',
      dosage: '',
      frequency: '',
      duration: '',
      quantity: '',
      unitPrice: '',
      instructions: '',
      schedule: '',
      prescribedDate: new Date().toISOString().split('T')[0],
      startDate: '',
      endDate: '',
      status: 'Active',
      notes: ''
    })
    setEditingPrescription(null)
  }

  const handleAddPrescription = (): void => {
    resetPrescriptionForm()
    setShowPrescriptionModal(true)
  }

  const handleEditPrescription = (prescription: Prescription): void => {
    setPrescriptionFormData({
      medicationName: prescription.medicationName || '',
      genericName: prescription.genericName || '',
      dosage: prescription.dosage || '',
      frequency: prescription.frequency || '',
      duration: prescription.duration || '',
      quantity: prescription.quantity?.toString() || '',
      unitPrice: prescription.unitPrice?.toString() || '',
      instructions: prescription.instructions || '',
      schedule: prescription.schedule || '',
      prescribedDate: prescription.prescribedDate ? new Date(prescription.prescribedDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      startDate: prescription.startDate ? new Date(prescription.startDate).toISOString().split('T')[0] : '',
      endDate: prescription.endDate ? new Date(prescription.endDate).toISOString().split('T')[0] : '',
      status: prescription.status || 'Active',
      notes: prescription.notes || ''
    })
    setEditingPrescription(prescription)
    setShowPrescriptionModal(true)
  }

  const handleDeletePrescriptionClick = (id: number): void => {
    setDeletePrescriptionId(id)
    setShowDeletePrescriptionConfirm(true)
  }

  const handleDeletePrescription = async (): Promise<void> => {
    if (!deletePrescriptionId || !selectedRecord) return
    
    try {
      // Note: If there's no DELETE endpoint, we might need to add one
      // For now, trying to delete via the medical records controller
      await api.delete(`/medical-records/${selectedRecord.id}/prescriptions/${deletePrescriptionId}`)
      showToast('Prescription deleted successfully', 'success')
      setShowDeletePrescriptionConfirm(false)
      setDeletePrescriptionId(null)
      // Refresh the medical record to get updated prescriptions
      await handleView(selectedRecord)
    } catch (error: any) {
      console.error('Error deleting prescription:', error)
      // If endpoint doesn't exist, try alternative approach
      if (error.response?.status === 404) {
        showToast('Delete endpoint not available. Please contact administrator.', 'error')
      } else {
        const message = error.response?.data?.message || 'Failed to delete prescription'
        showToast(message, 'error')
      }
    }
  }

  const handlePrescriptionSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!selectedRecord) return

    try {
      const payload: any = {
        medicationName: prescriptionFormData.medicationName,
        genericName: prescriptionFormData.genericName || null,
        dosage: prescriptionFormData.dosage,
        frequency: prescriptionFormData.frequency,
        duration: prescriptionFormData.duration,
        quantity: parseInt(prescriptionFormData.quantity) || 0,
        unitPrice: prescriptionFormData.unitPrice ? parseFloat(prescriptionFormData.unitPrice) : null,
        instructions: prescriptionFormData.instructions || null,
        schedule: prescriptionFormData.schedule || null,
        prescribedDate: new Date(prescriptionFormData.prescribedDate).toISOString(),
        startDate: prescriptionFormData.startDate ? new Date(prescriptionFormData.startDate).toISOString() : null,
        endDate: prescriptionFormData.endDate ? new Date(prescriptionFormData.endDate).toISOString() : null,
        status: prescriptionFormData.status,
        notes: prescriptionFormData.notes || null
      }

      if (editingPrescription) {
        // Update prescription - if endpoint exists
        try {
          await api.put(`/medical-records/${selectedRecord.id}/prescriptions/${editingPrescription.id}`, payload)
          showToast('Prescription updated successfully', 'success')
        } catch (error: any) {
          if (error.response?.status === 404) {
            showToast('Update endpoint not available. Please delete and recreate.', 'error')
          } else {
            throw error
          }
        }
      } else {
        // Add new prescription
        await api.post(`/medical-records/${selectedRecord.id}/prescriptions`, payload)
        showToast('Prescription added successfully', 'success')
      }
      
      setShowPrescriptionModal(false)
      resetPrescriptionForm()
      // Refresh the medical record to get updated prescriptions
      await handleView(selectedRecord)
    } catch (error: any) {
      console.error('Error saving prescription:', error)
      const message = error.response?.data?.message || 'Failed to save prescription'
      showToast(message, 'error')
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Medical Records</h1>
          <p className="mt-1 text-sm text-gray-500">
            View and manage patient medical records
          </p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Medical Record
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search records..."
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
          <div>
            <input
              type="date"
              placeholder="From Date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <input
              type="date"
              placeholder="To Date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
      </div>

      {/* Medical Records Table */}
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
                  Visit Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Chief Complaint
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    No medical records found
                  </td>
                </tr>
              ) : (
                records
                  .filter((record) => {
                    if (!searchTerm) return true
                    const search = searchTerm.toLowerCase()
                    return (
                      record.visitNumber?.toLowerCase().includes(search) ||
                      record.patient?.firstName?.toLowerCase().includes(search) ||
                      record.patient?.lastName?.toLowerCase().includes(search) ||
                      record.chiefComplaint?.toLowerCase().includes(search)
                    )
                  })
                  .map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {record.visitNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.patient ? `${record.patient.firstName} ${record.patient.lastName}` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          {record.visitDate ? new Date(record.visitDate).toLocaleDateString() : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.visitType || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="max-w-xs truncate">
                          {record.chiefComplaint || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          record.status === 'Completed' ? 'bg-green-100 text-green-800' :
                          record.status === 'Active' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {record.status}
                        </span>
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
                          <button
                            onClick={() => handleEdit(record)}
                            className="text-primary-600 hover:text-primary-900"
                            title="Edit"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(record.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Medical Record Modal */}
      {showViewModal && selectedRecord && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Medical Record: {selectedRecord.visitNumber}
              </h3>
              <button
                onClick={() => {
                  setShowViewModal(false)
                  setSelectedRecord(null)
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="space-y-6">
              {/* Basic Information */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3">Basic Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Patient</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedRecord.patient ? `${selectedRecord.patient.firstName} ${selectedRecord.patient.lastName}` : '-'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Provider</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedRecord.provider ? `${selectedRecord.provider.firstName} ${selectedRecord.provider.lastName}` : '-'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Visit Date</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedRecord.visitDate ? new Date(selectedRecord.visitDate).toLocaleDateString() : '-'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Visit Type</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedRecord.visitType || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedRecord.status || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Vitals */}
              {(selectedRecord.height || selectedRecord.weight || selectedRecord.bloodPressureSystolic || 
                selectedRecord.temperature || selectedRecord.pulse || selectedRecord.respiratoryRate || 
                selectedRecord.oxygenSaturation) && (
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-3">Vitals</h4>
                  <div className="grid grid-cols-3 gap-4">
                    {selectedRecord.height && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Height</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedRecord.height} cm</p>
                      </div>
                    )}
                    {selectedRecord.weight && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Weight</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedRecord.weight} kg</p>
                      </div>
                    )}
                    {(selectedRecord.bloodPressureSystolic || selectedRecord.bloodPressureDiastolic) && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Blood Pressure</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {selectedRecord.bloodPressureSystolic}/{selectedRecord.bloodPressureDiastolic} mmHg
                        </p>
                      </div>
                    )}
                    {selectedRecord.temperature && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Temperature</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedRecord.temperature} °C</p>
                      </div>
                    )}
                    {selectedRecord.pulse && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Pulse</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedRecord.pulse} bpm</p>
                      </div>
                    )}
                    {selectedRecord.respiratoryRate && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Respiratory Rate</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedRecord.respiratoryRate} /min</p>
                      </div>
                    )}
                    {selectedRecord.oxygenSaturation && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Oxygen Saturation</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedRecord.oxygenSaturation}%</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Clinical Information */}
              {selectedRecord.chiefComplaint && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Chief Complaint</label>
                  <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{selectedRecord.chiefComplaint}</p>
                </div>
              )}
              {selectedRecord.historyOfPresentIllness && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">History of Present Illness</label>
                  <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{selectedRecord.historyOfPresentIllness}</p>
                </div>
              )}
              {selectedRecord.reviewOfSystems && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Review of Systems</label>
                  <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{selectedRecord.reviewOfSystems}</p>
                </div>
              )}
              {selectedRecord.physicalExamination && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Physical Examination</label>
                  <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{selectedRecord.physicalExamination}</p>
                </div>
              )}
              {selectedRecord.assessment && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Assessment</label>
                  <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{selectedRecord.assessment}</p>
                </div>
              )}
              {selectedRecord.plan && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Plan</label>
                  <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{selectedRecord.plan}</p>
                </div>
              )}
              {selectedRecord.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{selectedRecord.notes}</p>
                </div>
              )}

              {/* Prescriptions Section */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-md font-semibold text-gray-900 flex items-center">
                    <Pill className="h-5 w-5 mr-2" />
                    Prescriptions
                  </h4>
                  <button
                    onClick={handleAddPrescription}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-primary-600 hover:bg-primary-700"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Prescription
                  </button>
                </div>
                {(selectedRecord as any).prescriptions && Array.isArray((selectedRecord as any).prescriptions) && (selectedRecord as any).prescriptions.length > 0 ? (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Medication</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Dosage</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Frequency</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {(selectedRecord as any).prescriptions.map((prescription: Prescription) => (
                          <tr key={prescription.id} className="hover:bg-gray-50">
                            <td className="px-4 py-2 text-sm">
                              <div className="font-medium text-gray-900">{prescription.medicationName}</div>
                              {prescription.genericName && (
                                <div className="text-xs text-gray-500">{prescription.genericName}</div>
                              )}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-500">{prescription.dosage}</td>
                            <td className="px-4 py-2 text-sm text-gray-500">{prescription.frequency}</td>
                            <td className="px-4 py-2 text-sm text-gray-500">{prescription.duration}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">
                              {prescription.totalPrice ? `₹${prescription.totalPrice.toFixed(2)}` : '-'}
                            </td>
                            <td className="px-4 py-2">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                prescription.status === 'Active' ? 'bg-green-100 text-green-800' :
                                prescription.status === 'Completed' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {prescription.status}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-right text-sm font-medium">
                              <div className="flex justify-end space-x-2">
                                <button
                                  onClick={() => handleEditPrescription(prescription)}
                                  className="text-primary-600 hover:text-primary-900"
                                  title="Edit"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeletePrescriptionClick(prescription.id)}
                                  className="text-red-600 hover:text-red-900"
                                  title="Delete"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-lg p-4 text-center text-gray-500">
                    No prescriptions added yet. Click "Add Prescription" to add one.
                  </div>
                )}
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowViewModal(false)
                  handleEdit(selectedRecord)
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Edit Record
              </button>
              <button
                onClick={() => {
                  setShowViewModal(false)
                  setSelectedRecord(null)
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Prescription Modal */}
      {showPrescriptionModal && selectedRecord && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-3xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingPrescription ? 'Edit Prescription' : 'Add Prescription'}
              </h3>
              <button
                onClick={() => {
                  setShowPrescriptionModal(false)
                  resetPrescriptionForm()
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            <form onSubmit={handlePrescriptionSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Medication Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={prescriptionFormData.medicationName}
                    onChange={(e) => setPrescriptionFormData({ ...prescriptionFormData, medicationName: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Generic Name
                  </label>
                  <input
                    type="text"
                    value={prescriptionFormData.genericName}
                    onChange={(e) => setPrescriptionFormData({ ...prescriptionFormData, genericName: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Dosage *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., 500mg"
                    value={prescriptionFormData.dosage}
                    onChange={(e) => setPrescriptionFormData({ ...prescriptionFormData, dosage: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Frequency *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Twice daily"
                    value={prescriptionFormData.frequency}
                    onChange={(e) => setPrescriptionFormData({ ...prescriptionFormData, frequency: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Duration *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., 7 days"
                    value={prescriptionFormData.duration}
                    onChange={(e) => setPrescriptionFormData({ ...prescriptionFormData, duration: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={prescriptionFormData.quantity}
                    onChange={(e) => setPrescriptionFormData({ ...prescriptionFormData, quantity: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Unit Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={prescriptionFormData.unitPrice}
                    onChange={(e) => setPrescriptionFormData({ ...prescriptionFormData, unitPrice: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Status *
                  </label>
                  <select
                    required
                    value={prescriptionFormData.status}
                    onChange={(e) => setPrescriptionFormData({ ...prescriptionFormData, status: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                    <option value="Discontinued">Discontinued</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Prescribed Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={prescriptionFormData.prescribedDate}
                    onChange={(e) => setPrescriptionFormData({ ...prescriptionFormData, prescribedDate: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={prescriptionFormData.startDate}
                    onChange={(e) => setPrescriptionFormData({ ...prescriptionFormData, startDate: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={prescriptionFormData.endDate}
                    onChange={(e) => setPrescriptionFormData({ ...prescriptionFormData, endDate: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Schedule
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Schedule H"
                    value={prescriptionFormData.schedule}
                    onChange={(e) => setPrescriptionFormData({ ...prescriptionFormData, schedule: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Instructions
                </label>
                <textarea
                  rows={3}
                  value={prescriptionFormData.instructions}
                  onChange={(e) => setPrescriptionFormData({ ...prescriptionFormData, instructions: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., Take after meals"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Notes
                </label>
                <textarea
                  rows={2}
                  value={prescriptionFormData.notes}
                  onChange={(e) => setPrescriptionFormData({ ...prescriptionFormData, notes: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowPrescriptionModal(false)
                    resetPrescriptionForm()
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                >
                  {editingPrescription ? 'Update' : 'Add'} Prescription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationDialog
        isOpen={showDeletePrescriptionConfirm}
        title="Delete Prescription"
        message="Are you sure you want to delete this prescription? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleDeletePrescription}
        onCancel={() => {
          setShowDeletePrescriptionConfirm(false)
          setDeletePrescriptionId(null)
        }}
      />

      {/* Add/Edit Medical Record Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {selectedRecord ? 'Edit Medical Record' : 'Add Medical Record'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false)
                  resetForm()
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3">Basic Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Patient *
                    </label>
                    <select
                      required
                      value={formData.patientId}
                      onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">Select Patient</option>
                      {patients.map((patient) => (
                        <option key={patient.id} value={patient.id}>
                          {patient.firstName} {patient.lastName} (ID: {patient.patientId})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Provider
                    </label>
                    <select
                      value={formData.providerId}
                      onChange={(e) => setFormData({ ...formData, providerId: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">Select Provider</option>
                      {providers.map((provider) => (
                        <option key={provider.id} value={provider.id}>
                          {provider.firstName} {provider.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Visit Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.visitDate}
                      onChange={(e) => setFormData({ ...formData, visitDate: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Visit Type *
                    </label>
                    <select
                      required
                      value={formData.visitType}
                      onChange={(e) => setFormData({ ...formData, visitType: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="Consultation">Consultation</option>
                      <option value="Follow-up">Follow-up</option>
                      <option value="Emergency">Emergency</option>
                      <option value="Procedure">Procedure</option>
                      <option value="Check-up">Check-up</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Status *
                    </label>
                    <select
                      required
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="Active">Active</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Vitals */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3">Vitals</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Height (cm)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.height}
                      onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Weight (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Blood Pressure (Systolic)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.bloodPressureSystolic}
                      onChange={(e) => setFormData({ ...formData, bloodPressureSystolic: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Blood Pressure (Diastolic)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.bloodPressureDiastolic}
                      onChange={(e) => setFormData({ ...formData, bloodPressureDiastolic: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Temperature (°C)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.temperature}
                      onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Pulse (bpm)</label>
                    <input
                      type="number"
                      value={formData.pulse}
                      onChange={(e) => setFormData({ ...formData, pulse: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Respiratory Rate (/min)</label>
                    <input
                      type="number"
                      value={formData.respiratoryRate}
                      onChange={(e) => setFormData({ ...formData, respiratoryRate: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Oxygen Saturation (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.oxygenSaturation}
                      onChange={(e) => setFormData({ ...formData, oxygenSaturation: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
              </div>

              {/* Clinical Information */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3">Clinical Information</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Chief Complaint</label>
                    <textarea
                      rows={2}
                      value={formData.chiefComplaint}
                      onChange={(e) => setFormData({ ...formData, chiefComplaint: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">History of Present Illness</label>
                    <textarea
                      rows={3}
                      value={formData.historyOfPresentIllness}
                      onChange={(e) => setFormData({ ...formData, historyOfPresentIllness: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Review of Systems</label>
                    <textarea
                      rows={3}
                      value={formData.reviewOfSystems}
                      onChange={(e) => setFormData({ ...formData, reviewOfSystems: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Physical Examination</label>
                    <textarea
                      rows={3}
                      value={formData.physicalExamination}
                      onChange={(e) => setFormData({ ...formData, physicalExamination: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Assessment</label>
                    <textarea
                      rows={3}
                      value={formData.assessment}
                      onChange={(e) => setFormData({ ...formData, assessment: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Plan</label>
                    <textarea
                      rows={3}
                      value={formData.plan}
                      onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <textarea
                      rows={3}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    resetForm()
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                >
                  {selectedRecord ? 'Update' : 'Create'} Medical Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        title="Delete Medical Record"
        message="Are you sure you want to delete this medical record? This action cannot be undone."
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

export default MedicalRecords

