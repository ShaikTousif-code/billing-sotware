import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import PrivateRoute from './components/PrivateRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import NewProduct from './pages/NewProduct'
import Customers from './pages/Customers'
import Invoices from './pages/Invoices'
import CreateInvoice from './pages/CreateInvoice'
import ViewInvoice from './pages/ViewInvoice'
import Reports from './pages/Reports'
import Payments from './pages/Payments'
import CreditNotes from './pages/CreditNotes'
import Alerts from './pages/Alerts'
import Export from './pages/Export'
import Wallet from './pages/Wallet'
import ProductVariants from './pages/ProductVariants'
import ActivityLogs from './pages/ActivityLogs'
import CustomerPurchaseHistory from './pages/CustomerPurchaseHistory'
import Tables from './pages/Tables'
import JobCards from './pages/JobCards'
import BundleProducts from './pages/BundleProducts'
import Permissions from './pages/Permissions'
import Students from './pages/Students'
import Classes from './pages/Classes'
import FeeHeads from './pages/FeeHeads'
import Fees from './pages/Fees'
import FeeAssignment from './pages/FeeAssignment'
import SchoolReports from './pages/SchoolReports'
import OfficeClients from './pages/OfficeClients'
import Projects from './pages/Projects'
import InstallmentPlans from './pages/InstallmentPlans'
import TimeTracking from './pages/TimeTracking'
import Milestones from './pages/Milestones'
import Documents from './pages/Documents'
import BillScanner from './pages/BillScanner'
import FeeConcessions from './pages/FeeConcessions'
import PaymentHistory from './pages/PaymentHistory'
import TenantManagement from './pages/TenantManagement'
import UserManagement from './pages/UserManagement'
import ContactUs from './pages/ContactUs'
import Pharmacy from './pages/Pharmacy'
import Inventory from './pages/Inventory'
import SizeCharts from './pages/SizeCharts'
import ProductVariantCombinations from './pages/ProductVariantCombinations'
import SalesReturns from './pages/SalesReturns'
import SalesExchanges from './pages/SalesExchanges'
import SizeWiseSales from './pages/Reports/SizeWiseSales'
import ColorWiseSales from './pages/Reports/ColorWiseSales'
import ExchangeReturnReport from './pages/Reports/ExchangeReturnReport'
import Layout from './components/Layout'
import ErrorBoundary from './components/ErrorBoundary'
import { ThemeProvider } from './contexts/ThemeContext'
import UpdateNotification from './components/UpdateNotification'

// Wrapper component to provide navigation to ErrorBoundary
// This component must be inside Router to use useNavigate
function ErrorBoundaryWrapper({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()

  const handleNavigateBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate('/dashboard', { replace: true })
    }
  }

  return (
    <ErrorBoundary onNavigateBack={handleNavigateBack}>
      {children}
    </ErrorBoundary>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <UpdateNotification />
          <Router>
            <ErrorBoundaryWrapper>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <Layout />
                  </PrivateRoute>
                }
              >
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="products" element={<Products />} />
                <Route path="products/new" element={<NewProduct />} />
                <Route path="products/:productId/edit" element={<NewProduct />} />
                <Route path="inventory" element={<Inventory />} />
                <Route path="customers" element={<Customers />} />
                <Route path="invoices" element={<Invoices />} />
                <Route path="invoices/new" element={<CreateInvoice />} />
                <Route path="invoices/:invoiceId/view" element={<ViewInvoice />} />
                <Route path="invoices/:invoiceId/edit" element={<CreateInvoice />} />
                <Route path="invoices/:invoiceId/payments" element={<Payments />} />
                <Route path="payments" element={<Payments />} />
                <Route path="credit-notes" element={<CreditNotes />} />
                <Route path="alerts" element={<Alerts />} />
                <Route path="bill-scanner" element={<BillScanner />} />
                <Route path="export" element={<Export />} />
                <Route path="wallet/customer/:customerId" element={<Wallet />} />
                <Route path="products/:productId/variants" element={<ProductVariants />} />
                <Route path="products/:productId/variant-combinations" element={<ProductVariantCombinations />} />
                <Route path="size-charts" element={<SizeCharts />} />
                <Route path="sales-returns" element={<SalesReturns />} />
                <Route path="sales-exchanges" element={<SalesExchanges />} />
                <Route path="reports/size-wise-sales" element={<SizeWiseSales />} />
                <Route path="reports/color-wise-sales" element={<ColorWiseSales />} />
                <Route path="reports/exchange-return" element={<ExchangeReturnReport />} />
                <Route path="activity-logs" element={<ActivityLogs />} />
                <Route path="customers/:customerId/purchase-history" element={<CustomerPurchaseHistory />} />
                <Route path="tables" element={<Tables />} />
                <Route path="job-cards" element={<JobCards />} />
                <Route path="bundle-products" element={<BundleProducts />} />
                <Route path="permissions" element={<Permissions />} />
                <Route path="students" element={<Students />} />
                <Route path="classes" element={<Classes />} />
                <Route path="fee-heads" element={<FeeHeads />} />
                <Route path="fees" element={<Fees />} />
                <Route path="payment-history" element={<PaymentHistory />} />
                <Route path="fee-assignment" element={<FeeAssignment />} />
                <Route path="school-reports" element={<SchoolReports />} />
                <Route path="office-clients" element={<OfficeClients />} />
                <Route path="projects" element={<Projects />} />
                <Route path="installment-plans" element={<InstallmentPlans />} />
                <Route path="time-tracking" element={<TimeTracking />} />
                <Route path="milestones" element={<Milestones />} />
                <Route path="documents" element={<Documents />} />
                <Route path="fee-concessions" element={<FeeConcessions />} />
                <Route path="reports" element={<Reports />} />
                <Route path="pharmacy" element={<Pharmacy />} />
                <Route path="admin/tenants" element={<TenantManagement />} />
                <Route path="admin/users" element={<UserManagement />} />
                <Route path="contact-us" element={<ContactUs />} />
              </Route>
            </Routes>
            </ErrorBoundaryWrapper>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App

