import { useEffect, useState } from 'react'
import api from '../services/api'
import { format } from 'date-fns'
import { Plus, Eye } from 'lucide-react'

interface JobCard {
  id: number
  jobCardNumber: string
  createdAt: string
  scheduledDate?: string
  completedDate?: string
  status: string
  description?: string
  estimatedCost?: number
  actualCost?: number
  customer?: {
    name: string
  }
  assignedTo?: {
    firstName: string
    lastName: string
  }
}

const JobCards = () => {
  const [jobCards, setJobCards] = useState<JobCard[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [statusFilter, setStatusFilter] = useState<string>('')

  useEffect(() => {
    fetchJobCards()
  }, [statusFilter])

  const fetchJobCards = async (): Promise<void> => {
    try {
      const url = statusFilter ? `/job-cards?status=${statusFilter}` : '/job-cards'
      const response = await api.get<JobCard[]>(url)
      setJobCards(response.data)
    } catch (error) {
      console.error('Error fetching job cards:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800'
      case 'InProgress':
        return 'bg-blue-100 text-blue-800'
      case 'Open':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Job Cards</h1>
          <p className="mt-1 text-sm text-gray-500">Manage service job cards</p>
        </div>
        <div className="flex space-x-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">All Status</option>
            <option value="Open">Open</option>
            <option value="InProgress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {jobCards.map((jobCard) => (
          <div key={jobCard.id} className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{jobCard.jobCardNumber}</h3>
                <p className="text-sm text-gray-500">Customer: {jobCard.customer?.name || 'N/A'}</p>
              </div>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(jobCard.status)}`}>
                {jobCard.status}
              </span>
            </div>
            {jobCard.description && (
              <p className="text-sm text-gray-600 mb-4">{jobCard.description}</p>
            )}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Created:</span>
                <span className="text-gray-900">{format(new Date(jobCard.createdAt), 'MMM dd, yyyy')}</span>
              </div>
              {jobCard.scheduledDate && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Scheduled:</span>
                  <span className="text-gray-900">{format(new Date(jobCard.scheduledDate), 'MMM dd, yyyy')}</span>
                </div>
              )}
              {jobCard.assignedTo && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Assigned To:</span>
                  <span className="text-gray-900">
                    {jobCard.assignedTo.firstName} {jobCard.assignedTo.lastName}
                  </span>
                </div>
              )}
              {jobCard.estimatedCost && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Estimated:</span>
                  <span className="text-gray-900">₹{jobCard.estimatedCost.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default JobCards

