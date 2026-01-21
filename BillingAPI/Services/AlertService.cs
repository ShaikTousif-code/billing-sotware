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
        var now = DateTime.UtcNow;

        // Get all batches with expiry dates
        var batches = await _context.Batches
            .Include(b => b.Product)
            .Where(b => b.TenantId == tenantId
                && b.ExpiryDate.HasValue
                && b.Quantity > 0)
            .ToListAsync();

        // Also get products with expiry enabled that might not have batches yet
        var productsWithExpiry = await _context.Products
            .Where(p => p.TenantId == tenantId
                && p.IsExpiryEnabled
                && (p.ExpiryDate.HasValue || p.ExpiryType != null))
            .ToListAsync();

        var alerts = new List<ExpiryAlert>();

        // Process batches
        foreach (var batch in batches)
        {
            if (batch.Product == null)
                continue;

            // Use product's expiry configuration if available, otherwise use batch expiry date
            // This handles cases where product has expiry but flag isn't set, or batch has expiry info
            var productHasExpiryConfig = batch.Product.IsExpiryEnabled || 
                                        batch.Product.ExpiryType != null || 
                                        batch.Product.ExpiryDate.HasValue;

            // If batch has expiry date, process it (even if product flag isn't set)
            if (!batch.ExpiryDate.HasValue)
                continue;

            // Calculate alert date using product-level alert configuration
            // If product doesn't have expiry enabled but batch has expiry, still process it
            var alertDate = batch.Product.IsExpiryEnabled 
                ? ExpiryService.CalculateAlertDate(batch.ExpiryDate, batch.Product)
                : null;
            
            // If no product-level alert config, use default daysAhead
            var alertThresholdDays = daysAhead;
            if (batch.Product.IsExpiryEnabled && batch.Product.AlertBeforeValue.HasValue)
            {
                if (string.IsNullOrEmpty(batch.Product.AlertBeforeUnit) || batch.Product.AlertBeforeUnit.ToUpper() == "DAYS")
                {
                    alertThresholdDays = batch.Product.AlertBeforeValue.Value;
                }
                else if (batch.Product.AlertBeforeUnit.ToUpper() == "MONTHS")
                {
                    // Calculate exact days by subtracting months from expiry date
                    if (alertDate.HasValue)
                    {
                        alertThresholdDays = (int)(batch.ExpiryDate!.Value.Date - alertDate.Value.Date).TotalDays;
                    }
                    else
                    {
                        // Fallback: approximate months to days
                        alertThresholdDays = batch.Product.AlertBeforeValue.Value * 30;
                    }
                }
            }

            var daysUntilExpiry = (int)(batch.ExpiryDate!.Value.Date - now.Date).TotalDays;

            // Evaluate batch status on-the-fly to ensure it's current
            // If product doesn't have expiry enabled, use a simple check based on expiry date
            var currentStatus = batch.Product.IsExpiryEnabled
                ? ExpiryService.EvaluateBatchStatus(batch.ExpiryDate, batch.Product)
                : (batch.ExpiryDate.Value.Date < now.Date ? "EXPIRED" : 
                   (daysUntilExpiry <= 30 ? "NEAR_EXPIRY" : "ACTIVE"));

            // Check if alert should be shown based on alert date or threshold
            // If daysAhead is large (>= 365), show all alerts including expired ones
            var shouldShowAlert = false;
            if (daysAhead >= 365)
            {
                // Show all batches with expiry dates (including expired)
                shouldShowAlert = true;
            }
            else if (alertDate.HasValue)
            {
                // Show alert if today is on or after the alert date, or if status is EXPIRED or NEAR_EXPIRY
                shouldShowAlert = now.Date >= alertDate.Value.Date || currentStatus == "EXPIRED" || currentStatus == "NEAR_EXPIRY";
            }
            else
            {
                // Fallback to days-based threshold
                shouldShowAlert = daysUntilExpiry <= alertThresholdDays || currentStatus == "EXPIRED" || currentStatus == "NEAR_EXPIRY";
            }

            if (shouldShowAlert)
            {
                // Update batch status in database if it has changed
                if (batch.Status != currentStatus)
                {
                    batch.Status = currentStatus;
                    batch.IsExpired = currentStatus == "EXPIRED";
                    _context.Batches.Update(batch);
                }

                alerts.Add(new ExpiryAlert
                {
                    BatchId = batch.Id,
                    ProductId = batch.ProductId,
                    ProductName = batch.Product?.Name ?? "",
                    BatchNumber = batch.BatchNumber,
                    ExpiryDate = batch.ExpiryDate!.Value,
                    DaysUntilExpiry = daysUntilExpiry,
                    Quantity = batch.Quantity,
                    AlertThresholdDays = alertThresholdDays,
                    Status = currentStatus
                });
            }
        }

        // Process products with expiry that don't have batches yet
        // This handles cases where products have expiry configured but no stock/batches created
        foreach (var product in productsWithExpiry)
        {
            // Skip if product already has batches (already processed above)
            if (batches.Any(b => b.ProductId == product.Id))
                continue;

            // Only process if product has an expiry date or expiry configuration
            DateTime? expiryDate = null;
            if (product.ExpiryType == "FIXED_DATE" && product.ExpiryDate.HasValue)
            {
                expiryDate = product.ExpiryDate;
            }
            else if (product.ExpiryType == "DURATION" && product.ManufacturingDate.HasValue)
            {
                expiryDate = ExpiryService.CalculateExpiryDate(product.ManufacturingDate, product);
            }

            if (!expiryDate.HasValue)
                continue;

            var daysUntilExpiry = (int)(expiryDate.Value.Date - now.Date).TotalDays;
            var currentStatus = ExpiryService.EvaluateBatchStatus(expiryDate, product);
            var alertDate = ExpiryService.CalculateAlertDate(expiryDate, product);

            // Determine if alert should be shown
            var shouldShowAlert = false;
            if (daysAhead >= 365)
            {
                shouldShowAlert = true;
            }
            else if (alertDate.HasValue)
            {
                shouldShowAlert = now.Date >= alertDate.Value.Date || currentStatus == "EXPIRED" || currentStatus == "NEAR_EXPIRY";
            }
            else
            {
                var alertThresholdDays = product.AlertBeforeValue ?? daysAhead;
                shouldShowAlert = daysUntilExpiry <= alertThresholdDays || currentStatus == "EXPIRED" || currentStatus == "NEAR_EXPIRY";
            }

            if (shouldShowAlert)
            {
                var alertThresholdDays = product.AlertBeforeValue ?? daysAhead;
                if (product.AlertBeforeUnit?.ToUpper() == "MONTHS" && product.AlertBeforeValue.HasValue)
                {
                    if (alertDate.HasValue)
                    {
                        alertThresholdDays = (int)(expiryDate.Value.Date - alertDate.Value.Date).TotalDays;
                    }
                    else
                    {
                        alertThresholdDays = product.AlertBeforeValue.Value * 30;
                    }
                }

                alerts.Add(new ExpiryAlert
                {
                    BatchId = 0, // No batch yet
                    ProductId = product.Id,
                    ProductName = product.Name,
                    BatchNumber = product.BatchNo ?? "N/A",
                    ExpiryDate = expiryDate.Value,
                    DaysUntilExpiry = daysUntilExpiry,
                    Quantity = product.StockQuantity ?? 0,
                    AlertThresholdDays = alertThresholdDays,
                    Status = currentStatus
                });
            }
        }

        // Save any batch status updates
        await _context.SaveChangesAsync();

        return alerts;
    }

    public async Task<object> GetExpiryAlertsDebugAsync(int tenantId)
    {
        var now = DateTime.UtcNow;
        
        var batches = await _context.Batches
            .Include(b => b.Product)
            .Where(b => b.TenantId == tenantId)
            .ToListAsync();

        var productsWithExpiry = await _context.Products
            .Where(p => p.TenantId == tenantId && p.IsExpiryEnabled)
            .ToListAsync();

        var debugInfo = new
        {
            CurrentDate = now,
            TotalBatches = batches.Count,
            BatchesWithExpiryDate = batches.Count(b => b.ExpiryDate.HasValue),
            BatchesWithQuantity = batches.Count(b => b.Quantity > 0),
            ProductsWithExpiryEnabled = productsWithExpiry.Count,
            Batches = batches.Select(b => {
                var alertDate = b.ExpiryDate.HasValue && b.Product != null 
                    ? ExpiryService.CalculateAlertDate(b.ExpiryDate, b.Product) 
                    : null;
                var shouldShowAlert = b.ExpiryDate.HasValue && b.Product != null && b.Product.IsExpiryEnabled && b.Quantity > 0
                    && alertDate.HasValue && now.Date >= alertDate.Value.Date;
                
                return new
                {
                    BatchId = b.Id,
                    ProductId = b.ProductId,
                    ProductName = b.Product?.Name ?? "Unknown",
                    BatchNumber = b.BatchNumber,
                    ManufacturingDate = b.ManufacturingDate,
                    ExpiryDate = b.ExpiryDate,
                    Quantity = b.Quantity,
                    Status = b.Status,
                    ProductIsExpiryEnabled = b.Product?.IsExpiryEnabled ?? false,
                    ProductExpiryType = b.Product?.ExpiryType,
                    ProductAlertBeforeValue = b.Product?.AlertBeforeValue,
                    ProductAlertBeforeUnit = b.Product?.AlertBeforeUnit,
                    CalculatedAlertDate = alertDate,
                    EvaluatedStatus = b.ExpiryDate.HasValue && b.Product != null
                        ? ExpiryService.EvaluateBatchStatus(b.ExpiryDate, b.Product)
                        : "N/A",
                    DaysUntilExpiry = b.ExpiryDate.HasValue 
                        ? (int)(b.ExpiryDate.Value.Date - now.Date).TotalDays 
                        : (int?)null,
                    ShouldShowAlert = shouldShowAlert
                };
            }).ToList()
        };

        return debugInfo;
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

