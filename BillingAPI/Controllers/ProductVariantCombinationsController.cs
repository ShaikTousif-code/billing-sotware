using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BillingAPI.Models;
using BillingAPI.Services;
using BillingAPI.DTOs;
using System.Security.Claims;

namespace BillingAPI.Controllers;

[ApiController]
[Route("api/product-variant-combinations")]
[Authorize]
public class ProductVariantCombinationsController : ControllerBase
{
    private readonly IProductVariantCombinationService _variantService;

    public ProductVariantCombinationsController(IProductVariantCombinationService variantService)
    {
        _variantService = variantService;
    }

    [HttpGet("product/{productId}")]
    public async Task<IActionResult> GetVariantsByProduct(int productId)
    {
        var tenantId = GetTenantId();
        var variants = await _variantService.GetVariantCombinationsByProductIdAsync(productId, tenantId);
        return Ok(ApiResponse<List<ProductVariantCombination>>.SuccessResponse(variants));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetVariant(int id)
    {
        var tenantId = GetTenantId();
        var variant = await _variantService.GetVariantCombinationByIdAsync(id, tenantId);
        if (variant == null) return NotFound(ApiResponse<ProductVariantCombination>.ErrorResponse("Variant combination not found."));
        return Ok(ApiResponse<ProductVariantCombination>.SuccessResponse(variant));
    }

    [HttpGet("barcode/{barcode}")]
    public async Task<IActionResult> GetVariantByBarcode(string barcode)
    {
        var tenantId = GetTenantId();
        var variant = await _variantService.GetVariantByBarcodeAsync(barcode, tenantId);
        if (variant == null) return NotFound(ApiResponse<ProductVariantCombination>.ErrorResponse("Variant not found for barcode."));
        return Ok(ApiResponse<ProductVariantCombination>.SuccessResponse(variant));
    }

    [HttpPost]
    public async Task<IActionResult> CreateVariant([FromBody] ProductVariantCombination variant)
    {
        variant.TenantId = GetTenantId();
        try
        {
            var created = await _variantService.CreateVariantCombinationAsync(variant);
            return CreatedAtAction(nameof(GetVariant), new { id = created.Id }, 
                ApiResponse<ProductVariantCombination>.SuccessResponse(created, "Variant combination created successfully."));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<ProductVariantCombination>.ErrorResponse(ex.Message));
        }
    }

    [HttpPost("bulk")]
    public async Task<IActionResult> BulkCreateVariants([FromBody] BulkVariantCreationRequest request)
    {
        var tenantId = GetTenantId();
        try
        {
            var created = await _variantService.BulkCreateVariantsAsync(request.ProductId, tenantId, request.Variants);
            return Ok(ApiResponse<List<ProductVariantCombination>>.SuccessResponse(created, $"{created.Count} variant combinations created successfully."));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<List<ProductVariantCombination>>.ErrorResponse(ex.Message));
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateVariant(int id, [FromBody] ProductVariantCombination variant)
    {
        if (id != variant.Id) return BadRequest(ApiResponse<ProductVariantCombination>.ErrorResponse("ID mismatch."));
        variant.TenantId = GetTenantId();
        try
        {
            var updated = await _variantService.UpdateVariantCombinationAsync(variant);
            return Ok(ApiResponse<ProductVariantCombination>.SuccessResponse(updated, "Variant combination updated successfully."));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<ProductVariantCombination>.ErrorResponse(ex.Message));
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteVariant(int id)
    {
        var tenantId = GetTenantId();
        var deleted = await _variantService.DeleteVariantCombinationAsync(id, tenantId);
        if (!deleted) return NotFound(ApiResponse<object>.ErrorResponse("Variant combination not found."));
        return Ok(ApiResponse<object>.SuccessResponse(null, "Variant combination deleted successfully."));
    }

    [HttpGet("product/{productId}/stock")]
    public async Task<IActionResult> GetStockBySizeAndColor(int productId)
    {
        var tenantId = GetTenantId();
        var stock = await _variantService.GetStockBySizeAndColorAsync(productId, tenantId);
        return Ok(ApiResponse<Dictionary<string, int>>.SuccessResponse(stock));
    }

    private int GetTenantId()
    {
        return int.Parse(User.FindFirst("TenantId")?.Value ?? "0");
    }
}

public class BulkVariantCreationRequest
{
    public int ProductId { get; set; }
    public List<ProductVariantCombination> Variants { get; set; } = new();
}

