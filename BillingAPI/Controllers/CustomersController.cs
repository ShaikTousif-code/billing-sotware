using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BillingAPI.Models;
using BillingAPI.Services;
using BillingAPI.DTOs;
using BillingAPI.Validators;
using FluentValidation;
using System.Security.Claims;

namespace BillingAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CustomersController : ControllerBase
{
    private readonly ICustomerService _customerService;
    private readonly IValidator<Customer> _validator;

    public CustomersController(ICustomerService customerService, IValidator<Customer> validator)
    {
        _customerService = customerService;
        _validator = validator;
    }

    [HttpGet]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public async Task<IActionResult> GetCustomers([FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var tenantId = GetTenantId();
        var customers = await _customerService.GetCustomersAsync(tenantId);
        
        // Apply search filter
        if (!string.IsNullOrEmpty(search))
        {
            customers = customers.Where(c => 
                c.Name.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                c.Email?.Contains(search, StringComparison.OrdinalIgnoreCase) == true ||
                c.Phone?.Contains(search) == true
            ).ToList();
        }
        
        var totalCount = customers.Count;
        var paginatedCustomers = customers
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToList();

        var response = new PaginatedResponse<Customer>
        {
            Data = paginatedCustomers,
            PageNumber = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };

        return Ok(ApiResponse<PaginatedResponse<Customer>>.SuccessResponse(response));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetCustomer(int id)
    {
        var tenantId = GetTenantId();
        var customer = await _customerService.GetCustomerByIdAsync(id, tenantId);
        if (customer == null) return NotFound();
        return Ok(customer);
    }

    [HttpPost]
    public async Task<IActionResult> CreateCustomer([FromBody] Customer customer)
    {
        var validationResult = await _validator.ValidateAsync(customer);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
            return BadRequest(ApiResponse<Customer>.ErrorResponse("Validation failed", errors));
        }

        customer.TenantId = GetTenantId();
        var created = await _customerService.CreateCustomerAsync(customer);
        return CreatedAtAction(nameof(GetCustomer), new { id = created.Id }, 
            ApiResponse<Customer>.SuccessResponse(created, "Customer created successfully"));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateCustomer(int id, [FromBody] Customer customer)
    {
        var validationResult = await _validator.ValidateAsync(customer);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
            return BadRequest(ApiResponse<Customer>.ErrorResponse("Validation failed", errors));
        }

        var tenantId = GetTenantId();
        if (id != customer.Id || customer.TenantId != tenantId)
            return BadRequest(ApiResponse<Customer>.ErrorResponse("Invalid customer data"));

        var updated = await _customerService.UpdateCustomerAsync(customer);
        return Ok(ApiResponse<Customer>.SuccessResponse(updated, "Customer updated successfully"));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteCustomer(int id)
    {
        var tenantId = GetTenantId();
        var deleted = await _customerService.DeleteCustomerAsync(id, tenantId);
        if (!deleted) return NotFound();
        return NoContent();
    }

    private int GetTenantId()
    {
        return int.Parse(User.FindFirst("TenantId")?.Value ?? "0");
    }
}

