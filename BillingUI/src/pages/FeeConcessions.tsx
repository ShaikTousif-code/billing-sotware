import { useEffect, useState } from 'react'
import api from '../services/api'
import { Plus, CheckCircle, XCircle, DollarSign } from 'lucide-react'
import { FeeConcession, Student, Fee } from '../types'
import { useToast } from '../hooks/useToast'
import { TableSkeleton } from '../components/LoadingSkeleton'

const FeeConcessions = () => {
  const [concessions, setConcessions] = useState<FeeConcession[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [fees, setFees] = useState<Fee[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [showModal, setShowModal] = useState<boolean>(false)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const { showToast, ToastContainer } = useToast()

  const [formData, setFormData] = useState({
    studentId: '',
    feeId: '',
    concessionType: 'Discount' as 'Discount' | 'Waiver' | 'Scholarship',
    amount: 0,
    percentage: 0,
    reason: '',
  })

  useEffect(() => {
    fetchData()
  }, [statusFilter])

  const fetchData = async (): Promise<void> => {
    try {
      const params: any = {}
      if (statusFilter) params.status = statusFilter

      const [concessionsRes, studentsRes, feesRes] = await Promise.all([
        api.get<{ success: boolean; data: FeeConcession[] }>('/fee-concessions', { params }),
        api.get<{ success: boolean; data: Student[] }>('/students'),
        api.get<{ success: boolean; data: Fee[] }>('/fees'),
      ])
      // ApiResponse structure: { success: true, data: T }
      setConcessions(concessionsRes.data?.data || [])
      setStudents(studentsRes.data?.data || [])
      setFees(feesRes.data?.data || [])
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
      const payload = {
        studentId: parseInt(formData.studentId),
        feeId: formData.feeId ? parseInt(formData.feeId) : null,
        concessionType: formData.concessionType,
        amount: formData.amount || 0,
        percentage: formData.percentage || null,
        reason: formData.reason,
        validFrom: new Date().toISOString(),
      }
      await api.post('/fee-concessions', payload)
      setShowModal(false)
      setFormData({
        studentId: '',
        feeId: '',
        concessionType: 'Discount',
        amount: 0,
        percentage: 0,
        reason: '',
      })
      showToast('Concession request submitted successfully', 'success')
      fetchData()
    } catch (error: any) {
      console.error('Error creating concession:', error)
      const message = error.response?.data?.message || error.response?.data?.error || 'Failed to create concession'
      showToast(message, 'error')
    }
  }

  const handleApprove = async (id: number): Promise<void> => {
    try {
      await api.post(`/fee-concessions/${id}/approve`)
      showToast('Concession approved', 'success')
      fetchData()
    } catch (error: any) {
      showToast('Failed to approve concession', 'error')
    }
  }

  const handleReject = async (id: number): Promise<void> => {
    try {
      await api.post(`/fee-concessions/${id}/reject`, { reason: 'Rejected by administrator' })
      showToast('Concession rejected', 'success')
      fetchData()
    } catch (error: any) {
      showToast('Failed to reject concession', 'error')
    }
  }

  if (loading) {
    return <TableSkeleton rows={8} columns={6} />
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fee Concessions</h1>
          <p className="mt-1 text-sm text-gray-500">Manage fee discounts, waivers, and scholarships</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
        >
          <Plus className="h-5 w-5 mr-2" />
          Request Concession
        </button>
      </div>

      {/* Filter */}
      <div className="bg-white shadow rounded-lg p-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Concessions Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {concessions.map((concession) => (
              <tr key={concession.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {concession.student?.firstName} {concession.student?.lastName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {concession.concessionType}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {concession.percentage
                    ? `${concession.percentage}%`
                    : `₹${concession.amount.toFixed(2)}`}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{concession.reason}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      concession.status === 'Approved'
                        ? 'bg-green-100 text-green-800'
                        : concession.status === 'Rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {concession.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {concession.status === 'Pending' && (
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleApprove(concession.id)}
                        className="text-green-600 hover:text-green-900"
                      >
                        <CheckCircle className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleReject(concession.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <XCircle className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Request Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Request Fee Concession</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Student *</label>
                <select
                  required
                  value={formData.studentId}
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
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
                <label className="block text-sm font-medium text-gray-700">Fee (Optional)</label>
                <select
                  value={formData.feeId}
                  onChange={(e) => setFormData({ ...formData, feeId: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">All Fees</option>
                  {fees
                    .filter((f) => f.studentId === parseInt(formData.studentId))
                    .map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.feeType} - ₹{f.balanceAmount.toFixed(2)}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Concession Type *</label>
                <select
                  required
                  value={formData.concessionType}
                  onChange={(e) => setFormData({ ...formData, concessionType: e.target.value as any })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="Discount">Discount</option>
                  <option value="Waiver">Waiver</option>
                  <option value="Scholarship">Scholarship</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Percentage</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.percentage}
                    onChange={(e) => setFormData({ ...formData, percentage: parseFloat(e.target.value) })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Reason *</label>
                <textarea
                  required
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  rows={3}
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
                  Submit Request
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

export default FeeConcessions

