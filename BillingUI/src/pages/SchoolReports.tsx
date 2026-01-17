import { useState, useEffect } from 'react'
import api from '../services/api'
import { Download, FileText, TrendingUp, Users, DollarSign, Calendar, Filter } from 'lucide-react'
import { format } from 'date-fns'
import { formatToLocalTime } from '../utils/dateUtils'

interface StudentDue {
  studentId: number
  studentName: string
  studentIdNumber: string
  class: string
  section: string
  totalFees: number
  paidFees: number
  outstandingFees: number
  status: string
}

interface CollectionPayment {
  id: number
  paymentDate: string
  receiptNumber: string
  studentName: string
  studentId: string
  feeType: string
  amount: number
  paymentMode: string
  transactionId?: string
}

interface ClassSummary {
  classId: number
  className: string
  totalStudents: number
  expectedFees: number
  collectedFees: number
  pendingFees: number
  collectionPercentage: number
}

export default function SchoolReports() {
  const [activeTab, setActiveTab] = useState<'dues' | 'collection' | 'classwise'>('dues')
  const [loading, setLoading] = useState(false)
  const [studentDues, setStudentDues] = useState<StudentDue[]>([])
  const [collectionData, setCollectionData] = useState<{
    payments: CollectionPayment[]
    summary: any
  } | null>(null)
  const [classSummary, setClassSummary] = useState<ClassSummary[]>([])
  
  // Filters
  const [classFilter, setClassFilter] = useState<number | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [fromDate, setFromDate] = useState(format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'))
  const [toDate, setToDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [paymentModeFilter, setPaymentModeFilter] = useState<string>('')

  useEffect(() => {
    if (activeTab === 'dues') {
      fetchStudentDues()
    } else if (activeTab === 'collection') {
      fetchCollectionReport()
    } else if (activeTab === 'classwise') {
      fetchClassWiseSummary()
    }
  }, [activeTab, classFilter, statusFilter, fromDate, toDate, paymentModeFilter])

  const fetchStudentDues = async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (classFilter) params.classId = classFilter
      if (statusFilter) params.status = statusFilter
      
      const response = await api.get('/school-reports/student-dues', { params })
      const data = response.data?.data || []
      setStudentDues(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching student dues:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCollectionReport = async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (fromDate) params.fromDate = new Date(fromDate).toISOString()
      if (toDate) params.toDate = new Date(toDate).toISOString()
      if (paymentModeFilter) params.paymentMode = paymentModeFilter
      
      const response = await api.get('/school-reports/collection', { params })
      const data = response.data?.data || {}
      setCollectionData(data)
    } catch (error) {
      console.error('Error fetching collection report:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchClassWiseSummary = async () => {
    setLoading(true)
    try {
      const response = await api.get('/school-reports/class-wise-summary')
      const data = response.data?.data || []
      setClassSummary(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching class-wise summary:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportToExcel = async (type: string) => {
    try {
      // This would call an export endpoint
      alert(`Export ${type} to Excel - Feature coming soon`)
    } catch (error) {
      console.error('Error exporting:', error)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">School Reports</h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'dues', label: 'Student Dues', icon: Users },
            { id: 'collection', label: 'Collection Report', icon: DollarSign },
            { id: 'classwise', label: 'Class-wise Summary', icon: TrendingUp },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Filters */}
      {activeTab === 'dues' && (
        <div className="bg-white p-4 rounded-lg shadow-sm flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
            <select
              value={classFilter || ''}
              onChange={(e) => setClassFilter(Number(e.target.value) || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All Classes</option>
              {/* Classes would be loaded here */}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All</option>
              <option value="Due">Due</option>
              <option value="Paid">Paid</option>
            </select>
          </div>
          <button
            onClick={() => exportToExcel('dues')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </button>
        </div>
      )}

      {activeTab === 'collection' && (
        <div className="bg-white p-4 rounded-lg shadow-sm flex gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
            <select
              value={paymentModeFilter}
              onChange={(e) => setPaymentModeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All Modes</option>
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Online">Online</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
          </div>
          <button
            onClick={() => exportToExcel('collection')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </button>
        </div>
      )}

      {/* Content */}
      <div className="bg-white rounded-lg shadow-md">
        {loading ? (
          <div className="p-8 text-center">Loading...</div>
        ) : (
          <>
            {activeTab === 'dues' && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Fees</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Outstanding</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {studentDues.map((due) => (
                      <tr key={due.studentId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{due.studentIdNumber}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{due.studentName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{due.class} {due.section && `- ${due.section}`}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">₹{due.totalFees.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">₹{due.paidFees.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">₹{due.outstandingFees.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            due.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {due.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'collection' && collectionData && (
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">Total Collection</div>
                    <div className="text-2xl font-bold text-blue-600">₹{collectionData.summary?.totalCollection?.toFixed(2) || '0.00'}</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">Total Payments</div>
                    <div className="text-2xl font-bold text-green-600">{collectionData.summary?.totalPayments || 0}</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">Payment Modes</div>
                    <div className="text-sm mt-2 space-y-1">
                      {collectionData.summary?.paymentModeBreakdown?.map((mode: any) => (
                        <div key={mode.paymentMode} className="flex justify-between">
                          <span>{mode.paymentMode}:</span>
                          <span className="font-semibold">₹{mode.total.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receipt #</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fee Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mode</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {collectionData.payments?.map((payment) => (
                        <tr key={payment.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{formatToLocalTime(payment.paymentDate, 'dd/MM/yyyy')}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">{payment.receiptNumber}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{payment.studentName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{payment.feeType}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">₹{payment.amount.toFixed(2)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{payment.paymentMode}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'classwise' && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Students</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expected</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Collected</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pending</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Collection %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {classSummary.map((summary) => (
                      <tr key={summary.classId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{summary.className}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{summary.totalStudents}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">₹{summary.expectedFees.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">₹{summary.collectedFees.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">₹{summary.pendingFees.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${Math.min(summary.collectionPercentage, 100)}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">{summary.collectionPercentage.toFixed(1)}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

