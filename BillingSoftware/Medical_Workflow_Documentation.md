# Medical Billing Workflow

## Workflow Overview

The medical billing workflow follows this sequence:

```
Patient → Reception → Doctor → Medicine Billing → Exit
```

**Key Changes:**
- **Reception** starts consultation AND bills consultation fee immediately
- **Doctor** only completes consultation (adds prescriptions/procedures, NO billing)
- **Medicine Billing** happens separately when collecting medicines from pharmacy/medical person

## Detailed Workflow Stages

### 1. **Patient** 👤
- Patient arrives at the clinic/hospital
- Patient information is already in the system (or needs to be registered)
- Patient may have a scheduled appointment or walk-in

**Status:** Patient registered/identified

---

### 2. **Reception** 📋
- Reception staff creates/confirms appointment
- **Reception starts consultation** (creates medical record)
- **Reception bills consultation fee immediately** (if consultation fee is set)
- Patient goes to doctor

**Actions:**
- Create new appointment
- Confirm existing appointment
- **Start Consultation**: 
  - Creates medical record from appointment
  - **Bills consultation fee immediately** (creates and pays consultation invoice)
  - Status: `InProgress`
  - Medical Record Status: `Active`
- Update appointment details
- Assign to doctor/provider

**Appointment Status:** `Scheduled` or `Confirmed` → `InProgress` (after starting consultation)

**Billing:**
- Consultation fee invoice created and paid immediately
- Invoice Status: `Completed` (paid at reception)

**UI Location:** Appointments Page (Start Consultation button)

---

### 3. **Doctor** 👨‍⚕️
- Doctor examines patient
- Doctor records vitals, diagnosis, etc.
- Doctor adds prescriptions and procedures
- **Doctor completes consultation** (NO billing)

**Actions:**
- **During Consultation**: Doctor can:
  - Update medical record details
  - Add prescriptions
  - Add procedures
  - Record vitals
  - Add diagnosis
  
- **Complete Consultation**: 
  - Medical Record Status: `Completed`
  - **NO invoice generation** (only marks consultation as complete)
  - Prescriptions and procedures are ready for billing

**Appointment Status:** `InProgress` → Consultation completed (but appointment not completed yet)

**UI Location:** 
- Appointments Page (Complete Consultation button)
- Medical Records Page (for detailed record management)

---

### 4. **Medicine Billing** 💰
- **Separate billing** at pharmacy/medical person
- Invoice is generated for prescriptions and procedures only
- Patient pays for medicines
- Payment is processed

**Actions:**
- **Generate Medicine Bill**: Creates invoice for:
  - Prescription costs
  - Procedure costs
  - **NOT consultation fee** (already paid at reception)
  
- **View Invoice**: Shows medicine charges
  - Prescription costs
  - Procedure costs
  - Total amount
  
- **Process Payment**: 
  - Accept payment (Cash, Card, UPI, etc.)
  - Update invoice status
  - Generate receipt

**Invoice Status:** `Draft` → `Completed` (after payment)

**Payment Status:** 
- Pending (if balance > 0)
- Completed (if balance = 0)

**UI Location:** Appointments Page (Generate Medicine Bill and Pay & Exit buttons)

---

### 5. **Exit** 🚪
- Patient completes the visit
- All records are saved
- Appointment is marked as completed
- Patient can leave

**Status:** 
- Appointment: `Completed`
- Invoice: `Completed`
- Payment: `Completed`

**Actions:**
- Exit workflow
- View completed records
- Print receipt/invoice

---

## Workflow State Diagram

```
┌─────────┐
│ Patient │
└────┬────┘
     │
     ▼
┌─────────────────────┐
│     Reception       │ ← Create/Confirm Appointment
│    (Scheduled)      │ ← Start Consultation
│                     │ ← Bill Consultation Fee ✅
└────┬────────────────┘
     │
     ▼
┌─────────────────────┐
│       Doctor        │ ← Examine Patient
│    (InProgress)     │ ← Add Prescriptions/Procedures
│                     │ ← Complete Consultation (NO billing)
└────┬────────────────┘
     │
     ▼
┌─────────────────────┐
│  Medicine Billing   │ ← Generate Medicine Bill
│   (Pharmacy)        │    (Prescriptions/Procedures only)
│                     │ ← Process Payment
└────┬────────────────┘
     │
     ▼
┌─────────┐
│  Exit   │ ← Complete & Exit
│(Completed)│
└─────────┘
```

## Status Transitions

### Appointment Status Flow:
```
Scheduled → Confirmed → InProgress → Completed
                ↓
            Cancelled (can happen at any stage)
```

### Medical Record Status Flow:
```
Active → Completed
```

### Invoice Status Flow:
```
Draft → Completed
```

## API Endpoints

### 1. Reception Stage
- `GET /api/appointments` - List appointments
- `POST /api/appointments` - Create appointment
- `PUT /api/appointments/{id}` - Update appointment
- `POST /api/appointments/{id}/confirm` - Confirm appointment
- `POST /api/appointments/{id}/start-consultation` - **Start consultation and bill consultation fee**
  - Creates medical record
  - Creates and pays consultation fee invoice (if consultation fee is set)
  - Returns: `{ MedicalRecord, ConsultationInvoice }`

### 2. Doctor Stage
- `GET /api/medical-records/{id}` - Get medical record
- `PUT /api/medical-records/{id}` - Update medical record
- `POST /api/medical-records/{id}/prescriptions` - Add prescription
- `POST /api/medical-records/{id}/procedures` - Add procedure
- `POST /api/medical-workflow/medical-records/{id}/complete-consultation` - **Complete consultation (NO billing)**
  - Only marks consultation as completed
  - Does NOT generate invoice

### 3. Medicine Billing Stage
- `POST /api/medical-workflow/medical-records/{id}/generate-medicine-bill` - **Generate medicine bill**
  - Creates invoice for prescriptions and procedures only
  - Does NOT include consultation fee (already paid at reception)
- `GET /api/invoices/{id}` - Get invoice
- `POST /api/payments` - Process payment
- `POST /api/medical-workflow/invoices/{id}/process-payment-and-exit` - Pay and exit

## UI Workflow Actions

### Appointments Page
1. **Reception Actions:**
   - Create Appointment
   - Confirm Appointment
   - Edit Appointment
   - Cancel Appointment
   - **Start Consultation** (button appears when status is Scheduled/Confirmed)
     - Creates medical record
     - Bills consultation fee immediately (if set)

2. **Doctor Actions:**
   - **Complete Consultation** (button appears when consultation is in progress)
     - Marks consultation as complete
     - NO billing (prescriptions/procedures ready for separate billing)

3. **Medicine Billing Actions:**
   - **Generate Medicine Bill** (button appears after consultation is completed)
     - Creates invoice for prescriptions and procedures only
   - **Pay & Exit** (button appears when medicine invoice is ready)
     - Processes payment for medicines
     - Completes appointment

### Medical Records Page
- View medical record details
- Edit medical record
- Add/Edit/Delete prescriptions
- Add/Edit/Delete procedures
- View complete consultation details

## Business Rules

1. **Reception Stage:**
   - Appointment must be created before consultation can start
   - Patient must be linked to appointment
   - Consultation fee can be set at appointment creation
   - **Reception starts consultation** (not doctor)
   - **Consultation fee is billed immediately** when consultation starts (if fee is set)
   - Consultation fee invoice is created and paid at reception

2. **Doctor Stage:**
   - Consultation must be started by reception first
   - Medical record is automatically created when reception starts consultation
   - Prescriptions and procedures can be added during consultation
   - **Doctor only completes consultation** (NO billing)
   - Consultation completion does NOT generate invoice

3. **Medicine Billing Stage:**
   - Medicine bill is generated **separately** after consultation is completed
   - Medicine invoice includes:
     - All prescriptions with prices
     - All procedures with prices
     - **NOT consultation fee** (already paid at reception)
   - Medicine billing happens at pharmacy/medical person
   - Payment can be processed once medicine invoice is created
   - Patient can exit only after medicine payment is completed

4. **Exit Stage:**
   - All stages must be completed
   - Consultation fee must be paid (at reception)
   - Medicine invoice must be paid in full
   - Appointment status must be Completed

## Error Handling

- **Cannot start consultation**: Appointment not found or wrong status
- **Cannot complete consultation**: No billable items (prescriptions/procedures without prices)
- **Cannot process payment**: Invoice not found or already paid
- **Cannot exit**: Payment pending or workflow incomplete

## Summary

The workflow ensures:
1. ✅ Patient is properly registered
2. ✅ **Reception starts consultation and bills consultation fee immediately**
3. ✅ **Doctor only completes consultation** (adds prescriptions/procedures, NO billing)
4. ✅ **Medicine billing happens separately** at pharmacy/medical person
5. ✅ Patient exits after completing all stages

### Key Workflow Changes:
- **Two separate billing points:**
  1. **Reception**: Bills consultation fee when starting consultation
  2. **Pharmacy/Medical Person**: Bills for medicines after consultation is completed

- **Doctor's role:**
  - Only completes consultation
  - Does NOT handle any billing
  - Adds prescriptions and procedures for later billing

This workflow maintains proper medical documentation, billing accuracy, and patient flow management with clear separation of responsibilities.

