namespace BillingAPI.Models;

public class Appointment
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    
    // Support both Customer (general) and Patient (medical) appointments
    public int? CustomerId { get; set; }
    public int? PatientId { get; set; }
    
    // Service/Product information
    public int? ServiceId { get; set; } // Product with Type=Service
    public string? AppointmentType { get; set; } // Consultation, Follow-up, Procedure, Check-up, etc.
    public string? Specialty { get; set; } // Cardiology, Orthopedics, General, etc.
    
    // Date and time
    public DateTime AppointmentDate { get; set; }
    public TimeSpan AppointmentTime { get; set; }
    public int DurationMinutes { get; set; } = 30; // Default 30 minutes
    
    // Status tracking
    public string Status { get; set; } = "Scheduled"; // Scheduled, Confirmed, InProgress, Completed, Cancelled, NoShow, Rescheduled
    public string? CancellationReason { get; set; }
    public DateTime? CancelledAt { get; set; }
    
    // Staff assignment
    public int? AssignedToUserId { get; set; } // Doctor/Staff member
    public string? DoctorName { get; set; } // For quick reference
    public string? Location { get; set; } // Room number, Clinic name, etc.
    
    // Additional information
    public string? Notes { get; set; }
    public string? ReasonForVisit { get; set; }
    public bool IsRecurring { get; set; } = false;
    public int? RecurringParentId { get; set; } // For recurring appointments
    
    // Billing integration
    public decimal? ConsultationFee { get; set; } // Consultation fee charged for the appointment
    public string? ConsultationFeePaymentMode { get; set; } // Payment mode for consultation fee (Cash, UPI, Card, BankTransfer, etc.)
    public int? ConsultationInvoiceId { get; set; } // Link to consultation fee invoice (billed at reception)
    public int? InvoiceId { get; set; } // Link to medicine invoice if medicines are billed
    public int? MedicalRecordId { get; set; } // Link to medical record after visit
    
    // Timestamps
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public DateTime? ConfirmedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public int? CreatedById { get; set; }

    // Navigation properties
    public Tenant? Tenant { get; set; }
    public Customer? Customer { get; set; }
    public Patient? Patient { get; set; }
    public Product? Service { get; set; }
    public User? AssignedTo { get; set; }
    public User? CreatedBy { get; set; }
    public Invoice? Invoice { get; set; }
    public MedicalRecord? MedicalRecord { get; set; }
    public Appointment? RecurringParent { get; set; }
    public ICollection<Appointment> RecurringChildren { get; set; } = new List<Appointment>();
}

