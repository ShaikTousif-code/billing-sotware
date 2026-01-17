namespace BillingAPI.Models;

public class BankAccount
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public string AccountName { get; set; } = string.Empty;
    public string AccountNumber { get; set; } = string.Empty;
    public string BankName { get; set; } = string.Empty;
    public string? IFSC { get; set; }
    public string? Branch { get; set; }
    public string AccountType { get; set; } = "Current"; // Current, Savings, etc.
    public decimal Balance { get; set; } = 0;
    public bool IsActive { get; set; } = true;
    public bool IsDefault { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Tenant? Tenant { get; set; }
}

