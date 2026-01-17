using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BillingAPI.Models;
using Microsoft.EntityFrameworkCore;
using BillingAPI.Data;
using System.Security.Claims;

namespace BillingAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class JobCardsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public JobCardsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetJobCards([FromQuery] string? status)
    {
        var tenantId = GetTenantId();
        var query = _context.Set<JobCard>()
            .Include(jc => jc.Customer)
            .Include(jc => jc.AssignedTo)
            .Where(jc => jc.TenantId == tenantId);

        if (!string.IsNullOrEmpty(status))
            query = query.Where(jc => jc.Status == status);

        var jobCards = await query.OrderByDescending(jc => jc.CreatedAt).ToListAsync();
        return Ok(jobCards);
    }

    [HttpPost]
    public async Task<IActionResult> CreateJobCard([FromBody] JobCard jobCard)
    {
        jobCard.TenantId = GetTenantId();
        jobCard.CreatedAt = DateTime.UtcNow;

        if (string.IsNullOrEmpty(jobCard.JobCardNumber))
        {
            jobCard.JobCardNumber = await GenerateJobCardNumberAsync(jobCard.TenantId);
        }

        _context.Set<JobCard>().Add(jobCard);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetJobCards), new { id = jobCard.Id }, jobCard);
    }

    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateStatusRequest request)
    {
        var tenantId = GetTenantId();
        var jobCard = await _context.Set<JobCard>()
            .FirstOrDefaultAsync(jc => jc.Id == id && jc.TenantId == tenantId);

        if (jobCard == null) return NotFound();

        jobCard.Status = request.Status;
        if (request.Status == "Completed")
            jobCard.CompletedDate = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return Ok(jobCard);
    }

    private async Task<string> GenerateJobCardNumberAsync(int tenantId)
    {
        var year = DateTime.UtcNow.Year;
        var lastJobCard = await _context.Set<JobCard>()
            .Where(jc => jc.TenantId == tenantId && jc.JobCardNumber.StartsWith($"JC-{year}"))
            .OrderByDescending(jc => jc.JobCardNumber)
            .FirstOrDefaultAsync();

        int nextNumber = 1;
        if (lastJobCard != null)
        {
            var parts = lastJobCard.JobCardNumber.Split('-');
            if (parts.Length >= 3 && int.TryParse(parts[^1], out var lastNumber))
            {
                nextNumber = lastNumber + 1;
            }
        }

        return $"JC-{year}-{nextNumber:D6}";
    }

    private int GetTenantId()
    {
        return int.Parse(User.FindFirst("TenantId")?.Value ?? "0");
    }
}

public class UpdateStatusRequest
{
    public string Status { get; set; } = string.Empty;
}

