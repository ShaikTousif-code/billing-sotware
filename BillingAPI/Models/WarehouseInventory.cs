namespace BillingAPI.Models;

public class WarehouseInventory
{
    public int Id { get; set; }
    public int WarehouseId { get; set; }
    public int ProductId { get; set; }
    public int Quantity { get; set; }
    public decimal AverageCost { get; set; }
    public DateTime LastUpdatedAt { get; set; } = DateTime.UtcNow;

    public Warehouse? Warehouse { get; set; }
    public Product? Product { get; set; }
}

