using Microsoft.EntityFrameworkCore;
using BillingAPI.Data;
using BillingAPI.Models;

namespace BillingAPI.Services;

public class TimeTrackingService : ITimeTrackingService
{
    private readonly ApplicationDbContext _context;

    public TimeTrackingService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<TimeEntry> CreateTimeEntryAsync(TimeEntry entry)
    {
        entry.CreatedAt = DateTime.UtcNow;
        entry.Status = "Pending";

        if (entry.IsBillable && entry.HourlyRate.HasValue)
        {
            entry.TotalAmount = entry.Hours * entry.HourlyRate.Value;
        }

        _context.TimeEntries.Add(entry);
        await _context.SaveChangesAsync();
        return entry;
    }

    public async Task<List<TimeEntry>> GetTimeEntriesAsync(int tenantId, int? projectId = null, int? userId = null, DateTime? fromDate = null, DateTime? toDate = null)
    {
        var query = _context.TimeEntries
            .Include(t => t.Project)
            .Include(t => t.User)
            .Where(t => t.TenantId == tenantId);

        if (projectId.HasValue)
            query = query.Where(t => t.ProjectId == projectId.Value);

        if (userId.HasValue)
            query = query.Where(t => t.UserId == userId.Value);

        if (fromDate.HasValue)
            query = query.Where(t => t.EntryDate >= fromDate.Value);

        if (toDate.HasValue)
            query = query.Where(t => t.EntryDate <= toDate.Value);

        return await query.OrderByDescending(t => t.EntryDate).ToListAsync();
    }

    public async Task<TimeEntry?> GetTimeEntryByIdAsync(int id, int tenantId)
    {
        return await _context.TimeEntries
            .Include(t => t.Project)
            .Include(t => t.User)
            .Include(t => t.ApprovedBy)
            .FirstOrDefaultAsync(t => t.Id == id && t.TenantId == tenantId);
    }

    public async Task<TimeEntry> UpdateTimeEntryAsync(TimeEntry entry)
    {
        if (entry.IsBillable && entry.HourlyRate.HasValue)
        {
            entry.TotalAmount = entry.Hours * entry.HourlyRate.Value;
        }

        _context.TimeEntries.Update(entry);
        await _context.SaveChangesAsync();
        return entry;
    }

    public async Task<bool> ApproveTimeEntryAsync(int id, int approvedById, int tenantId)
    {
        var entry = await _context.TimeEntries
            .FirstOrDefaultAsync(t => t.Id == id && t.TenantId == tenantId);

        if (entry == null) return false;

        entry.Status = "Approved";
        entry.ApprovedById = approvedById;
        entry.ApprovedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> RejectTimeEntryAsync(int id, int tenantId, string? reason = null)
    {
        var entry = await _context.TimeEntries
            .FirstOrDefaultAsync(t => t.Id == id && t.TenantId == tenantId);

        if (entry == null) return false;

        entry.Status = "Rejected";
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<decimal> GetTotalBillableHoursAsync(int projectId, int tenantId)
    {
        return await _context.TimeEntries
            .Where(t => t.ProjectId == projectId 
                && t.TenantId == tenantId 
                && t.IsBillable 
                && t.Status == "Approved")
            .SumAsync(t => t.Hours);
    }

    public async Task<decimal> GetTotalBillableAmountAsync(int projectId, int tenantId)
    {
        return await _context.TimeEntries
            .Where(t => t.ProjectId == projectId 
                && t.TenantId == tenantId 
                && t.IsBillable 
                && t.Status == "Approved")
            .SumAsync(t => t.TotalAmount ?? 0);
    }
}

