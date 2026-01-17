using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.EntityFrameworkCore;
using BillingAPI.Models;
using BillingAPI.Services;
using BillingAPI.DTOs;
using BillingAPI.Validators;
using BillingAPI.Data;
using System.Security.Claims;
using FluentValidation;

namespace BillingAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProductsController : ControllerBase
{
    private readonly IProductService _productService;
    private readonly IInventoryService _inventoryService;
    private readonly IValidator<Product> _validator;
    private readonly ApplicationDbContext _context;

    public ProductsController(
        IProductService productService, 
        IInventoryService inventoryService,
        IValidator<Product> validator,
        ApplicationDbContext context)
    {
        _productService = productService;
        _inventoryService = inventoryService;
        _validator = validator;
        _context = context;
    }

    [HttpGet]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public async Task<IActionResult> GetProducts(
        [FromQuery] bool includeInactive = false,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var tenantId = GetTenantId();
        var products = await _productService.GetProductsAsync(tenantId, includeInactive);
        
        var totalCount = products.Count;
        var paginatedProducts = products
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToList();

        var response = new PaginatedResponse<Product>
        {
            Data = paginatedProducts,
            PageNumber = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };

        return Ok(ApiResponse<PaginatedResponse<Product>>.SuccessResponse(response));
    }

    [HttpGet("{id}")]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public async Task<IActionResult> GetProduct(int id)
    {
        var tenantId = GetTenantId();
        var product = await _productService.GetProductByIdAsync(id, tenantId);
        if (product == null) 
            return NotFound(ApiResponse<Product>.ErrorResponse("Product not found"));
        
        return Ok(ApiResponse<Product>.SuccessResponse(product));
    }

    [HttpPost]
    public async Task<IActionResult> CreateProduct([FromBody] Product product)
    {
        var validationResult = await _validator.ValidateAsync(product);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
            return BadRequest(ApiResponse<Product>.ErrorResponse("Validation failed", errors));
        }

        product.TenantId = GetTenantId();
        var created = await _productService.CreateProductAsync(product);
        
        // Inventory is automatically created/synced by ProductService.CreateProductAsync
        
        return CreatedAtAction(nameof(GetProduct), new { id = created.Id }, 
            ApiResponse<Product>.SuccessResponse(created, "Product created successfully"));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateProduct(int id, [FromBody] Product product)
    {
        var validationResult = await _validator.ValidateAsync(product);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
            return BadRequest(ApiResponse<Product>.ErrorResponse("Validation failed", errors));
        }

        var tenantId = GetTenantId();
        if (id != product.Id || product.TenantId != tenantId)
            return BadRequest(ApiResponse<Product>.ErrorResponse("Invalid product data"));

        // Get the existing product to check for stock quantity changes
        var existingProduct = await _productService.GetProductByIdAsync(id, tenantId);
        if (existingProduct == null)
            return NotFound(ApiResponse<Product>.ErrorResponse("Product not found"));

        var updated = await _productService.UpdateProductAsync(product);

        // Inventory is automatically synced by ProductService.UpdateProductAsync

        return Ok(ApiResponse<Product>.SuccessResponse(updated, "Product updated successfully"));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteProduct(int id)
    {
        var tenantId = GetTenantId();
        var deleted = await _productService.DeleteProductAsync(id, tenantId);
        if (!deleted)
            return NotFound(ApiResponse<object>.ErrorResponse("Product not found"));

        return Ok(ApiResponse<object>.SuccessResponse(null, "Product deleted successfully"));
    }

    [HttpGet("categories")]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public async Task<IActionResult> GetCategories()
    {
        var tenantId = GetTenantId();
        var categories = await _productService.GetCategoriesAsync(tenantId);
        return Ok(ApiResponse<List<ProductCategory>>.SuccessResponse(categories));
    }

    [HttpPost("categories")]
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


    private int GetTenantId()
    {
        return int.Parse(User.FindFirst("TenantId")?.Value ?? "0");
    }
}
