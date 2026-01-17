namespace BillingAPI.Models;

public class SalesReturn
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public int InvoiceId { get; set; }
    public string ReturnNumber { get; set; } = string.Empty;
    public DateTime ReturnDate { get; set; } = DateTime.UtcNow;
    public string Reason { get; set; } = string.Empty;
    public string Status { get; set; } = "Pending"; // Pending, Approved, Processed, Cancelled
    public decimal TotalAmount { get; set; }
    public string? Notes { get; set; }
    public int CreatedById { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ApprovedAt { get; set; }
    public DateTime? ProcessedAt { get; set; }
    public int? CreditNoteId { get; set; } // Link to credit note if created

    // Navigation properties
    public Tenant? Tenant { get; set; }
    public Invoice? Invoice { get; set; }
    public CreditNote? CreditNote { get; set; }
    public User? CreatedBy { get; set; }
    public ICollection<SalesReturnItem> Items { get; set; } = new List<SalesReturnItem>();
}

