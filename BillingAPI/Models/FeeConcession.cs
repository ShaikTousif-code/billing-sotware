namespace BillingAPI.Models;

// Fee Concession/Waiver Management
public class FeeConcession
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public int StudentId { get; set; }
    public int? FeeId { get; set; } // If null, applies to all fees
    public string ConcessionType { get; set; } = "Discount"; // Discount, Waiver, Scholarship
    public decimal Amount { get; set; }
    public decimal? Percentage { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string Status { get; set; } = "Pending"; // Pending, Approved, Rejected
    public int? RequestedById { get; set; }
    public int? ApprovedById { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public string? ApprovalNotes { get; set; }
    public DateTime ValidFrom { get; set; }
    public DateTime? ValidTo { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public Tenant? Tenant { get; set; }
    public Student? Student { get; set; }
    public Fee? Fee { get; set; }
    public User? RequestedBy { get; set; }
    public User? ApprovedBy { get; set; }
}

