using Microsoft.EntityFrameworkCore;
using BillingAPI.Data;
using BillingAPI.Models;

namespace BillingAPI.Services;

public class AlertService : IAlertService
{
    private readonly ApplicationDbContext _context;

    public AlertService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<LowStockAlert>> GetLowStockAlertsAsync(int tenantId)
    {
        var products = await _context.Products
            .Include(p => p.Category)
            .Where(p => p.TenantId == tenantId
                && p.TrackInventory)
            .ToListAsync();

        var inventories = await _context.Inventories
            .Where(i => i.TenantId == tenantId)
            .ToListAsync();

        var alerts = new List<LowStockAlert>();

        foreach (var product in products)
        {
            var inventory = inventories.FirstOrDefault(i => i.ProductId == product.Id);
            var currentStock = inventory?.Quantity ?? product.StockQuantity ?? 0;
            var lowStockThreshold = product.LowStockAlert ?? 10; // Default threshold of 10 if not set

            // Show all products with inventory tracking
            alerts.Add(new LowStockAlert
            {
                ProductId = product.Id,
                ProductName = product.Name,
                CurrentStock = currentStock,
                LowStockThreshold = lowStockThreshold,
                Unit = product.Unit ?? "PCS",
                IsLowStock = product.LowStockAlert.HasValue && currentStock <= product.LowStockAlert.Value,
                HasAlertConfigured = product.LowStockAlert.HasValue
            });
        }

        return alerts;
    }

    public async Task<List<ExpiryAlert>> GetExpiryAlertsAsync(int tenantId, int daysAhead = 30)
    {
        var expiryDate = DateTime.UtcNow.AddDays(daysAhead);

        var batches = await _context.Batches
            .Include(b => b.Product)
            .Where(b => b.TenantId == tenantId
                && b.ExpiryDate.HasValue
                && b.ExpiryDate <= expiryDate
                && !b.IsExpired
                && b.Quantity > 0)
            .ToListAsync();

        return batches.Select(b => new ExpiryAlert
        {
            BatchId = b.Id,
            ProductId = b.ProductId,
            ProductName = b.Product?.Name ?? "",
            BatchNumber = b.BatchNumber,
            ExpiryDate = b.ExpiryDate!.Value,
            DaysUntilExpiry = (int)(b.ExpiryDate.Value - DateTime.UtcNow).TotalDays,
            Quantity = b.Quantity
        }).ToList();
    }

    public async Task CheckAndCreateAlertsAsync(int tenantId)
    {
        // This can be called by a background job to check and send notifications
        var lowStockAlerts = await GetLowStockAlertsAsync(tenantId);
        var expiryAlerts = await GetExpiryAlertsAsync(tenantId);

        // TODO: Send notifications (email, SMS, etc.)
        await Task.CompletedTask;
    }
}

