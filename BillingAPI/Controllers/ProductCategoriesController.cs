using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BillingAPI.Models;
using BillingAPI.Services;
using BillingAPI.DTOs;
using BillingAPI.Data;
using System.Security.Claims;

namespace BillingAPI.Controllers;

[ApiController]
[Route("api/product-categories")]
[Authorize]
public class ProductCategoriesController : ControllerBase
{
    private readonly IProductService _productService;
    private readonly ApplicationDbContext _context;

    public ProductCategoriesController(
        IProductService productService,
        ApplicationDbContext context)
    {
        _productService = productService;
        _context = context;
    }

    [HttpGet]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public async Task<IActionResult> GetCategories()
    {
        var tenantId = GetTenantId();
        var categories = await _productService.GetCategoriesAsync(tenantId);
        return Ok(ApiResponse<List<ProductCategory>>.SuccessResponse(categories));
    }

    [HttpPost]
    public async Task<IActionResult> CreateCategory([FromBody] ProductCategory category)
    {
        if (string.IsNullOrWhiteSpace(category.Name))
        {
            return BadRequest(ApiResponse<ProductCategory>.ErrorResponse("Category name is required"));
        }

        category.TenantId = GetTenantId();
        category.IsActive = true;
        category.CreatedAt = DateTime.UtcNow;
        
        _context.ProductCategories.Add(category);
        await _context.SaveChangesAsync();
        
        return CreatedAtAction(nameof(GetCategories), null,
            ApiResponse<ProductCategory>.SuccessResponse(category, "Category created successfully"));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateCategory(int id, [FromBody] ProductCategory category)
    {
        var tenantId = GetTenantId();
        var existingCategory = await _context.ProductCategories
            .FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId);

        if (existingCategory == null)
            return NotFound(ApiResponse<ProductCategory>.ErrorResponse("Category not found"));

        if (string.IsNullOrWhiteSpace(category.Name))
        {
            return BadRequest(ApiResponse<ProductCategory>.ErrorResponse("Category name is required"));
        }

        existingCategory.Name = category.Name;
        existingCategory.Description = category.Description;
        existingCategory.IsActive = category.IsActive;

        await _context.SaveChangesAsync();

        return Ok(ApiResponse<ProductCategory>.SuccessResponse(existingCategory, "Category updated successfully"));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteCategory(int id)
    {
        var tenantId = GetTenantId();
        var category = await _context.ProductCategories
            .FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId);

        if (category == null)
            return NotFound(ApiResponse<object>.ErrorResponse("Category not found"));

        // Check if category is being used by any products
        var productsUsingCategory = await _context.Products
            .AnyAsync(p => p.CategoryId == id && p.TenantId == tenantId);

        if (productsUsingCategory)
        {
            return BadRequest(ApiResponse<object>.ErrorResponse("Cannot delete category. It is being used by one or more products."));
        }

        _context.ProductCategories.Remove(category);
        await _context.SaveChangesAsync();

        return Ok(ApiResponse<object>.SuccessResponse(null, "Category deleted successfully"));
    }

    private int GetTenantId()
    {
        return int.Parse(User.FindFirst("TenantId")?.Value ?? "0");
    }
}

