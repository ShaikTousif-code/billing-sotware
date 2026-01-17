using BillingAPI.Models;

namespace BillingAPI.Services;

public interface IRecurringInvoiceService
{
    Task<List<ContractInvoice>> GenerateRecurringInvoicesAsync(int tenantId);
    Task<ContractInvoice> GenerateContractInvoiceAsync(int contractId, int tenantId, string period);
    Task<List<ServiceContract>> GetExpiringContractsAsync(int tenantId, int daysAhead = 30);
}

