using BillingAPI.Models;

namespace BillingAPI.Services;

public interface IWalletService
{
    Task<List<WalletTransaction>> GetWalletTransactionsAsync(int tenantId, int customerId);
    Task<WalletTransaction> AddWalletCreditAsync(int tenantId, int customerId, decimal amount, string? notes, int createdById);
    Task<WalletTransaction> AddWalletDebitAsync(int tenantId, int customerId, decimal amount, string? notes, int createdById);
    Task<decimal> GetWalletBalanceAsync(int customerId);
    Task<bool> UseWalletPaymentAsync(int tenantId, int customerId, int invoiceId, decimal amount, int createdById);
}

