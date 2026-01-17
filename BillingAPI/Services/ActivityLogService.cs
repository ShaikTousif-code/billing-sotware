using Microsoft.EntityFrameworkCore;
using BillingAPI.Data;
using BillingAPI.Models;
using BillingAPI.DTOs;

namespace BillingAPI.Services;

public class ActivityLogService : IActivityLogService
{
    private readonly ApplicationDbContext _context;

    public ActivityLogService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task LogActivityAsync(ActivityLog log)
    {
        try
        {
            _context.ActivityLogs.Add(log);
            await _context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            // Log error but don't fail the request
            // Use Serilog or similar logging framework
            Console.WriteLine($"Error logging activity: {ex.Message}");
        }
    }

    public async Task<PaginatedResponse<ActivityLog>> GetActivityLogsAsync(
        int tenantId, 
        string? entityType = null, 
        int? entityId = null,
        int? userId = null,
        string? action = null,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        int page = 1,
        int pageSize = 50)
    {
        var query = _context.ActivityLogs
            .Include(al => al.User)
            .Where(al => al.TenantId == tenantId);

        if (!string.IsNullOrEmpty(entityType))
        {
            query = query.Where(al => al.EntityType == entityType);
        }

        if (entityId.HasValue)
        {
            query = query.Where(al => al.EntityId == entityId.Value);
        }

        if (userId.HasValue)
        {
            query = query.Where(al => al.UserId == userId.Value);
        }

        if (!string.IsNullOrEmpty(action))
        {
            query = query.Where(al => al.Action == action);
        }

        if (fromDate.HasValue)
        {
            query = query.Where(al => al.CreatedAt >= fromDate.Value);
        }

        if (toDate.HasValue)
        {
            var toDateEnd = toDate.Value.Date.AddDays(1).AddTicks(-1);
            query = query.Where(al => al.CreatedAt <= toDateEnd);
        }

        var totalCount = await query.CountAsync();
        
        var logs = await query
            .OrderByDescending(al => al.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PaginatedResponse<ActivityLog>
        {
            Data = logs,
            PageNumber = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }

    public async Task<PaginatedResponse<ActivityLog>> GetUserActivityLogsAsync(int tenantId, int userId, int page = 1, int pageSize = 50)
    {
        var query = _context.ActivityLogs
            .Include(al => al.User)
            .Where(al => al.TenantId == tenantId && al.UserId == userId);

        var totalCount = await query.CountAsync();

        var logs = await query
            .OrderByDescending(al => al.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PaginatedResponse<ActivityLog>
        {
            Data = logs,
            PageNumber = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }

    public async Task<ActivityLog?> GetActivityLogByIdAsync(int id, int tenantId)
    {
        return await _context.ActivityLogs
            .Include(al => al.User)
            .FirstOrDefaultAsync(al => al.Id == id && al.TenantId == tenantId);
    }
}

