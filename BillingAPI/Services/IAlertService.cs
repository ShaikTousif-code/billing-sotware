using BillingAPI.Models;

namespace BillingAPI.Services;

public interface IAlertService
{
    Task<List<LowStockAlert>> GetLowStockAlertsAsync(int tenantId);
    Task<List<ExpiryAlert>> GetExpiryAlertsAsync(int tenantId, int daysAhead = 30);
    Task CheckAndCreateAlertsAsync(int tenantId);
}

public class LowStockAlert
{
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public int CurrentStock { get; set; }
    public int LowStockThreshold { get; set; }
    public string Unit { get; set; } = string.Empty;
    public bool IsLowStock { get; set; } = false;
    public bool HasAlertConfigured { get; set; } = false;
}

public class ExpiryAlert
{
    public int BatchId { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string BatchNumber { get; set; } = string.Empty;
    public DateTime ExpiryDate { get; set; }
    public int DaysUntilExpiry { get; set; }
    public int Quantity { get; set; }
}

