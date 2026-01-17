using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BillingAPI.Models;
using BillingAPI.DTOs;
using Microsoft.EntityFrameworkCore;
using BillingAPI.Data;
using System.Security.Claims;

namespace BillingAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AdvancedReportsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public AdvancedReportsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("fee-collection")]
    public async Task<IActionResult> GetFeeCollectionReport([FromQuery] DateTime? fromDate, [FromQuery] DateTime? toDate, [FromQuery] int? classId)
    {
        var tenantId = GetTenantId();
        var query = _context.FeePayments
            .Include(p => p.Student)
            .ThenInclude(s => s!.Class)
            .Where(p => p.TenantId == tenantId);

        if (fromDate.HasValue)
            query = query.Where(p => p.PaymentDate >= fromDate.Value);

        if (toDate.HasValue)
            query = query.Where(p => p.PaymentDate <= toDate.Value);

        if (classId.HasValue)
            query = query.Where(p => p.Student!.ClassId == classId.Value);

        var payments = await query.ToListAsync();

        var report = new
        {
            TotalCollection = payments.Sum(p => p.Amount),
            TotalPayments = payments.Count,
            CollectionByClass = payments
                .GroupBy(p => p.Student!.Class?.Name ?? "N/A")
                .Select(g => new { Class = g.Key, Amount = g.Sum(p => p.Amount), Count = g.Count() })
                .ToList(),
            CollectionByPaymentMode = payments
                .GroupBy(p => p.PaymentMode)
                .Select(g => new { Mode = g.Key, Amount = g.Sum(p => p.Amount), Count = g.Count() })
                .ToList(),
            DailyCollection = payments
                .GroupBy(p => p.PaymentDate.Date)
                .Select(g => new { Date = g.Key, Amount = g.Sum(p => p.Amount), Count = g.Count() })
                .OrderBy(x => x.Date)
                .ToList()
        };

        return Ok(ApiResponse<object>.SuccessResponse(report));
    }

    [HttpGet("outstanding-fees")]
    public async Task<IActionResult> GetOutstandingFeesReport([FromQuery] int? classId, [FromQuery] string? status)
    {
        var tenantId = GetTenantId();
        var query = _context.Fees
            .Include(f => f.Student)
            .ThenInclude(s => s!.Class)
            .Where(f => f.TenantId == tenantId && f.BalanceAmount > 0);

        if (classId.HasValue)
            query = query.Where(f => f.Student!.ClassId == classId.Value);

        if (!string.IsNullOrEmpty(status))
            query = query.Where(f => f.Status == status);

        var fees = await query.ToListAsync();

        var report = new
        {
            TotalOutstanding = fees.Sum(f => f.BalanceAmount),
            TotalFees = fees.Count,
            OutstandingByClass = fees
                .GroupBy(f => f.Student!.Class?.Name ?? "N/A")
                .Select(g => new { Class = g.Key, Amount = g.Sum(f => f.BalanceAmount), Count = g.Count() })
                .ToList(),
            OutstandingByStatus = fees
                .GroupBy(f => f.Status)
                .Select(g => new { Status = g.Key, Amount = g.Sum(f => f.BalanceAmount), Count = g.Count() })
                .ToList(),
            OverdueFees = fees.Where(f => f.DueDate < DateTime.UtcNow).Count(),
            OverdueAmount = fees.Where(f => f.DueDate < DateTime.UtcNow).Sum(f => f.BalanceAmount)
        };

        return Ok(ApiResponse<object>.SuccessResponse(report));
    }

    [HttpGet("project-profitability")]
    public async Task<IActionResult> GetProjectProfitabilityReport([FromQuery] int? projectId, [FromQuery] int? clientId)
    {
        var tenantId = GetTenantId();
        var query = _context.Projects
            .Include(p => p.Client)
            .Include(p => p.Invoices)
            .Include(p => p.Expenses)
            .Where(p => p.TenantId == tenantId);

        if (projectId.HasValue)
            query = query.Where(p => p.Id == projectId.Value);

        if (clientId.HasValue)
            query = query.Where(p => p.ClientId == clientId.Value);

        var projects = await query.ToListAsync();

        var report = projects.Select(p => new
        {
            ProjectId = p.Id,
            ProjectName = p.ProjectName,
            ProjectCode = p.ProjectCode,
            ClientName = p.Client?.CompanyName,
            Budget = p.Budget,
            BilledAmount = p.BilledAmount,
            TotalExpenses = p.Expenses.Sum(e => e.Amount),
            Profit = p.BilledAmount - p.Expenses.Sum(e => e.Amount),
            ProfitMargin = p.BilledAmount > 0 
                ? ((p.BilledAmount - p.Expenses.Sum(e => e.Amount)) / p.BilledAmount) * 100 
                : 0,
            Status = p.Status
        }).ToList();

        return Ok(ApiResponse<object>.SuccessResponse(report));
    }

    [HttpGet("client-revenue")]
    public async Task<IActionResult> GetClientRevenueReport([FromQuery] DateTime? fromDate, [FromQuery] DateTime? toDate)
    {
        var tenantId = GetTenantId();
        var query = _context.ProjectInvoices
            .Include(i => i.Client)
            .Where(i => i.TenantId == tenantId);

        if (fromDate.HasValue)
            query = query.Where(i => i.InvoiceDate >= fromDate.Value);

        if (toDate.HasValue)
            query = query.Where(i => i.InvoiceDate <= toDate.Value);

        var invoices = await query.ToListAsync();

        var report = new
        {
            TotalRevenue = invoices.Sum(i => i.TotalAmount),
            TotalInvoices = invoices.Count,
            ClientWiseRevenue = invoices
                .GroupBy(i => i.Client?.CompanyName ?? "N/A")
                .Select(g => new 
                { 
                    Client = g.Key, 
                    Revenue = g.Sum(i => i.TotalAmount), 
                    InvoiceCount = g.Count(),
                    PaidAmount = g.Sum(i => i.PaidAmount),
                    Outstanding = g.Sum(i => i.BalanceAmount)
                })
                .OrderByDescending(x => x.Revenue)
                .ToList()
        };

        return Ok(ApiResponse<object>.SuccessResponse(report));
    }

    [HttpGet("time-tracking")]
    public async Task<IActionResult> GetTimeTrackingReport([FromQuery] int? projectId, [FromQuery] int? userId, [FromQuery] DateTime? fromDate, [FromQuery] DateTime? toDate)
    {
        var tenantId = GetTenantId();
        var query = _context.TimeEntries
            .Include(t => t.Project)
            .Include(t => t.User)
            .Where(t => t.TenantId == tenantId && t.Status == "Approved");

        if (projectId.HasValue)
            query = query.Where(t => t.ProjectId == projectId.Value);

        if (userId.HasValue)
            query = query.Where(t => t.UserId == userId.Value);

        if (fromDate.HasValue)
            query = query.Where(t => t.EntryDate >= fromDate.Value);

        if (toDate.HasValue)
            query = query.Where(t => t.EntryDate <= toDate.Value);

        var entries = await query.ToListAsync();

        var report = new
        {
            TotalHours = entries.Sum(e => e.Hours),
            BillableHours = entries.Where(e => e.IsBillable).Sum(e => e.Hours),
            NonBillableHours = entries.Where(e => !e.IsBillable).Sum(e => e.Hours),
            TotalBillableAmount = entries.Where(e => e.IsBillable).Sum(e => e.TotalAmount ?? 0),
            ProjectWiseHours = entries
                .GroupBy(e => e.Project?.ProjectName ?? "N/A")
                .Select(g => new { Project = g.Key, Hours = g.Sum(e => e.Hours), Amount = g.Sum(e => e.TotalAmount ?? 0) })
                .ToList(),
            EmployeeWiseHours = entries
                .GroupBy(e => e.EmployeeName)
                .Select(g => new { Employee = g.Key, Hours = g.Sum(e => e.Hours), Amount = g.Sum(e => e.TotalAmount ?? 0) })
                .ToList()
        };

        return Ok(ApiResponse<object>.SuccessResponse(report));
    }

    private int GetTenantId()
    {
        return int.Parse(User.FindFirst("TenantId")?.Value ?? "0");
    }
}

