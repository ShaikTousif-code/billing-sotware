namespace BillingAPI.Models;

// Unit Conversion for Grocery Module
public class UnitConversion
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public int ProductId { get; set; }
    public string FromUnit { get; set; } = string.Empty; // e.g., "KG"
    public string ToUnit { get; set; } = string.Empty; // e.g., "G"
    public decimal ConversionFactor { get; set; } // e.g., 1000 (1 KG = 1000 G)
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Tenant? Tenant { get; set; }
    public Product? Product { get; set; }
}

