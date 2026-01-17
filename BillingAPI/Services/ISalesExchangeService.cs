using BillingAPI.Models;

namespace BillingAPI.Services;

public interface ISalesExchangeService
{
    Task<List<SalesExchange>> GetSalesExchangesAsync(int tenantId, DateTime? fromDate = null, DateTime? toDate = null);
    Task<SalesExchange?> GetSalesExchangeByIdAsync(int id, int tenantId);
    Task<List<SalesExchange>> GetSalesExchangesByInvoiceIdAsync(int invoiceId, int tenantId);
    Task<SalesExchange> CreateSalesExchangeAsync(SalesExchange exchange);
    Task<bool> ApproveSalesExchangeAsync(int exchangeId, int tenantId);
    Task<bool> ProcessSalesExchangeAsync(int exchangeId, int tenantId);
    Task<decimal> CalculatePriceDifferenceAsync(SalesExchange exchange);
    Task<bool> ValidateExchangeAsync(int invoiceItemId, string? oldSize, string? oldColor, string? newSize, string? newColor, int tenantId);
}

