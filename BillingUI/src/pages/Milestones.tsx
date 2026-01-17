import { useEffect, useState } from 'react'
import api from '../services/api'
import { Plus, Target, CheckCircle, XCircle } from 'lucide-react'
import { Milestone, Project } from '../types'
import { useToast } from '../hooks/useToast'
import { TableSkeleton } from '../components/LoadingSkeleton'

const Milestones = () => {
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [showModal, setShowModal] = useState<boolean>(false)
  const [selectedProject, setSelectedProject] = useState<number | null>(null)
  const { showToast, ToastContainer } = useToast()

  const [formData, setFormData] = useState({
    projectId: '',
    name: '',
    description: '',
    targetDate: '',
    billingAmount: 0,
  })

  useEffect(() => {
    fetchData()
  }, [selectedProject])

  const fetchData = async (): Promise<void> => {
    try {
      const params: any = {}
      if (selectedProject) params.projectId = selectedProject

      const [milestonesRes, projectsRes] = await Promise.all([
        api.get<{ data: { data: Milestone[] } }>('/milestones', { params }),
        api.get<{ data: { data: Project[] } }>('/projects'),
      ])
      setMilestones(milestonesRes.data.data?.data || milestonesRes.data.data || [])
      setProjects(projectsRes.data.data?.data || projectsRes.data.data || [])
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
      await api.post('/milestones', formData)
      setShowModal(false)
      setFormData({
        projectId: '',
        name: '',
        description: '',
        targetDate: '',
        billingAmount: 0,
      })
      showToast('Milestone created successfully', 'success')
      fetchData()
    } catch (error: any) {
      console.error('Error creating milestone:', error)
      const message = error.response?.data?.message || 'Failed to create milestone'
      showToast(message, 'error')
    }
  }

  const handleComplete = async (id: number): Promise<void> => {
    try {
      await api.post(`/milestones/${id}/complete`)
      showToast('Milestone marked as complete', 'success')
      fetchData()
    } catch (error: any) {
      showToast('Failed to complete milestone', 'error')
    }
  }

  if (loading) {
    return <TableSkeleton rows={8} columns={6} />
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Project Milestones</h1>
          <p className="mt-1 text-sm text-gray-500">Track project milestones and deliverables</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Milestone
        </button>
      </div>

      {/* Filter */}
      <div className="bg-white shadow rounded-lg p-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Project</label>
          <select
            value={selectedProject || ''}
            onChange={(e) => setSelectedProject(e.target.value ? parseInt(e.target.value) : null)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.projectName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Milestones Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {milestones.map((milestone) => (
          <div key={milestone.id} className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center">
                <Target className="h-6 w-6 text-primary-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">{milestone.name}</h3>
              </div>
              <span
                className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  milestone.status === 'Completed'
                    ? 'bg-green-100 text-green-800'
                    : milestone.status === 'In Progress'
                    ? 'bg-blue-100 text-blue-800'
                    : milestone.status === 'Delayed'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {milestone.status}
              </span>
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-500">Project:</span>
                <p className="font-semibold">{milestone.project?.projectName}</p>
              </div>
              <div>
                <span className="text-gray-500">Target Date:</span>
                <p className="font-semibold">{new Date(milestone.targetDate).toLocaleDateString()}</p>
              </div>
              <div>
                <span className="text-gray-500">Progress:</span>
                <div className="mt-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span>{milestone.percentageComplete}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full"
                      style={{ width: `${milestone.percentageComplete}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              {milestone.billingAmount && (
                <div>
                  <span className="text-gray-500">Billing Amount:</span>
                  <p className="font-semibold">₹{milestone.billingAmount.toFixed(2)}</p>
                </div>
              )}
            </div>
            {milestone.status !== 'Completed' && (
              <button
                onClick={() => handleComplete(milestone.id)}
                className="mt-4 w-full px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md"
              >
                Mark Complete
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add Milestone Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add Milestone</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Project *</label>
                <select
                  required
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select Project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.projectName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Milestone Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Target Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.targetDate}
                    onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Billing Amount</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.billingAmount}
                    onChange={(e) => setFormData({ ...formData, billingAmount: parseFloat(e.target.value) })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
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
                  Create Milestone
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

export default Milestones

