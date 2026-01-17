using Microsoft.EntityFrameworkCore;
using BillingAPI.Data;
using BillingAPI.Models;

namespace BillingAPI.Services;

public class UnitConversionService : IUnitConversionService
{
    private readonly ApplicationDbContext _context;

    public UnitConversionService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<decimal> ConvertUnitAsync(int tenantId, int productId, decimal quantity, string fromUnit, string toUnit)
    {
        if (fromUnit.Equals(toUnit, StringComparison.OrdinalIgnoreCase))
            return quantity;

        var conversion = await _context.Set<UnitConversion>()
            .FirstOrDefaultAsync(uc => uc.TenantId == tenantId 
                && uc.ProductId == productId 
                && uc.FromUnit.Equals(fromUnit, StringComparison.OrdinalIgnoreCase)
                && uc.ToUnit.Equals(toUnit, StringComparison.OrdinalIgnoreCase)
                && uc.IsActive);

        if (conversion != null)
        {
            return quantity * conversion.ConversionFactor;
        }

        // Try reverse conversion
        var reverseConversion = await _context.Set<UnitConversion>()
            .FirstOrDefaultAsync(uc => uc.TenantId == tenantId 
                && uc.ProductId == productId 
                && uc.FromUnit.Equals(toUnit, StringComparison.OrdinalIgnoreCase)
                && uc.ToUnit.Equals(fromUnit, StringComparison.OrdinalIgnoreCase)
                && uc.IsActive);

        if (reverseConversion != null)
        {
            return quantity / reverseConversion.ConversionFactor;
        }

        throw new Exception($"No conversion found from {fromUnit} to {toUnit}");
    }

    public async Task<List<UnitConversion>> GetConversionsAsync(int tenantId, int productId)
    {
        return await _context.Set<UnitConversion>()
            .Where(uc => uc.TenantId == tenantId && uc.ProductId == productId && uc.IsActive)
            .ToListAsync();
    }

    public async Task<UnitConversion> CreateConversionAsync(UnitConversion conversion)
    {
        _context.Set<UnitConversion>().Add(conversion);
        await _context.SaveChangesAsync();
        return conversion;
    }
}

