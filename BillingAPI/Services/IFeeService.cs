using BillingAPI.Models;

namespace BillingAPI.Services;

public interface IFeeService
{
    Task<List<Fee>> GetFeesAsync(int tenantId, int? studentId = null, string? status = null);
    Task<Fee?> GetFeeByIdAsync(int id, int tenantId);
    Task<Fee> CreateFeeAsync(Fee fee);
    Task<Fee> UpdateFeeAsync(Fee fee);
    Task<bool> DeleteFeeAsync(int id, int tenantId);
    Task<string> GenerateFeeNumberAsync(int tenantId);
    Task<List<Fee>> GenerateFeesForClassAsync(int classId, int tenantId, string term = "");
    Task<FeePayment> RecordFeePaymentAsync(FeePayment payment);
    Task<FeePayment?> GetFeePaymentByIdAsync(int id, int tenantId);
}

