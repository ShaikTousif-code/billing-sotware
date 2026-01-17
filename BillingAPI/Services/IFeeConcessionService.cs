using BillingAPI.Models;

namespace BillingAPI.Services;

public interface IFeeConcessionService
{
    Task<FeeConcession> RequestConcessionAsync(FeeConcession concession);
    Task<bool> ApproveConcessionAsync(int id, int approvedById, int tenantId, string? notes = null);
    Task<bool> RejectConcessionAsync(int id, int tenantId, string? reason = null);
    Task<List<FeeConcession>> GetConcessionsAsync(int tenantId, int? studentId = null, string? status = null);
    Task<FeeConcession?> GetConcessionByIdAsync(int id, int tenantId);
    Task ApplyConcessionToFeeAsync(int concessionId, int feeId, int tenantId);
}

