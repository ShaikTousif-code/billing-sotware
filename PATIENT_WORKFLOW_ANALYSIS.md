# Patient Workflow Analysis & Implementation Plan

## Current Status Assessment

### ✅ What EXISTS:

1. **Appointment Booking (AMS)**
   - ✅ Appointment model with Patient linking
   - ✅ AppointmentService with scheduling logic
   - ✅ AppointmentsController with full CRUD
   - ✅ UI for appointment management

2. **Consultation (Medical Records)**
   - ✅ MedicalRecord model with full patient data
   - ✅ MedicalRecordsController with CRUD
   - ✅ Prescriptions, Diagnoses, Procedures support
   - ✅ Vitals tracking

3. **Medicine Billing**
   - ✅ GenerateBillFromMedicalRecord endpoint exists
   - ✅ Invoice model supports PatientId and MedicalRecordId
   - ✅ Prescriptions and Procedures can be billed

4. **Payment**
   - ✅ PaymentService with payment processing
   - ✅ PaymentsController
   - ✅ Split payments support

### ❌ What's MISSING:

1. **Medical-Specific User Roles**
   - ❌ No "Doctor" role
   - ❌ No "Reception" role  
   - ❌ No "Medical Biller" role
   - Currently only: Owner, Manager, Cashier, Accountant

2. **Complete Workflow Integration**
   - ❌ No automatic link: Appointment → Medical Record
   - ❌ No workflow service connecting all steps
   - ❌ No single endpoint to complete full workflow
   - ❌ Missing: Appointment completion → Medical Record creation
   - ❌ Missing: Medical Record completion → Invoice generation
   - ❌ Missing: Payment → Appointment status update → Exit

3. **Workflow Status Tracking**
   - ❌ No workflow state management
   - ❌ No "In Consultation" status
   - ❌ No "Billing" status
   - ❌ No "Payment Pending" status
   - ❌ No "Completed" workflow status

## Required Implementation

### Phase 1: Add Medical Roles
- Add Doctor, Reception, Medical Biller roles to database
- Update Role model if needed
- Create migration script

### Phase 2: Create Workflow Service
- MedicalWorkflowService to orchestrate:
  1. Start Consultation (Appointment → Medical Record)
  2. Complete Consultation (Medical Record → Invoice)
  3. Process Payment (Payment → Complete Workflow)
  4. Exit Patient (Update all statuses)

### Phase 3: Add Workflow Endpoints
- POST /api/appointments/{id}/start-consultation
- POST /api/medical-records/{id}/complete-consultation
- POST /api/invoices/{id}/process-payment-and-exit
- GET /api/patients/{id}/workflow-status

### Phase 4: Update UI
- Workflow status indicators
- Quick actions for each workflow step
- Patient queue/dashboard
- Complete workflow view

## Complete Patient Workflow (Target)

```
1. RECEPTION: Book Appointment
   └─> Appointment Status: "Scheduled"
   
2. RECEPTION: Patient Arrives → Confirm Appointment
   └─> Appointment Status: "Confirmed"
   
3. DOCTOR: Start Consultation
   └─> Appointment Status: "InProgress"
   └─> Create Medical Record from Appointment
   └─> Medical Record Status: "Active"
   
4. DOCTOR: Complete Consultation
   └─> Add Prescriptions/Procedures
   └─> Medical Record Status: "Completed"
   └─> Auto-generate Invoice from Medical Record
   └─> Invoice Status: "Draft"
   
5. MEDICAL BILLER: Review & Finalize Bill
   └─> Invoice Status: "Completed"
   
6. RECEPTION/CASHIER: Process Payment
   └─> Create Payment
   └─> Update Invoice: PaidAmount, BalanceAmount
   └─> If fully paid: Invoice Status: "Paid"
   
7. EXIT: Complete Workflow
   └─> Appointment Status: "Completed"
   └─> Update Appointment.MedicalRecordId
   └─> Update Appointment.InvoiceId
   └─> Patient can exit
```

## Implementation Priority

1. **HIGH**: Add medical roles (Doctor, Reception, Medical Biller)
2. **HIGH**: Create workflow service connecting all steps
3. **MEDIUM**: Add workflow endpoints
4. **MEDIUM**: Update UI for workflow management
5. **LOW**: Advanced features (queue management, notifications)

## Next Steps

1. Create database migration for medical roles
2. Create MedicalWorkflowService
3. Add workflow endpoints to controllers
4. Update UI components
5. Test complete workflow end-to-end
