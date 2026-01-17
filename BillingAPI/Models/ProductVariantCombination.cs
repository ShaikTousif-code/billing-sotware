namespace BillingAPI.Models;

public class ProductVariantCombination
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public int ProductId { get; set; }
    public string Size { get; set; } = string.Empty; // S, M, L, XL, XXL, etc.
    public string Color { get; set; } = string.Empty; // Red, Blue, etc.
    public string? SKU { get; set; } // Unique SKU per combination
    public string? Barcode { get; set; } // Unique barcode per combination
    public decimal? CostPrice { get; set; }
    public decimal? SellingPrice { get; set; }
    public int StockQuantity { get; set; } = 0;
    public string? ImageUrl { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Tenant? Tenant { get; set; }
    public Product? Product { get; set; }
}

