using Microsoft.EntityFrameworkCore;
using BillingAPI.Data;
using BillingAPI.Models;
using BillingAPI.DTOs;

namespace BillingAPI.Services;

public class MedicalWorkflowService : IMedicalWorkflowService
{
    private readonly ApplicationDbContext _context;
    private readonly IAppointmentService _appointmentService;

    public MedicalWorkflowService(ApplicationDbContext context, IAppointmentService appointmentService)
    {
        _context = context;
        _appointmentService = appointmentService;
    }

    public async Task<(MedicalRecord medicalRecord, Invoice? consultationInvoice)> StartConsultationAsync(int appointmentId, int tenantId, int? doctorId = null, string? consultationFeePaymentMode = null)
    {
        // Get appointment
        var appointment = await _appointmentService.GetAppointmentByIdAsync(appointmentId, tenantId);
        if (appointment == null)
            throw new InvalidOperationException("Appointment not found.");

        if (appointment.Status != "Scheduled" && appointment.Status != "Confirmed")
            throw new InvalidOperationException($"Cannot start consultation. Appointment status is: {appointment.Status}");

        if (!appointment.PatientId.HasValue)
            throw new InvalidOperationException("Appointment must be linked to a patient to start consultation.");

        // Check if medical record already exists for this appointment
        var existingRecord = await _context.MedicalRecords
            .FirstOrDefaultAsync(m => m.TenantId == tenantId && 
                                     m.PatientId == appointment.PatientId.Value &&
                                     m.VisitDate.Date == appointment.AppointmentDate.Date);

        if (existingRecord != null)
            throw new InvalidOperationException("Medical record already exists for this appointment.");

        // Create medical record from appointment
        var medicalRecord = new MedicalRecord
        {
            TenantId = tenantId,
            PatientId = appointment.PatientId.Value,
            ProviderId = doctorId ?? appointment.AssignedToUserId,
            VisitDate = appointment.AppointmentDate,
            VisitType = appointment.AppointmentType ?? "Consultation",
            ChiefComplaint = appointment.ReasonForVisit,
            Status = "Active",
            CreatedAt = DateTime.UtcNow
        };

        // Generate Visit Number
        medicalRecord.VisitNumber = await GenerateVisitNumberAsync(tenantId);

        _context.MedicalRecords.Add(medicalRecord);
        
        // Save medical record first to get the ID
        await _context.SaveChangesAsync();
        
        // Update appointment status and link to medical record
        appointment.Status = "InProgress";
        appointment.MedicalRecordId = medicalRecord.Id;
        appointment.UpdatedAt = DateTime.UtcNow;

        // Create and process consultation fee invoice if consultation fee is set
        Invoice? consultationInvoice = null;
        if (appointment.ConsultationFee.HasValue && appointment.ConsultationFee.Value > 0)
        {
            // Use provided payment mode or fall back to appointment's payment mode or default to "Cash"
            var paymentMode = consultationFeePaymentMode ?? appointment.ConsultationFeePaymentMode ?? "Cash";
            consultationInvoice = await CreateConsultationFeeInvoiceAsync(appointment, medicalRecord, tenantId, paymentMode);
            appointment.ConsultationInvoiceId = consultationInvoice.Id;
        }

        await _context.SaveChangesAsync();

        // Load navigation properties
        await _context.Entry(medicalRecord)
            .Reference(m => m.Patient)
            .LoadAsync();
        await _context.Entry(medicalRecord)
            .Reference(m => m.Provider)
            .LoadAsync();

        return (medicalRecord, consultationInvoice);
    }

    private async Task<Invoice> CreateConsultationFeeInvoiceAsync(Appointment appointment, MedicalRecord medicalRecord, int tenantId, string paymentMode = "Cash")
    {
        // Create consultation fee invoice
        var invoice = new Invoice
        {
            TenantId = tenantId,
            PatientId = appointment.PatientId.Value,
            MedicalRecordId = medicalRecord.Id,
            InvoiceDate = DateTime.UtcNow,
            Status = "Completed", // Consultation fee is paid immediately at reception
            CreatedAt = DateTime.UtcNow,
            Notes = $"Consultation fee for visit {medicalRecord.VisitNumber}"
        };

        // Generate invoice number
        var config = await _context.TenantConfigurations
            .FirstOrDefaultAsync(c => c.TenantId == tenantId);
        var prefix = config?.InvoicePrefix ?? "INV";
        var year = DateTime.UtcNow.Year;
        var lastInvoice = await _context.Invoices
            .Where(i => i.TenantId == tenantId && i.InvoiceNumber.StartsWith($"{prefix}-{year}"))
            .OrderByDescending(i => i.InvoiceNumber)
            .FirstOrDefaultAsync();
        int nextNumber = 1;
        if (lastInvoice != null)
        {
            var parts = lastInvoice.InvoiceNumber.Split('-');
            if (parts.Length >= 3 && int.TryParse(parts[^1], out var lastNum))
                nextNumber = lastNum + 1;
        }
        invoice.InvoiceNumber = $"{prefix}-{year}-{nextNumber:D6}";

        // Add consultation fee item
        invoice.Items.Add(new InvoiceItem
        {
            ProductId = 0,
            ProductName = "Consultation Fee",
            Quantity = 1,
            UnitPrice = appointment.ConsultationFee.Value,
            DiscountAmount = 0,
            TaxRate = 0,
            TaxAmount = 0,
            TotalAmount = appointment.ConsultationFee.Value
        });

        // Calculate totals
        invoice.SubTotal = appointment.ConsultationFee.Value;
        invoice.TaxAmount = 0;
        invoice.DiscountAmount = 0;
        invoice.TotalAmount = appointment.ConsultationFee.Value;
        invoice.PaidAmount = appointment.ConsultationFee.Value; // Paid immediately
        invoice.BalanceAmount = 0;

        _context.Invoices.Add(invoice);

        // Create payment record for consultation fee
        var payment = new Payment
        {
            TenantId = tenantId,
            InvoiceId = invoice.Id,
            Amount = appointment.ConsultationFee.Value,
            PaymentDate = DateTime.UtcNow,
            PaymentMode = paymentMode, // Use provided payment mode
            CreatedById = 0 // Will be set from user context if needed
        };

        _context.Payments.Add(payment);

        await _context.SaveChangesAsync();

        return invoice;
    }

    public async Task<MedicalRecord> CompleteConsultationAsync(int medicalRecordId, int tenantId)
    {
        var medicalRecord = await _context.MedicalRecords
            .Include(m => m.Patient)
            .Include(m => m.Provider)
            .FirstOrDefaultAsync(m => m.Id == medicalRecordId && m.TenantId == tenantId);

        if (medicalRecord == null)
            throw new InvalidOperationException("Medical record not found.");

        if (medicalRecord.Status == "Completed")
            throw new InvalidOperationException("Consultation is already completed.");

        // Update medical record status - Doctor only completes consultation, doesn't bill
        medicalRecord.Status = "Completed";
        medicalRecord.UpdatedAt = DateTime.UtcNow;

        // Update appointment status (but don't mark as completed yet - wait for medicine billing)
        var appointment = await _context.Appointments
            .FirstOrDefaultAsync(a => a.MedicalRecordId == medicalRecordId && a.TenantId == tenantId);
        
        if (appointment != null)
        {
            // Don't mark appointment as completed yet - medicine billing happens separately
            appointment.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        // Load navigation properties
        await _context.Entry(medicalRecord)
            .Reference(m => m.Patient)
            .LoadAsync();
        await _context.Entry(medicalRecord)
            .Reference(m => m.Provider)
            .LoadAsync();

        return medicalRecord;
    }

    public async Task<Invoice> GenerateMedicineBillAsync(int medicalRecordId, int tenantId, GenerateMedicalBillRequest? billRequest = null, int? createdById = null)
    {
        var medicalRecord = await _context.MedicalRecords
            .Include(m => m.Patient)
            .Include(m => m.Prescriptions)
            .Include(m => m.Procedures)
            .FirstOrDefaultAsync(m => m.Id == medicalRecordId && m.TenantId == tenantId);

        if (medicalRecord == null)
            throw new InvalidOperationException("Medical record not found.");

        if (medicalRecord.Status != "Completed")
            throw new InvalidOperationException("Consultation must be completed before generating medicine bill.");

        // Get prescriptions and procedures to bill
        // Handle null collections safely
        var allPrescriptions = medicalRecord.Prescriptions ?? new List<Prescription>();
        var allProcedures = medicalRecord.Procedures ?? new List<Procedure>();

        var prescriptionsToBill = allPrescriptions
            .Where(p => 
                billRequest == null || 
                billRequest.PrescriptionIds == null || 
                billRequest.PrescriptionIds.Count == 0 || 
                billRequest.PrescriptionIds.Contains(p.Id))
            .Where(p => p.TotalPrice.HasValue && p.TotalPrice > 0)
            .ToList();

        var proceduresToBill = allProcedures
            .Where(p => 
                billRequest == null || 
                billRequest.ProcedureIds == null || 
                billRequest.ProcedureIds.Count == 0 || 
                billRequest.ProcedureIds.Contains(p.Id))
            .Where(p => p.TotalAmount > 0)
            .ToList();

        if (!prescriptionsToBill.Any() && !proceduresToBill.Any())
            throw new InvalidOperationException("No billable items found. Please ensure prescriptions have prices or procedures are added.");

        // Create medicine invoice (separate from consultation fee)
        // Mark as Completed immediately - cannot be undone
        var invoice = new Invoice
        {
            TenantId = tenantId,
            PatientId = medicalRecord.PatientId,
            MedicalRecordId = medicalRecordId,
            InvoiceDate = billRequest?.InvoiceDate ?? DateTime.UtcNow,
            Status = "Completed", // Mark as completed - cannot be undone
            CreatedById = createdById ?? 0, // Set from user context
            CreatedAt = DateTime.UtcNow,
            Notes = $"Medicine bill for visit {medicalRecord.VisitNumber} - {medicalRecord.ChiefComplaint}"
        };

        // Generate invoice number
        var config = await _context.TenantConfigurations
            .FirstOrDefaultAsync(c => c.TenantId == tenantId);
        var prefix = config?.InvoicePrefix ?? "INV";
        var year = DateTime.UtcNow.Year;
        var lastInvoice = await _context.Invoices
            .Where(i => i.TenantId == tenantId && i.InvoiceNumber.StartsWith($"{prefix}-{year}"))
            .OrderByDescending(i => i.InvoiceNumber)
            .FirstOrDefaultAsync();
        int nextNumber = 1;
        if (lastInvoice != null)
        {
            var parts = lastInvoice.InvoiceNumber.Split('-');
            if (parts.Length >= 3 && int.TryParse(parts[^1], out var lastNum))
                nextNumber = lastNum + 1;
        }
        invoice.InvoiceNumber = $"{prefix}-{year}-{nextNumber:D6}";

        // Add prescription items to invoice
        foreach (var prescription in prescriptionsToBill)
        {
            var product = prescription.ProductId.HasValue
                ? await _context.Products.FindAsync(prescription.ProductId.Value)
                : null;

            invoice.Items.Add(new InvoiceItem
            {
                ProductId = prescription.ProductId ?? 0,
                ProductName = product?.Name ?? prescription.MedicationName,
                Quantity = prescription.Quantity,
                UnitPrice = prescription.UnitPrice ?? 0,
                DiscountAmount = 0,
                TaxRate = 0,
                TaxAmount = 0,
                TotalAmount = prescription.TotalPrice ?? 0
            });
        }

        // Add procedure items to invoice
        foreach (var procedure in proceduresToBill)
        {
            invoice.Items.Add(new InvoiceItem
            {
                ProductId = 0,
                ProductName = procedure.Description ?? $"Procedure {procedure.CPTCode}",
                Quantity = procedure.Quantity,
                UnitPrice = procedure.UnitPrice,
                DiscountAmount = 0,
                TaxRate = 0,
                TaxAmount = 0,
                TotalAmount = procedure.TotalAmount
            });
        }

        // Calculate totals - ensure Items collection is not null
        var itemsList = invoice.Items?.ToList() ?? new List<InvoiceItem>();
        invoice.SubTotal = itemsList.Sum(i => i.TotalAmount);
        invoice.TaxAmount = itemsList.Sum(i => i.TaxAmount);
        invoice.DiscountAmount = billRequest?.DiscountAmount ?? 0;
        invoice.TotalAmount = invoice.SubTotal + invoice.TaxAmount - invoice.DiscountAmount;
        invoice.BalanceAmount = 0; // Mark as fully paid since status is Completed
        invoice.PaidAmount = invoice.TotalAmount; // Mark as paid

        _context.Invoices.Add(invoice);

        // Update appointment with medicine invoice ID
        var appointment = await _context.Appointments
            .FirstOrDefaultAsync(a => a.MedicalRecordId == medicalRecordId && a.TenantId == tenantId);
        
        if (appointment != null)
        {
            appointment.InvoiceId = invoice.Id; // Medicine invoice
            appointment.Status = "Completed";
            appointment.CompletedAt = DateTime.UtcNow;
            appointment.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        // Load related data for response
        await _context.Entry(invoice)
            .Reference(i => i.Patient).LoadAsync();
        await _context.Entry(invoice)
            .Reference(i => i.MedicalRecord).LoadAsync();
        await _context.Entry(invoice)
            .Collection(i => i.Items).LoadAsync();

        return invoice;
    }

    public async Task<Payment> ProcessPaymentAndExitAsync(int invoiceId, int tenantId, decimal amount, string paymentMode, string? referenceNumber = null)
    {
        var invoice = await _context.Invoices
            .Include(i => i.Patient)
            .Include(i => i.MedicalRecord)
            .FirstOrDefaultAsync(i => i.Id == invoiceId && i.TenantId == tenantId);

        if (invoice == null)
            throw new InvalidOperationException("Invoice not found.");

        if (amount > invoice.BalanceAmount)
            throw new InvalidOperationException($"Payment amount ({amount}) exceeds invoice balance ({invoice.BalanceAmount}).");

        // Create payment
        var payment = new Payment
        {
            TenantId = tenantId,
            InvoiceId = invoiceId,
            Amount = amount,
            PaymentDate = DateTime.UtcNow,
            PaymentMode = paymentMode,
            TransactionId = referenceNumber,
            CreatedById = 0 // Will be set from user context if needed
        };

        _context.Payments.Add(payment);

        // Update invoice
        invoice.PaidAmount += amount;
        invoice.BalanceAmount = invoice.TotalAmount - invoice.PaidAmount;

        if (invoice.BalanceAmount <= 0)
        {
            invoice.Status = "Completed";
        }

        // Update appointment status if linked
        var appointment = await _context.Appointments
            .FirstOrDefaultAsync(a => a.InvoiceId == invoiceId && a.TenantId == tenantId);

        if (appointment != null)
        {
            if (invoice.BalanceAmount <= 0)
            {
                appointment.Status = "Completed";
                appointment.CompletedAt = DateTime.UtcNow;
            }
            appointment.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        // Load navigation properties
        await _context.Entry(payment)
            .Reference(p => p.Invoice)
            .LoadAsync();

        return payment;
    }

    public async Task<PatientWorkflowStatus> GetPatientWorkflowStatusAsync(int patientId, int tenantId)
    {
        var patient = await _context.Patients
            .FirstOrDefaultAsync(p => p.Id == patientId && p.TenantId == tenantId);

        if (patient == null)
            throw new InvalidOperationException("Patient not found.");

        // Get current appointment
        var appointment = await _context.Appointments
            .Include(a => a.AssignedTo)
            .Where(a => a.TenantId == tenantId && 
                       a.PatientId == patientId &&
                       (a.Status == "Scheduled" || a.Status == "Confirmed" || a.Status == "InProgress"))
            .OrderByDescending(a => a.AppointmentDate)
            .ThenByDescending(a => a.AppointmentTime)
            .FirstOrDefaultAsync();

        MedicalRecord? medicalRecord = null;
        Invoice? invoice = null;

        if (appointment != null && appointment.MedicalRecordId.HasValue)
        {
            medicalRecord = await _context.MedicalRecords
                .Include(m => m.Provider)
                .FirstOrDefaultAsync(m => m.Id == appointment.MedicalRecordId.Value);
        }

        if (appointment != null && appointment.InvoiceId.HasValue)
        {
            invoice = await _context.Invoices
                .Include(i => i.Items)
                .FirstOrDefaultAsync(i => i.Id == appointment.InvoiceId.Value);
        }
        else if (medicalRecord != null)
        {
            invoice = await _context.Invoices
                .Include(i => i.Items)
                .FirstOrDefaultAsync(i => i.MedicalRecordId == medicalRecord.Id && i.TenantId == tenantId);
        }

        var status = new PatientWorkflowStatus
        {
            PatientId = patientId,
            PatientName = $"{patient.FirstName} {patient.LastName}",
            CurrentAppointment = appointment,
            CurrentMedicalRecord = medicalRecord,
            CurrentInvoice = invoice,
            OutstandingAmount = invoice?.BalanceAmount
        };

        // Determine workflow stage
        if (appointment == null)
        {
            status.WorkflowStage = "None";
        }
        else if (appointment.Status == "Scheduled" || appointment.Status == "Confirmed")
        {
            status.WorkflowStage = "Reception"; // Reception stage - can start consultation
        }
        else if (appointment.Status == "InProgress" && medicalRecord != null && medicalRecord.Status == "Active")
        {
            status.WorkflowStage = "Doctor"; // Doctor stage - can complete consultation
        }
        else if (medicalRecord != null && medicalRecord.Status == "Completed" && invoice == null)
        {
            status.WorkflowStage = "MedicineBilling"; // Medicine billing stage - consultation completed, need to bill medicines
        }
        else if (invoice != null && invoice.Status == "Draft")
        {
            status.WorkflowStage = "MedicineBilling"; // Medicine invoice created, ready for payment
        }
        else if (invoice != null && invoice.BalanceAmount > 0)
        {
            status.WorkflowStage = "PaymentPending"; // Medicine payment pending
        }
        else if (appointment.Status == "Completed" && invoice != null && invoice.BalanceAmount <= 0)
        {
            status.WorkflowStage = "Completed";
            status.CanExit = true;
        }

        return status;
    }

    public async Task<AppointmentWorkflowStatus> GetAppointmentWorkflowStatusAsync(int appointmentId, int tenantId)
    {
        var appointment = await _appointmentService.GetAppointmentByIdAsync(appointmentId, tenantId);
        if (appointment == null)
            throw new InvalidOperationException("Appointment not found.");

        MedicalRecord? medicalRecord = null;
        Invoice? invoice = null; // Medicine invoice
        Invoice? consultationInvoice = null; // Consultation fee invoice
        Payment? payment = null;

        if (appointment.MedicalRecordId.HasValue)
        {
            medicalRecord = await _context.MedicalRecords
                .Include(m => m.Provider)
                .Include(m => m.Prescriptions)
                .Include(m => m.Procedures)
                .FirstOrDefaultAsync(m => m.Id == appointment.MedicalRecordId.Value);
        }

        // Get consultation fee invoice (billed at reception)
        if (appointment.ConsultationInvoiceId.HasValue)
        {
            consultationInvoice = await _context.Invoices
                .Include(i => i.Items)
                .FirstOrDefaultAsync(i => i.Id == appointment.ConsultationInvoiceId.Value);
        }

        // Get medicine invoice (billed at pharmacy)
        if (appointment.InvoiceId.HasValue)
        {
            invoice = await _context.Invoices
                .Include(i => i.Items)
                .FirstOrDefaultAsync(i => i.Id == appointment.InvoiceId.Value);

            if (invoice != null)
            {
                payment = await _context.Payments
                    .Where(p => p.InvoiceId == invoice.Id)
                    .OrderByDescending(p => p.PaymentDate)
                    .FirstOrDefaultAsync();
            }
        }

        var status = new AppointmentWorkflowStatus
        {
            AppointmentId = appointmentId,
            AppointmentStatus = appointment.Status,
            MedicalRecord = medicalRecord,
            Invoice = invoice, // Medicine invoice
            ConsultationInvoice = consultationInvoice, // Consultation fee invoice
            Payment = payment
        };

        // Determine workflow stage and permissions
        if (appointment.Status == "Scheduled" || appointment.Status == "Confirmed")
        {
            status.WorkflowStage = "Reception"; // Reception stage - can start consultation and bill consultation fee
            status.CanStartConsultation = true;
        }
        else if (appointment.Status == "InProgress" && medicalRecord != null && medicalRecord.Status == "Active")
        {
            status.WorkflowStage = "Doctor"; // Doctor stage - can complete consultation (no billing)
            status.CanCompleteConsultation = true;
        }
        else if (medicalRecord != null && medicalRecord.Status == "Completed" && invoice == null)
        {
            status.WorkflowStage = "MedicineBilling"; // Consultation completed, need to generate medicine bill
            status.CanGenerateMedicineBill = true;
        }
        else if (invoice != null && invoice.Status == "Draft")
        {
            status.WorkflowStage = "MedicineBilling"; // Medicine invoice created, ready for payment
            status.CanProcessPayment = true;
        }
        else if (invoice != null && invoice.BalanceAmount > 0)
        {
            status.WorkflowStage = "PaymentPending"; // Medicine payment pending
            status.CanProcessPayment = true;
        }
        else if (appointment.Status == "Completed" && invoice != null && invoice.BalanceAmount <= 0)
        {
            status.WorkflowStage = "Completed";
            status.CanExit = true;
        }

        return status;
    }

    private async Task<string> GenerateVisitNumberAsync(int tenantId)
    {
        var year = DateTime.UtcNow.Year;
        var lastRecord = await _context.MedicalRecords
            .Where(m => m.TenantId == tenantId && m.VisitNumber.StartsWith($"VISIT-{year}"))
            .OrderByDescending(m => m.VisitNumber)
            .FirstOrDefaultAsync();

        int nextNumber = 1;
        if (lastRecord != null)
        {
            var parts = lastRecord.VisitNumber.Split('-');
            if (parts.Length >= 3 && int.TryParse(parts[^1], out var lastNumber))
            {
                nextNumber = lastNumber + 1;
            }
        }

        return $"VISIT-{year}-{nextNumber:D6}";
    }
}
