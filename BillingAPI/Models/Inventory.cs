namespace BillingAPI.Models;

public class Inventory
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public int ProductId { get; set; }
    public int? VariantCombinationId { get; set; } // For variant-specific inventory
    public int Quantity { get; set; }
    public decimal AverageCost { get; set; }
    public DateTime LastUpdatedAt { get; set; } = DateTime.UtcNow;

    public Tenant? Tenant { get; set; }
    public Product? Product { get; set; }
    public ProductVariantCombination? VariantCombination { get; set; }
}

