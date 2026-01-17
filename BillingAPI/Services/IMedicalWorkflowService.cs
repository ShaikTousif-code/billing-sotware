using BillingAPI.Models;
using BillingAPI.DTOs;

namespace BillingAPI.Services;

public interface IMedicalWorkflowService
{
    // Start Consultation: Create Medical Record from Appointment and bill consultation fee at reception
    Task<(MedicalRecord medicalRecord, Invoice? consultationInvoice)> StartConsultationAsync(int appointmentId, int tenantId, int? doctorId = null, string? consultationFeePaymentMode = null);
    
    // Complete Consultation: Doctor completes consultation (no billing)
    Task<MedicalRecord> CompleteConsultationAsync(int medicalRecordId, int tenantId);
    
    // Generate Medicine Bill: Create invoice for prescriptions/procedures (billed at pharmacy/medical person)
    Task<Invoice> GenerateMedicineBillAsync(int medicalRecordId, int tenantId, GenerateMedicalBillRequest? billRequest = null, int? createdById = null);
    
    // Process Payment and Complete Workflow
    Task<Payment> ProcessPaymentAndExitAsync(int invoiceId, int tenantId, decimal amount, string paymentMode, string? referenceNumber = null);
    
    // Get Patient Workflow Status
    Task<PatientWorkflowStatus> GetPatientWorkflowStatusAsync(int patientId, int tenantId);
    
    // Get Appointment Workflow Status
    Task<AppointmentWorkflowStatus> GetAppointmentWorkflowStatusAsync(int appointmentId, int tenantId);
}

public class PatientWorkflowStatus
{
    public int PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public Appointment? CurrentAppointment { get; set; }
    public MedicalRecord? CurrentMedicalRecord { get; set; }
    public Invoice? CurrentInvoice { get; set; }
    public string WorkflowStage { get; set; } = "None"; // None, Scheduled, InConsultation, Billing, PaymentPending, Completed
    public decimal? OutstandingAmount { get; set; }
    public bool CanExit { get; set; }
}

public class AppointmentWorkflowStatus
{
    public int AppointmentId { get; set; }
    public string AppointmentStatus { get; set; } = string.Empty;
    public MedicalRecord? MedicalRecord { get; set; }
    public Invoice? Invoice { get; set; } // Medicine invoice
    public Invoice? ConsultationInvoice { get; set; } // Consultation fee invoice (billed at reception)
    public Payment? Payment { get; set; }
    public string WorkflowStage { get; set; } = "Reception"; // Reception, Doctor, MedicineBilling, PaymentPending, Completed
    public bool CanStartConsultation { get; set; } // Reception can start consultation
    public bool CanCompleteConsultation { get; set; } // Doctor can complete consultation
    public bool CanGenerateMedicineBill { get; set; } // Can generate medicine bill after consultation
    public bool CanProcessPayment { get; set; } // Can process medicine payment
    public bool CanExit { get; set; }
}
