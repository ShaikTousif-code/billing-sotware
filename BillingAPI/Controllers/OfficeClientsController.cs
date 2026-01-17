using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BillingAPI.Models;
using Microsoft.EntityFrameworkCore;
using BillingAPI.Data;
using BillingAPI.DTOs;
using System.Security.Claims;

namespace BillingAPI.Controllers;

[ApiController]
[Route("api/office-clients")]
[Authorize]
public class OfficeClientsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public OfficeClientsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public async Task<IActionResult> GetClients([FromQuery] string? status, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var tenantId = GetTenantId();
        var query = _context.OfficeClients.Where(c => c.TenantId == tenantId);

        if (!string.IsNullOrEmpty(status))
            query = query.Where(c => c.Status == status);

        var totalCount = await query.CountAsync();
        var clients = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .OrderBy(c => c.CompanyName)
            .ToListAsync();

        var response = new PaginatedResponse<OfficeClient>
        {
            Data = clients,
            PageNumber = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };

        return Ok(ApiResponse<PaginatedResponse<OfficeClient>>.SuccessResponse(response));
    }

    [HttpPost]
    public async Task<IActionResult> CreateClient([FromBody] OfficeClient client)
    {
        if (string.IsNullOrEmpty(client.ClientCode))
        {
            client.ClientCode = await GenerateClientCodeAsync(client.TenantId);
        }

        client.TenantId = GetTenantId();
        client.CreatedAt = DateTime.UtcNow;
        _context.OfficeClients.Add(client);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetClients), new { id = client.Id },
            ApiResponse<OfficeClient>.SuccessResponse(client, "Client created successfully"));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateClient(int id, [FromBody] OfficeClient client)
    {
        var tenantId = GetTenantId();
        if (id != client.Id || client.TenantId != tenantId)
            return BadRequest(ApiResponse<OfficeClient>.ErrorResponse("Invalid client data"));

        client.UpdatedAt = DateTime.UtcNow;
        _context.OfficeClients.Update(client);
        await _context.SaveChangesAsync();
        return Ok(ApiResponse<OfficeClient>.SuccessResponse(client, "Client updated successfully"));
    }

    private async Task<string> GenerateClientCodeAsync(int tenantId)
    {
        var year = DateTime.UtcNow.Year;
        var lastClient = await _context.OfficeClients
            .Where(c => c.TenantId == tenantId && c.ClientCode.StartsWith($"CLT-{year}"))
            .OrderByDescending(c => c.ClientCode)
            .FirstOrDefaultAsync();

        int nextNumber = 1;
        if (lastClient != null)
        {
            var parts = lastClient.ClientCode.Split('-');
            if (parts.Length >= 3 && int.TryParse(parts[^1], out var lastNumber))
            {
                nextNumber = lastNumber + 1;
            }
        }

        return $"CLT-{year}-{nextNumber:D4}";
    }

    private int GetTenantId()
    {
        return int.Parse(User.FindFirst("TenantId")?.Value ?? "0");
    }
}

