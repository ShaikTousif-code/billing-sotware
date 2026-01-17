namespace BillingAPI.Models;

public class LoyaltyTransaction
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public int CustomerId { get; set; }
    public string TransactionType { get; set; } = string.Empty; // Earn, Redeem
    public decimal Points { get; set; }
    public string? ReferenceType { get; set; } // Invoice, Manual, etc.
    public int? ReferenceId { get; set; }
    public string? Notes { get; set; }
    public DateTime TransactionDate { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Tenant? Tenant { get; set; }
    public Customer? Customer { get; set; }
}

