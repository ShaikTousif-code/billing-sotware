namespace BillingAPI.Models;

public class SalesExchange
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public int InvoiceId { get; set; }
    public string ExchangeNumber { get; set; } = string.Empty;
    public DateTime ExchangeDate { get; set; } = DateTime.UtcNow;
    public string Reason { get; set; } = string.Empty;
    public string Status { get; set; } = "Pending"; // Pending, Approved, Processed, Cancelled
    public decimal PriceDifference { get; set; } = 0; // Amount to pay (positive) or receive (negative)
    public string? Notes { get; set; }
    public int CreatedById { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ApprovedAt { get; set; }
    public DateTime? ProcessedAt { get; set; }

    // Navigation properties
    public Tenant? Tenant { get; set; }
    public Invoice? Invoice { get; set; }
    public User? CreatedBy { get; set; }
    public ICollection<SalesExchangeItem> Items { get; set; } = new List<SalesExchangeItem>();
}

