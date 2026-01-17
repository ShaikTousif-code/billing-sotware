namespace BillingAPI.Models;

public class Customer
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public string? GSTIN { get; set; }
    public string? CustomerType { get; set; } = "B2C"; // B2B or B2C (nullable for backward compatibility)
    public int? CustomerGroupId { get; set; } // For B2C pricing groups
    public string? PaymentTerms { get; set; } // Net 30, Net 60, COD, etc. (for B2B)
    public int? CreditDays { get; set; } // Number of credit days (for B2B)
    public decimal CreditLimit { get; set; } = 0; // For B2B credit sales
    public decimal OutstandingBalance { get; set; } = 0;
    public decimal LoyaltyPoints { get; set; } = 0; // For B2C loyalty program
    public decimal WalletBalance { get; set; } = 0; // For B2C wallet
    public decimal LoyaltyPointsEarned { get; set; } = 0; // Total lifetime points earned
    public decimal LoyaltyPointsRedeemed { get; set; } = 0; // Total lifetime points redeemed
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Tenant? Tenant { get; set; }
    public CustomerGroup? CustomerGroup { get; set; }
}

