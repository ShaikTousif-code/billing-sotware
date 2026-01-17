using BillingAPI.Models;

namespace BillingAPI.Services;

public interface IUnitConversionService
{
    Task<decimal> ConvertUnitAsync(int tenantId, int productId, decimal quantity, string fromUnit, string toUnit);
    Task<List<UnitConversion>> GetConversionsAsync(int tenantId, int productId);
    Task<UnitConversion> CreateConversionAsync(UnitConversion conversion);
}

