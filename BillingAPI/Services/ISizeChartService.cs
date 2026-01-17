using BillingAPI.Models;

namespace BillingAPI.Services;

public interface ISizeChartService
{
    Task<List<SizeChart>> GetSizeChartsAsync(int tenantId);
    Task<SizeChart?> GetSizeChartByIdAsync(int id, int tenantId);
    Task<SizeChart> CreateSizeChartAsync(SizeChart chart);
    Task<SizeChart> UpdateSizeChartAsync(SizeChart chart);
    Task<bool> DeleteSizeChartAsync(int id, int tenantId);
    Task<List<string>> GetSizeValuesAsync(int sizeChartId, int tenantId);
}

