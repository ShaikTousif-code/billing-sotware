using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BillingAPI.Models;
using BillingAPI.Services;
using System.Security.Claims;

namespace BillingAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CreditNotesController : ControllerBase
{
    private readonly ICreditNoteService _creditNoteService;

    public CreditNotesController(ICreditNoteService creditNoteService)
    {
        _creditNoteService = creditNoteService;
    }

    [HttpGet]
    public async Task<IActionResult> GetCreditNotes([FromQuery] int? invoiceId)
    {
        var tenantId = GetTenantId();
        var creditNotes = await _creditNoteService.GetCreditNotesAsync(tenantId, invoiceId);
        return Ok(creditNotes);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetCreditNote(int id)
    {
        var tenantId = GetTenantId();
        var creditNote = await _creditNoteService.GetCreditNoteByIdAsync(id, tenantId);
        if (creditNote == null) return NotFound();
        return Ok(creditNote);
    }

    [HttpPost]
    public async Task<IActionResult> CreateCreditNote([FromBody] CreditNote creditNote)
    {
        creditNote.TenantId = GetTenantId();
        creditNote.CreatedById = GetUserId();
        creditNote.CreditNoteDate = DateTime.UtcNow;

        var created = await _creditNoteService.CreateCreditNoteAsync(creditNote);
        return CreatedAtAction(nameof(GetCreditNote), new { id = created.Id }, created);
    }

    [HttpPost("{id}/process")]
    public async Task<IActionResult> ProcessCreditNote(int id)
    {
        var tenantId = GetTenantId();
        var processed = await _creditNoteService.ProcessCreditNoteAsync(id, tenantId);
        if (!processed) return NotFound();
        return Ok(new { message = "Credit note processed successfully" });
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

