namespace BillingAPI.Models;

// Medical Record/Visit Model
public class MedicalRecord
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public int PatientId { get; set; }
    public int? ProviderId { get; set; } // Doctor/Provider User ID
    public string VisitNumber { get; set; } = string.Empty;
    public DateTime VisitDate { get; set; }
    public string VisitType { get; set; } = "Consultation"; // Consultation, Follow-up, Emergency, Procedure, etc.
    
    // Chief Complaint & History
    public string? ChiefComplaint { get; set; }
    public string? HistoryOfPresentIllness { get; set; }
    public string? ReviewOfSystems { get; set; }
    public string? PhysicalExamination { get; set; }
    
    // Assessment & Plan
    public string? Assessment { get; set; }
    public string? Plan { get; set; }
    public string? Notes { get; set; }
    
    // Vitals
    public decimal? Height { get; set; } // in cm
    public decimal? Weight { get; set; } // in kg
    public decimal? BloodPressureSystolic { get; set; }
    public decimal? BloodPressureDiastolic { get; set; }
    public decimal? Temperature { get; set; } // in Celsius
    public int? Pulse { get; set; } // beats per minute
    public int? RespiratoryRate { get; set; } // breaths per minute
    public decimal? OxygenSaturation { get; set; } // percentage
    
    // Status
    public string Status { get; set; } = "Active"; // Active, Completed, Cancelled
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    
    // Navigation properties
    public Tenant? Tenant { get; set; }
    public Patient? Patient { get; set; }
    public User? Provider { get; set; }
    public ICollection<Diagnosis> Diagnoses { get; set; } = new List<Diagnosis>();
    public ICollection<Procedure> Procedures { get; set; } = new List<Procedure>();
    public ICollection<Prescription> Prescriptions { get; set; } = new List<Prescription>();
}

