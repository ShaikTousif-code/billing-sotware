using BillingAPI.Models;

namespace BillingAPI.Services;

public interface IPaymentService
{
    Task<List<Payment>> GetPaymentsAsync(int tenantId, int? invoiceId = null);
    Task<Payment> CreatePaymentAsync(Payment payment);
    Task<Payment> CreateSplitPaymentAsync(int invoiceId, int tenantId, List<SplitPaymentRequest> payments);
    Task<bool> DeletePaymentAsync(int id, int tenantId);
    Task<decimal> GetTotalPaidAsync(int invoiceId);
}

public class SplitPaymentRequest
{
    public decimal Amount { get; set; }
    public string PaymentMode { get; set; } = string.Empty;
    public string? TransactionId { get; set; }
    public int? BankAccountId { get; set; }
}

