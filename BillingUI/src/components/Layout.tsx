import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  LayoutDashboard,
  Package,
  Users,
  FileText,
  BarChart3,
  LogOut,
  Menu,
  X,
  LucideIcon,
  Bell,
  Activity,
  Moon,
  Sun,
  GraduationCap,
  Building2,
  FolderKanban,
  DollarSign,
  Calendar,
  Clock,
  Target,
  Percent,
  Heart,
  Pill,
  Stethoscope,
  Shield,
  Settings,
  ChevronDown,
  ChevronRight,
  Upload,
  Warehouse,
  Ruler,
  RotateCcw,
  RefreshCw,
  HelpCircle,
} from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { useState, useEffect } from 'react'

interface NavigationItem {
  name: string
  href: string
  icon: LucideIcon
  billingTypes?: string[] // Array of billing types this menu applies to. If undefined, applies to all
  group?: string // Optional group name for organization
  superAdminOnly?: boolean // If true, only show for SuperAdmin users
}

interface NavigationGroup {
  name: string
  items: NavigationItem[]
}

const Layout = () => {
  const { logout, user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false)
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [isThemeTransitioning, setIsThemeTransitioning] = useState(false)
  // Initialize with Common group expanded by default
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['Common']))
  
  // Expand the active item's group when location changes
  useEffect(() => {
    const activeItem = allNavigationItems.find(item => {
      const href = item.href
      return location.pathname === href || location.pathname.startsWith(href + '/')
    })
    if (activeItem && activeItem.group) {
      setExpandedGroups(prev => new Set([...prev, activeItem.group!]))
    }
  }, [location.pathname])
  
  // Get user type and billing type from localStorage
  const userType = localStorage.getItem('userType') || 'User'
  const billingType = localStorage.getItem('billingType') || 'General'
  const tenantName = localStorage.getItem('tenantName') || 'Tenant'
  const tenantCode = localStorage.getItem('tenantCode') || ''
  const isSuperAdminStorage = localStorage.getItem('isSuperAdmin') === 'true'
  
  // Check if user is SuperAdmin
  const isSuperAdmin = isSuperAdminStorage || userType.includes('SuperAdmin') || tenantCode === 'SYSTEM'

  // Normalize billing type (handle variations)
  const normalizedBillingType = (() => {
    const type = billingType.toLowerCase()
    if (type === 'school' || type === 'college' || type === 'university') {
      return 'School'
    }
    if (type === 'office' || type === 'project' || type === 'service') {
      return 'Office'
    }
    if (type === 'medical' || type === 'clinic' || type === 'hospital' || type === 'pharmacy' || type === 'healthcare') {
      return 'Medical'
    }
    // Default to General for 'general', 'retail', 'business', or any other value
    return 'General'
  })()

  // Define all navigation items with billing type assignments
  const allNavigationItems: NavigationItem[] = [
    // SuperAdmin menus (only visible to SuperAdmin)
    ...(isSuperAdmin ? [
      { name: 'Tenant Management', href: '/admin/tenants', icon: Building2, group: 'Administration', superAdminOnly: true },
      { name: 'User Management', href: '/admin/users', icon: Users, group: 'Administration', superAdminOnly: true },
    ] : []),
    
    // Common menus (available to all billing types)
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, group: 'Common' },
    { name: 'Reports', href: '/reports', icon: BarChart3, group: 'Common' },
    { name: 'Alerts', href: '/alerts', icon: Bell, group: 'Common' },
    { name: 'Activity Logs', href: '/activity-logs', icon: Activity, group: 'Common' },
    { name: 'Export', href: '/export', icon: FileText, group: 'Common' },
    { name: 'Permissions', href: '/permissions', icon: Activity, group: 'Common' },
    { name: 'Contact Us', href: '/contact-us', icon: HelpCircle, group: 'Common' },
    
    // General/Retail Billing menus
    { name: 'Products', href: '/products', icon: Package, billingTypes: ['General'], group: 'Retail' },
    { name: 'Inventory', href: '/inventory', icon: Warehouse, billingTypes: ['General'], group: 'Retail' },
    { name: 'Customers', href: '/customers', icon: Users, billingTypes: ['General'], group: 'Retail' },
    { name: 'Invoices', href: '/invoices', icon: FileText, billingTypes: ['General'], group: 'Retail' },
    { name: 'Payments', href: '/payments', icon: FileText, billingTypes: ['General'], group: 'Retail' },
    { name: 'Credit Notes', href: '/credit-notes', icon: FileText, billingTypes: ['General'], group: 'Retail' },
    { name: 'Bundle Products', href: '/bundle-products', icon: Package, billingTypes: ['General'], group: 'Retail' },
    { name: 'Size Charts', href: '/size-charts', icon: Ruler, billingTypes: ['General'], group: 'Retail' },
    { name: 'Sales Returns', href: '/sales-returns', icon: RotateCcw, billingTypes: ['General'], group: 'Retail' },
    { name: 'Sales Exchanges', href: '/sales-exchanges', icon: RefreshCw, billingTypes: ['General'], group: 'Retail' },
    
    // Optional: Restaurant/Hotel specific (uncomment if needed)
    // { name: 'Tables', href: '/tables', icon: FileText, billingTypes: ['General'], group: 'Restaurant' },
    
    // Optional: Service Business specific (uncomment if needed)
    // { name: 'Job Cards', href: '/job-cards', icon: FileText, billingTypes: ['General'], group: 'Service' },
    
    // School/College Billing menus
    { name: 'Students', href: '/students', icon: GraduationCap, billingTypes: ['School'], group: 'School' },
    { name: 'Classes', href: '/classes', icon: GraduationCap, billingTypes: ['School'], group: 'School' },
    { name: 'Fee Heads', href: '/fee-heads', icon: DollarSign, billingTypes: ['School'], group: 'School' },
    { name: 'Fees', href: '/fees', icon: DollarSign, billingTypes: ['School'], group: 'School' },
    { name: 'Fee Assignment', href: '/fee-assignment', icon: Users, billingTypes: ['School'], group: 'School' },
    { name: 'School Reports', href: '/school-reports', icon: BarChart3, billingTypes: ['School'], group: 'School' },
    { name: 'Installment Plans', href: '/installment-plans', icon: Calendar, billingTypes: ['School'], group: 'School' },
    { name: 'Fee Concessions', href: '/fee-concessions', icon: Percent, billingTypes: ['School'], group: 'School' },
    
    // Office/Project Billing menus
    { name: 'Office Clients', href: '/office-clients', icon: Building2, billingTypes: ['Office'], group: 'Office' },
    { name: 'Projects', href: '/projects', icon: FolderKanban, billingTypes: ['Office'], group: 'Office' },
    { name: 'Time Tracking', href: '/time-tracking', icon: Clock, billingTypes: ['Office'], group: 'Office' },
    { name: 'Milestones', href: '/milestones', icon: Target, billingTypes: ['Office'], group: 'Office' },
    { name: 'Documents', href: '/documents', icon: FileText, billingTypes: ['Office'], group: 'Office' },
    { name: 'Bill Scanner', href: '/bill-scanner', icon: Upload, billingTypes: ['Retail', 'Office', 'School', 'Medical'], group: 'Common' },
    
    // Medical Billing menus
    { name: 'Patients', href: '/patients', icon: Heart, billingTypes: ['Medical'], group: 'Medical' },
    { name: 'Appointments', href: '/appointments', icon: Calendar, billingTypes: ['Medical'], group: 'Medical' },
    { name: 'Medical Records', href: '/medical-records', icon: FileText, billingTypes: ['Medical'], group: 'Medical' },
    { name: 'Prescriptions', href: '/prescriptions', icon: Pill, billingTypes: ['Medical'], group: 'Medical' },
    { name: 'Pharmacy', href: '/pharmacy', icon: Pill, billingTypes: ['Medical'], group: 'Medical' },
    { name: 'Medical Codes', href: '/medical-codes', icon: Stethoscope, billingTypes: ['Medical'], group: 'Medical' },
  ]

  // Filter navigation items based on billing type
  const navigation: NavigationItem[] = allNavigationItems.filter(item => {
    // If no billingTypes specified, show for all types
    if (!item.billingTypes) return true
    // Otherwise, check if current billing type is in the list
    return item.billingTypes.includes(normalizedBillingType)
  })

  // Group navigation items for better organization
  const groupedNavigation: NavigationGroup[] = [
    ...(isSuperAdmin && navigation.some(item => item.group === 'Administration') ? [{
      name: 'Administration',
      items: navigation.filter(item => item.group === 'Administration')
    }] : []),
    {
      name: 'Common',
      items: navigation.filter(item => item.group === 'Common')
    },
    {
      name: normalizedBillingType === 'General' ? 'Retail' : normalizedBillingType === 'School' ? 'School' : normalizedBillingType === 'Medical' ? 'Medical' : 'Office',
      items: navigation.filter(item => item.group !== 'Common' && item.group !== 'Administration')
    }
  ].filter(group => group.items.length > 0) // Remove empty groups

  const isActive = (href: string): boolean => location.pathname === href

  // Handle theme toggle with animation
  const handleThemeToggle = () => {
    setIsThemeTransitioning(true)
    toggleTheme()
    setTimeout(() => setIsThemeTransitioning(false), 300)
  }

  // Close sidebar on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false)
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [sidebarOpen])

  // Toggle group expansion
  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev)
      if (newSet.has(groupName)) {
        newSet.delete(groupName)
      } else {
        newSet.add(groupName)
      }
      return newSet
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden animate-fade-in">
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity duration-300 animate-fade-in"
            onClick={() => setSidebarOpen(false)}
          ></div>
          <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white shadow-xl transform transition-transform duration-300 ease-out animate-slide-in-left h-full">
            <div className="flex h-16 items-center justify-between px-4 border-b bg-gradient-to-r from-primary-50 to-white flex-shrink-0">
              <h1 className="text-xl font-bold text-primary-600 animate-scale-in">Billing Software</h1>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-gray-500 hover:text-gray-700 focus:outline-none p-2 rounded-lg hover:bg-gray-100 transition-all duration-200 hover:scale-110 active:scale-95"
                aria-label="Close sidebar"
              >
                <X className="h-6 w-6 transition-transform duration-200 hover:rotate-90" />
              </button>
            </div>
            <nav className="flex-1 min-h-0 overflow-y-auto space-y-1 px-2 py-4 scroll-smooth">
              {groupedNavigation.map((group) => {
                const isExpanded = expandedGroups.has(group.name)
                return (
                  <div key={group.name} className="mb-2">
                    {group.items.length > 0 && (
                      <>
                        <button
                          onClick={() => toggleGroup(group.name)}
                          className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:bg-gray-50 rounded-lg transition-all duration-200 group cursor-pointer"
                          aria-expanded={isExpanded}
                        >
                          <span className="select-none">{group.name}</span>
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 transition-transform duration-200 group-hover:scale-110 flex-shrink-0" />
                          ) : (
                            <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:scale-110 flex-shrink-0" />
                          )}
                        </button>
                        <div
                          className={`overflow-hidden transition-all duration-300 ease-in-out ${
                            isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                          }`}
                        >
                          <div className="pt-1">
                            {group.items.map((item, index) => {
                              const Icon = item.icon
                              const isItemActive = isActive(item.href)
                              const isItemHovered = hoveredItem === item.name
                              return (
                                <Link
                                  key={item.name}
                                  to={item.href}
                                  onClick={() => setSidebarOpen(false)}
                                  onMouseEnter={() => setHoveredItem(item.name)}
                                  onMouseLeave={() => setHoveredItem(null)}
                                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 transform ${
                                    isItemActive
                                      ? 'bg-primary-50 text-primary-700 shadow-md scale-[1.02]'
                                      : 'text-gray-700 hover:bg-gray-100 hover:scale-[1.02] hover:shadow-sm'
                                  }`}
                                  style={{ animationDelay: `${index * 0.05}s` }}
                                >
                                  <Icon 
                                    className={`mr-3 h-5 w-5 flex-shrink-0 transition-all duration-200 ${
                                      isItemHovered || isItemActive ? 'scale-110 text-primary-600' : ''
                                    }`} 
                                  />
                                  <span className="transition-all duration-200">{item.name}</span>
                                </Link>
                              )
                            })}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </nav>
            <div className="p-4 border-t bg-gray-50 animate-slide-up flex-shrink-0">
              <div className="text-sm text-gray-600 mb-1 font-medium animate-fade-in">{tenantName}</div>
              <div className="text-xs text-gray-500 mb-1 animate-fade-in" style={{ animationDelay: '0.1s' }}>Type: {billingType}</div>
              <div className="text-xs text-gray-500 mb-3 animate-fade-in" style={{ animationDelay: '0.2s' }}>User: {userType}</div>
              <button
                onClick={logout}
                className="ripple flex items-center w-full px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-95 group"
              >
                <LogOut className="mr-3 h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col h-full bg-white border-r border-gray-200 shadow-sm">
          <div className="flex h-16 items-center px-4 border-b bg-gradient-to-r from-primary-50 to-white flex-shrink-0">
            <h1 className="text-xl font-bold text-primary-600 animate-fade-in">Billing Software</h1>
          </div>
          <nav className="flex-1 min-h-0 overflow-y-auto space-y-1 px-2 py-4 scroll-smooth">
            {groupedNavigation.map((group) => {
              const isExpanded = expandedGroups.has(group.name)
              return (
                <div key={group.name} className="mb-2">
                  {group.items.length > 0 && (
                    <>
                      <button
                        onClick={() => toggleGroup(group.name)}
                        className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:bg-gray-50 rounded-lg transition-all duration-200 group cursor-pointer"
                        aria-expanded={isExpanded}
                      >
                        <span className="select-none">{group.name}</span>
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 transition-transform duration-200 group-hover:scale-110 flex-shrink-0" />
                        ) : (
                          <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:scale-110 flex-shrink-0" />
                        )}
                      </button>
                      <div
                        className={`overflow-hidden transition-all duration-300 ease-in-out ${
                          isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                        }`}
                      >
                        <div className="pt-1">
                          {group.items.map((item, index) => {
                            const Icon = item.icon
                            const isItemActive = isActive(item.href)
                            const isItemHovered = hoveredItem === item.name
                            return (
                              <Link
                                key={item.name}
                                to={item.href}
                                onMouseEnter={() => setHoveredItem(item.name)}
                                onMouseLeave={() => setHoveredItem(null)}
                                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 transform relative group ${
                                  isItemActive
                                    ? 'bg-primary-50 text-primary-700 shadow-md scale-[1.02]'
                                    : 'text-gray-700 hover:bg-gray-100 hover:scale-[1.02] hover:shadow-sm'
                                }`}
                                style={{ animationDelay: `${index * 0.03}s` }}
                              >
                                {isItemActive && (
                                  <span className="absolute left-0 top-0 bottom-0 w-1 bg-primary-600 rounded-r-full animate-scale-in"></span>
                                )}
                                <Icon 
                                  className={`mr-3 h-5 w-5 transition-all duration-200 ${
                                    isItemHovered || isItemActive 
                                      ? 'scale-110 text-primary-600 rotate-3' 
                                      : 'group-hover:scale-105'
                                  }`} 
                                />
                                <span className="transition-all duration-200">{item.name}</span>
                              </Link>
                            )
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </nav>
          <div className="p-4 border-t bg-gray-50 animate-slide-up flex-shrink-0">
            <div className="text-sm text-gray-600 mb-1 font-medium animate-fade-in">{tenantName}</div>
            <div className="text-xs text-gray-500 mb-1 animate-fade-in" style={{ animationDelay: '0.1s' }}>Billing Type: {billingType}</div>
            <div className="text-xs text-gray-500 mb-3 animate-fade-in" style={{ animationDelay: '0.2s' }}>User Type: {userType}</div>
            <button
              onClick={logout}
              className="ripple flex items-center w-full px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-95 group"
            >
              <LogOut className="mr-3 h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-10 flex h-16 bg-white shadow-sm border-b border-gray-200 backdrop-blur-sm bg-opacity-95">
          <button
            type="button"
            className="px-4 text-gray-500 lg:hidden hover:text-gray-700 transition-all duration-200 hover:bg-gray-100 rounded-lg active:scale-95"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu className="h-6 w-6 transition-transform duration-200 hover:scale-110" />
          </button>
          <div className="flex flex-1 items-center justify-between px-2 sm:px-4">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 animate-slide-up truncate">
              {navigation.find((n) => isActive(n.href))?.name || 'Dashboard'}
            </h2>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={handleThemeToggle}
                className={`p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300 hover:scale-110 active:scale-95 ${
                  isThemeTransitioning ? 'animate-rotate-slow' : ''
                }`}
                title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                disabled={isThemeTransitioning}
              >
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5 transition-transform duration-300 hover:rotate-180" />
                ) : (
                  <Moon className="h-5 w-5 transition-transform duration-300 hover:-rotate-12" />
                )}
              </button>
              <div className="flex items-center space-x-2 px-2 sm:px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all duration-200 hover:shadow-sm group">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse-soft group-hover:scale-125 transition-transform duration-200 flex-shrink-0"></div>
                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 font-medium truncate max-w-[100px] sm:max-w-none">
                  {localStorage.getItem('userName') || user?.email || 'User'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-3 sm:p-4 md:p-6 animate-fade-in">
          <div className="animate-slide-up max-w-full overflow-x-hidden">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout

