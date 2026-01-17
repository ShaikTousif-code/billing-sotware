using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BillingAPI.Models;
using BillingAPI.Services;
using BillingAPI.DTOs;
using System.Security.Claims;

namespace BillingAPI.Controllers;

[ApiController]
[Route("api/time-tracking")]
[Authorize]
public class TimeTrackingController : ControllerBase
{
    private readonly ITimeTrackingService _timeTrackingService;

    public TimeTrackingController(ITimeTrackingService timeTrackingService)
    {
        _timeTrackingService = timeTrackingService;
    }

    [HttpPost]
    public async Task<IActionResult> CreateTimeEntry([FromBody] TimeEntry entry)
    {
        entry.TenantId = GetTenantId();
        entry.UserId = GetUserId();
        var created = await _timeTrackingService.CreateTimeEntryAsync(entry);
        return CreatedAtAction(nameof(GetTimeEntry), new { id = created.Id },
            ApiResponse<TimeEntry>.SuccessResponse(created, "Time entry created successfully"));
    }

    [HttpGet]
    public async Task<IActionResult> GetTimeEntries([FromQuery] int? projectId, [FromQuery] int? userId, [FromQuery] DateTime? fromDate, [FromQuery] DateTime? toDate)
    {
        var tenantId = GetTenantId();
        var entries = await _timeTrackingService.GetTimeEntriesAsync(tenantId, projectId, userId, fromDate, toDate);
        return Ok(ApiResponse<List<TimeEntry>>.SuccessResponse(entries));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetTimeEntry(int id)
    {
        var tenantId = GetTenantId();
        var entry = await _timeTrackingService.GetTimeEntryByIdAsync(id, tenantId);
        if (entry == null)
            return NotFound(ApiResponse<TimeEntry>.ErrorResponse("Time entry not found"));
        
        return Ok(ApiResponse<TimeEntry>.SuccessResponse(entry));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateTimeEntry(int id, [FromBody] TimeEntry entry)
    {
        var tenantId = GetTenantId();
        if (id != entry.Id || entry.TenantId != tenantId)
            return BadRequest(ApiResponse<TimeEntry>.ErrorResponse("Invalid entry data"));

        var updated = await _timeTrackingService.UpdateTimeEntryAsync(entry);
        return Ok(ApiResponse<TimeEntry>.SuccessResponse(updated, "Time entry updated successfully"));
    }

    [HttpPost("{id}/approve")]
    public async Task<IActionResult> ApproveTimeEntry(int id)
    {
        var tenantId = GetTenantId();
        var approved = await _timeTrackingService.ApproveTimeEntryAsync(id, GetUserId(), tenantId);
        if (!approved)
            return NotFound(ApiResponse<object>.ErrorResponse("Time entry not found"));
        
        return Ok(ApiResponse<object>.SuccessResponse(null, "Time entry approved"));
    }

    [HttpPost("{id}/reject")]
    public async Task<IActionResult> RejectTimeEntry(int id, [FromBody] RejectRequest? request)
    {
        var tenantId = GetTenantId();
        var rejected = await _timeTrackingService.RejectTimeEntryAsync(id, tenantId, request?.Reason);
        if (!rejected)
            return NotFound(ApiResponse<object>.ErrorResponse("Time entry not found"));
        
        return Ok(ApiResponse<object>.SuccessResponse(null, "Time entry rejected"));
    }

    [HttpGet("project/{projectId}/billable-hours")]
    public async Task<IActionResult> GetBillableHours(int projectId)
    {
        var tenantId = GetTenantId();
        var hours = await _timeTrackingService.GetTotalBillableHoursAsync(projectId, tenantId);
        return Ok(ApiResponse<decimal>.SuccessResponse(hours));
    }

    [HttpGet("project/{projectId}/billable-amount")]
    public async Task<IActionResult> GetBillableAmount(int projectId)
    {
        var tenantId = GetTenantId();
        var amount = await _timeTrackingService.GetTotalBillableAmountAsync(projectId, tenantId);
        return Ok(ApiResponse<decimal>.SuccessResponse(amount));
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

public class RejectRequest
{
    public string? Reason { get; set; }
}

