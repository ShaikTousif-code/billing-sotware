using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BillingAPI.Models;
using BillingAPI.Services;
using BillingAPI.DTOs;
using System.Security.Claims;

namespace BillingAPI.Controllers;

[ApiController]
[Route("api/size-charts")]
[Authorize]
public class SizeChartsController : ControllerBase
{
    private readonly ISizeChartService _sizeChartService;

    public SizeChartsController(ISizeChartService sizeChartService)
    {
        _sizeChartService = sizeChartService;
    }

    [HttpGet]
    public async Task<IActionResult> GetSizeCharts()
    {
        var tenantId = GetTenantId();
        var charts = await _sizeChartService.GetSizeChartsAsync(tenantId);
        return Ok(ApiResponse<List<SizeChart>>.SuccessResponse(charts));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetSizeChart(int id)
    {
        var tenantId = GetTenantId();
        var chart = await _sizeChartService.GetSizeChartByIdAsync(id, tenantId);
        if (chart == null) return NotFound(ApiResponse<SizeChart>.ErrorResponse("Size chart not found."));
        return Ok(ApiResponse<SizeChart>.SuccessResponse(chart));
    }

    [HttpGet("{id}/sizes")]
    public async Task<IActionResult> GetSizeValues(int id)
    {
        var tenantId = GetTenantId();
        var sizes = await _sizeChartService.GetSizeValuesAsync(id, tenantId);
        return Ok(ApiResponse<List<string>>.SuccessResponse(sizes));
    }

    [HttpPost]
    public async Task<IActionResult> CreateSizeChart([FromBody] SizeChart chart)
    {
        chart.TenantId = GetTenantId();
        try
        {
            var created = await _sizeChartService.CreateSizeChartAsync(chart);
            return CreatedAtAction(nameof(GetSizeChart), new { id = created.Id }, 
                ApiResponse<SizeChart>.SuccessResponse(created, "Size chart created successfully."));
        }
        catch (Exception ex)
        {
            var errorMessage = ex.Message;
            if (ex.InnerException != null)
            {
                errorMessage += " | Inner Exception: " + ex.InnerException.Message;
            }
            return BadRequest(ApiResponse<SizeChart>.ErrorResponse(errorMessage));
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateSizeChart(int id, [FromBody] SizeChart chart)
    {
        if (id != chart.Id) return BadRequest(ApiResponse<SizeChart>.ErrorResponse("ID mismatch."));
        chart.TenantId = GetTenantId();
        try
        {
            var updated = await _sizeChartService.UpdateSizeChartAsync(chart);
            return Ok(ApiResponse<SizeChart>.SuccessResponse(updated, "Size chart updated successfully."));
        }
        catch (InvalidOperationException ex)
        {
            var errorMessage = ex.Message;
            if (ex.InnerException != null)
            {
                errorMessage += " | Inner Exception: " + ex.InnerException.Message;
            }
            return BadRequest(ApiResponse<SizeChart>.ErrorResponse(errorMessage));
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteSizeChart(int id)
    {
        var tenantId = GetTenantId();
        try
        {
            var deleted = await _sizeChartService.DeleteSizeChartAsync(id, tenantId);
            if (!deleted) return NotFound(ApiResponse<object>.ErrorResponse("Size chart not found."));
            return Ok(ApiResponse<object>.SuccessResponse(null, "Size chart deleted successfully."));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<object>.ErrorResponse(ex.Message));
        }
    }

    private int GetTenantId()
    {
        return int.Parse(User.FindFirst("TenantId")?.Value ?? "0");
    }
}

