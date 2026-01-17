namespace BillingAPI.Models;

public class BundleProduct
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal BundlePrice { get; set; }
    public decimal? DiscountPercentage { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Tenant? Tenant { get; set; }
    public ICollection<BundleItem> Items { get; set; } = new List<BundleItem>();
}

public class BundleItem
{
    public int Id { get; set; }
    public int BundleProductId { get; set; }
    public int ProductId { get; set; }
    public decimal Quantity { get; set; }
    public decimal? DiscountPercentage { get; set; }

    public BundleProduct? BundleProduct { get; set; }
    public Product? Product { get; set; }
}

