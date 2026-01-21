namespace BillingAPI.Models;

public class Batch
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public int ProductId { get; set; }
    public int? SupplierId { get; set; }
    public string BatchNumber { get; set; } = string.Empty;
    public DateTime? ManufacturingDate { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public int Quantity { get; set; }
    public decimal UnitCost { get; set; }
    public int? WarehouseId { get; set; }
    public bool IsExpired { get; set; } = false;
    public string? Status { get; set; } // "ACTIVE", "NEAR_EXPIRY", "EXPIRED"
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Tenant? Tenant { get; set; }
    public Product? Product { get; set; }
    public Supplier? Supplier { get; set; }
    public Warehouse? Warehouse { get; set; }
}

