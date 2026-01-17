import { useEffect, useState } from 'react'
import api from '../services/api'
import { format, parseISO, addDays, startOfWeek, endOfWeek } from 'date-fns'
import { Plus, Calendar, Clock, User, MapPin, Stethoscope, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { Appointment, Patient, User as UserType, AppointmentWorkflowStatus } from '../types'
import { useToast } from '../hooks/useToast'
import { TableSkeleton } from '../components/LoadingSkeleton'
import ConfirmationDialog from '../components/ConfirmationDialog'

const Appointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [doctors, setDoctors] = useState<UserType[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [showModal, setShowModal] = useState<boolean>(false)
  const [showCalendar, setShowCalendar] = useState<boolean>(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [workflowStatuses, setWorkflowStatuses] = useState<Record<number, AppointmentWorkflowStatus>>({})
  const { showToast, ToastContainer } = useToast()

  const [formData, setFormData] = useState({
    patientId: '',
    customerId: '',
    serviceId: '',
    appointmentType: '',
    specialty: '',
    appointmentDate: new Date().toISOString().split('T')[0],
    appointmentTime: '09:00',
    durationMinutes: 30,
    assignedToUserId: '',
    doctorName: '',
    location: '',
    notes: '',
    reasonForVisit: '',
    consultationFee: '',
    consultationFeePaymentMode: 'Cash', // Default payment mode
    status: 'Scheduled' as Appointment['status']
  })

  useEffect(() => {
    fetchData()
  }, [selectedDate])

  const fetchData = async (): Promise<void> => {
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      const [appointmentsRes, patientsRes, doctorsRes] = await Promise.all([
        api.get<{ data: { data: Appointment[] } }>(`/appointments?date=${dateStr}`),
        api.get<{ data: { data: Patient[] } }>('/patients'),
        api.get<{ data: { data: UserType[] } }>('/auth/users')
      ])
      
      const appointmentsList = appointmentsRes.data.data?.data || appointmentsRes.data.data || []
      setAppointments(appointmentsList)
      setPatients(patientsRes.data.data?.data || patientsRes.data.data || [])
      setDoctors(doctorsRes.data.data?.data || doctorsRes.data.data || [])
      
      // Fetch workflow statuses for each appointment
      const statusPromises = appointmentsList
        .filter(a => a.patientId) // Only for patient appointments
        .map(async (appointment) => {
          try {
            const statusRes = await api.get<{ data: { data: AppointmentWorkflowStatus } }>(`/appointments/${appointment.id}/workflow-status`)
            return { id: appointment.id, status: statusRes.data.data?.data || statusRes.data.data }
          } catch {
            return null
          }
        })
      
      const statuses = await Promise.all(statusPromises)
      const statusMap: Record<number, AppointmentWorkflowStatus> = {}
      statuses.forEach(s => {
        if (s) statusMap[s.id] = s.status
      })
      setWorkflowStatuses(statusMap)
    } catch (error) {
      console.error('Error fetching data:', error)
      showToast('Failed to fetch data', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    try {
      // Convert time string (HH:mm) to TimeSpan format (HH:mm:ss)
      const timeParts = formData.appointmentTime.split(':')
      const timeSpan = timeParts.length === 2 
        ? `${timeParts[0]}:${timeParts[1]}:00` 
        : formData.appointmentTime

      const payload = {
        patientId: formData.patientId ? parseInt(formData.patientId) : null,
        customerId: formData.customerId ? parseInt(formData.customerId) : null,
        serviceId: formData.serviceId ? parseInt(formData.serviceId) : null,
        appointmentType: formData.appointmentType || null,
        specialty: formData.specialty || null,
        appointmentDate: new Date(formData.appointmentDate).toISOString(),
        appointmentTime: timeSpan,
        durationMinutes: parseInt(formData.durationMinutes.toString()),
        assignedToUserId: formData.assignedToUserId ? parseInt(formData.assignedToUserId) : null,
        doctorName: formData.doctorName || null,
        location: formData.location || null,
        notes: formData.notes || null,
        reasonForVisit: formData.reasonForVisit || null,
        consultationFee: formData.consultationFee ? parseFloat(formData.consultationFee) : null,
        consultationFeePaymentMode: formData.consultationFeePaymentMode || null,
        status: formData.status
      }

      if (selectedAppointment) {
        await api.put(`/appointments/${selectedAppointment.id}`, payload)
        showToast('Appointment updated successfully', 'success')
      } else {
        await api.post('/appointments', payload)
        showToast('Appointment created successfully', 'success')
      }

      setShowModal(false)
      resetForm()
      fetchData()
    } catch (error: any) {
      console.error('Error saving appointment:', error)
      showToast(error.response?.data?.message || 'Failed to save appointment', 'error')
    }
  }

  const handleDelete = async (id: number): Promise<void> => {
    try {
      await api.delete(`/appointments/${id}`)
      showToast('Appointment deleted successfully', 'success')
      fetchData()
    } catch (error: any) {
      console.error('Error deleting appointment:', error)
      showToast(error.response?.data?.message || 'Failed to delete appointment', 'error')
    }
  }

  const handleStatusUpdate = async (id: number, status: Appointment['status'], reason?: string): Promise<void> => {
    try {
      await api.put(`/appointments/${id}/status`, { status, cancellationReason: reason })
      showToast('Appointment status updated successfully', 'success')
      fetchData()
    } catch (error: any) {
      console.error('Error updating status:', error)
      showToast(error.response?.data?.message || 'Failed to update status', 'error')
    }
  }

  const handleStartConsultation = async (appointmentId: number): Promise<void> => {
    try {
      // Get appointment to check if payment mode is set
      const appointment = appointments.find(a => a.id === appointmentId)
      const paymentMode = appointment?.consultationFeePaymentMode
      
      // If consultation fee is set but payment mode is not, prompt for it
      if (appointment?.consultationFee && !paymentMode) {
        const selectedMode = prompt('Please select payment mode for consultation fee:\n1. Cash\n2. UPI\n3. Card\n4. BankTransfer\n5. Cheque\n6. Online\n\nEnter the number or payment mode name:', 'Cash')
        if (!selectedMode) {
          showToast('Payment mode is required', 'error')
          return
        }
        // Map number to payment mode
        const modeMap: Record<string, string> = {
          '1': 'Cash',
          '2': 'UPI',
          '3': 'Card',
          '4': 'BankTransfer',
          '5': 'Cheque',
          '6': 'Online'
        }
        const finalMode = modeMap[selectedMode] || selectedMode
        
        // Update appointment with payment mode first
        await api.put(`/appointments/${appointmentId}`, {
          ...appointment,
          consultationFeePaymentMode: finalMode
        })
        
        await api.post(`/appointments/${appointmentId}/start-consultation`, {
          consultationFeePaymentMode: finalMode
        })
      } else {
        await api.post(`/appointments/${appointmentId}/start-consultation`, paymentMode ? {
          consultationFeePaymentMode: paymentMode
        } : {})
      }
      
      showToast('Consultation started successfully', 'success')
      fetchData()
    } catch (error: any) {
      console.error('Error starting consultation:', error)
      showToast(error.response?.data?.message || 'Failed to start consultation', 'error')
    }
  }

  const handleCompleteConsultation = async (medicalRecordId: number): Promise<void> => {
    try {
      await api.post(`/medical-workflow/medical-records/${medicalRecordId}/complete-consultation`)
      showToast('Consultation completed successfully', 'success')
      fetchData()
    } catch (error: any) {
      console.error('Error completing consultation:', error)
      showToast(error.response?.data?.message || 'Failed to complete consultation', 'error')
    }
  }

  const handleGenerateMedicineBill = async (medicalRecordId: number): Promise<void> => {
    try {
      await api.post(`/medical-workflow/medical-records/${medicalRecordId}/generate-medicine-bill`, {})
      showToast('Medicine bill generated successfully', 'success')
      fetchData()
    } catch (error: any) {
      console.error('Error generating medicine bill:', error)
      showToast(error.response?.data?.message || 'Failed to generate medicine bill', 'error')
    }
  }

  const handleProcessPayment = async (invoiceId: number, amount: number, paymentMode: string): Promise<void> => {
    try {
      await api.post(`/medical-workflow/invoices/${invoiceId}/process-payment-and-exit`, {
        amount,
        paymentMode,
        referenceNumber: ''
      })
      showToast('Payment processed and patient workflow completed', 'success')
      fetchData()
    } catch (error: any) {
      console.error('Error processing payment:', error)
      showToast(error.response?.data?.message || 'Failed to process payment', 'error')
    }
  }

  const resetForm = (): void => {
    setFormData({
      patientId: '',
      customerId: '',
      serviceId: '',
      appointmentType: '',
      specialty: '',
      appointmentDate: new Date().toISOString().split('T')[0],
      appointmentTime: '09:00',
      durationMinutes: 30,
      assignedToUserId: '',
      doctorName: '',
      location: '',
      notes: '',
      reasonForVisit: '',
      consultationFee: '',
      consultationFeePaymentMode: 'Cash',
      status: 'Scheduled'
    })
    setSelectedAppointment(null)
  }

  const handleEdit = (appointment: Appointment): void => {
    setSelectedAppointment(appointment)
    setFormData({
      patientId: appointment.patientId?.toString() || '',
      customerId: appointment.customerId?.toString() || '',
      serviceId: appointment.serviceId?.toString() || '',
      appointmentType: appointment.appointmentType || '',
      specialty: appointment.specialty || '',
      appointmentDate: appointment.appointmentDate.split('T')[0],
      appointmentTime: appointment.appointmentTime.substring(0, 5),
      durationMinutes: appointment.durationMinutes,
      assignedToUserId: appointment.assignedToUserId?.toString() || '',
      doctorName: appointment.doctorName || '',
      location: appointment.location || '',
      notes: appointment.notes || '',
      reasonForVisit: appointment.reasonForVisit || '',
      consultationFee: appointment.consultationFee?.toString() || '',
      consultationFeePaymentMode: appointment.consultationFeePaymentMode || 'Cash',
      status: appointment.status
    })
    setShowModal(true)
  }

  const getStatusColor = (status: Appointment['status']): string => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800'
      case 'Confirmed':
        return 'bg-blue-100 text-blue-800'
      case 'InProgress':
        return 'bg-yellow-100 text-yellow-800'
      case 'Cancelled':
        return 'bg-red-100 text-red-800'
      case 'NoShow':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: Appointment['status']) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle className="w-4 h-4" />
      case 'Cancelled':
        return <XCircle className="w-4 h-4" />
      default:
        return <AlertCircle className="w-4 h-4" />
    }
  }

  if (loading) {
    return <TableSkeleton />
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="mt-1 text-sm text-gray-500">Manage patient appointments</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode(viewMode === 'list' ? 'calendar' : 'list')}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center space-x-2"
          >
            <Calendar className="w-4 h-4" />
            <span>{viewMode === 'list' ? 'Calendar View' : 'List View'}</span>
          </button>
          <button
            onClick={() => {
              resetForm()
              setShowModal(true)
            }}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Appointment</span>
          </button>
        </div>
      </div>

      {/* Date Selector */}
      <div className="flex items-center space-x-4">
        <input
          type="date"
          value={format(selectedDate, 'yyyy-MM-dd')}
          onChange={(e) => setSelectedDate(parseISO(e.target.value))}
          className="px-3 py-2 border border-gray-300 rounded-md"
        />
        <button
          onClick={() => setSelectedDate(new Date())}
          className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
        >
          Today
        </button>
      </div>

      {/* Appointments List */}
      {viewMode === 'list' && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient/Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Doctor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {appointments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                      No appointments found for this date
                    </td>
                  </tr>
                ) : (
                  appointments.map((appointment) => (
                    <tr key={appointment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">
                            {appointment.appointmentTime.substring(0, 5)}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({appointment.durationMinutes} min)
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {appointment.patient
                                ? `${appointment.patient.firstName} ${appointment.patient.lastName}`
                                : appointment.customer?.name || 'N/A'}
                            </div>
                            {appointment.patient && (
                              <div className="text-xs text-gray-500">{appointment.patient.patientId}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <Stethoscope className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900">
                            {appointment.doctorName || appointment.assignedTo
                              ? `${appointment.assignedTo?.firstName || ''} ${appointment.assignedTo?.lastName || ''}`.trim() || appointment.doctorName
                              : 'Unassigned'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{appointment.appointmentType || 'General'}</div>
                        {appointment.specialty && (
                          <div className="text-xs text-gray-500">{appointment.specialty}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {appointment.consultationFee ? `₹${appointment.consultationFee.toFixed(2)}` : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            appointment.status
                          )}`}
                        >
                          {getStatusIcon(appointment.status)}
                          <span className="ml-1">{appointment.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex flex-col space-y-1">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEdit(appointment)}
                              className="text-primary-600 hover:text-primary-900 text-xs"
                            >
                              Edit
                            </button>
                            {appointment.status === 'Scheduled' && (
                              <>
                                <button
                                  onClick={() => handleStatusUpdate(appointment.id, 'Confirmed')}
                                  className="text-blue-600 hover:text-blue-900 text-xs"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => handleStatusUpdate(appointment.id, 'Cancelled', 'Cancelled by user')}
                                  className="text-red-600 hover:text-red-900 text-xs"
                                >
                                  Cancel
                                </button>
                              </>
                            )}
                          </div>
                          {/* Workflow Actions */}
                          {appointment.patientId && workflowStatuses[appointment.id] && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {/* Reception: Start Consultation (bills consultation fee) */}
                              {workflowStatuses[appointment.id].canStartConsultation && (
                                <button
                                  onClick={() => handleStartConsultation(appointment.id)}
                                  className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200"
                                  title="Reception: Start consultation and bill consultation fee"
                                >
                                  Start Consultation
                                </button>
                              )}
                              {/* Doctor: Complete Consultation (no billing) */}
                              {workflowStatuses[appointment.id].canCompleteConsultation && workflowStatuses[appointment.id].medicalRecord && (
                                <button
                                  onClick={() => handleCompleteConsultation(workflowStatuses[appointment.id].medicalRecord!.id)}
                                  className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                                  title="Doctor: Complete consultation"
                                >
                                  Complete Consultation
                                </button>
                              )}
                              {/* Medicine Billing: Generate Medicine Bill */}
                              {workflowStatuses[appointment.id].canGenerateMedicineBill && workflowStatuses[appointment.id].medicalRecord && (
                                <button
                                  onClick={() => handleGenerateMedicineBill(workflowStatuses[appointment.id].medicalRecord!.id)}
                                  className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200"
                                  title="Medicine Billing: Generate bill for prescriptions/procedures"
                                >
                                  Generate Medicine Bill
                                </button>
                              )}
                              {/* Medicine Payment: Pay & Exit */}
                              {workflowStatuses[appointment.id].canProcessPayment && workflowStatuses[appointment.id].invoice && (
                                <button
                                  onClick={() => {
                                    const invoice = workflowStatuses[appointment.id].invoice!
                                    const amount = invoice.balanceAmount || invoice.totalAmount
                                    if (confirm(`Process payment of ₹${amount.toFixed(2)} for medicines?`)) {
                                      handleProcessPayment(invoice.id, amount, 'Cash')
                                    }
                                  }}
                                  className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded hover:bg-purple-200"
                                  title="Medicine Payment: Pay for medicines and exit"
                                >
                                  Pay & Exit
                                </button>
                              )}
                              {workflowStatuses[appointment.id].canExit && (
                                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
                                  Completed
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center font-semibold text-gray-700 py-2">
                {day}
              </div>
            ))}
          </div>
          <div className="text-center text-gray-500 py-8">
            Calendar view coming soon...
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {selectedAppointment ? 'Edit Appointment' : 'New Appointment'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Patient <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.patientId}
                    onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="">Select Patient</option>
                    {patients.map((patient) => (
                      <option key={patient.id} value={patient.id}>
                        {patient.firstName} {patient.lastName} ({patient.patientId})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Doctor/Staff</label>
                  <select
                    value={formData.assignedToUserId}
                    onChange={(e) => setFormData({ ...formData, assignedToUserId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select Doctor</option>
                    {doctors.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        {doctor.firstName} {doctor.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Appointment Type</label>
                  <input
                    type="text"
                    value={formData.appointmentType}
                    onChange={(e) => setFormData({ ...formData, appointmentType: e.target.value })}
                    placeholder="e.g., Consultation, Follow-up"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Specialty</label>
                  <input
                    type="text"
                    value={formData.specialty}
                    onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                    placeholder="e.g., Cardiology, Orthopedics"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.appointmentDate}
                    onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={formData.appointmentTime}
                    onChange={(e) => setFormData({ ...formData, appointmentTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                  <input
                    type="number"
                    value={formData.durationMinutes}
                    onChange={(e) => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) || 30 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    min="15"
                    step="15"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Room 101, Clinic A"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Consultation Fee (₹)</label>
                  <input
                    type="number"
                    value={formData.consultationFee}
                    onChange={(e) => setFormData({ ...formData, consultationFee: e.target.value })}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  {formData.consultationFee && (
                    <div className="mt-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
                      <select
                        value={formData.consultationFeePaymentMode}
                        onChange={(e) => setFormData({ ...formData, consultationFeePaymentMode: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="Cash">Cash</option>
                        <option value="UPI">UPI</option>
                        <option value="Card">Card</option>
                        <option value="BankTransfer">Bank Transfer</option>
                        <option value="Cheque">Cheque</option>
                        <option value="Online">Online</option>
                      </select>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as Appointment['status'] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="InProgress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Visit</label>
                <textarea
                  value={formData.reasonForVisit}
                  onChange={(e) => setFormData({ ...formData, reasonForVisit: e.target.value })}
                  placeholder="Reason for the appointment"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    resetForm()
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  {selectedAppointment ? 'Update' : 'Create'} Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  )
}

export default Appointments
