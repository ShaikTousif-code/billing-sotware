using Microsoft.EntityFrameworkCore;
using BillingAPI.Data;
using BillingAPI.Models;

namespace BillingAPI.Services;

public class MilestoneService : IMilestoneService
{
    private readonly ApplicationDbContext _context;

    public MilestoneService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Milestone> CreateMilestoneAsync(Milestone milestone)
    {
        milestone.CreatedAt = DateTime.UtcNow;
        _context.Milestones.Add(milestone);
        await _context.SaveChangesAsync();
        return milestone;
    }

    public async Task<Milestone?> GetMilestoneByIdAsync(int id, int tenantId)
    {
        return await _context.Milestones
            .Include(m => m.Project)
            .Include(m => m.Invoice)
            .Include(m => m.Deliverables)
            .Include(m => m.CreatedBy)
            .FirstOrDefaultAsync(m => m.Id == id && m.TenantId == tenantId);
    }

    public async Task<List<Milestone>> GetMilestonesAsync(int tenantId, int? projectId = null)
    {
        var query = _context.Milestones
            .Include(m => m.Project)
            .Include(m => m.Deliverables)
            .Where(m => m.TenantId == tenantId);

        if (projectId.HasValue)
            query = query.Where(m => m.ProjectId == projectId.Value);

        return await query.OrderBy(m => m.TargetDate).ToListAsync();
    }

    public async Task<Milestone> UpdateMilestoneAsync(Milestone milestone)
    {
        milestone.UpdatedAt = DateTime.UtcNow;
        _context.Milestones.Update(milestone);
        await _context.SaveChangesAsync();
        return milestone;
    }

    public async Task<bool> MarkMilestoneCompleteAsync(int id, int tenantId)
    {
        var milestone = await _context.Milestones
            .FirstOrDefaultAsync(m => m.Id == id && m.TenantId == tenantId);

        if (milestone == null) return false;

        milestone.Status = "Completed";
        milestone.CompletedDate = DateTime.UtcNow;
        milestone.PercentageComplete = 100;
        milestone.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<Deliverable> AddDeliverableAsync(Deliverable deliverable)
    {
        _context.Deliverables.Add(deliverable);
        await _context.SaveChangesAsync();
        return deliverable;
    }

    public async Task<bool> LinkMilestoneToInvoiceAsync(int milestoneId, int invoiceId, int tenantId)
    {
        var milestone = await _context.Milestones
            .FirstOrDefaultAsync(m => m.Id == milestoneId && m.TenantId == tenantId);

        if (milestone == null) return false;

        milestone.InvoiceId = invoiceId;
        milestone.IsBilled = true;
        milestone.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }
}

