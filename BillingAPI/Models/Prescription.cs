namespace BillingAPI.Models;

// Prescription Model
public class Prescription
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public int MedicalRecordId { get; set; }
    public int PatientId { get; set; }
    public string PrescriptionNumber { get; set; } = string.Empty;
    public string MedicationName { get; set; } = string.Empty;
    public string? GenericName { get; set; }
    public string Dosage { get; set; } = string.Empty; // e.g., "500mg"
    public string Frequency { get; set; } = string.Empty; // e.g., "Twice daily"
    public string Duration { get; set; } = string.Empty; // e.g., "7 days"
    public int Quantity { get; set; }
    public decimal? UnitPrice { get; set; } // Price per unit
    public decimal? TotalPrice { get; set; } // Total price (Quantity * UnitPrice)
    public int? ProductId { get; set; } // Link to Product/Medicine in inventory
    public string? Instructions { get; set; }
    public string? Schedule { get; set; } // Schedule H, Schedule X, etc.
    public DateTime PrescribedDate { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string Status { get; set; } = "Active"; // Active, Completed, Discontinued
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public Tenant? Tenant { get; set; }
    public MedicalRecord? MedicalRecord { get; set; }
    public Patient? Patient { get; set; }
    public Product? Product { get; set; }
}

