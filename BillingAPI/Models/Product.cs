namespace BillingAPI.Models;

public class Product
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? SKU { get; set; }
    public string? HSNCode { get; set; }
    public string? SACCode { get; set; }
    public string? Barcode { get; set; }
    public string? Description { get; set; }
    public int? CategoryId { get; set; }
    public decimal CostPrice { get; set; }
    public decimal SellingPrice { get; set; }
    public decimal? MRP { get; set; } // Maximum Retail Price
    public decimal? TaxRate { get; set; }
    public string? TaxType { get; set; } // GST, Non-GST, Exempt
    public int? StockQuantity { get; set; }
    public int? LowStockAlert { get; set; }
    public string? Unit { get; set; } // PCS, KG, LTR, etc.
    public string? ImageUrl { get; set; }
    public ProductType Type { get; set; } = ProductType.Product; // Product or Service
    public bool IsActive { get; set; } = true;
    public bool TrackInventory { get; set; } = true;

    // Enhanced purchase invoice fields
    public string? BatchNo { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public string? Manufacturer { get; set; }

    // Purchase tracking
    public decimal? LastPurchasePrice { get; set; }
    public decimal? LastPurchaseQuantity { get; set; }
    public DateTime? LastPurchaseDate { get; set; }
    public string? SupplierName { get; set; }

    // RMG-specific fields
    public string? StyleCode { get; set; } // Unique style/design code
    public string? Season { get; set; } // Spring, Summer, Fall, Winter
    public string? Collection { get; set; } // Collection name
    public string? Gender { get; set; } // Men, Women, Kids, Unisex
    public string? FabricType { get; set; } // Cotton, Polyester, etc.
    public int? SizeChartId { get; set; } // Reference to size chart

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Tenant? Tenant { get; set; }
    public ProductCategory? Category { get; set; }
    public SizeChart? SizeChart { get; set; }
    public ICollection<ProductVariantCombination> VariantCombinations { get; set; } = new List<ProductVariantCombination>();
}

