namespace BillingAPI.Models;

// Fee Structure for Classes
public class FeeStructure
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public int? ClassId { get; set; }
    public int FeeHeadId { get; set; } // Reference to FeeHead
    public string Name { get; set; } = string.Empty; // e.g., "Tuition Fee", "Library Fee"
    public string FeeType { get; set; } = "Tuition"; // Tuition, Library, Lab, Sports, Transport, Hostel, etc.
    public decimal Amount { get; set; }
    public string Frequency { get; set; } = "Monthly"; // Monthly, Quarterly, Semester, Annual, One-time
    public string AcademicYear { get; set; } = string.Empty;
    public bool IsMandatory { get; set; } = true;
    public bool IsOptional { get; set; } = false; // For Transport, Hostel, etc.
    public int? MaxInstallments { get; set; } // Max 3-4 installments
    public decimal? LateFeeAmount { get; set; } // Flat late fee amount (₹100, ₹200)
    public int? LateFeeDays { get; set; } // Days after due date to apply late fee
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public Tenant? Tenant { get; set; }
    public Class? Class { get; set; }
    public FeeHead? FeeHead { get; set; }
    public ICollection<Fee> Fees { get; set; } = new List<Fee>();
    public ICollection<FeeInstallment> Installments { get; set; } = new List<FeeInstallment>();
}

