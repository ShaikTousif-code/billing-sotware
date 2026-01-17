namespace BillingAPI.Models;

public class ProductVariant
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public string VariantType { get; set; } = string.Empty; // Size, Color, Pack, etc.
    public string VariantValue { get; set; } = string.Empty; // Small, Red, 500ml, etc.
    public string? SKU { get; set; }
    public decimal? CostPrice { get; set; }
    public decimal? SellingPrice { get; set; }
    public int? StockQuantity { get; set; }
    public string? ImageUrl { get; set; }
    public bool IsActive { get; set; } = true;

    public Product? Product { get; set; }
}

