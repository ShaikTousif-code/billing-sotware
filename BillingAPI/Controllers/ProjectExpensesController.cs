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
public class ProjectExpensesController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public ProjectExpensesController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetExpenses([FromQuery] int? projectId, [FromQuery] string? status)
    {
        var tenantId = GetTenantId();
        var query = _context.ProjectExpenses
            .Include(e => e.Project)
            .Include(e => e.CreatedBy)
            .Where(e => e.TenantId == tenantId);

        if (projectId.HasValue)
            query = query.Where(e => e.ProjectId == projectId.Value);

        if (!string.IsNullOrEmpty(status))
            query = query.Where(e => e.Status == status);

        var expenses = await query.OrderByDescending(e => e.ExpenseDate).ToListAsync();
        return Ok(ApiResponse<List<ProjectExpense>>.SuccessResponse(expenses));
    }

    [HttpPost]
    public async Task<IActionResult> CreateExpense([FromBody] ProjectExpense expense)
    {
        expense.TenantId = GetTenantId();
        expense.CreatedById = GetUserId();
        expense.Status = "Pending";
        expense.CreatedAt = DateTime.UtcNow;

        _context.ProjectExpenses.Add(expense);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetExpenses), new { id = expense.Id },
            ApiResponse<ProjectExpense>.SuccessResponse(expense, "Expense created successfully"));
    }

    [HttpPost("{id}/approve")]
    public async Task<IActionResult> ApproveExpense(int id, [FromBody] ApprovalRequest? request)
    {
        var tenantId = GetTenantId();
        var expense = await _context.ProjectExpenses
            .FirstOrDefaultAsync(e => e.Id == id && e.TenantId == tenantId);

        if (expense == null)
            return NotFound(ApiResponse<object>.ErrorResponse("Expense not found"));

        expense.Status = "Approved";
        if (!string.IsNullOrEmpty(request?.Notes))
            expense.Notes = request.Notes;

        await _context.SaveChangesAsync();
        return Ok(ApiResponse<object>.SuccessResponse(null, "Expense approved"));
    }

    [HttpPost("{id}/reject")]
    public async Task<IActionResult> RejectExpense(int id, [FromBody] RejectionRequest request)
    {
        var tenantId = GetTenantId();
        var expense = await _context.ProjectExpenses
            .FirstOrDefaultAsync(e => e.Id == id && e.TenantId == tenantId);

        if (expense == null)
            return NotFound(ApiResponse<object>.ErrorResponse("Expense not found"));

        expense.Status = "Rejected";
        if (!string.IsNullOrEmpty(request.Reason))
            expense.Notes = request.Reason;

        await _context.SaveChangesAsync();
        return Ok(ApiResponse<object>.SuccessResponse(null, "Expense rejected"));
    }

    [HttpPost("{id}/mark-paid")]
    public async Task<IActionResult> MarkPaid(int id)
    {
        var tenantId = GetTenantId();
        var expense = await _context.ProjectExpenses
            .FirstOrDefaultAsync(e => e.Id == id && e.TenantId == tenantId);

        if (expense == null)
            return NotFound(ApiResponse<object>.ErrorResponse("Expense not found"));

        if (expense.Status != "Approved")
            return BadRequest(ApiResponse<object>.ErrorResponse("Only approved expenses can be marked as paid"));

        expense.Status = "Paid";
        await _context.SaveChangesAsync();
        return Ok(ApiResponse<object>.SuccessResponse(null, "Expense marked as paid"));
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetExpenseSummary([FromQuery] int? projectId, [FromQuery] DateTime? fromDate, [FromQuery] DateTime? toDate)
    {
        var tenantId = GetTenantId();
        var query = _context.ProjectExpenses.Where(e => e.TenantId == tenantId);

        if (projectId.HasValue)
            query = query.Where(e => e.ProjectId == projectId.Value);

        if (fromDate.HasValue)
            query = query.Where(e => e.ExpenseDate >= fromDate.Value);

        if (toDate.HasValue)
            query = query.Where(e => e.ExpenseDate <= toDate.Value);

        var expenses = await query.ToListAsync();

        var summary = new
        {
            TotalExpenses = expenses.Sum(e => e.Amount),
            PendingAmount = expenses.Where(e => e.Status == "Pending").Sum(e => e.Amount),
            ApprovedAmount = expenses.Where(e => e.Status == "Approved").Sum(e => e.Amount),
            PaidAmount = expenses.Where(e => e.Status == "Paid").Sum(e => e.Amount),
            RejectedAmount = expenses.Where(e => e.Status == "Rejected").Sum(e => e.Amount),
            ExpenseByType = expenses
                .GroupBy(e => e.ExpenseType)
                .Select(g => new { Type = g.Key, Amount = g.Sum(e => e.Amount), Count = g.Count() })
                .ToList()
        };

        return Ok(ApiResponse<object>.SuccessResponse(summary));
    }

    private int GetTenantId()
    {
        return int.Parse(User.FindFirst("TenantId")?.Value ?? "0");
    }

    private int GetUserId()
    {
        return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
    }
}

