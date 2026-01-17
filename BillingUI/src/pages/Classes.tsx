import { useEffect, useState } from 'react'
import api from '../services/api'
import { Plus, Edit, Trash2, Search, GraduationCap, DollarSign, X, Calendar, Copy } from 'lucide-react'
import { Class, FeeStructure, FeeHead, FeeInstallment } from '../types'
import { useDebounce } from '../hooks/useDebounce'
import { useToast } from '../hooks/useToast'
import ConfirmationDialog from '../components/ConfirmationDialog'
import { TableSkeleton } from '../components/LoadingSkeleton'

const Classes = () => {
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const debouncedSearch = useDebounce(searchTerm, 500)
  const [showModal, setShowModal] = useState<boolean>(false)
  const [showEditModal, setShowEditModal] = useState<boolean>(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false)
  const [showFeeStructureModal, setShowFeeStructureModal] = useState<boolean>(false)
  const [selectedClass, setSelectedClass] = useState<Class | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([])
  const [feeHeads, setFeeHeads] = useState<FeeHead[]>([])
  const [loadingFeeStructures, setLoadingFeeStructures] = useState<boolean>(false)
  const [showAddFeeStructure, setShowAddFeeStructure] = useState<boolean>(false)
  const { showToast, ToastContainer } = useToast()

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'School' as 'School' | 'College' | 'University',
    course: '',
    department: '',
    maxStrength: '',
    academicYear: new Date().getFullYear().toString(),
    classTeacher: '',
    isActive: true,
  })

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (debouncedSearch) {
      fetchClasses()
    }
  }, [debouncedSearch])

  const fetchData = async (): Promise<void> => {
    try {
      const response = await api.get<{ success: boolean; data: Class[]; message?: string }>('/classes')
      // ApiResponse structure: { success: true, data: Class[] }
      const classesData = response.data?.data || []
      setClasses(Array.isArray(classesData) ? classesData : [])
    } catch (error: any) {
      console.error('Error fetching classes:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch classes'
      showToast(errorMessage, 'error')
      setClasses([])
    } finally {
      setLoading(false)
    }
  }

  const fetchClasses = async (): Promise<void> => {
    try {
      const response = await api.get<{ success: boolean; data: Class[]; message?: string }>('/classes')
      let classesData = response.data?.data || []
      
      if (debouncedSearch) {
        classesData = classesData.filter(
          (c) =>
            c.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            c.code?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            c.course?.toLowerCase().includes(debouncedSearch.toLowerCase())
        )
      }
      
      setClasses(Array.isArray(classesData) ? classesData : [])
    } catch (error: any) {
      console.error('Error fetching classes:', error)
      showToast('Failed to fetch classes', 'error')
    }
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    try {
      await api.post('/classes', {
        ...formData,
        maxStrength: formData.maxStrength ? parseInt(formData.maxStrength) : null,
        currentStrength: 0,
      })
      setShowModal(false)
      resetForm()
      showToast('Class created successfully', 'success')
      fetchData()
    } catch (error: any) {
      console.error('Error creating class:', error)
      const message = error.response?.data?.message || 'Failed to create class'
      showToast(message, 'error')
    }
  }

  const handleEditClick = (classItem: Class): void => {
    setSelectedClass(classItem)
    setFormData({
      name: classItem.name,
      code: classItem.code || '',
      type: classItem.type,
      course: classItem.course || '',
      department: classItem.department || '',
      maxStrength: classItem.maxStrength?.toString() || '',
      academicYear: classItem.academicYear,
      classTeacher: classItem.classTeacher || '',
      isActive: classItem.isActive,
    })
    setShowEditModal(true)
  }

  const handleUpdate = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!selectedClass) return

    try {
      await api.put(`/classes/${selectedClass.id}`, {
        id: selectedClass.id,
        tenantId: selectedClass.tenantId,
        ...formData,
        maxStrength: formData.maxStrength ? parseInt(formData.maxStrength) : null,
        currentStrength: selectedClass.currentStrength,
        createdAt: selectedClass.createdAt,
      })
      setShowEditModal(false)
      setSelectedClass(null)
      resetForm()
      showToast('Class updated successfully', 'success')
      fetchData()
    } catch (error: any) {
      console.error('Error updating class:', error)
      const message = error.response?.data?.message || 'Failed to update class'
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
      await api.delete(`/classes/${deleteId}`)
      showToast('Class deleted successfully', 'success')
      setShowDeleteConfirm(false)
      setDeleteId(null)
      fetchData()
    } catch (error: any) {
      console.error('Error deleting class:', error)
      const message = error.response?.data?.message || 'Failed to delete class'
      showToast(message, 'error')
    }
  }

  const resetForm = (): void => {
    setFormData({
      name: '',
      code: '',
      type: 'School',
      course: '',
      department: '',
      maxStrength: '',
      academicYear: new Date().getFullYear().toString(),
      classTeacher: '',
      isActive: true,
    })
  }

  const handleManageFeeStructure = async (classItem: Class): Promise<void> => {
    setSelectedClass(classItem)
    setShowFeeStructureModal(true)
    await fetchFeeStructures(classItem.id)
    await fetchFeeHeads()
  }

  const fetchFeeStructures = async (classId: number): Promise<void> => {
    setLoadingFeeStructures(true)
    try {
      const response = await api.get<{ success: boolean; data: FeeStructure[]; message?: string }>(`/fee-structures?classId=${classId}&includeInactive=true`)
      // ApiResponse structure: { success: true, data: FeeStructure[] }
      const feeStructuresData = response.data?.data || []
      setFeeStructures(Array.isArray(feeStructuresData) ? feeStructuresData : [])
    } catch (error: any) {
      console.error('Error fetching fee structures:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch fee structures'
      showToast(errorMessage, 'error')
      setFeeStructures([])
    } finally {
      setLoadingFeeStructures(false)
    }
  }

  const fetchFeeHeads = async (): Promise<void> => {
    try {
      const response = await api.get<{ data: { data: FeeHead[] } }>('/fee-heads')
      setFeeHeads(response.data.data?.data || response.data.data || [])
    } catch (error) {
      console.error('Error fetching fee heads:', error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <TableSkeleton rows={8} columns={6} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Classes</h1>
          <p className="mt-1 text-sm text-gray-500">Manage classes, courses, and sections</p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Class
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search classes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      {/* Classes Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course/Department</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Academic Year</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Strength</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {classes.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                  No classes found. Click "Add Class" to create one.
                </td>
              </tr>
            ) : (
              classes.map((classItem) => (
                <tr key={classItem.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <GraduationCap className="h-5 w-5 text-gray-400 mr-2" />
                      <div className="text-sm font-medium text-gray-900">{classItem.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {classItem.code || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {classItem.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {classItem.course || classItem.department || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {classItem.academicYear}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {classItem.currentStrength}
                    {classItem.maxStrength && ` / ${classItem.maxStrength}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        classItem.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {classItem.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleManageFeeStructure(classItem)}
                        className="text-green-600 hover:text-green-900"
                        title="Manage Fee Structure"
                      >
                        <DollarSign className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleEditClick(classItem)}
                        className="text-primary-600 hover:text-primary-900"
                        title="Edit Class"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(classItem.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Class"
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

      {/* Add Class Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Class</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Class 10, B.Tech 1st Year"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Code</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g., CLS10, BTECH1"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type *</label>
                  <select
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'School' | 'College' | 'University' })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="School">School</option>
                    <option value="College">College</option>
                    <option value="University">University</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Academic Year *</label>
                  <input
                    type="text"
                    required
                    value={formData.academicYear}
                    onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                    placeholder="e.g., 2024-2025"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              {(formData.type === 'College' || formData.type === 'University') && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Course</label>
                    <input
                      type="text"
                      value={formData.course}
                      onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                      placeholder="e.g., B.Tech, MBA, B.Com"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Department</label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      placeholder="e.g., Computer Science, Commerce"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Max Strength</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.maxStrength}
                    onChange={(e) => setFormData({ ...formData, maxStrength: e.target.value })}
                    placeholder="Maximum number of students"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Class Teacher</label>
                  <input
                    type="text"
                    value={formData.classTeacher}
                    onChange={(e) => setFormData({ ...formData, classTeacher: e.target.value })}
                    placeholder="Teacher name"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">Active</span>
                </label>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    resetForm()
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700"
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
      )}

      {/* Edit Class Modal */}
      {showEditModal && selectedClass && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Class</h3>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Code</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type *</label>
                  <select
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'School' | 'College' | 'University' })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="School">School</option>
                    <option value="College">College</option>
                    <option value="University">University</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Academic Year *</label>
                  <input
                    type="text"
                    required
                    value={formData.academicYear}
                    onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              {(formData.type === 'College' || formData.type === 'University') && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Course</label>
                    <input
                      type="text"
                      value={formData.course}
                      onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Department</label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Max Strength</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.maxStrength}
                    onChange={(e) => setFormData({ ...formData, maxStrength: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Class Teacher</label>
                  <input
                    type="text"
                    value={formData.classTeacher}
                    onChange={(e) => setFormData({ ...formData, classTeacher: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">Active</span>
                </label>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false)
                    setSelectedClass(null)
                    resetForm()
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fee Structure Management Modal */}
      {showFeeStructureModal && selectedClass && (
        <FeeStructureModal
          classItem={selectedClass}
          feeStructures={feeStructures}
          feeHeads={feeHeads}
          loading={loadingFeeStructures}
          onClose={() => {
            setShowFeeStructureModal(false)
            setSelectedClass(null)
            setFeeStructures([])
            setShowAddFeeStructure(false)
          }}
          onRefresh={() => selectedClass && fetchFeeStructures(selectedClass.id)}
          showToast={showToast}
        />
      )}

      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        title="Delete Class"
        message="Are you sure you want to delete this class? This action cannot be undone. Students assigned to this class will need to be reassigned."
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

// Fee Structure Management Modal Component
interface FeeStructureModalProps {
  classItem: Class
  feeStructures: FeeStructure[]
  feeHeads: FeeHead[]
  loading: boolean
  onClose: () => void
  onRefresh: () => void
  showToast: (message: string, type: 'success' | 'error' | 'info') => void
}

const FeeStructureModal = ({
  classItem,
  feeStructures,
  feeHeads,
  loading,
  onClose,
  onRefresh,
  showToast,
}: FeeStructureModalProps) => {
  const [showAddForm, setShowAddForm] = useState<boolean>(false)
  const [editingFeeStructure, setEditingFeeStructure] = useState<FeeStructure | null>(null)
  const [selectedFeeStructureForInstallments, setSelectedFeeStructureForInstallments] = useState<FeeStructure | null>(null)
  const [installments, setInstallments] = useState<FeeInstallment[]>([])
  const [showInstallmentForm, setShowInstallmentForm] = useState<boolean>(false)
  const [editingInstallment, setEditingInstallment] = useState<FeeInstallment | null>(null)
  const [installmentFormData, setInstallmentFormData] = useState({
    installmentNumber: '',
    amount: '',
    dueDate: '',
    lateFeeAmount: '',
    description: '',
    isActive: true,
  })
  const [formData, setFormData] = useState({
    name: '',
    feeHeadId: '',
    feeType: 'Tuition',
    amount: '',
    frequency: 'Monthly' as 'Monthly' | 'Quarterly' | 'Semester' | 'Annual' | 'One-time',
    academicYear: classItem.academicYear,
    isMandatory: true,
    isOptional: false,
    maxInstallments: '',
    lateFeeAmount: '',
    lateFeeDays: '',
    isActive: true,
  })

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    try {
      const payload = {
        classId: classItem.id,
        name: formData.name,
        feeHeadId: parseInt(formData.feeHeadId),
        feeType: formData.feeType,
        amount: parseFloat(formData.amount),
        frequency: formData.frequency,
        academicYear: formData.academicYear,
        isMandatory: formData.isMandatory,
        isOptional: formData.isOptional,
        maxInstallments: formData.maxInstallments ? parseInt(formData.maxInstallments) : null,
        lateFeeAmount: formData.lateFeeAmount ? parseFloat(formData.lateFeeAmount) : null,
        lateFeeDays: formData.lateFeeDays ? parseInt(formData.lateFeeDays) : null,
        isActive: formData.isActive,
      }

      if (editingFeeStructure) {
        await api.put(`/fee-structures/${editingFeeStructure.id}`, { ...editingFeeStructure, ...payload })
        showToast('Fee structure updated successfully', 'success')
      } else {
        await api.post('/fee-structures', payload)
        showToast('Fee structure created successfully', 'success')
      }

      setShowAddForm(false)
      setEditingFeeStructure(null)
      resetForm()
      onRefresh()
    } catch (error: any) {
      console.error('Error saving fee structure:', error)
      const message = error.response?.data?.message || 'Failed to save fee structure'
      showToast(message, 'error')
    }
  }

  const handleEdit = async (fs: FeeStructure): Promise<void> => {
    setEditingFeeStructure(fs)
    setFormData({
      name: fs.name,
      feeHeadId: fs.feeHeadId.toString(),
      feeType: fs.feeType,
      amount: fs.amount.toString(),
      frequency: fs.frequency,
      academicYear: fs.academicYear,
      isMandatory: fs.isMandatory,
      isOptional: fs.isOptional,
      maxInstallments: fs.maxInstallments?.toString() || '',
      lateFeeAmount: fs.lateFeeAmount?.toString() || '',
      lateFeeDays: fs.lateFeeDays?.toString() || '',
      isActive: fs.isActive,
    })
    setShowAddForm(true)
    
    // Load installments for this fee structure
    try {
      const response = await api.get<{ success: boolean; data: FeeInstallment[] }>(`/fee-structures/${fs.id}/installments`)
      setInstallments(response.data?.data || [])
    } catch (error) {
      console.error('Error fetching installments:', error)
      setInstallments([])
    }
  }

  const handleManageInstallments = async (fs: FeeStructure): Promise<void> => {
    setSelectedFeeStructureForInstallments(fs)
    try {
      const response = await api.get<{ success: boolean; data: FeeInstallment[] }>(`/fee-structures/${fs.id}/installments`)
      setInstallments(response.data?.data || [])
      setShowInstallmentForm(false)
    } catch (error) {
      console.error('Error fetching installments:', error)
      showToast('Failed to fetch installments', 'error')
      setInstallments([])
    }
  }

  const handleInstallmentSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!selectedFeeStructureForInstallments) return

    try {
      const payload = {
        installmentNumber: parseInt(installmentFormData.installmentNumber),
        amount: parseFloat(installmentFormData.amount),
        dueDate: installmentFormData.dueDate,
        lateFeeAmount: installmentFormData.lateFeeAmount ? parseFloat(installmentFormData.lateFeeAmount) : null,
        description: installmentFormData.description || null,
        isActive: installmentFormData.isActive,
      }

      if (editingInstallment) {
        await api.put(`/fee-structures/installments/${editingInstallment.id}`, payload)
        showToast('Installment updated successfully', 'success')
      } else {
        await api.post(`/fee-structures/${selectedFeeStructureForInstallments.id}/installments`, payload)
        showToast('Installment created successfully', 'success')
      }

      setShowInstallmentForm(false)
      setEditingInstallment(null)
      resetInstallmentForm()
      await handleManageInstallments(selectedFeeStructureForInstallments)
    } catch (error: any) {
      console.error('Error saving installment:', error)
      const message = error.response?.data?.message || 'Failed to save installment'
      showToast(message, 'error')
    }
  }

  const handleEditInstallment = (installment: FeeInstallment): void => {
    setEditingInstallment(installment)
    setInstallmentFormData({
      installmentNumber: installment.installmentNumber.toString(),
      amount: installment.amount.toString(),
      dueDate: installment.dueDate.split('T')[0],
      lateFeeAmount: installment.lateFeeAmount?.toString() || '',
      description: installment.description || '',
      isActive: installment.isActive,
    })
    setShowInstallmentForm(true)
  }

  const handleDeleteInstallment = async (id: number): Promise<void> => {
    if (!confirm('Are you sure you want to delete this installment?')) return

    try {
      await api.delete(`/fee-structures/installments/${id}`)
      showToast('Installment deleted successfully', 'success')
      if (selectedFeeStructureForInstallments) {
        await handleManageInstallments(selectedFeeStructureForInstallments)
      }
    } catch (error: any) {
      console.error('Error deleting installment:', error)
      showToast('Failed to delete installment', 'error')
    }
  }

  const handleDuplicateInstallment = async (id: number): Promise<void> => {
    try {
      await api.post(`/fee-structures/installments/${id}/duplicate`)
      showToast('Installment duplicated successfully', 'success')
      if (selectedFeeStructureForInstallments) {
        await handleManageInstallments(selectedFeeStructureForInstallments)
      }
    } catch (error: any) {
      console.error('Error duplicating installment:', error)
      const message = error.response?.data?.message || 'Failed to duplicate installment'
      showToast(message, 'error')
    }
  }

  const resetInstallmentForm = (): void => {
    setInstallmentFormData({
      installmentNumber: '',
      amount: '',
      dueDate: '',
      lateFeeAmount: '',
      description: '',
      isActive: true,
    })
    setEditingInstallment(null)
  }

  const handleDelete = async (id: number): Promise<void> => {
    if (!confirm('Are you sure you want to delete this fee structure?')) return

    try {
      await api.delete(`/fee-structures/${id}`)
      showToast('Fee structure deleted successfully', 'success')
      onRefresh()
    } catch (error: any) {
      console.error('Error deleting fee structure:', error)
      showToast('Failed to delete fee structure', 'error')
    }
  }

  const resetForm = (): void => {
    setFormData({
      name: '',
      feeHeadId: '',
      feeType: 'Tuition',
      amount: '',
      frequency: 'Monthly',
      academicYear: classItem.academicYear,
      isMandatory: true,
      isOptional: false,
      maxInstallments: '',
      lateFeeAmount: '',
      lateFeeDays: '',
      isActive: true,
    })
    setEditingFeeStructure(null)
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Fee Structure - {classItem.name}
            </h3>
            <p className="text-sm text-gray-500">Academic Year: {classItem.academicYear}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-4">
          <button
            onClick={() => {
              resetForm()
              setShowAddForm(true)
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Fee Structure
          </button>
        </div>

        {showAddForm && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-md font-medium text-gray-900 mb-4">
              {editingFeeStructure ? 'Edit Fee Structure' : 'Add New Fee Structure'}
            </h4>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Tuition Fee, Library Fee"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fee Head *</label>
                  <select
                    required
                    value={formData.feeHeadId}
                    onChange={(e) => setFormData({ ...formData, feeHeadId: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select Fee Head</option>
                    {feeHeads.map((fh) => (
                      <option key={fh.id} value={fh.id}>
                        {fh.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Academic Year *</label>
                  <input
                    type="text"
                    required
                    value={formData.academicYear}
                    onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                    placeholder="e.g., 2024-2025"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <p className="mt-1 text-xs text-gray-500">Must match the class academic year: {classItem.academicYear}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fee Type *</label>
                  <input
                    type="text"
                    required
                    value={formData.feeType}
                    onChange={(e) => setFormData({ ...formData, feeType: e.target.value })}
                    placeholder="e.g., Tuition, Library"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Frequency *</label>
                  <select
                    required
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value as any })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Semester">Semester</option>
                    <option value="Annual">Annual</option>
                    <option value="One-time">One-time</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Max Installments</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={formData.maxInstallments}
                    onChange={(e) => setFormData({ ...formData, maxInstallments: e.target.value })}
                    placeholder="e.g., 3"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Late Fee Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.lateFeeAmount}
                    onChange={(e) => setFormData({ ...formData, lateFeeAmount: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Late Fee Days</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.lateFeeDays}
                    onChange={(e) => setFormData({ ...formData, lateFeeDays: e.target.value })}
                    placeholder="Days after due date"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isMandatory}
                    onChange={(e) => setFormData({ ...formData, isMandatory: e.target.checked })}
                    className="rounded"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">Mandatory</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isOptional}
                    onChange={(e) => setFormData({ ...formData, isOptional: e.target.checked })}
                    className="rounded"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">Optional</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">Active</span>
                </label>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false)
                    resetForm()
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                >
                  {editingFeeStructure ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fee Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Frequency</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Academic Year</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Installments</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {feeStructures.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                      No fee structures found. Click "Add Fee Structure" to create one.
                    </td>
                  </tr>
                ) : (
                  feeStructures.map((fs) => (
                    <tr key={fs.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {fs.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {fs.feeType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ₹{fs.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {fs.frequency}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`px-2 py-1 rounded text-xs ${
                          fs.academicYear === classItem.academicYear 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {fs.academicYear}
                          {fs.academicYear !== classItem.academicYear && ' ⚠️'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex flex-col">
                          {fs.installments && fs.installments.length > 0 ? (
                            <>
                              <span className="font-medium text-green-700">
                                {fs.installments.filter(i => i.isActive).length} Installments
                              </span>
                              <span className="text-xs text-gray-500">
                                ₹{fs.installments.filter(i => i.isActive).reduce((sum, i) => sum + i.amount, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </span>
                            </>
                          ) : fs.maxInstallments ? (
                            <span className="text-yellow-600">
                              {fs.maxInstallments} Max (Not Configured)
                            </span>
                          ) : (
                            <span>Single Payment</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            fs.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {fs.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleManageInstallments(fs)}
                            className="text-green-600 hover:text-green-900"
                            title="Manage Installments"
                          >
                            <Calendar className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleEdit(fs)}
                            className="text-primary-600 hover:text-primary-900"
                            title="Edit"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(fs.id)}
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
        )}
      </div>

      {/* Installment Management Modal */}
      {selectedFeeStructureForInstallments && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Manage Installments - {selectedFeeStructureForInstallments.name}
                </h3>
                <p className="text-sm text-gray-500">Total Amount: ₹{selectedFeeStructureForInstallments.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    resetInstallmentForm()
                    setShowInstallmentForm(true)
                  }}
                  className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Installment
                </button>
                <button
                  onClick={() => {
                    setSelectedFeeStructureForInstallments(null)
                    setInstallments([])
                    setShowInstallmentForm(false)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {showInstallmentForm && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-md font-medium text-gray-900 mb-4">
                  {editingInstallment ? 'Edit Installment' : 'Add New Installment'}
                </h4>
                <form onSubmit={handleInstallmentSubmit} className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Installment Number *</label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={installmentFormData.installmentNumber}
                        onChange={(e) => setInstallmentFormData({ ...installmentFormData, installmentNumber: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Amount (₹) *</label>
                      <input
                        type="number"
                        required
                        step="0.01"
                        min="0"
                        value={installmentFormData.amount}
                        onChange={(e) => setInstallmentFormData({ ...installmentFormData, amount: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Due Date *</label>
                      <input
                        type="date"
                        required
                        value={installmentFormData.dueDate}
                        onChange={(e) => setInstallmentFormData({ ...installmentFormData, dueDate: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Late Fee Amount (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={installmentFormData.lateFeeAmount}
                        onChange={(e) => setInstallmentFormData({ ...installmentFormData, lateFeeAmount: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="flex items-center mt-6">
                        <input
                          type="checkbox"
                          checked={installmentFormData.isActive}
                          onChange={(e) => setInstallmentFormData({ ...installmentFormData, isActive: e.target.checked })}
                          className="rounded"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700">Active</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      value={installmentFormData.description}
                      onChange={(e) => setInstallmentFormData({ ...installmentFormData, description: e.target.value })}
                      rows={2}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowInstallmentForm(false)
                        resetInstallmentForm()
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                    >
                      {editingInstallment ? 'Update' : 'Create'} Installment
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Installments Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Late Fee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {installments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                        No installments found. Click "Add Installment" to create one.
                      </td>
                    </tr>
                  ) : (
                    installments.map((inst) => (
                      <tr key={inst.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {inst.installmentNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ₹{inst.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(inst.dueDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {inst.lateFeeAmount ? `₹${inst.lateFeeAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {inst.description || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              inst.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {inst.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleDuplicateInstallment(inst.id)}
                              className="text-purple-600 hover:text-purple-900"
                              title="Duplicate"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleEditInstallment(inst)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteInstallment(inst.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
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
        </div>
      )}
    </div>
  )
}

export default Classes

