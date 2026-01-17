using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BillingAPI.Models;
using BillingAPI.Services;
using BillingAPI.DTOs;
using Microsoft.EntityFrameworkCore;
using BillingAPI.Data;
using System.Security.Claims;

namespace BillingAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FeeRemindersController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly INotificationService _notificationService;

    public FeeRemindersController(ApplicationDbContext context, INotificationService notificationService)
    {
        _context = context;
        _notificationService = notificationService;
    }

    [HttpPost("send-overdue")]
    public async Task<IActionResult> SendOverdueReminders([FromQuery] int? daysOverdue = null)
    {
        var tenantId = GetTenantId();
        var cutoffDate = DateTime.UtcNow.AddDays(-(daysOverdue ?? 7));

        var overdueFees = await _context.Fees
            .Include(f => f.Student)
            .Where(f => f.TenantId == tenantId
                && f.Status != "Paid"
                && f.DueDate < cutoffDate
                && f.BalanceAmount > 0)
            .ToListAsync();

        var sentCount = 0;
        foreach (var fee in overdueFees)
        {
            if (fee.Student != null)
            {
                await _notificationService.SendFeeReminderAsync(
                    tenantId,
                    fee.StudentId,
                    fee.Id,
                    fee.BalanceAmount,
                    fee.DueDate
                );
                sentCount++;
            }
        }

        return Ok(ApiResponse<object>.SuccessResponse(
            new { sentCount, totalOverdue = overdueFees.Count },
            $"Sent {sentCount} reminder(s)"
        ));
    }

    [HttpPost("send-upcoming")]
    public async Task<IActionResult> SendUpcomingReminders([FromQuery] int daysAhead = 7)
    {
        var tenantId = GetTenantId();
        var fromDate = DateTime.UtcNow;
        var toDate = DateTime.UtcNow.AddDays(daysAhead);

        var upcomingFees = await _context.Fees
            .Include(f => f.Student)
            .Where(f => f.TenantId == tenantId
                && f.Status == "Pending"
                && f.DueDate >= fromDate
                && f.DueDate <= toDate
                && f.BalanceAmount > 0)
            .ToListAsync();

        var sentCount = 0;
        foreach (var fee in upcomingFees)
        {
            if (fee.Student != null)
            {
                await _notificationService.SendFeeReminderAsync(
                    tenantId,
                    fee.StudentId,
                    fee.Id,
                    fee.BalanceAmount,
                    fee.DueDate
                );
                sentCount++;
            }
        }

        return Ok(ApiResponse<object>.SuccessResponse(
            new { sentCount, totalUpcoming = upcomingFees.Count },
            $"Sent {sentCount} reminder(s)"
        ));
    }

    [HttpGet("overdue")]
    public async Task<IActionResult> GetOverdueFees([FromQuery] int? daysOverdue = null)
    {
        var tenantId = GetTenantId();
        var cutoffDate = DateTime.UtcNow.AddDays(-(daysOverdue ?? 7));

        var overdueFees = await _context.Fees
            .Include(f => f.Student)
            .ThenInclude(s => s!.Class)
            .Where(f => f.TenantId == tenantId
                && f.Status != "Paid"
                && f.DueDate < cutoffDate
                && f.BalanceAmount > 0)
            .OrderBy(f => f.DueDate)
            .ToListAsync();

        return Ok(ApiResponse<List<Fee>>.SuccessResponse(overdueFees));
    }

    private int GetTenantId()
    {
        return int.Parse(User.FindFirst("TenantId")?.Value ?? "0");
    }
}

