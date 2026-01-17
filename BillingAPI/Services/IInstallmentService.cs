using BillingAPI.Models;

namespace BillingAPI.Services;

public interface IInstallmentService
{
    Task<InstallmentPlan> CreateInstallmentPlanAsync(InstallmentPlan plan);
    Task<InstallmentPlan?> GetInstallmentPlanByIdAsync(int id, int tenantId);
    Task<List<InstallmentPlan>> GetInstallmentPlansAsync(int tenantId, int? studentId = null);
    Task<Installment> RecordInstallmentPaymentAsync(int installmentId, decimal amount, string paymentMode, string? transactionId = null);
    Task<bool> CancelInstallmentPlanAsync(int id, int tenantId);
}

