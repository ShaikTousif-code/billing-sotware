using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BillingAPI.Models;
using BillingAPI.Services;

namespace BillingAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProductVariantsController : ControllerBase
{
    private readonly IProductVariantService _variantService;

    public ProductVariantsController(IProductVariantService variantService)
    {
        _variantService = variantService;
    }

    [HttpGet("product/{productId}")]
    public async Task<IActionResult> GetVariantsByProduct(int productId)
    {
        var variants = await _variantService.GetVariantsByProductIdAsync(productId);
        return Ok(variants);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetVariant(int id)
    {
        var variant = await _variantService.GetVariantByIdAsync(id);
        if (variant == null) return NotFound();
        return Ok(variant);
    }

    [HttpPost]
    public async Task<IActionResult> CreateVariant([FromBody] ProductVariant variant)
    {
        var created = await _variantService.CreateVariantAsync(variant);
        return CreatedAtAction(nameof(GetVariant), new { id = created.Id }, created);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateVariant(int id, [FromBody] ProductVariant variant)
    {
        if (id != variant.Id) return BadRequest();
        var updated = await _variantService.UpdateVariantAsync(variant);
        return Ok(updated);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteVariant(int id)
    {
        var deleted = await _variantService.DeleteVariantAsync(id);
        if (!deleted) return NotFound();
        return NoContent();
    }
}

