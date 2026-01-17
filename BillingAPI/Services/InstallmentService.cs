using Microsoft.EntityFrameworkCore;
using BillingAPI.Data;
using BillingAPI.Models;

namespace BillingAPI.Services;

public class InstallmentService : IInstallmentService
{
    private readonly ApplicationDbContext _context;

    public InstallmentService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<InstallmentPlan> CreateInstallmentPlanAsync(InstallmentPlan plan)
    {
        plan.CreatedAt = DateTime.UtcNow;
        plan.InstallmentAmount = plan.TotalAmount / plan.NumberOfInstallments;

        // Create installments
        var installments = new List<Installment>();
        var installmentDate = plan.StartDate;

        for (int i = 1; i <= plan.NumberOfInstallments; i++)
        {
            // Adjust installment date based on frequency
            if (i > 1)
            {
                installmentDate = plan.Frequency switch
                {
                    "Weekly" => installmentDate.AddDays(7),
                    "Monthly" => installmentDate.AddMonths(1),
                    "Quarterly" => installmentDate.AddMonths(3),
                    _ => installmentDate.AddMonths(1)
                };
            }

            // Last installment might have different amount due to rounding
            var amount = i == plan.NumberOfInstallments
                ? plan.TotalAmount - installments.Sum(inst => inst.Amount)
                : plan.InstallmentAmount;

            installments.Add(new Installment
            {
                InstallmentNumber = i,
                Amount = amount,
                DueDate = installmentDate,
                Status = "Pending"
            });
        }

        plan.Installments = installments;
        _context.InstallmentPlans.Add(plan);
        await _context.SaveChangesAsync();

        return plan;
    }

    public async Task<InstallmentPlan?> GetInstallmentPlanByIdAsync(int id, int tenantId)
    {
        return await _context.InstallmentPlans
            .Include(p => p.Student)
            .Include(p => p.Fee)
            .Include(p => p.Installments)
            .FirstOrDefaultAsync(p => p.Id == id && p.TenantId == tenantId);
    }

    public async Task<List<InstallmentPlan>> GetInstallmentPlansAsync(int tenantId, int? studentId = null)
    {
        var query = _context.InstallmentPlans
            .Include(p => p.Student)
            .Include(p => p.Fee)
            .Include(p => p.Installments)
            .Where(p => p.TenantId == tenantId);

        if (studentId.HasValue)
            query = query.Where(p => p.StudentId == studentId.Value);

        return await query.OrderByDescending(p => p.CreatedAt).ToListAsync();
    }

    public async Task<Installment> RecordInstallmentPaymentAsync(int installmentId, decimal amount, string paymentMode, string? transactionId = null)
    {
        var installment = await _context.Installments
            .Include(i => i.InstallmentPlan)
            .FirstOrDefaultAsync(i => i.Id == installmentId);

        if (installment == null)
            throw new Exception("Installment not found");

        installment.PaidAmount += amount;
        installment.PaidDate = DateTime.UtcNow;
        installment.Status = installment.PaidAmount >= installment.Amount ? "Paid" : "Partial";
        installment.PaymentReference = transactionId;

        // Update installment plan status
        var plan = installment.InstallmentPlan;
        if (plan != null)
        {
            var allPaid = plan.Installments.All(i => i.Status == "Paid");
            if (allPaid)
            {
                plan.Status = "Completed";
            }
        }

        // Update fee payment
        if (plan?.FeeId != null)
        {
            var fee = await _context.Fees.FindAsync(plan.FeeId);
            if (fee != null)
            {
                fee.PaidAmount += amount;
                fee.BalanceAmount = fee.NetAmount - fee.PaidAmount;
                fee.Status = fee.BalanceAmount <= 0 ? "Paid" : fee.BalanceAmount < fee.NetAmount ? "Partial" : "Pending";
            }
        }

        await _context.SaveChangesAsync();
        return installment;
    }

    public async Task<bool> CancelInstallmentPlanAsync(int id, int tenantId)
    {
        var plan = await _context.InstallmentPlans
            .FirstOrDefaultAsync(p => p.Id == id && p.TenantId == tenantId);

        if (plan == null) return false;

        plan.Status = "Cancelled";
        await _context.SaveChangesAsync();
        return true;
    }
}

