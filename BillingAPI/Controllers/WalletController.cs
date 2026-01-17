using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BillingAPI.Models;
using BillingAPI.Services;
using System.Security.Claims;

namespace BillingAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class WalletController : ControllerBase
{
    private readonly IWalletService _walletService;

    public WalletController(IWalletService walletService)
    {
        _walletService = walletService;
    }

    [HttpGet("customer/{customerId}")]
    public async Task<IActionResult> GetWalletTransactions(int customerId)
    {
        var tenantId = GetTenantId();
        var transactions = await _walletService.GetWalletTransactionsAsync(tenantId, customerId);
        var balance = await _walletService.GetWalletBalanceAsync(customerId);
        
        return Ok(new { transactions, balance });
    }

    [HttpPost("customer/{customerId}/credit")]
    public async Task<IActionResult> AddCredit(int customerId, [FromBody] WalletCreditRequest request)
    {
        var tenantId = GetTenantId();
        try
        {
            var transaction = await _walletService.AddWalletCreditAsync(
                tenantId, customerId, request.Amount, request.Notes, GetUserId());
            return Ok(transaction);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("customer/{customerId}/debit")]
    public async Task<IActionResult> AddDebit(int customerId, [FromBody] WalletDebitRequest request)
    {
        var tenantId = GetTenantId();
        try
        {
            var transaction = await _walletService.AddWalletDebitAsync(
                tenantId, customerId, request.Amount, request.Notes, GetUserId());
            return Ok(transaction);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("customer/{customerId}/balance")]
    public async Task<IActionResult> GetBalance(int customerId)
    {
        var balance = await _walletService.GetWalletBalanceAsync(customerId);
        return Ok(new { balance });
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

public class WalletCreditRequest
{
    public decimal Amount { get; set; }
    public string? Notes { get; set; }
}

public class WalletDebitRequest
{
    public decimal Amount { get; set; }
    public string? Notes { get; set; }
}

