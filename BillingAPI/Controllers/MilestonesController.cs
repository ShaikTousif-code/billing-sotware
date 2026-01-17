using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BillingAPI.Models;
using BillingAPI.Services;
using BillingAPI.DTOs;
using System.Security.Claims;

namespace BillingAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MilestonesController : ControllerBase
{
    private readonly IMilestoneService _milestoneService;

    public MilestonesController(IMilestoneService milestoneService)
    {
        _milestoneService = milestoneService;
    }

    [HttpPost]
    public async Task<IActionResult> CreateMilestone([FromBody] Milestone milestone)
    {
        milestone.TenantId = GetTenantId();
        milestone.CreatedById = GetUserId();
        var created = await _milestoneService.CreateMilestoneAsync(milestone);
        return CreatedAtAction(nameof(GetMilestone), new { id = created.Id },
            ApiResponse<Milestone>.SuccessResponse(created, "Milestone created successfully"));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetMilestone(int id)
    {
        var tenantId = GetTenantId();
        var milestone = await _milestoneService.GetMilestoneByIdAsync(id, tenantId);
        if (milestone == null)
            return NotFound(ApiResponse<Milestone>.ErrorResponse("Milestone not found"));
        
        return Ok(ApiResponse<Milestone>.SuccessResponse(milestone));
    }

    [HttpGet]
    public async Task<IActionResult> GetMilestones([FromQuery] int? projectId)
    {
        var tenantId = GetTenantId();
        var milestones = await _milestoneService.GetMilestonesAsync(tenantId, projectId);
        return Ok(ApiResponse<List<Milestone>>.SuccessResponse(milestones));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateMilestone(int id, [FromBody] Milestone milestone)
    {
        var tenantId = GetTenantId();
        if (id != milestone.Id || milestone.TenantId != tenantId)
            return BadRequest(ApiResponse<Milestone>.ErrorResponse("Invalid milestone data"));

        var updated = await _milestoneService.UpdateMilestoneAsync(milestone);
        return Ok(ApiResponse<Milestone>.SuccessResponse(updated, "Milestone updated successfully"));
    }

    [HttpPost("{id}/complete")]
    public async Task<IActionResult> MarkComplete(int id)
    {
        var tenantId = GetTenantId();
        var completed = await _milestoneService.MarkMilestoneCompleteAsync(id, tenantId);
        if (!completed)
            return NotFound(ApiResponse<object>.ErrorResponse("Milestone not found"));
        
        return Ok(ApiResponse<object>.SuccessResponse(null, "Milestone marked as complete"));
    }

    [HttpPost("{id}/deliverable")]
    public async Task<IActionResult> AddDeliverable(int id, [FromBody] Deliverable deliverable)
    {
        deliverable.MilestoneId = id;
        var created = await _milestoneService.AddDeliverableAsync(deliverable);
        return CreatedAtAction(nameof(GetMilestone), new { id },
            ApiResponse<Deliverable>.SuccessResponse(created, "Deliverable added successfully"));
    }

    [HttpPost("{id}/link-invoice")]
    public async Task<IActionResult> LinkToInvoice(int id, [FromBody] LinkInvoiceRequest request)
    {
        var tenantId = GetTenantId();
        var linked = await _milestoneService.LinkMilestoneToInvoiceAsync(id, request.InvoiceId, tenantId);
        if (!linked)
            return NotFound(ApiResponse<object>.ErrorResponse("Milestone not found"));
        
        return Ok(ApiResponse<object>.SuccessResponse(null, "Milestone linked to invoice"));
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

public class LinkInvoiceRequest
{
    public int InvoiceId { get; set; }
}

