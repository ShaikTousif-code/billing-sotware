namespace BillingAPI.Models;

// Individual Fee Record for Students
public class Fee
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public int StudentId { get; set; }
    public int FeeStructureId { get; set; }
    public string FeeNumber { get; set; } = string.Empty;
    public string FeeType { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal ScholarshipAmount { get; set; }
    public decimal NetAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal BalanceAmount { get; set; }
    public DateTime DueDate { get; set; }
    public string Status { get; set; } = "Pending"; // Pending, Partial, Paid, Overdue, Waived
    public string? Term { get; set; } // For semester/term-based fees
    public string? Month { get; set; } // For monthly fees
    public string AcademicYear { get; set; } = string.Empty; // Academic year
    public int? InstallmentNumber { get; set; } // For installment-based fees
    public decimal? LateFeeAmount { get; set; } // Late fee applied
    public DateTime? LateFeeAppliedDate { get; set; } // When late fee was applied
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? PaidDate { get; set; }
    
    // Navigation properties
    public Tenant? Tenant { get; set; }
    public Student? Student { get; set; }
    public FeeStructure? FeeStructure { get; set; }
    public ICollection<FeePayment> Payments { get; set; } = new List<FeePayment>();
}

