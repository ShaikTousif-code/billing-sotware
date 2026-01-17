using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BillingAPI.Services;
using BillingAPI.Models;
using BillingAPI.DTOs;
using System.Security.Claims;

namespace BillingAPI.Controllers;

[ApiController]
[Route("api/contact")]
[Authorize]
public class ContactController : ControllerBase
{
    private readonly ISupportTicketService _supportTicketService;

    public ContactController(ISupportTicketService supportTicketService)
    {
        _supportTicketService = supportTicketService;
    }

    [HttpPost("submit-issue")]
    public async Task<IActionResult> SubmitIssue([FromBody] SubmitIssueDto dto)
    {
        try
        {
            var tenantId = GetTenantId();
            var userId = GetUserId();

            var ticket = new SupportTicket
            {
                TenantId = tenantId,
                UserId = userId,
                Subject = dto.Subject,
                Description = dto.Description,
                Email = dto.Email,
                Phone = dto.Phone,
                Priority = dto.Priority,
                Status = "Open"
            };

            var createdTicket = await _supportTicketService.CreateSupportTicketAsync(ticket);

            return Ok(ApiResponse<SupportTicket>.SuccessResponse(
                createdTicket,
                "Your issue has been submitted successfully. Ticket number: " + createdTicket.TicketNumber
            ));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<object>.ErrorResponse($"Failed to submit issue: {ex.Message}"));
        }
    }

    [HttpGet("tickets")]
    public async Task<IActionResult> GetTickets([FromQuery] string? status)
    {
        try
        {
            var tenantId = GetTenantId();
            var tickets = await _supportTicketService.GetSupportTicketsAsync(tenantId, status);
            return Ok(ApiResponse<List<SupportTicket>>.SuccessResponse(tickets));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<object>.ErrorResponse($"Failed to fetch tickets: {ex.Message}"));
        }
    }

    [HttpGet("tickets/{id}")]
    public async Task<IActionResult> GetTicket(int id)
    {
        try
        {
            var tenantId = GetTenantId();
            var ticket = await _supportTicketService.GetSupportTicketByIdAsync(id, tenantId);
            
            if (ticket == null)
                return NotFound(ApiResponse<SupportTicket>.ErrorResponse("Ticket not found"));

            return Ok(ApiResponse<SupportTicket>.SuccessResponse(ticket));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<object>.ErrorResponse($"Failed to fetch ticket: {ex.Message}"));
        }
    }

    private int GetTenantId()
    {
        return int.Parse(User.FindFirst("TenantId")?.Value ?? "0");
    }

    private int GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(userIdClaim, out var userId) ? userId : 0;
    }
}

