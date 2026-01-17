namespace BillingAPI.Models;

public class WalletTransaction
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public int CustomerId { get; set; }
    public string TransactionType { get; set; } = string.Empty; // Credit, Debit
    public decimal Amount { get; set; }
    public decimal BalanceAfter { get; set; }
    public string? ReferenceType { get; set; } // Payment, Refund, Manual
    public int? ReferenceId { get; set; }
    public string? Notes { get; set; }
    public DateTime TransactionDate { get; set; } = DateTime.UtcNow;
    public int CreatedById { get; set; }

    public Tenant? Tenant { get; set; }
    public Customer? Customer { get; set; }
    public User? CreatedBy { get; set; }
}

