using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BillingAPI.Models;
using BillingAPI.Services;
using System.Security.Claims;

namespace BillingAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UnitConversionController : ControllerBase
{
    private readonly IUnitConversionService _service;

    public UnitConversionController(IUnitConversionService service)
    {
        _service = service;
    }

    [HttpGet("product/{productId}")]
    public async Task<IActionResult> GetConversions(int productId)
    {
        var tenantId = GetTenantId();
        var conversions = await _service.GetConversionsAsync(tenantId, productId);
        return Ok(conversions);
    }

    [HttpPost("convert")]
    public async Task<IActionResult> ConvertUnit([FromBody] ConvertUnitRequest request)
    {
        var tenantId = GetTenantId();
        try
        {
            var convertedQuantity = await _service.ConvertUnitAsync(
                tenantId, 
                request.ProductId, 
                request.Quantity, 
                request.FromUnit, 
                request.ToUnit);
            return Ok(new { convertedQuantity });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost]
    public async Task<IActionResult> CreateConversion([FromBody] UnitConversion conversion)
    {
        conversion.TenantId = GetTenantId();
        conversion.CreatedAt = DateTime.UtcNow;
        var result = await _service.CreateConversionAsync(conversion);
        return CreatedAtAction(nameof(GetConversions), new { productId = conversion.ProductId }, result);
    }

    private int GetTenantId()
    {
        return int.Parse(User.FindFirst("TenantId")?.Value ?? "0");
    }
}

public class ConvertUnitRequest
{
    public int ProductId { get; set; }
    public decimal Quantity { get; set; }
    public string FromUnit { get; set; } = string.Empty;
    public string ToUnit { get; set; } = string.Empty;
}

