using BillingAPI.Models;

namespace BillingAPI.Services;

public interface ITimeTrackingService
{
    Task<TimeEntry> CreateTimeEntryAsync(TimeEntry entry);
    Task<List<TimeEntry>> GetTimeEntriesAsync(int tenantId, int? projectId = null, int? userId = null, DateTime? fromDate = null, DateTime? toDate = null);
    Task<TimeEntry?> GetTimeEntryByIdAsync(int id, int tenantId);
    Task<TimeEntry> UpdateTimeEntryAsync(TimeEntry entry);
    Task<bool> ApproveTimeEntryAsync(int id, int approvedById, int tenantId);
    Task<bool> RejectTimeEntryAsync(int id, int tenantId, string? reason = null);
    Task<decimal> GetTotalBillableHoursAsync(int projectId, int tenantId);
    Task<decimal> GetTotalBillableAmountAsync(int projectId, int tenantId);
}

