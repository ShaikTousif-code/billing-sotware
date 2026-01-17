import { useState, useEffect } from 'react'
import api from '../services/api'
import { Plus, Search, Users, GraduationCap, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

interface Class {
  id: number
  name: string
  code?: string
}

interface Student {
  id: number
  studentId: string
  firstName: string
  lastName: string
  classId?: number
  className?: string
  section?: string
  status: string
}

interface FeeAssignmentResult {
  fees: any[]
  count: number
}

export default function FeeAssignment() {
  const [classes, setClasses] = useState<Class[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [selectedClass, setSelectedClass] = useState<number | null>(null)
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchClasses()
    fetchStudents()
  }, [])

  const fetchClasses = async () => {
    try {
      const response = await api.get('/classes')
      const data = response.data?.data || response.data || []
      setClasses(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching classes:', error)
    }
  }

  const fetchStudents = async () => {
    try {
      const response = await api.get('/students')
      const data = response.data?.data?.data || response.data?.data || response.data || []
      setStudents(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching students:', error)
    }
  }

  const handleAssignToClass = async () => {
    if (!selectedClass) {
      setMessage({ type: 'error', text: 'Please select a class' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const response = await api.post<{ success: boolean; data: { Fees: any[]; Count: number }; message?: string }>(`/fee-assignment/class/${selectedClass}`, {})
      // ApiResponse structure: { success: true, data: { Fees: [], Count: number }, message: "..." }
      const result = response.data?.data || { Fees: [], Count: 0 }
      const count = result.Count || (result.Fees?.length || 0)
      const message = response.data?.message || `Successfully assigned ${count} fees to class`
      setMessage({
        type: 'success',
        text: message
      })
      setTimeout(() => {
        fetchStudents()
        setMessage(null)
      }, 3000)
    } catch (error: any) {
      console.error('Error assigning fees to class:', error)
      const errorMessage = error.response?.data?.message || error.response?.data?.errors?.[0] || 'Error assigning fees to class. Make sure fee structures are defined for this class.'
      setMessage({
        type: 'error',
        text: errorMessage
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAssignToStudent = async () => {
    if (!selectedStudent) {
      setMessage({ type: 'error', text: 'Please select a student' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const response = await api.post<{ success: boolean; data: { Fees: any[]; Count: number }; message?: string }>(`/fee-assignment/student/${selectedStudent}`, {})
      // ApiResponse structure: { success: true, data: { Fees: [], Count: number }, message: "..." }
      const result = response.data?.data || { Fees: [], Count: 0 }
      const count = result.Count || (result.Fees?.length || 0)
      const message = response.data?.message || `Successfully assigned ${count} fees to student`
      setMessage({
        type: 'success',
        text: message
      })
      setTimeout(() => {
        fetchStudents()
        setMessage(null)
      }, 3000)
    } catch (error: any) {
      console.error('Error assigning fees to student:', error)
      const errorMessage = error.response?.data?.message || error.response?.data?.errors?.[0] || 'Error assigning fees to student. Make sure fee structures are defined for this student\'s class.'
      setMessage({
        type: 'error',
        text: errorMessage
      })
    } finally {
      setLoading(false)
    }
  }

  const handleApplyLateFees = async () => {
    if (!confirm('Apply late fees to all overdue fees? This action cannot be undone.')) {
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      await api.post('/fee-assignment/apply-late-fees')
      setMessage({
        type: 'success',
        text: 'Late fees applied successfully'
      })
      setTimeout(() => {
        fetchStudents()
        setMessage(null)
      }, 3000)
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Error applying late fees'
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredStudents = students.filter(s =>
    s.status === 'Active' &&
    (searchTerm === '' ||
      s.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Fee Assignment</h1>
        <button
          onClick={handleApplyLateFees}
          disabled={loading}
          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4" />
          Apply Late Fees
        </button>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <XCircle className="w-5 h-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Assign to Class */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <GraduationCap className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold">Assign Fees to Class</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Class
              </label>
              <select
                value={selectedClass || ''}
                onChange={(e) => setSelectedClass(Number(e.target.value) || null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a class</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} {cls.code && `(${cls.code})`}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleAssignToClass}
              disabled={loading || !selectedClass}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                'Assigning...'
              ) : (
                <>
                  <Users className="w-4 h-4" />
                  Assign Fees to All Students in Class
                </>
              )}
            </button>
          </div>
        </div>

        {/* Assign to Student */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-6 h-6 text-green-600" />
            <h2 className="text-xl font-semibold">Assign Fees to Student</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Student
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by ID or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Student
              </label>
              <select
                value={selectedStudent || ''}
                onChange={(e) => setSelectedStudent(Number(e.target.value) || null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent max-h-48 overflow-y-auto"
              >
                <option value="">Select a student</option>
                {filteredStudents.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.studentId} - {student.firstName} {student.lastName}
                    {student.className && ` (${student.className}${student.section ? ` - ${student.section}` : ''})`}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleAssignToStudent}
              disabled={loading || !selectedStudent}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                'Assigning...'
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Assign Fees to Student
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">How it works:</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Fees are assigned based on active fee structures for the selected class/student</li>
          <li>Installment-based fees will be split according to the fee structure configuration</li>
          <li>Only active students will receive fee assignments</li>
          <li>Duplicate fees are automatically prevented</li>
        </ul>
      </div>
    </div>
  )
}

