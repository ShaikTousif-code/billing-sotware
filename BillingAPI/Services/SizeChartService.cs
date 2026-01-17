using Microsoft.EntityFrameworkCore;
using BillingAPI.Data;
using BillingAPI.Models;
using System.Text.Json;

namespace BillingAPI.Services;

public class SizeChartService : ISizeChartService
{
    private readonly ApplicationDbContext _context;

    public SizeChartService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<SizeChart>> GetSizeChartsAsync(int tenantId)
    {
        return await _context.SizeCharts
            .Where(c => c.TenantId == tenantId && c.IsActive)
            .OrderBy(c => c.Name)
            .ToListAsync();
    }

    public async Task<SizeChart?> GetSizeChartByIdAsync(int id, int tenantId)
    {
        return await _context.SizeCharts
            .FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId);
    }

    public async Task<SizeChart> CreateSizeChartAsync(SizeChart chart)
    {
        chart.CreatedAt = DateTime.UtcNow;
        chart.UpdatedAt = DateTime.UtcNow;
        _context.SizeCharts.Add(chart);
        await _context.SaveChangesAsync();
        return chart;
    }

    public async Task<SizeChart> UpdateSizeChartAsync(SizeChart chart)
    {
        var existing = await _context.SizeCharts
            .FirstOrDefaultAsync(c => c.Id == chart.Id && c.TenantId == chart.TenantId);

        if (existing == null)
        {
            throw new InvalidOperationException("Size chart not found.");
        }

        existing.Name = chart.Name;
        existing.SizeValues = chart.SizeValues;
        existing.Description = chart.Description;
        existing.IsDefault = chart.IsDefault;
        existing.IsActive = chart.IsActive;
        existing.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return existing;
    }

    public async Task<bool> DeleteSizeChartAsync(int id, int tenantId)
    {
        var chart = await _context.SizeCharts
            .FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId);

        if (chart == null) return false;

        // Check if any products are using this size chart
        var productsUsingChart = await _context.Products
            .AnyAsync(p => p.SizeChartId == id && p.TenantId == tenantId);

        if (productsUsingChart)
        {
            throw new InvalidOperationException("Cannot delete size chart. It is being used by one or more products.");
        }

        // Soft delete
        chart.IsActive = false;
        chart.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<string>> GetSizeValuesAsync(int sizeChartId, int tenantId)
    {
        var chart = await _context.SizeCharts
            .FirstOrDefaultAsync(c => c.Id == sizeChartId && c.TenantId == tenantId);

        if (chart == null || string.IsNullOrEmpty(chart.SizeValues))
        {
            return new List<string>();
        }

        try
        {
            return JsonSerializer.Deserialize<List<string>>(chart.SizeValues) ?? new List<string>();
        }
        catch
        {
            // Fallback: treat as comma-separated values
            return chart.SizeValues.Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(s => s.Trim())
                .ToList();
        }
    }
}

