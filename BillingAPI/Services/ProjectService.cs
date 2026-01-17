using Microsoft.EntityFrameworkCore;
using BillingAPI.Data;
using BillingAPI.Models;

namespace BillingAPI.Services;

public class ProjectService : IProjectService
{
    private readonly ApplicationDbContext _context;

    public ProjectService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<Project>> GetProjectsAsync(int tenantId, int? clientId = null, string? status = null)
    {
        var query = _context.Projects
            .Include(p => p.Client)
            .Where(p => p.TenantId == tenantId);

        if (clientId.HasValue)
            query = query.Where(p => p.ClientId == clientId.Value);

        if (!string.IsNullOrEmpty(status))
            query = query.Where(p => p.Status == status);

        return await query.OrderByDescending(p => p.CreatedAt).ToListAsync();
    }

    public async Task<Project?> GetProjectByIdAsync(int id, int tenantId)
    {
        return await _context.Projects
            .Include(p => p.Client)
            .Include(p => p.Invoices)
            .Include(p => p.Expenses)
            .FirstOrDefaultAsync(p => p.Id == id && p.TenantId == tenantId);
    }

    public async Task<Project> CreateProjectAsync(Project project)
    {
        if (string.IsNullOrEmpty(project.ProjectCode))
        {
            project.ProjectCode = await GenerateProjectCodeAsync(project.TenantId);
        }

        project.CreatedAt = DateTime.UtcNow;
        project.BalanceAmount = project.Budget - project.PaidAmount;

        _context.Projects.Add(project);
        await _context.SaveChangesAsync();
        return project;
    }

    public async Task<Project> UpdateProjectAsync(Project project)
    {
        project.UpdatedAt = DateTime.UtcNow;
        project.BalanceAmount = project.Budget - project.PaidAmount;

        _context.Projects.Update(project);
        await _context.SaveChangesAsync();
        return project;
    }

    public async Task<bool> DeleteProjectAsync(int id, int tenantId)
    {
        var project = await _context.Projects
            .FirstOrDefaultAsync(p => p.Id == id && p.TenantId == tenantId);

        if (project == null) return false;

        _context.Projects.Remove(project);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<string> GenerateProjectCodeAsync(int tenantId)
    {
        var year = DateTime.UtcNow.Year;
        var lastProject = await _context.Projects
            .Where(p => p.TenantId == tenantId && p.ProjectCode.StartsWith($"PRJ-{year}"))
            .OrderByDescending(p => p.ProjectCode)
            .FirstOrDefaultAsync();

        int nextNumber = 1;
        if (lastProject != null)
        {
            var parts = lastProject.ProjectCode.Split('-');
            if (parts.Length >= 3 && int.TryParse(parts[^1], out var lastNumber))
            {
                nextNumber = lastNumber + 1;
            }
        }

        return $"PRJ-{year}-{nextNumber:D4}";
    }

    public async Task<ProjectInvoice> CreateProjectInvoiceAsync(ProjectInvoice invoice)
    {
        if (string.IsNullOrEmpty(invoice.InvoiceNumber))
        {
            invoice.InvoiceNumber = await GenerateInvoiceNumberAsync(invoice.TenantId);
        }

        invoice.CreatedAt = DateTime.UtcNow;
        invoice.BalanceAmount = invoice.TotalAmount - invoice.PaidAmount;
        invoice.Status = invoice.BalanceAmount <= 0 ? "Paid" : "Sent";

        _context.ProjectInvoices.Add(invoice);

        // Update project
        var project = await _context.Projects.FindAsync(invoice.ProjectId);
        if (project != null)
        {
            project.BilledAmount += invoice.TotalAmount;
            project.BalanceAmount = project.Budget - project.PaidAmount;
        }

        await _context.SaveChangesAsync();
        return invoice;
    }

    public async Task<ProjectExpense> AddProjectExpenseAsync(ProjectExpense expense)
    {
        expense.CreatedAt = DateTime.UtcNow;
        _context.ProjectExpenses.Add(expense);
        await _context.SaveChangesAsync();
        return expense;
    }

    private async Task<string> GenerateInvoiceNumberAsync(int tenantId)
    {
        var year = DateTime.UtcNow.Year;
        var lastInvoice = await _context.ProjectInvoices
            .Where(i => i.TenantId == tenantId && i.InvoiceNumber.StartsWith($"INV-{year}"))
            .OrderByDescending(i => i.InvoiceNumber)
            .FirstOrDefaultAsync();

        int nextNumber = 1;
        if (lastInvoice != null)
        {
            var parts = lastInvoice.InvoiceNumber.Split('-');
            if (parts.Length >= 3 && int.TryParse(parts[^1], out var lastNumber))
            {
                nextNumber = lastNumber + 1;
            }
        }

        return $"INV-{year}-{nextNumber:D6}";
    }
}

