import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import api from '../services/api'
import { formatDate, getLocalDate } from '../utils/dateUtils'
import {
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  LucideIcon,
  GraduationCap,
  Building2,
  Clock,
  Target,
  Calendar,
  AlertCircle,
  FileText,
  Filter,
  Download,
  Eye,
} from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Invoice, Customer, Product, SalesReport, DailySales } from '../types'

interface StatCard {
  name: string
  value: string
  icon: LucideIcon
}

interface ChartData {
  date: string
  sales: number
  invoices: number
}

interface DashboardStats {
  totalSales: number
  todaySales: number
  totalCustomers: number
  totalProducts: number
  salesGrowth: number
  // School stats
  totalFeesCollected: number
  outstandingFees: number
  totalStudents: number
  currentAcademicYearFeesCollected: number
  currentAcademicYear: string
  // Office stats
  activeProjects: number
  projectRevenue: number
  totalClients: number
  billableHours: number
  // Medical stats
  totalAppointments: number
  todayAppointments: number
  consultationFeesCollected: number
  totalPatients: number
  upcomingAppointments: number
}


const Dashboard = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    todaySales: 0,
    totalCustomers: 0,
    totalProducts: 0,
    salesGrowth: 0,
    totalFeesCollected: 0,
    outstandingFees: 0,
    totalStudents: 0,
    currentAcademicYearFeesCollected: 0,
    currentAcademicYear: '',
    activeProjects: 0,
    projectRevenue: 0,
    totalClients: 0,
    billableHours: 0,
    totalAppointments: 0,
    todayAppointments: 0,
    consultationFeesCollected: 0,
    totalPatients: 0,
    upcomingAppointments: 0,
  })
  const [salesData, setSalesData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [businessType, setBusinessType] = useState<string>('retail') // retail, school, office, medical
  const [showDuesDetails, setShowDuesDetails] = useState<boolean>(false)
  const [duesDetails, setDuesDetails] = useState<any[]>([])
  const [loadingDues, setLoadingDues] = useState<boolean>(false)
  const [duesFilters, setDuesFilters] = useState({
    classId: '',
    status: '',
    daysOverdue: '',
  })
  const [classes, setClasses] = useState<any[]>([])
  const [userRoles, setUserRoles] = useState<string[]>([])
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false)

  // Get user roles and determine access level
  useEffect(() => {
    const userType = localStorage.getItem('userType') || ''
    const roles = userType ? userType.split(',').map(r => r.trim()) : []
    setUserRoles(roles)
    setIsSuperAdmin(localStorage.getItem('isSuperAdmin') === 'true')
  }, [])

  // Determine what sections user can see based on role
  const canViewFullDashboard = (): boolean => {
    if (isSuperAdmin) return true
    const adminRoles = ['Owner', 'Admin', 'SuperAdmin']
    return userRoles.some(role => adminRoles.includes(role))
  }

  const canViewFinancialData = (): boolean => {
    if (canViewFullDashboard()) return true
    const financialRoles = ['Accountant', 'Manager', 'Owner', 'Admin']
    return userRoles.some(role => financialRoles.includes(role))
  }

  const canViewReports = (): boolean => {
    if (canViewFullDashboard()) return true
    const reportRoles = ['Accountant', 'Manager', 'Owner', 'Admin']
    return userRoles.some(role => reportRoles.includes(role))
  }

  const canViewDuesManagement = (): boolean => {
    if (canViewFullDashboard()) return true
    const duesRoles = ['Accountant', 'Owner', 'Admin']
    return userRoles.some(role => duesRoles.includes(role))
  }

  const canViewPaymentCollection = (): boolean => {
    if (canViewFullDashboard()) return true
    const paymentRoles = ['Accountant', 'Cashier', 'Owner', 'Admin']
    return userRoles.some(role => paymentRoles.includes(role))
  }

  const canViewStudentManagement = (): boolean => {
    if (canViewFullDashboard()) return true
    const studentRoles = ['Owner', 'Admin', 'Manager']
    return userRoles.some(role => studentRoles.includes(role))
  }

  const canViewBusinessTypeSelector = (): boolean => {
    return canViewFullDashboard()
  }

  useEffect(() => {
    fetchDashboardData()
    // Detect business type from tenant or user preference
    const billingType = localStorage.getItem('billingType') || 'General'
    const tenantType = localStorage.getItem('businessType') || 
      (billingType === 'Medical' ? 'medical' : 
       billingType === 'School' ? 'school' : 
       billingType === 'Office' ? 'office' : 'retail')
    setBusinessType(tenantType)
    
    // Fetch classes for school type
    if (tenantType === 'school') {
      fetchClasses()
    }
  }, [])

  const fetchClasses = async (): Promise<void> => {
    try {
      const response = await api.get<{ success: boolean; data: any[] }>('/classes')
      setClasses(response.data?.data || [])
    } catch (error) {
      console.error('Error fetching classes:', error)
    }
  }

  const fetchDuesDetails = async (): Promise<void> => {
    setLoadingDues(true)
    try {
      const params: any = {}
      if (duesFilters.classId) params.classId = parseInt(duesFilters.classId)
      if (duesFilters.status) params.status = duesFilters.status
      if (duesFilters.daysOverdue) params.daysOverdue = parseInt(duesFilters.daysOverdue)

      const response = await api.get<{ success: boolean; data: any[] }>('/school-reports/dues-details', { params })
      setDuesDetails(response.data?.data || [])
    } catch (error) {
      console.error('Error fetching dues details:', error)
      setDuesDetails([])
    } finally {
      setLoadingDues(false)
    }
  }

  useEffect(() => {
    if (showDuesDetails && businessType === 'school') {
      fetchDuesDetails()
    }
  }, [showDuesDetails, duesFilters, businessType])

  const fetchDashboardData = async (): Promise<void> => {
    try {
      const today = new Date()
      const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

      const [
        invoicesRes,
        customersRes,
        productsRes,
        salesReportRes,
        studentsRes,
        feesRes,
        projectsRes,
        clientsRes,
        timeEntriesRes,
        appointmentsRes,
        patientsRes,
      ] = await Promise.all([
        api.get<Invoice[]>('/invoices').catch(() => ({ data: [] })),
        api.get<{ data: Customer[] }>('/customers').catch(() => ({ data: { data: [] } })),
        api.get<{ data: Product[] }>('/products').catch(() => ({ data: { data: [] } })),
        api
          .get<SalesReport>(`/reports/sales?fromDate=${lastMonth.toISOString()}&toDate=${today.toISOString()}`)
          .catch(() => ({ data: null })),
        api.get('/students').catch(() => ({ data: { data: { data: [] } } })),
        api.get('/fees').catch(() => ({ data: { data: { data: [] } } })),
        api.get('/projects').catch(() => ({ data: { data: { data: [] } } })),
        api.get('/office-clients').catch(() => ({ data: { data: { data: [] } } })),
        api.get('/time-tracking').catch(() => ({ data: { data: { data: [] } } })),
        api.get('/appointments').catch(() => ({ data: { data: { data: [] } } })),
        api.get('/patients').catch(() => ({ data: { data: { data: [] } } })),
      ])

      const invoices = invoicesRes.data || []
      // Handle wrapped customers response
      const customersData = customersRes.data?.data || customersRes.data || []
      const customers = Array.isArray(customersData) ? customersData : []
      // Handle wrapped products response
      const productsData = productsRes.data?.data || productsRes.data || []
      const products = Array.isArray(productsData) ? productsData : []
      const salesReport = salesReportRes.data

      const completedInvoices = invoices.filter((inv) => inv.status === 'Completed')
      const todayInvoices = completedInvoices.filter(
        (inv) => new Date(inv.invoiceDate).toDateString() === today.toDateString()
      )

      // School data
      const students = studentsRes.data?.data?.data || studentsRes.data?.data || []
      const fees = feesRes.data?.data?.data || feesRes.data?.data || []
      const feePayments = await api
        .get('/fee-receipts/payment', { params: { fromDate: lastMonth.toISOString() } })
        .catch(() => ({ data: { data: [] } }))
      // ApiResponse structure: { success: true, data: List<FeePayment> }
      const payments = feePayments.data?.data || []
      
      // Get current academic year stats
      let currentAcademicYear = ''
      let currentYearFeesCollected = 0
      let studentStrength = 0
      
      try {
        const statsRes = await api.get<{ success: boolean; data: any }>('/school-reports/current-year-stats').catch(() => ({ data: { data: null } }))
        if (statsRes.data?.data) {
          currentAcademicYear = statsRes.data.data.academicYear || new Date().getFullYear().toString()
          currentYearFeesCollected = statsRes.data.data.feesCollected || 0
          studentStrength = statsRes.data.data.studentStrength || 0
        } else {
          // Fallback: calculate manually
          const academicYearsRes = await api.get<{ success: boolean; data: any[] }>('/academic-years').catch(() => ({ data: { data: [] } }))
          const academicYears = academicYearsRes.data?.data || []
          const activeYear = academicYears.find((ay: any) => ay.isActive)
          currentAcademicYear = activeYear?.name || new Date().getFullYear().toString()
          
          const activeStudents = students.filter((s: any) => s.status === 'Active')
          studentStrength = activeStudents.length
          
          const currentYearFees = fees.filter((f: any) => f.academicYear === currentAcademicYear)
          const currentYearFeesIds = currentYearFees.map((f: any) => f.id)
          const currentYearPayments = payments.filter((p: any) => currentYearFeesIds.includes(p.feeId))
          currentYearFeesCollected = currentYearPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0)
        }
      } catch (error) {
        // Fallback: use current year
        currentAcademicYear = new Date().getFullYear().toString()
        const activeStudents = students.filter((s: any) => s.status === 'Active')
        studentStrength = activeStudents.length
        const currentYearFees = fees.filter((f: any) => f.academicYear === currentAcademicYear)
        const currentYearFeesIds = currentYearFees.map((f: any) => f.id)
        const currentYearPayments = payments.filter((p: any) => currentYearFeesIds.includes(p.feeId))
        currentYearFeesCollected = currentYearPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0)
      }

      // Office data
      const projects = projectsRes.data?.data?.data || projectsRes.data?.data || []
      const clients = clientsRes.data?.data?.data || clientsRes.data?.data || []
      const timeEntries = timeEntriesRes.data?.data?.data || timeEntriesRes.data?.data || []

      // Medical data
      const appointments = appointmentsRes.data?.data?.data || appointmentsRes.data?.data || []
      const patients = patientsRes.data?.data?.data || patientsRes.data?.data || []
      const todayAppointmentsList = appointments.filter((apt: any) => {
        const aptDate = new Date(apt.appointmentDate)
        return aptDate.toDateString() === today.toDateString()
      })
      const upcomingAppointmentsList = appointments.filter((apt: any) => {
        const aptDate = new Date(apt.appointmentDate)
        return aptDate >= today && apt.status !== 'Completed' && apt.status !== 'Cancelled'
      })
      const consultationFees = appointments
        .filter((apt: any) => apt.status === 'Completed' && apt.consultationFee)
        .reduce((sum: number, apt: any) => sum + (apt.consultationFee || 0), 0)

      setStats({
        totalSales: completedInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0),
        todaySales: todayInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0),
        totalCustomers: customers?.length || 0,
        totalProducts: products?.length || 0,
        salesGrowth: 0,
        totalFeesCollected: payments?.reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 0,
        outstandingFees: fees?.reduce((sum: number, f: any) => sum + (f.balanceAmount || 0), 0) || 0,
        totalStudents: studentStrength || students.filter((s: any) => s.status === 'Active').length || 0,
        currentAcademicYearFeesCollected: currentYearFeesCollected || 0,
        currentAcademicYear: currentAcademicYear,
        activeProjects: projects?.filter((p: any) => p.status === 'Active').length || 0,
        projectRevenue: projects?.reduce((sum: number, p: any) => sum + (p.billedAmount || 0), 0) || 0,
        totalClients: clients?.length || 0,
        billableHours: timeEntries
          ?.filter((e: any) => e.isBillable && e.status === 'Approved')
          .reduce((sum: number, e: any) => sum + (e.hours || 0), 0) || 0,
        totalAppointments: appointments?.length || 0,
        todayAppointments: todayAppointmentsList?.length || 0,
        consultationFeesCollected: consultationFees || 0,
        totalPatients: patients?.length || 0,
        upcomingAppointments: upcomingAppointmentsList?.length || 0,
      })

      // Prepare chart data
      if (salesReport?.dailySales) {
        setSalesData(
          salesReport.dailySales.map((item: DailySales) => ({
            date: format(getLocalDate(item.date), 'MMM dd'),
            sales: item.amount,
            invoices: item.invoiceCount,
          }))
        )
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const retailStatCards: StatCard[] = [
    {
      name: 'Total Sales',
      value: `₹${(stats.totalSales ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
    },
    {
      name: "Today's Sales",
      value: `₹${(stats.todaySales ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      icon: ShoppingCart,
    },
    {
      name: 'Customers',
      value: (stats.totalCustomers ?? 0).toString(),
      icon: Users,
    },
    {
      name: 'Products',
      value: (stats.totalProducts ?? 0).toString(),
      icon: Package,
    },
  ]

  const schoolStatCards: StatCard[] = [
    {
      name: `Fees Collected (${stats.currentAcademicYear || 'Current Year'})`,
      value: `₹${(stats.currentAcademicYearFeesCollected ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
    },
    {
      name: 'Student Strength',
      value: (stats.totalStudents ?? 0).toString(),
      icon: Users,
    },
    {
      name: 'Outstanding Fees',
      value: `₹${(stats.outstandingFees ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      icon: GraduationCap,
    },
    {
      name: 'Fee Collection Rate',
      value: `${(stats.currentAcademicYearFeesCollected ?? 0) > 0 ? (((stats.currentAcademicYearFeesCollected ?? 0) / ((stats.currentAcademicYearFeesCollected ?? 0) + (stats.outstandingFees ?? 0))) * 100).toFixed(1) : 0}%`,
      icon: GraduationCap,
    },
  ]

  const officeStatCards: StatCard[] = [
    {
      name: 'Active Projects',
      value: (stats.activeProjects ?? 0).toString(),
      icon: Target,
    },
    {
      name: 'Project Revenue',
      value: `₹${(stats.projectRevenue ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
    },
    {
      name: 'Total Clients',
      value: (stats.totalClients ?? 0).toString(),
      icon: Building2,
    },
    {
      name: 'Billable Hours',
      value: (stats.billableHours ?? 0).toFixed(1),
      icon: Clock,
    },
  ]

  const medicalStatCards: StatCard[] = [
    {
      name: 'Consultation Fees',
      value: `₹${(stats.consultationFeesCollected ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
    },
    {
      name: "Today's Appointments",
      value: (stats.todayAppointments ?? 0).toString(),
      icon: Calendar,
    },
    {
      name: 'Total Patients',
      value: (stats.totalPatients ?? 0).toString(),
      icon: Users,
    },
    {
      name: 'Upcoming Appointments',
      value: (stats.upcomingAppointments ?? 0).toString(),
      icon: Clock,
    },
  ]

  const statCards = businessType === 'school' 
    ? schoolStatCards 
    : businessType === 'office' 
    ? officeStatCards 
    : businessType === 'medical'
    ? medicalStatCards
    : retailStatCards

  // Get user name for personalized greeting
  const userName = localStorage.getItem('userName') || 'User'
  const userRoleDisplay = userRoles.length > 0 ? userRoles.join(', ') : 'User'

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">Dashboard</h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-500 break-words">
            Welcome back, {userName}! ({userRoleDisplay}) - Here's what's happening with your {businessType === 'school' ? 'school' : businessType === 'office' ? 'office' : businessType === 'medical' ? 'medical practice' : 'business'} today.
          </p>
        </div>
        {canViewBusinessTypeSelector() && (
        <select
          value={businessType}
          onChange={(e) => {
            setBusinessType(e.target.value)
            localStorage.setItem('businessType', e.target.value)
          }}
            className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="retail">Retail</option>
          <option value="school">School/College</option>
          <option value="office">Office</option>
            <option value="medical">Medical</option>
        </select>
        )}
      </div>

      {/* Stats Grid - Show based on role */}
      {(canViewFullDashboard() || canViewFinancialData()) && (
        <div className="grid grid-cols-1 gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg hover-lift transition-all duration-200 cursor-pointer" onClick={() => {
              if (stat.name.includes('Sales')) navigate('/invoices')
              else if (stat.name.includes('Customer')) navigate('/customers')
              else if (stat.name.includes('Product')) navigate('/products')
            }}>
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Icon className="h-6 w-6 text-primary-600 transition-transform duration-200 group-hover:scale-110" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
                      <dd className="text-2xl font-semibold text-gray-900">
                        {stat.value}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      )}

      {/* Limited view for Cashier role - Only payment-related stats */}
      {!canViewFullDashboard() && !canViewFinancialData() && canViewPaymentCollection() && businessType === 'school' && (
        <div className="grid grid-cols-1 gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DollarSign className="h-6 w-6 text-primary-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Today's Collection</dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      ₹{stats.totalFeesCollected.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Pending Payments</dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {duesDetails.filter((d: any) => d.balanceAmount > 0).length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FileText className="h-6 w-6 text-primary-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Outstanding</dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      ₹{stats.outstandingFees.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dues Overview Card for School - Only for Accountant, Admin, Owner */}
      {businessType === 'school' && canViewDuesManagement() && (
        <div className="bg-white shadow rounded-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-medium text-gray-900">Fee Dues Overview</h3>
              <p className="text-xs sm:text-sm text-gray-500">Complete picture of all outstanding fees</p>
            </div>
            <button
              onClick={() => setShowDuesDetails(!showDuesDetails)}
              className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-transparent rounded-md shadow-sm text-xs sm:text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 w-full sm:w-auto"
            >
              <Eye className="h-4 w-4 mr-2" />
              {showDuesDetails ? 'Hide Details' : 'View All Dues'}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4">
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-red-600">Overdue</p>
                  <p className="text-2xl font-bold text-red-900">
                    {duesDetails.filter((d: any) => d.daysOverdue > 0).length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-yellow-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-yellow-600">Due This Week</p>
                  <p className="text-2xl font-bold text-yellow-900">
                    {duesDetails.filter((d: any) => d.daysRemaining >= 0 && d.daysRemaining <= 7 && d.daysOverdue === 0).length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-blue-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-blue-600">Pending</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {duesDetails.filter((d: any) => d.status === 'Pending').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center">
                <DollarSign className="h-5 w-5 text-gray-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Outstanding</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ₹{duesDetails.reduce((sum: number, d: any) => sum + (d.balanceAmount || 0), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {showDuesDetails && (
            <div className="mt-6">
              {/* Filters */}
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                    <select
                      value={duesFilters.classId}
                      onChange={(e) => setDuesFilters({ ...duesFilters, classId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="">All Classes</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={duesFilters.status}
                      onChange={(e) => setDuesFilters({ ...duesFilters, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="">All Status</option>
                      <option value="Overdue">Overdue</option>
                      <option value="Upcoming">Due This Week</option>
                      <option value="Pending">Pending</option>
                      <option value="Partial">Partial</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Days Overdue</label>
                    <select
                      value={duesFilters.daysOverdue}
                      onChange={(e) => setDuesFilters({ ...duesFilters, daysOverdue: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="">All</option>
                      <option value="7">Last 7 Days</option>
                      <option value="15">Last 15 Days</option>
                      <option value="30">Last 30 Days</option>
                      <option value="60">Last 60 Days</option>
                      <option value="90">Last 90 Days</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={fetchDuesDetails}
                      className="w-full px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm font-medium"
                    >
                      <Filter className="h-4 w-4 inline mr-2" />
                      Apply Filters
                    </button>
                  </div>
                </div>
              </div>

              {/* Dues Table */}
              {loadingDues ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fee Type</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount Due</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {duesDetails.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="px-4 py-8 text-center text-sm text-gray-500">
                            No dues found. {duesFilters.classId || duesFilters.status || duesFilters.daysOverdue ? 'Try adjusting your filters.' : 'All fees are paid.'}
                          </td>
                        </tr>
                      ) : (
                        duesDetails.map((due: any) => {
                          const isOverdue = due.daysOverdue > 0
                          const isDueSoon = !isOverdue && due.daysRemaining <= 7 && due.daysRemaining >= 0
                          
                          return (
                            <tr key={due.feeId} className={isOverdue ? 'bg-red-50' : isDueSoon ? 'bg-yellow-50' : ''}>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{due.studentName}</div>
                                <div className="text-xs text-gray-500">{due.studentIdNumber}</div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{due.className}</td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{due.feeType}</div>
                                {due.installmentNumber && (
                                  <div className="text-xs text-gray-500">Installment #{due.installmentNumber}</div>
                                )}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                {formatDate(due.dueDate)}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                {isOverdue ? (
                                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                    {due.daysOverdue} days overdue
                                  </span>
                                ) : isDueSoon ? (
                                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                    {due.daysRemaining} days left
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                    {due.daysRemaining} days left
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                ₹{due.balanceAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                {due.lateFeeAmount > 0 && (
                                  <div className="text-xs text-red-600">+ ₹{due.lateFeeAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} late fee</div>
                                )}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span
                                  className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                    due.status === 'Paid'
                                      ? 'bg-green-100 text-green-800'
                                      : due.status === 'Overdue'
                                      ? 'bg-red-100 text-red-800'
                                      : due.status === 'Partial'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}
                                >
                                  {due.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                {due.parentPhone && <div>{due.parentPhone}</div>}
                                {due.parentEmail && <div className="text-xs">{due.parentEmail}</div>}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                {canViewPaymentCollection() ? (
                                  <button
                                    onClick={() => navigate(`/fees?studentId=${due.studentId}&feeId=${due.feeId}`)}
                                    className="text-primary-600 hover:text-primary-900 font-medium"
                                    title="View/Record Payment"
                                  >
                                    Record Payment
                                  </button>
                                ) : (
                                  <span className="text-gray-400 text-xs">View Only</span>
                                )}
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Summary Footer */}
              {duesDetails.length > 0 && (
                <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Total Records: </span>
                      <span className="font-semibold">{duesDetails.length}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Outstanding: </span>
                      <span className="font-semibold text-red-600">
                        ₹{duesDetails.reduce((sum: number, d: any) => sum + (d.balanceAmount || 0), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Overdue Count: </span>
                      <span className="font-semibold text-red-600">
                        {duesDetails.filter((d: any) => d.daysOverdue > 0).length}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Due This Week: </span>
                      <span className="font-semibold text-yellow-600">
                        {duesDetails.filter((d: any) => d.daysRemaining >= 0 && d.daysRemaining <= 7 && d.daysOverdue === 0).length}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Charts - Only for users who can view reports */}
      {canViewReports() && (
        <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2">
          <div className="bg-white shadow rounded-lg p-4 sm:p-6 overflow-hidden">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4 truncate">
              {businessType === 'school' ? 'Fee Collection Trend' : businessType === 'office' ? 'Project Revenue Trend' : businessType === 'medical' ? 'Consultation Fees Trend' : 'Sales Trend'} (Last 7 Days)
          </h3>
            <div className="w-full" style={{ minHeight: '250px' }}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="sales" stroke="#0ea5e9" strokeWidth={2} name="Amount (₹)" />
            </LineChart>
          </ResponsiveContainer>
            </div>
        </div>

          <div className="bg-white shadow rounded-lg p-4 sm:p-6 overflow-hidden">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4 truncate">
              {businessType === 'school' ? 'Fee Payments' : businessType === 'office' ? 'Project Status' : businessType === 'medical' ? 'Appointments' : 'Daily Invoices'}
          </h3>
            <div className="w-full" style={{ minHeight: '250px' }}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
                <Bar dataKey="invoices" fill="#0ea5e9" name={businessType === 'school' ? 'Payments' : businessType === 'office' ? 'Projects' : businessType === 'medical' ? 'Appointments' : 'Invoices'} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
        </div>
      )}

      {/* Access Restricted Message for users without sufficient permissions */}
      {!canViewFullDashboard() && !canViewFinancialData() && !canViewPaymentCollection() && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-yellow-600 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-yellow-800">Limited Access</h3>
              <p className="mt-1 text-sm text-yellow-700">
                You don't have permission to view dashboard statistics. Please contact your administrator for access.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
