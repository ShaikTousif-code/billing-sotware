import { useEffect, useState } from 'react'
import api from '../services/api'
import { Plus, Search, FolderKanban, DollarSign } from 'lucide-react'
import { Project, OfficeClient } from '../types'
import { useToast } from '../hooks/useToast'
import { TableSkeleton } from '../components/LoadingSkeleton'

const Projects = () => {
  const [projects, setProjects] = useState<Project[]>([])
  const [clients, setClients] = useState<OfficeClient[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [selectedClient, setSelectedClient] = useState<number | null>(null)
  const { showToast, ToastContainer } = useToast()

  useEffect(() => {
    fetchData()
  }, [selectedClient])

  const fetchData = async (): Promise<void> => {
    try {
      const params: any = {}
      if (selectedClient) params.clientId = selectedClient

      const [projectsRes, clientsRes] = await Promise.all([
        api.get<{ data: { data: Project[] } }>('/projects', { params }),
        api.get<{ data: { data: OfficeClient[] } }>('/office-clients'),
      ])

      setProjects(projectsRes.data.data?.data || projectsRes.data.data || [])
      setClients(clientsRes.data.data?.data || clientsRes.data.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      showToast('Failed to fetch data', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <TableSkeleton rows={8} columns={6} />
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="mt-1 text-sm text-gray-500">Manage client projects and billing</p>
        </div>
        <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700">
          <Plus className="h-5 w-5 mr-2" />
          New Project
        </button>
      </div>

      {/* Filter */}
      <div className="bg-white shadow rounded-lg p-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Client</label>
          <select
            value={selectedClient || ''}
            onChange={(e) => setSelectedClient(e.target.value ? parseInt(e.target.value) : null)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Clients</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.companyName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <div key={project.id} className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center mb-4">
              <FolderKanban className="h-6 w-6 text-primary-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">{project.projectName}</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="text-gray-600">Client: {project.client?.companyName}</div>
              <div className="text-gray-600">Code: {project.projectCode}</div>
              <div className="text-gray-600">Type: {project.projectType}</div>
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Budget:</span>
                  <span className="font-semibold">₹{project.budget.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Billed:</span>
                  <span className="font-semibold">₹{project.billedAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Balance:</span>
                  <span className="font-semibold text-red-600">₹{project.balanceAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ToastContainer />
    </div>
  )
}

export default Projects

