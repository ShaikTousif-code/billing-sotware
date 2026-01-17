using BillingAPI.Models;

namespace BillingAPI.Services;

public interface ICostingService
{
    Task<decimal> CalculateCostAsync(int tenantId, int productId, decimal quantity, string costingMethod = "Average");
    Task<StockCost> GetStockCostAsync(int tenantId, int productId);
    Task<List<StockCostDetail>> GetStockCostDetailsAsync(int tenantId, int productId);
}

public class StockCost
{
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public decimal TotalQuantity { get; set; }
    public decimal AverageCost { get; set; }
    public decimal FIFOCost { get; set; }
    public decimal LIFOCost { get; set; }
    public decimal TotalValue { get; set; }
}

public class StockCostDetail
{
    public int BatchId { get; set; }
    public string BatchNumber { get; set; } = string.Empty;
    public DateTime? PurchaseDate { get; set; }
    public decimal Quantity { get; set; }
    public decimal UnitCost { get; set; }
    public decimal TotalCost { get; set; }
    public DateTime? ExpiryDate { get; set; }
}

