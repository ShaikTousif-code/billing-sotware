using BillingAPI.Models;

namespace BillingAPI.Services;

public interface ISalesReturnService
{
    Task<List<SalesReturn>> GetSalesReturnsAsync(int tenantId, DateTime? fromDate = null, DateTime? toDate = null);
    Task<SalesReturn?> GetSalesReturnByIdAsync(int id, int tenantId);
    Task<List<SalesReturn>> GetSalesReturnsByInvoiceIdAsync(int invoiceId, int tenantId);
    Task<SalesReturn> CreateSalesReturnAsync(SalesReturn salesReturn);
    Task<bool> ApproveSalesReturnAsync(int returnId, int tenantId);
    Task<bool> ProcessSalesReturnAsync(int returnId, int tenantId);
    Task<bool> ValidateReturnAsync(int invoiceItemId, decimal quantity, string? size, string? color, int tenantId);
}

