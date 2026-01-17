using BillingAPI.Models;

namespace BillingAPI.Services;

public interface IInventoryService
{
    Task<List<Inventory>> GetInventoryAsync(int tenantId);
    Task<Inventory?> GetInventoryByProductIdAsync(int productId, int tenantId);
    Task<Inventory> UpdateInventoryAsync(int productId, int tenantId, int quantity, decimal? unitCost = null, bool addToExisting = false);
    Task<List<StockTransaction>> GetStockTransactionsAsync(int tenantId, int? productId = null);
}

