using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BillingAPI.Services;
using BillingAPI.DTOs;
using System.Security.Claims;
using BillingAPI.Models;

namespace BillingAPI.Controllers;

[ApiController]
[Route("api/activity-logs")]
[Authorize]
public class ActivityLogsController : ControllerBase
{
    private readonly IActivityLogService _activityLogService;

    public ActivityLogsController(IActivityLogService activityLogService)
    {
        _activityLogService = activityLogService;
    }

    [HttpGet]
    public async Task<IActionResult> GetActivityLogs(
        [FromQuery] string? entityType, 
        [FromQuery] int? entityId,
        [FromQuery] int? userId,
        [FromQuery] string? action,
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        var tenantId = GetTenantId();
        var logs = await _activityLogService.GetActivityLogsAsync(
            tenantId, 
            entityType, 
            entityId,
            userId,
            action,
            fromDate,
            toDate,
            page,
            pageSize);
        return Ok(ApiResponse<PaginatedResponse<ActivityLog>>.SuccessResponse(logs));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetActivityLog(int id)
    {
        var tenantId = GetTenantId();
        var log = await _activityLogService.GetActivityLogByIdAsync(id, tenantId);
        if (log == null)
            return NotFound(ApiResponse<ActivityLog>.ErrorResponse("Activity log not found"));
        
        return Ok(ApiResponse<ActivityLog>.SuccessResponse(log));
    }

    [HttpGet("user/{userId}")]
    public async Task<IActionResult> GetUserActivityLogs(
        int userId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        var tenantId = GetTenantId();
        var logs = await _activityLogService.GetUserActivityLogsAsync(tenantId, userId, page, pageSize);
        return Ok(ApiResponse<PaginatedResponse<ActivityLog>>.SuccessResponse(logs));
    }

    private int GetTenantId()
    {
        return int.Parse(User.FindFirst("TenantId")?.Value ?? "0");
    }
}

