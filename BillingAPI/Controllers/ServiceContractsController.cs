using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BillingAPI.Models;
using Microsoft.EntityFrameworkCore;
using BillingAPI.Data;
using BillingAPI.DTOs;
using System.Security.Claims;

namespace BillingAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ServiceContractsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public ServiceContractsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetContracts([FromQuery] int? clientId, [FromQuery] string? status)
    {
        var tenantId = GetTenantId();
        var query = _context.ServiceContracts
            .Include(c => c.Client)
            .Where(c => c.TenantId == tenantId);

        if (clientId.HasValue)
            query = query.Where(c => c.ClientId == clientId.Value);

        if (!string.IsNullOrEmpty(status))
            query = query.Where(c => c.Status == status);

        var contracts = await query.OrderByDescending(c => c.CreatedAt).ToListAsync();
        return Ok(ApiResponse<List<ServiceContract>>.SuccessResponse(contracts));
    }

    [HttpPost]
    public async Task<IActionResult> CreateContract([FromBody] ServiceContract contract)
    {
        if (string.IsNullOrEmpty(contract.ContractNumber))
        {
            contract.ContractNumber = await GenerateContractNumberAsync(contract.TenantId);
        }

        contract.TenantId = GetTenantId();
        contract.CreatedAt = DateTime.UtcNow;
        _context.ServiceContracts.Add(contract);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetContracts), new { id = contract.Id },
            ApiResponse<ServiceContract>.SuccessResponse(contract, "Contract created successfully"));
    }

    [HttpPost("{id}/generate-invoice")]
    public async Task<IActionResult> GenerateInvoice(int id, [FromBody] GenerateContractInvoiceRequest request)
    {
        var tenantId = GetTenantId();
        var contract = await _context.ServiceContracts
            .FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId);

        if (contract == null)
            return NotFound(ApiResponse<object>.ErrorResponse("Contract not found"));

        var invoice = new ContractInvoice
        {
            TenantId = tenantId,
            ContractId = id,
            ClientId = contract.ClientId,
            InvoiceNumber = await GenerateInvoiceNumberAsync(tenantId),
            InvoiceDate = DateTime.UtcNow,
            DueDate = request.DueDate,
            Period = request.Period,
            Amount = contract.MonthlyAmount,
            TaxAmount = contract.MonthlyAmount * 0.18m, // 18% GST
            TotalAmount = contract.MonthlyAmount * 1.18m,
            BalanceAmount = contract.MonthlyAmount * 1.18m,
            Status = "Pending",
            CreatedAt = DateTime.UtcNow
        };

        _context.ContractInvoices.Add(invoice);
        await _context.SaveChangesAsync();
        return Ok(ApiResponse<ContractInvoice>.SuccessResponse(invoice, "Invoice generated successfully"));
    }

    private async Task<string> GenerateContractNumberAsync(int tenantId)
    {
        var year = DateTime.UtcNow.Year;
        var lastContract = await _context.ServiceContracts
            .Where(c => c.TenantId == tenantId && c.ContractNumber.StartsWith($"CNT-{year}"))
            .OrderByDescending(c => c.ContractNumber)
            .FirstOrDefaultAsync();

        int nextNumber = 1;
        if (lastContract != null)
        {
            var parts = lastContract.ContractNumber.Split('-');
            if (parts.Length >= 3 && int.TryParse(parts[^1], out var lastNumber))
            {
                nextNumber = lastNumber + 1;
            }
        }

        return $"CNT-{year}-{nextNumber:D4}";
    }

    private async Task<string> GenerateInvoiceNumberAsync(int tenantId)
    {
        var year = DateTime.UtcNow.Year;
        var lastInvoice = await _context.ContractInvoices
            .Where(i => i.TenantId == tenantId && i.InvoiceNumber.StartsWith($"CNT-INV-{year}"))
            .OrderByDescending(i => i.InvoiceNumber)
            .FirstOrDefaultAsync();

        int nextNumber = 1;
        if (lastInvoice != null)
        {
            var parts = lastInvoice.InvoiceNumber.Split('-');
            if (parts.Length >= 4 && int.TryParse(parts[^1], out var lastNumber))
            {
                nextNumber = lastNumber + 1;
            }
        }

        return $"CNT-INV-{year}-{nextNumber:D6}";
    }

    private int GetTenantId()
    {
        return int.Parse(User.FindFirst("TenantId")?.Value ?? "0");
    }
}

public class GenerateContractInvoiceRequest
{
    public string Period { get; set; } = string.Empty;
    public DateTime DueDate { get; set; }
}

