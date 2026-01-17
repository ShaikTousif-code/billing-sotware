namespace BillingAPI.Models;

public class CreditNote
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public int InvoiceId { get; set; }
    public string CreditNoteNumber { get; set; } = string.Empty;
    public DateTime CreditNoteDate { get; set; } = DateTime.UtcNow;
    public string Reason { get; set; } = string.Empty; // Return, Damage, Discount, etc.
    public decimal Amount { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = "Pending"; // Pending, Approved, Processed
    public string? Notes { get; set; }
    public int CreatedById { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ProcessedAt { get; set; }

    // Navigation properties
    public Tenant? Tenant { get; set; }
    public Invoice? Invoice { get; set; }
    public User? CreatedBy { get; set; }
    public ICollection<CreditNoteItem> Items { get; set; } = new List<CreditNoteItem>();
}

