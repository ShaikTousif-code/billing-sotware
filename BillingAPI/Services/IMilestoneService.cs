using BillingAPI.Models;

namespace BillingAPI.Services;

public interface IMilestoneService
{
    Task<Milestone> CreateMilestoneAsync(Milestone milestone);
    Task<Milestone?> GetMilestoneByIdAsync(int id, int tenantId);
    Task<List<Milestone>> GetMilestonesAsync(int tenantId, int? projectId = null);
    Task<Milestone> UpdateMilestoneAsync(Milestone milestone);
    Task<bool> MarkMilestoneCompleteAsync(int id, int tenantId);
    Task<Deliverable> AddDeliverableAsync(Deliverable deliverable);
    Task<bool> LinkMilestoneToInvoiceAsync(int milestoneId, int invoiceId, int tenantId);
}

