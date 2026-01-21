// User and Auth Types
export interface User {
  id: number
  tenantId: number
  email: string
  firstName: string
  lastName: string
  phone?: string
  isActive: boolean
  createdAt: string
  lastLoginAt?: string
}

export interface LoginRequest {
  tenantCode: string
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  tenantId: number
  tenantName: string
  tenantCode?: string
  businessType?: string
  userRoles?: string[]
  userEmail?: string
  userName?: string
  isSuperAdmin?: boolean
}

export interface AuthContextType {
  user: User | null
  token: string | null
  tenantId: string | null
  login: (tenantCode: string | undefined, email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  loading: boolean
}

// Tenant Types
export interface Tenant {
  id: number
  name: string
  code: string
  businessType?: string
  contactEmail?: string
  contactPhone?: string
  address?: string
  isActive: boolean
  createdAt: string
  subscriptionExpiresAt?: string
  planType?: string
}

// Product Types
export interface ProductCategory {
  id: number
  tenantId: number
  name: string
  description?: string
  parentCategoryId?: number
  isActive: boolean
  createdAt: string
}

export interface Product {
  id: number
  tenantId: number
  name: string
  sku?: string
  hsnCode?: string
  sacCode?: string
  description?: string
  categoryId?: number
  costPrice: number
  sellingPrice: number
  mrp?: number
  taxRate?: number
  taxType?: string
  stockQuantity?: number
  lowStockAlert?: number
  unit?: string
  imageUrl?: string
  type?: 'Product' | 'Service'
  barcode?: string
  isActive: boolean
  trackInventory: boolean
  // Medical purchase fields
  batchNo?: string
  manufacturingDate?: string
  expiryDate?: string
  manufacturer?: string
  supplierName?: string
  lastPurchasePrice?: number
  lastPurchaseQuantity?: number
  lastPurchaseDate?: string
  // Expiry configuration
  expiryType?: 'FIXED_DATE' | 'DURATION'
  expireAfterValue?: number
  expireAfterUnit?: 'DAYS' | 'MONTHS' | 'YEARS'
  alertBeforeValue?: number
  alertBeforeUnit?: 'DAYS' | 'MONTHS'
  isExpiryEnabled?: boolean
  // RMG fields
  styleCode?: string
  season?: string
  collection?: string
  gender?: string
  fabricType?: string
  sizeChartId?: number
  createdAt: string
  updatedAt: string
  category?: ProductCategory
  sizeChart?: SizeChart
}

// Customer Types
export interface Customer {
  id: number
  tenantId: number
  name: string
  email?: string
  phone?: string
  address?: string
  gstin?: string
  customerType?: 'B2B' | 'B2C'
  customerGroupId?: number
  paymentTerms?: string
  creditDays?: number
  creditLimit: number
  outstandingBalance: number
  loyaltyPoints: number
  walletBalance: number
  loyaltyPointsEarned?: number
  loyaltyPointsRedeemed?: number
  isActive: boolean
  createdAt: string
  customerGroup?: CustomerGroup
}

// Supplier Types
export interface Supplier {
  id: number
  tenantId: number
  name: string
  email?: string
  phone?: string
  address?: string
  gstin?: string
  outstandingBalance: number
  isActive: boolean
  createdAt: string
}

// Invoice Types
export interface InvoiceItem {
  id?: number
  invoiceId?: number
  productId: number
  productName: string
  quantity: number
  unitPrice: number
  discountAmount: number
  taxRate: number
  taxAmount: number
  totalAmount: number
  // RMG variant tracking
  variantCombinationId?: number
  size?: string
  color?: string
  product?: Product
}

export interface Invoice {
  id: number
  tenantId: number
  invoiceNumber: string
  invoiceDate: string
  customerId?: number
  customerName?: string
  customerPhone?: string // Mobile number for walk-in customers
  status: 'Draft' | 'Completed' | 'Cancelled' | 'Hold'
  subTotal: number
  taxAmount: number
  discountAmount: number
  billLevelDiscount?: number
  roundOff: number
  totalAmount: number
  paidAmount: number
  balanceAmount: number
  paymentMode?: string
  paymentTerms?: string
  dueDate?: string
  isTaxInvoice?: boolean
  placeOfSupply?: string
  loyaltyPointsEarned?: number
  loyaltyPointsRedeemed?: number
  notes?: string
  createdById: number
  createdAt: string
  cancelledAt?: string
  cancellationReason?: string
  customer?: Customer
  createdBy?: User
  items: InvoiceItem[]
  payments?: Payment[]
}

// Payment Types
export interface Payment {
  id: number
  tenantId: number
  invoiceId: number
  amount: number
  paymentMode: 'Cash' | 'UPI' | 'Card' | 'BankTransfer'
  transactionId?: string
  notes?: string
  paymentDate: string
  createdById: number
}

// Inventory Types
export interface Inventory {
  id: number
  tenantId: number
  productId: number
  variantCombinationId?: number
  quantity: number
  averageCost: number
  lastUpdatedAt: string
  product?: Product
  variantCombination?: ProductVariantCombination
}

export interface StockTransaction {
  id: number
  tenantId: number
  productId: number
  transactionType: 'In' | 'Out' | 'Adjustment'
  quantity: number
  unitCost?: number
  referenceType?: string
  referenceId?: number
  notes?: string
  transactionDate: string
  createdById: number
  product?: Product
}

export interface BulkPricing {
  id: number
  tenantId: number
  productId: number
  customerType: 'B2B' | 'B2C'
  customerGroupId?: number
  minQuantity: number
  maxQuantity?: number
  unitPrice: number
  discountPercentage?: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  product?: Product
  customerGroup?: CustomerGroup
}

export interface LoyaltyTransaction {
  id: number
  tenantId: number
  customerId: number
  transactionType: 'Earn' | 'Redeem'
  points: number
  referenceType?: string
  referenceId?: number
  notes?: string
  transactionDate: string
  customer?: Customer
}

// Purchase Order Types
export interface PurchaseOrderItem {
  id: number
  purchaseOrderId: number
  productId: number
  productName: string
  quantity: number
  unitPrice: number
  taxRate: number
  taxAmount: number
  totalAmount: number
}

export interface PurchaseOrder {
  id: number
  tenantId: number
  supplierId: number
  orderNumber: string
  orderDate: string
  status: 'Pending' | 'Received' | 'Cancelled'
  subTotal: number
  taxAmount: number
  totalAmount: number
  notes?: string
  createdById: number
  createdAt: string
  supplier?: Supplier
  items: PurchaseOrderItem[]
}

// Report Types
export interface DailySales {
  date: string
  amount: number
  invoiceCount: number
}

export interface SalesReport {
  totalSales: number
  totalTax: number
  totalDiscount: number
  totalInvoices: number
  totalCost?: number
  totalProfit?: number
  dailySales: DailySales[]
}

export interface ProductSalesItem {
  productId: number
  productName: string
  quantity: number
  totalAmount: number
  totalCost: number
  profit: number
}

export interface ProductSalesReport {
  items: ProductSalesItem[]
}

export interface StockSummaryItem {
  productId: number
  productName: string
  quantity: number
  averageCost: number
  totalValue: number
  isLowStock: boolean
}

export interface StockSummaryReport {
  items: StockSummaryItem[]
  lowStockCount: number
  totalValue: number
}

// Form Types
export interface CustomerFormData {
  name: string
  email: string
  phone: string
  address: string
}

export interface ProductFormData {
  name: string
  sku?: string
  categoryId?: number
  costPrice: number
  sellingPrice: number
  taxRate?: number
  stockQuantity?: number
  unit?: string
  description?: string
}

export interface InvoiceItemForm {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  discountAmount: number
  taxRate: number
  taxAmount: number
  totalAmount: number
  // RMG variant fields
  variantCombinationId?: number
  size?: string
  color?: string
}

export interface InvoiceFormData {
  customerId: number | null
  customerName: string | null
  invoiceDate: string
  status: 'Draft' | 'Completed'
  items: InvoiceItemForm[]
}

// ============================================
// SCHOOL/COLLEGE BILLING TYPES
// ============================================

export interface Class {
  id: number
  tenantId: number
  name: string
  code?: string
  type: 'School' | 'College' | 'University'
  course?: string
  department?: string
  maxStrength?: number
  currentStrength: number
  academicYear: string
  classTeacher?: string
  isActive: boolean
  createdAt: string
}

export interface Student {
  id: number
  tenantId: number
  studentId: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  dateOfBirth: string
  gender?: string
  address?: string
  city?: string
  state?: string
  pincode?: string
  classId?: number
  section?: string
  course?: string
  department?: string
  academicYear: string
  status: string
  parentName?: string
  parentPhone?: string
  parentEmail?: string
  guardianName?: string
  guardianPhone?: string
  totalFees: number
  paidFees: number
  outstandingFees: number
  scholarshipAmount: number
  isScholarshipApplicable: boolean
  discountPercentage?: number
  discountAmount?: number
  discountReason?: string
  isDiscountActive?: boolean
  createdAt: string
  updatedAt?: string
  class?: Class
  id: number
  tenantId: number
  studentId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth: string
  gender: string
  address: string
  city: string
  state: string
  pincode: string
  classId?: number
  section?: string
  course?: string
  department?: string
  academicYear: string
  status: 'Active' | 'Graduated' | 'Transferred' | 'Withdrawn'
  parentName?: string
  parentPhone?: string
  parentEmail?: string
  guardianName?: string
  guardianPhone?: string
  totalFees: number
  paidFees: number
  outstandingFees: number
  scholarshipAmount: number
  isScholarshipApplicable: boolean
  createdAt: string
  updatedAt?: string
  class?: Class
}

export interface FeeStructure {
  id: number
  tenantId: number
  classId?: number
  feeHeadId: number
  name: string
  feeType: string
  amount: number
  frequency: 'Monthly' | 'Quarterly' | 'Semester' | 'Annual' | 'One-time'
  academicYear: string
  isMandatory: boolean
  isOptional: boolean
  maxInstallments?: number
  lateFeeAmount?: number
  lateFeeDays?: number
  isActive: boolean
  createdAt: string
  class?: Class
  feeHead?: {
    id: number
    name: string
    code?: string
  }
  installments?: FeeInstallment[]
}

export interface FeeInstallment {
  id: number
  feeStructureId: number
  installmentNumber: number
  amount: number
  dueDate: string
  lateFeeAmount?: number
  description?: string
  isActive: boolean
  createdAt: string
}

export interface FeeHead {
  id: number
  tenantId: number
  name: string
  code: string
  description?: string
  isOptional: boolean
  isActive: boolean
  displayOrder: number
  createdAt: string
}

export interface Fee {
  id: number
  tenantId: number
  studentId: number
  feeStructureId: number
  feeNumber: string
  feeType: string
  amount: number
  discountAmount: number
  scholarshipAmount: number
  netAmount: number
  paidAmount: number
  balanceAmount: number
  dueDate: string
  status: 'Pending' | 'Partial' | 'Paid' | 'Overdue' | 'Waived'
  term?: string
  month?: string
  installmentNumber?: number
  academicYear?: string
  lateFeeAmount?: number
  notes?: string
  createdAt: string
  paidDate?: string
  student?: Student
  feeStructure?: FeeStructure
}

export interface FeePayment {
  id: number
  tenantId: number
  feeId: number
  studentId: number
  receiptNumber: string
  amount: number
  paymentMode: string
  transactionId?: string
  paymentGateway?: string
  paymentGatewayOrderId?: string
  paymentGatewayPaymentId?: string
  chequeNumber?: string
  chequeDate?: string
  bankName?: string
  upiId?: string
  paymentStatus: string
  paymentDate: string
  notes?: string
  createdAt: string
  isReceiptGenerated?: boolean
  student?: Student
  fee?: Fee
}

// ============================================
// OFFICE BILLING TYPES
// ============================================

export interface OfficeClient {
  id: number
  tenantId: number
  clientCode: string
  companyName: string
  contactPerson?: string
  email: string
  phone: string
  alternatePhone?: string
  address: string
  city?: string
  state?: string
  pincode?: string
  country?: string
  gstin?: string
  pan?: string
  clientType: 'Corporate' | 'Individual' | 'Government'
  status: 'Active' | 'Inactive' | 'Suspended'
  creditLimit: number
  outstandingBalance: number
  paymentTerms?: string
  createdAt: string
  updatedAt?: string
}

export interface Project {
  id: number
  tenantId: number
  clientId: number
  projectCode: string
  projectName: string
  description?: string
  projectType: 'Fixed' | 'Time & Material' | 'Retainer'
  startDate: string
  endDate?: string
  expectedCompletionDate?: string
  status: 'Active' | 'On Hold' | 'Completed' | 'Cancelled'
  budget: number
  billedAmount: number
  paidAmount: number
  balanceAmount: number
  projectManager?: string
  notes?: string
  createdAt: string
  updatedAt?: string
  client?: OfficeClient
}

export interface ProjectInvoice {
  id: number
  tenantId: number
  projectId: number
  clientId: number
  invoiceNumber: string
  invoiceDate: string
  milestone?: string
  description?: string
  subTotal: number
  taxAmount: number
  discountAmount: number
  totalAmount: number
  paidAmount: number
  balanceAmount: number
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Cancelled'
  dueDate?: string
  paymentTerms?: string
  notes?: string
  createdAt: string
  items?: ProjectInvoiceItem[]
}

export interface ProjectInvoiceItem {
  id: number
  projectInvoiceId: number
  description: string
  quantity: number
  unitPrice: number
  taxRate: number
  taxAmount: number
  totalAmount: number
}

export interface ProjectExpense {
  id: number
  tenantId: number
  projectId: number
  expenseType: string
  description: string
  amount: number
  expenseDate: string
  vendor?: string
  receiptNumber?: string
  paymentMode?: string
  status: 'Pending' | 'Approved' | 'Rejected' | 'Paid'
  notes?: string
  createdAt: string
}

export interface ServiceContract {
  id: number
  tenantId: number
  clientId: number
  contractNumber: string
  serviceName: string
  description?: string
  contractType: 'Monthly' | 'Quarterly' | 'Annual' | 'One-time'
  contractValue: number
  monthlyAmount: number
  startDate: string
  endDate: string
  autoRenewal: boolean
  status: 'Active' | 'Expired' | 'Cancelled' | 'Suspended'
  paymentTerms?: string
  notes?: string
  createdAt: string
  updatedAt?: string
  client?: OfficeClient
}

export interface ContractInvoice {
  id: number
  tenantId: number
  contractId: number
  clientId: number
  invoiceNumber: string
  invoiceDate: string
  dueDate: string
  period: string
  amount: number
  taxAmount: number
  totalAmount: number
  paidAmount: number
  balanceAmount: number
  status: 'Pending' | 'Paid' | 'Overdue'
  paidDate?: string
  createdAt: string
}

// Advanced Features Types
export interface InstallmentPlan {
  id: number
  tenantId: number
  feeId: number
  studentId: number
  planName: string
  numberOfInstallments: number
  totalAmount: number
  installmentAmount: number
  startDate: string
  frequency: 'Monthly' | 'Quarterly' | 'Weekly'
  status: 'Active' | 'Completed' | 'Cancelled'
  createdAt: string
  student?: Student
  fee?: Fee
  installments?: Installment[]
}

export interface Installment {
  id: number
  installmentPlanId: number
  installmentNumber: number
  amount: number
  dueDate: string
  paidAmount: number
  paidDate?: string
  status: 'Pending' | 'Paid' | 'Overdue'
  paymentReference?: string
}

export interface TimeEntry {
  id: number
  tenantId: number
  projectId: number
  userId?: number
  employeeName: string
  entryDate: string
  hours: number
  description?: string
  taskType: string
  isBillable: boolean
  hourlyRate?: number
  totalAmount?: number
  status: 'Pending' | 'Approved' | 'Rejected' | 'Billed'
  approvedById?: number
  approvedAt?: string
  createdAt: string
  project?: Project
  user?: User
}

// Medical Billing Types
export interface Patient {
  id: number
  tenantId: number
  patientId: string
  firstName: string
  lastName: string
  dateOfBirth: string
  gender: string
  email?: string
  phone?: string
  mobile?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
  bloodGroup?: string
  allergies?: string
  medicalHistory?: string
  currentMedications?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  emergencyContactRelation?: string
  insuranceProvider?: string
  insurancePolicyNumber?: string
  insuranceGroupNumber?: string
  insuranceExpiryDate?: string
  insuranceCardNumber?: string
  status: string
  createdAt: string
  updatedAt?: string
}

// Appointment Types
export interface Appointment {
  id: number
  tenantId: number
  customerId?: number
  patientId?: number
  serviceId?: number
  appointmentType?: string
  specialty?: string
  appointmentDate: string
  appointmentTime: string
  durationMinutes: number
  status: 'Scheduled' | 'Confirmed' | 'InProgress' | 'Completed' | 'Cancelled' | 'NoShow' | 'Rescheduled'
  cancellationReason?: string
  cancelledAt?: string
  assignedToUserId?: number
  doctorName?: string
  location?: string
  notes?: string
  reasonForVisit?: string
  isRecurring: boolean
  recurringParentId?: number
  consultationFee?: number
  consultationFeePaymentMode?: string // Payment mode for consultation fee (Cash, UPI, Card, BankTransfer, etc.)
  invoiceId?: number
  medicalRecordId?: number
  createdAt: string
  updatedAt?: string
  confirmedAt?: string
  completedAt?: string
  createdById?: number
  patient?: Patient
  customer?: Customer
  service?: Product
  assignedTo?: User
  createdBy?: User
  invoice?: Invoice
}

// Workflow Types
export interface AppointmentWorkflowStatus {
  appointmentId: number
  appointmentStatus: string
  medicalRecord?: MedicalRecord
  invoice?: Invoice // Medicine invoice
  consultationInvoice?: Invoice // Consultation fee invoice (billed at reception)
  payment?: Payment
  workflowStage: string // Reception, Doctor, MedicineBilling, PaymentPending, Completed
  canStartConsultation: boolean // Reception can start consultation
  canCompleteConsultation: boolean // Doctor can complete consultation
  canGenerateMedicineBill?: boolean // Can generate medicine bill after consultation
  canProcessPayment: boolean // Can process medicine payment
  canExit: boolean
}

export interface PatientWorkflowStatus {
  patientId: number
  patientName: string
  currentAppointment?: Appointment
  currentMedicalRecord?: MedicalRecord
  currentInvoice?: Invoice
  workflowStage: string
  outstandingAmount?: number
  canExit: boolean
}

export interface MedicalRecord {
  id: number
  tenantId: number
  patientId: number
  providerId?: number
  visitNumber: string
  visitDate: string
  visitType: string
  chiefComplaint?: string
  historyOfPresentIllness?: string
  reviewOfSystems?: string
  physicalExamination?: string
  assessment?: string
  plan?: string
  notes?: string
  height?: number
  weight?: number
  bloodPressureSystolic?: number
  bloodPressureDiastolic?: number
  temperature?: number
  pulse?: number
  respiratoryRate?: number
  oxygenSaturation?: number
  status: string
  createdAt: string
  updatedAt?: string
  patient?: Patient
  provider?: User
}

export interface Milestone {
  id: number
  tenantId: number
  projectId: number
  name: string
  description?: string
  targetDate: string
  completedDate?: string
  percentageComplete: number
  status: 'Not Started' | 'In Progress' | 'Completed' | 'Delayed' | 'Cancelled'
  billingAmount?: number
  isBilled: boolean
  invoiceId?: number
  createdAt: string
  updatedAt?: string
  project?: Project
  deliverables?: Deliverable[]
}

export interface Deliverable {
  id: number
  milestoneId: number
  name: string
  description?: string
  status: 'Pending' | 'In Progress' | 'Completed' | 'Rejected'
  completedDate?: string
  fileUrl?: string
  notes?: string
}

export interface Document {
  id: number
  tenantId: number
  documentType: string
  entityType?: string
  entityId?: number
  fileName: string
  originalFileName: string
  filePath: string
  fileType: string
  fileSize: number
  description?: string
  tags?: string
  createdAt: string
}

export interface FeeConcession {
  id: number
  tenantId: number
  studentId: number
  feeId?: number
  concessionType: 'Discount' | 'Waiver' | 'Scholarship'
  amount: number
  percentage?: number
  reason: string
  status: 'Pending' | 'Approved' | 'Rejected'
  requestedById: number
  approvedById?: number
  approvedAt?: string
  approvalNotes?: string
  validFrom: string
  validTo?: string
  createdAt: string
  student?: Student
  fee?: Fee
}

// Prescription Types
export interface Prescription {
  id: number
  tenantId: number
  medicalRecordId: number
  patientId: number
  prescriptionNumber: string
  medicationName: string
  genericName?: string
  dosage: string
  frequency: string
  duration: string
  quantity: number
  unitPrice?: number
  totalPrice?: number
  productId?: number
  instructions?: string
  schedule?: string
  prescribedDate: string
  startDate?: string
  endDate?: string
  status: 'Active' | 'Completed' | 'Discontinued'
  notes?: string
  createdAt: string
  patient?: Patient
  medicalRecord?: MedicalRecord
  product?: Product
}

// Medical Code Types
export interface ICD10Code {
  id: number
  code: string
  description: string
  category: string
  chapter?: string
  isActive: boolean
  createdAt: string
}

// RMG (Readymade Garments) Types
export interface ProductVariantCombination {
  id: number
  tenantId: number
  productId: number
  size: string
  color: string
  sku?: string
  barcode?: string
  costPrice?: number
  sellingPrice?: number
  stockQuantity: number
  imageUrl?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  product?: Product
}

export interface SizeChart {
  id: number
  tenantId: number
  name: string
  sizeValues: string // JSON array of sizes
  description?: string
  isDefault: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface SalesReturn {
  id: number
  tenantId: number
  invoiceId: number
  returnNumber: string
  returnDate: string
  reason: string
  status: 'Pending' | 'Approved' | 'Processed' | 'Cancelled'
  totalAmount: number
  notes?: string
  createdById: number
  createdAt: string
  approvedAt?: string
  processedAt?: string
  creditNoteId?: number
  invoice?: Invoice
  creditNote?: CreditNote
  items: SalesReturnItem[]
}

export interface SalesReturnItem {
  id: number
  salesReturnId: number
  invoiceItemId: number
  productId: number
  productName: string
  variantCombinationId?: number
  size?: string
  color?: string
  quantity: number
  unitPrice: number
  totalAmount: number
  reason?: string
  product?: Product
  variantCombination?: ProductVariantCombination
}

export interface SalesExchange {
  id: number
  tenantId: number
  invoiceId: number
  exchangeNumber: string
  exchangeDate: string
  reason: string
  status: 'Pending' | 'Approved' | 'Processed' | 'Cancelled'
  priceDifference: number
  notes?: string
  createdById: number
  createdAt: string
  approvedAt?: string
  processedAt?: string
  invoice?: Invoice
  items: SalesExchangeItem[]
}

export interface SalesExchangeItem {
  id: number
  salesExchangeId: number
  type: 'Original' | 'New'
  invoiceItemId?: number
  productId: number
  productName: string
  variantCombinationId?: number
  size?: string
  color?: string
  quantity: number
  unitPrice: number
  totalAmount: number
  product?: Product
  variantCombination?: ProductVariantCombination
}

export interface CPTCode {
  id: number
  code: string
  description: string
  category: string
  typicalFee?: number
  isActive: boolean
  createdAt: string
}

