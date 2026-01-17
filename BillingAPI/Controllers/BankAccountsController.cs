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
public class BankAccountsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public BankAccountsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetBankAccounts()
    {
        var tenantId = GetTenantId();
        var accounts = await _context.BankAccounts
            .Where(ba => ba.TenantId == tenantId && ba.IsActive)
            .ToListAsync();
        return Ok(accounts);
    }

    [HttpPost]
    public async Task<IActionResult> CreateBankAccount([FromBody] BankAccount account)
    {
        account.TenantId = GetTenantId();
        account.CreatedAt = DateTime.UtcNow;
        
        _context.BankAccounts.Add(account);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetBankAccounts), new { id = account.Id }, account);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateBankAccount(int id, [FromBody] BankAccount account)
    {
        var tenantId = GetTenantId();
        if (id != account.Id || account.TenantId != tenantId)
            return BadRequest();

        _context.BankAccounts.Update(account);
        await _context.SaveChangesAsync();
        return Ok(account);
    }

    private int GetTenantId()
    {
        return int.Parse(User.FindFirst("TenantId")?.Value ?? "0");
    }
}

