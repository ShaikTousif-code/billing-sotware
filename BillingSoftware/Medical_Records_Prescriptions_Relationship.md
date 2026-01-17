# Medical Records and Prescriptions Relationship

## Overview
Medical Records and Prescriptions have a **one-to-many relationship** where:
- **One Medical Record** can have **multiple Prescriptions**
- **Each Prescription** must belong to **exactly one Medical Record**

## Database Relationship

### Medical Record Model
```csharp
public class MedicalRecord
{
    public int Id { get; set; }
    public int PatientId { get; set; }
    public int? ProviderId { get; set; }
    public string VisitNumber { get; set; }
    public DateTime VisitDate { get; set; }
    // ... other fields
    
    // Navigation Property - One Medical Record has many Prescriptions
    public ICollection<Prescription> Prescriptions { get; set; } = new List<Prescription>();
}
```

### Prescription Model
```csharp
public class Prescription
{
    public int Id { get; set; }
    public int MedicalRecordId { get; set; }  // Foreign Key - REQUIRED
    public int PatientId { get; set; }         // Also linked to Patient
    public string PrescriptionNumber { get; set; }
    public string MedicationName { get; set; }
    // ... other fields
    
    // Navigation Property - Each Prescription belongs to one Medical Record
    public MedicalRecord? MedicalRecord { get; set; }
}
```

## Key Dependencies

### 1. **Prescription Requires Medical Record**
- A prescription **cannot exist** without a medical record
- The `MedicalRecordId` field is **required** (not nullable)
- When creating a prescription, you must specify which medical record it belongs to

### 2. **Patient Relationship**
- Both Medical Record and Prescription are linked to the same Patient
- When adding a prescription to a medical record, the `PatientId` is automatically copied from the medical record

### 3. **Workflow**
```
1. Create Medical Record (for a patient visit)
   ↓
2. Add Prescriptions to that Medical Record
   ↓
3. Generate Bill (includes prescriptions from the medical record)
```

## API Endpoints

### Adding Prescription to Medical Record
```
POST /api/medical-records/{medicalRecordId}/prescriptions
```

**Request Body:**
```json
{
  "medicationName": "Paracetamol",
  "genericName": "Acetaminophen",
  "dosage": "500mg",
  "frequency": "Twice daily",
  "duration": "7 days",
  "quantity": 14,
  "unitPrice": 5.00,
  "instructions": "Take after meals",
  "prescribedDate": "2024-01-15T00:00:00Z"
}
```

**What happens:**
1. System automatically sets `MedicalRecordId` from the URL parameter
2. System automatically sets `PatientId` from the medical record
3. System automatically sets `TenantId` from the authenticated user
4. System generates `PrescriptionNumber` if not provided
5. System calculates `TotalPrice` = `Quantity × UnitPrice`

### Getting Prescriptions
```
GET /api/medical-records/{id}
```
Returns the medical record with all its prescriptions included.

## Frontend Implementation

### Current Implementation
1. **Prescriptions Page** (`Prescriptions.tsx`):
   - Fetches all medical records
   - Extracts prescriptions from each medical record
   - Displays all prescriptions in a unified list

2. **Medical Records Page** (`MedicalRecords.tsx`):
   - Shows medical records
   - Can view full record details (including prescriptions)
   - Can add/edit/delete medical records

### Missing Feature
Currently, there's **no UI to add prescriptions** directly from the Medical Records page. This should be added.

## Recommended UI Enhancement

### Add Prescription Management to Medical Records View Modal

When viewing a medical record, add:
1. **Prescriptions Section** showing all prescriptions for that record
2. **"Add Prescription" button** to add new prescriptions
3. **Edit/Delete actions** for each prescription

### Example Flow:
```
Medical Records Page
  → Click "View" on a record
    → View Modal opens
      → Shows record details
      → Shows "Prescriptions" section
        → List of prescriptions
        → "Add Prescription" button
        → Edit/Delete for each prescription
```

## Data Flow Diagram

```
┌─────────────────┐
│   Patient       │
└────────┬────────┘
         │
         │ 1:N
         │
┌────────▼────────┐        1:N         ┌──────────────┐
│ Medical Record  │◄───────────────────│ Prescription │
│                 │                    │              │
│ - Visit Number  │                    │ - Medication │
│ - Visit Date     │                    │ - Dosage     │
│ - Chief Complaint│                   │ - Frequency   │
│ - Assessment     │                    │ - Duration   │
│ - Plan           │                    │ - Price      │
└──────────────────┘                    └──────────────┘
         │
         │ 1:1
         │
┌────────▼────────┐
│   Provider      │
│   (Doctor)      │
└─────────────────┘
```

## Business Rules

1. **Prescription Creation**:
   - Must be linked to an existing medical record
   - Patient ID is inherited from the medical record
   - Cannot be created standalone

2. **Prescription Deletion**:
   - Deleting a medical record should handle prescriptions (cascade or prevent)
   - Individual prescriptions can be deleted without affecting the medical record

3. **Billing**:
   - Prescriptions are included when generating bills from medical records
   - Total bill includes consultation fee + procedure costs + prescription costs

4. **Prescription Status**:
   - Active: Currently being taken
   - Completed: Course finished
   - Discontinued: Stopped before completion

## Summary

**Medical Records** are the **parent entity** and **Prescriptions** are the **child entity**. 

- Prescriptions are **dependent** on Medical Records
- Prescriptions **cannot exist** without a Medical Record
- One Medical Record can have **multiple** Prescriptions
- Prescriptions are typically added **during or after** a medical consultation
- Prescriptions are used for **billing** along with the medical record

The relationship ensures that all prescriptions are properly linked to a specific patient visit/consultation, maintaining proper medical documentation and billing accuracy.

