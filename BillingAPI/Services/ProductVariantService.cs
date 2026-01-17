using Microsoft.EntityFrameworkCore;
using BillingAPI.Data;
using BillingAPI.Models;

namespace BillingAPI.Services;

public class ProductVariantService : IProductVariantService
{
    private readonly ApplicationDbContext _context;

    public ProductVariantService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<ProductVariant>> GetVariantsByProductIdAsync(int productId)
    {
        return await _context.ProductVariants
            .Where(v => v.ProductId == productId && v.IsActive)
            .ToListAsync();
    }

    public async Task<ProductVariant?> GetVariantByIdAsync(int id)
    {
        return await _context.ProductVariants
            .Include(v => v.Product)
            .FirstOrDefaultAsync(v => v.Id == id);
    }

    public async Task<ProductVariant> CreateVariantAsync(ProductVariant variant)
    {
        _context.ProductVariants.Add(variant);
        await _context.SaveChangesAsync();
        return variant;
    }

    public async Task<ProductVariant> UpdateVariantAsync(ProductVariant variant)
    {
        _context.ProductVariants.Update(variant);
        await _context.SaveChangesAsync();
        return variant;
    }

    public async Task<bool> DeleteVariantAsync(int id)
    {
        var variant = await _context.ProductVariants.FindAsync(id);
        if (variant == null) return false;

        variant.IsActive = false;
        await _context.SaveChangesAsync();
        return true;
    }
}

