import { useEffect, useState } from 'react'
import api from '../services/api'
import { Plus, Calendar, DollarSign, CheckCircle, XCircle } from 'lucide-react'
import { InstallmentPlan, Student, Fee } from '../types'
import { useToast } from '../hooks/useToast'
import { TableSkeleton } from '../components/LoadingSkeleton'
import ConfirmationDialog from '../components/ConfirmationDialog'

const InstallmentPlans = () => {
  const [plans, setPlans] = useState<InstallmentPlan[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [fees, setFees] = useState<Fee[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [showModal, setShowModal] = useState<boolean>(false)
  const [selectedPlan, setSelectedPlan] = useState<InstallmentPlan | null>(null)
  const { showToast, ToastContainer } = useToast()

  const [formData, setFormData] = useState({
    feeId: '',
    studentId: '',
    planName: '',
    numberOfInstallments: 3,
    totalAmount: 0,
    startDate: new Date().toISOString().split('T')[0],
    frequency: 'Monthly' as 'Monthly' | 'Quarterly' | 'Weekly',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async (): Promise<void> => {
    try {
      const [plansRes, studentsRes, feesRes] = await Promise.all([
        api.get<{ data: { data: InstallmentPlan[] } }>('/installments'),
        api.get<{ data: { data: Student[] } }>('/students'),
        api.get<{ data: { data: Fee[] } }>('/fees'),
      ])
      setPlans(plansRes.data.data?.data || plansRes.data.data || [])
      setStudents(studentsRes.data.data?.data || studentsRes.data.data || [])
      setFees(feesRes.data.data?.data || feesRes.data.data || [])
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
      await api.post('/installments', formData)
      setShowModal(false)
      setFormData({
        feeId: '',
        studentId: '',
        planName: '',
        numberOfInstallments: 3,
        totalAmount: 0,
        startDate: new Date().toISOString().split('T')[0],
        frequency: 'Monthly',
      })
      showToast('Installment plan created successfully', 'success')
      fetchData()
    } catch (error: any) {
      console.error('Error creating plan:', error)
      const message = error.response?.data?.message || 'Failed to create plan'
      showToast(message, 'error')
    }
  }

  const handleViewPlan = (plan: InstallmentPlan): void => {
    setSelectedPlan(plan)
  }

  if (loading) {
    return <TableSkeleton rows={8} columns={6} />
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Installment Plans</h1>
          <p className="mt-1 text-sm text-gray-500">Manage fee installment payment plans</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
        >
          <Plus className="h-5 w-5 mr-2" />
          Create Plan
        </button>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <div key={plan.id} className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{plan.planName}</h3>
                <p className="text-sm text-gray-500">
                  {plan.student?.firstName} {plan.student?.lastName}
                </p>
              </div>
              <span
                className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  plan.status === 'Completed'
                    ? 'bg-green-100 text-green-800'
                    : plan.status === 'Cancelled'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {plan.status}
              </span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Total Amount:</span>
                <span className="font-semibold">₹{plan.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Installments:</span>
                <span className="font-semibold">{plan.numberOfInstallments}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Per Installment:</span>
                <span className="font-semibold">₹{plan.installmentAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Frequency:</span>
                <span className="font-semibold">{plan.frequency}</span>
              </div>
            </div>
            <button
              onClick={() => handleViewPlan(plan)}
              className="mt-4 w-full px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-900 border border-primary-600 rounded-md"
            >
              View Details
            </button>
          </div>
        ))}
      </div>

      {/* Create Plan Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Create Installment Plan</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Student *</label>
                <select
                  required
                  value={formData.studentId}
                  onChange={(e) => {
                    setFormData({ ...formData, studentId: e.target.value })
                    const student = students.find((s) => s.id === parseInt(e.target.value))
                    if (student) {
                      const studentFees = fees.filter((f) => f.studentId === student.id && f.balanceAmount > 0)
                      setFormData((prev) => ({ ...prev, fees: studentFees }))
                    }
                  }}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select Student</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.studentId} - {s.firstName} {s.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Fee *</label>
                <select
                  required
                  value={formData.feeId}
                  onChange={(e) => {
                    const feeId = e.target.value
                    const fee = fees.find((f) => f.id === parseInt(feeId))
                    setFormData({
                      ...formData,
                      feeId: feeId,
                      totalAmount: fee?.balanceAmount || 0,
                    })
                  }}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select Fee</option>
                  {fees
                    .filter((f) => f.studentId === parseInt(formData.studentId) && f.balanceAmount > 0)
                    .map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.feeType} - ₹{f.balanceAmount.toFixed(2)}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Plan Name *</label>
                <input
                  type="text"
                  required
                  value={formData.planName}
                  onChange={(e) => setFormData({ ...formData, planName: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Installments *</label>
                  <input
                    type="number"
                    required
                    min="2"
                    max="12"
                    value={formData.numberOfInstallments}
                    onChange={(e) => setFormData({ ...formData, numberOfInstallments: parseInt(e.target.value) })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Frequency *</label>
                  <select
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value as any })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Weekly">Weekly</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Start Date *</label>
                <input
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                >
                  Create Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Plan Details Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">{selectedPlan.planName}</h3>
              <button
                onClick={() => setSelectedPlan(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-500">Student:</span>
                  <p className="font-semibold">
                    {selectedPlan.student?.firstName} {selectedPlan.student?.lastName}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Total Amount:</span>
                  <p className="font-semibold">₹{selectedPlan.totalAmount.toFixed(2)}</p>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Installments</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">#</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Amount</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Due Date</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedPlan.installments?.map((inst) => (
                        <tr key={inst.id}>
                          <td className="px-4 py-2 text-sm">{inst.installmentNumber}</td>
                          <td className="px-4 py-2 text-sm">₹{inst.amount.toFixed(2)}</td>
                          <td className="px-4 py-2 text-sm">
                            {new Date(inst.dueDate).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            <span
                              className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                inst.status === 'Paid'
                                  ? 'bg-green-100 text-green-800'
                                  : inst.status === 'Overdue'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {inst.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  )
}

export default InstallmentPlans

