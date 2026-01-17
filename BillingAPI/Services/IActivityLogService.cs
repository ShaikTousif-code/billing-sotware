using BillingAPI.Models;
using BillingAPI.DTOs;

namespace BillingAPI.Services;

public interface IActivityLogService
{
    Task LogActivityAsync(ActivityLog log);
    Task<PaginatedResponse<ActivityLog>> GetActivityLogsAsync(
        int tenantId, 
        string? entityType = null, 
        int? entityId = null,
        int? userId = null,
        string? action = null,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        int page = 1,
        int pageSize = 50);
    Task<PaginatedResponse<ActivityLog>> GetUserActivityLogsAsync(int tenantId, int userId, int page = 1, int pageSize = 50);
    Task<ActivityLog?> GetActivityLogByIdAsync(int id, int tenantId);
}

