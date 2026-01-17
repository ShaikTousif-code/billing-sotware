using Microsoft.EntityFrameworkCore;
using BillingAPI.Data;
using BillingAPI.Models;

namespace BillingAPI.Services;

public class FeeConcessionService : IFeeConcessionService
{
    private readonly ApplicationDbContext _context;

    public FeeConcessionService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<FeeConcession> RequestConcessionAsync(FeeConcession concession)
    {
        concession.Status = "Pending";
        concession.CreatedAt = DateTime.UtcNow;
        _context.FeeConcessions.Add(concession);
        await _context.SaveChangesAsync();
        return concession;
    }

    public async Task<bool> ApproveConcessionAsync(int id, int approvedById, int tenantId, string? notes = null)
    {
        var concession = await _context.FeeConcessions
            .FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId);

        if (concession == null) return false;

        concession.Status = "Approved";
        concession.ApprovedById = approvedById;
        concession.ApprovedAt = DateTime.UtcNow;
        concession.ApprovalNotes = notes;

        // Apply concession to fee if specified
        if (concession.FeeId.HasValue)
        {
            await ApplyConcessionToFeeAsync(id, concession.FeeId.Value, tenantId);
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> RejectConcessionAsync(int id, int tenantId, string? reason = null)
    {
        var concession = await _context.FeeConcessions
            .FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId);

        if (concession == null) return false;

        concession.Status = "Rejected";
        concession.ApprovalNotes = reason;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<FeeConcession>> GetConcessionsAsync(int tenantId, int? studentId = null, string? status = null)
    {
        var query = _context.FeeConcessions
            .AsNoTracking() // Improve performance and avoid tracking issues
            .Include(c => c.Student)
            .Include(c => c.Fee)
            .Include(c => c.RequestedBy)
            .Include(c => c.ApprovedBy)
            .Where(c => c.TenantId == tenantId);

        if (studentId.HasValue)
            query = query.Where(c => c.StudentId == studentId.Value);

        if (!string.IsNullOrEmpty(status))
            query = query.Where(c => c.Status == status);

        return await query.OrderByDescending(c => c.CreatedAt).ToListAsync();
    }

    public async Task<FeeConcession?> GetConcessionByIdAsync(int id, int tenantId)
    {
        return await _context.FeeConcessions
            .Include(c => c.Student)
            .Include(c => c.Fee)
            .Include(c => c.RequestedBy)
            .Include(c => c.ApprovedBy)
            .FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId);
    }

    public async Task ApplyConcessionToFeeAsync(int concessionId, int feeId, int tenantId)
    {
        var concession = await _context.FeeConcessions
            .FirstOrDefaultAsync(c => c.Id == concessionId && c.TenantId == tenantId);

        var fee = await _context.Fees
            .FirstOrDefaultAsync(f => f.Id == feeId && f.TenantId == tenantId);

        if (concession == null || fee == null) return;

        decimal discountAmount = 0;
        if (concession.Percentage.HasValue)
        {
            discountAmount = fee.Amount * (concession.Percentage.Value / 100);
        }
        else
        {
            discountAmount = concession.Amount;
        }

        fee.DiscountAmount += discountAmount;
        fee.NetAmount = fee.Amount - fee.DiscountAmount - fee.ScholarshipAmount;
        fee.BalanceAmount = fee.NetAmount - fee.PaidAmount;

        await _context.SaveChangesAsync();
    }
}

