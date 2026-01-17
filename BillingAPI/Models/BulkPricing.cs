namespace BillingAPI.Models;

public class BulkPricing
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public int ProductId { get; set; }
    public string CustomerType { get; set; } = "B2B"; // B2B or B2C
    public int? CustomerGroupId { get; set; } // For B2C group pricing
    public decimal MinQuantity { get; set; } // Minimum quantity for this price tier
    public decimal? MaxQuantity { get; set; } // Maximum quantity (null for unlimited)
    public decimal UnitPrice { get; set; } // Price per unit at this tier
    public decimal? DiscountPercentage { get; set; } // Optional discount percentage
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Tenant? Tenant { get; set; }
    public Product? Product { get; set; }
    public CustomerGroup? CustomerGroup { get; set; }
}

