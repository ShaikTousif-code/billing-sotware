using Microsoft.EntityFrameworkCore;
using BillingAPI.Data;
using BillingAPI.Models;

namespace BillingAPI.Services;

public class InventoryService : IInventoryService
{
    private readonly ApplicationDbContext _context;

    public InventoryService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<Inventory>> GetInventoryAsync(int tenantId)
    {
        return await _context.Inventories
            .Include(i => i.Product)
            .Where(i => i.TenantId == tenantId)
            .OrderBy(i => i.Product!.Name)
            .ToListAsync();
    }

    public async Task<Inventory?> GetInventoryByProductIdAsync(int productId, int tenantId)
    {
        return await _context.Inventories
            .Include(i => i.Product)
            .FirstOrDefaultAsync(i => i.ProductId == productId && i.TenantId == tenantId);
    }

    public async Task<Inventory> UpdateInventoryAsync(int productId, int tenantId, int quantity, decimal? unitCost = null, bool addToExisting = false)
    {
        // Load product to sync StockQuantity
        var product = await _context.Products
            .FirstOrDefaultAsync(p => p.Id == productId && p.TenantId == tenantId);

        if (product == null)
        {
            throw new InvalidOperationException($"Product with ID {productId} not found");
        }

        var inventory = await _context.Inventories
            .FirstOrDefaultAsync(i => i.ProductId == productId && i.TenantId == tenantId);

        int finalQuantity;
        decimal finalAverageCost;

        if (inventory == null)
        {
            finalQuantity = quantity;
            finalAverageCost = unitCost ?? product.CostPrice;
            
            inventory = new Inventory
            {
                TenantId = tenantId,
                ProductId = productId,
                Quantity = finalQuantity,
                AverageCost = finalAverageCost,
                LastUpdatedAt = DateTime.UtcNow
            };
            _context.Inventories.Add(inventory);
        }
        else
        {
            if (addToExisting)
            {
                finalQuantity = inventory.Quantity + quantity;
                // Calculate weighted average cost when adding stock
                if (unitCost.HasValue && quantity > 0)
                {
                    var totalCost = (inventory.Quantity * inventory.AverageCost) + (quantity * unitCost.Value);
                    finalAverageCost = totalCost / finalQuantity;
                }
                else
                {
                    finalAverageCost = inventory.AverageCost;
                }
            }
            else
            {
                finalQuantity = quantity;
                finalAverageCost = unitCost ?? inventory.AverageCost;
            }
            
            inventory.Quantity = finalQuantity;
            inventory.AverageCost = finalAverageCost;
            inventory.LastUpdatedAt = DateTime.UtcNow;
        }

        // Sync Product.StockQuantity with Inventory.Quantity
        if (product.TrackInventory)
        {
            product.StockQuantity = finalQuantity;
            product.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        return inventory;
    }

    public async Task<List<StockTransaction>> GetStockTransactionsAsync(int tenantId, int? productId = null)
    {
        var query = _context.StockTransactions
            .Include(t => t.Product)
            .Where(t => t.TenantId == tenantId);

        if (productId.HasValue)
        {
            query = query.Where(t => t.ProductId == productId.Value);
        }

        return await query.OrderByDescending(t => t.TransactionDate).ToListAsync();
    }
}

