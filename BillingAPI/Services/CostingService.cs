using Microsoft.EntityFrameworkCore;
using BillingAPI.Data;
using BillingAPI.Models;

namespace BillingAPI.Services;

public class CostingService : ICostingService
{
    private readonly ApplicationDbContext _context;

    public CostingService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<decimal> CalculateCostAsync(int tenantId, int productId, decimal quantity, string costingMethod = "Average")
    {
        return costingMethod.ToUpper() switch
        {
            "FIFO" => await CalculateFIFOCostAsync(tenantId, productId, quantity),
            "LIFO" => await CalculateLIFOCostAsync(tenantId, productId, quantity),
            _ => await CalculateAverageCostAsync(tenantId, productId, quantity)
        };
    }

    private async Task<decimal> CalculateAverageCostAsync(int tenantId, int productId, decimal quantity)
    {
        var product = await _context.Products.FindAsync(productId);
        if (product == null) return 0;

        // Get all stock transactions for this product
        var transactions = await _context.StockTransactions
            .Where(st => st.TenantId == tenantId && st.ProductId == productId)
            .OrderBy(st => st.TransactionDate)
            .ToListAsync();

        decimal totalCost = 0;
        decimal totalQuantity = 0;

        foreach (var transaction in transactions)
        {
            if (transaction.TransactionType == "In" || transaction.TransactionType == "Purchase")
            {
                totalCost += transaction.Quantity * (transaction.UnitCost ?? 0);
                totalQuantity += transaction.Quantity;
            }
        }

        if (totalQuantity == 0) return product.CostPrice;

        var averageCost = totalCost / totalQuantity;
        return averageCost * quantity;
    }

    private async Task<decimal> CalculateFIFOCostAsync(int tenantId, int productId, decimal quantity)
    {
        // Get batches ordered by purchase date (oldest first)
        var batches = await _context.Batches
            .Where(b => b.TenantId == tenantId 
                && b.ProductId == productId 
                && b.Quantity > 0
                && !b.IsExpired)
            .OrderBy(b => b.CreatedAt)
            .ToListAsync();

        decimal remainingQuantity = quantity;
        decimal totalCost = 0;

        foreach (var batch in batches)
        {
            if (remainingQuantity <= 0) break;

            var quantityToUse = Math.Min(remainingQuantity, batch.Quantity);
            totalCost += quantityToUse * batch.UnitCost;
            remainingQuantity -= quantityToUse;
        }

        // If still need more, use average cost for remaining
        if (remainingQuantity > 0)
        {
            var product = await _context.Products.FindAsync(productId);
            totalCost += remainingQuantity * (product?.CostPrice ?? 0);
        }

        return totalCost;
    }

    private async Task<decimal> CalculateLIFOCostAsync(int tenantId, int productId, decimal quantity)
    {
        // Get batches ordered by purchase date (newest first)
        var batches = await _context.Batches
            .Where(b => b.TenantId == tenantId 
                && b.ProductId == productId 
                && b.Quantity > 0
                && !b.IsExpired)
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync();

        decimal remainingQuantity = quantity;
        decimal totalCost = 0;

        foreach (var batch in batches)
        {
            if (remainingQuantity <= 0) break;

            var quantityToUse = Math.Min(remainingQuantity, batch.Quantity);
            totalCost += quantityToUse * batch.UnitCost;
            remainingQuantity -= quantityToUse;
        }

        // If still need more, use average cost for remaining
        if (remainingQuantity > 0)
        {
            var product = await _context.Products.FindAsync(productId);
            totalCost += remainingQuantity * (product?.CostPrice ?? 0);
        }

        return totalCost;
    }

    public async Task<StockCost> GetStockCostAsync(int tenantId, int productId)
    {
        var product = await _context.Products.FindAsync(productId);
        if (product == null)
            throw new Exception("Product not found");

        var batches = await _context.Batches
            .Where(b => b.TenantId == tenantId && b.ProductId == productId && b.Quantity > 0)
            .ToListAsync();

        var totalQuantity = batches.Sum(b => b.Quantity);
        var averageCost = batches.Any() 
            ? batches.Sum(b => b.Quantity * b.UnitCost) / totalQuantity 
            : product.CostPrice;

        // Calculate FIFO cost for total quantity
        var fifoCost = await CalculateFIFOCostAsync(tenantId, productId, totalQuantity);
        var fifoUnitCost = totalQuantity > 0 ? fifoCost / totalQuantity : averageCost;

        // Calculate LIFO cost for total quantity
        var lifoCost = await CalculateLIFOCostAsync(tenantId, productId, totalQuantity);
        var lifoUnitCost = totalQuantity > 0 ? lifoCost / totalQuantity : averageCost;

        return new StockCost
        {
            ProductId = productId,
            ProductName = product.Name,
            TotalQuantity = totalQuantity,
            AverageCost = averageCost,
            FIFOCost = fifoUnitCost,
            LIFOCost = lifoUnitCost,
            TotalValue = totalQuantity * averageCost
        };
    }

    public async Task<List<StockCostDetail>> GetStockCostDetailsAsync(int tenantId, int productId)
    {
        var batches = await _context.Batches
            .Where(b => b.TenantId == tenantId && b.ProductId == productId && b.Quantity > 0)
            .OrderBy(b => b.CreatedAt)
            .ToListAsync();

        return batches.Select(b => new StockCostDetail
        {
            BatchId = b.Id,
            BatchNumber = b.BatchNumber,
            PurchaseDate = b.CreatedAt,
            Quantity = b.Quantity,
            UnitCost = b.UnitCost,
            TotalCost = b.Quantity * b.UnitCost,
            ExpiryDate = b.ExpiryDate
        }).ToList();
    }
}

