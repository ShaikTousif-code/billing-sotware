using BillingAPI.Models;

namespace BillingAPI.Services;

public interface IInvoiceService
{
    Task<List<Invoice>> GetInvoicesAsync(int tenantId, DateTime? fromDate = null, DateTime? toDate = null);
    Task<Invoice?> GetInvoiceByIdAsync(int id, int tenantId);
    Task<Invoice> CreateInvoiceAsync(Invoice invoice);
    Task<Invoice> UpdateInvoiceAsync(Invoice invoice);
    Task<bool> CancelInvoiceAsync(int id, int tenantId, string reason);
    Task<string> GenerateInvoiceNumberAsync(int tenantId);
}

