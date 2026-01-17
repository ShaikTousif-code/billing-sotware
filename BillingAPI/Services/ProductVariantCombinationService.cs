using Microsoft.EntityFrameworkCore;
using BillingAPI.Data;
using BillingAPI.Models;

namespace BillingAPI.Services;

public class ProductVariantCombinationService : IProductVariantCombinationService
{
    private readonly ApplicationDbContext _context;

    public ProductVariantCombinationService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<ProductVariantCombination>> GetVariantCombinationsByProductIdAsync(int productId, int tenantId)
    {
        return await _context.ProductVariantCombinations
            .Where(v => v.ProductId == productId && v.TenantId == tenantId && v.IsActive)
            .OrderBy(v => v.Size)
            .ThenBy(v => v.Color)
            .ToListAsync();
    }

    public async Task<ProductVariantCombination?> GetVariantCombinationByIdAsync(int id, int tenantId)
    {
        return await _context.ProductVariantCombinations
            .Include(v => v.Product)
            .FirstOrDefaultAsync(v => v.Id == id && v.TenantId == tenantId);
    }

    public async Task<ProductVariantCombination?> GetVariantByBarcodeAsync(string barcode, int tenantId)
    {
        return await _context.ProductVariantCombinations
            .Include(v => v.Product)
            .FirstOrDefaultAsync(v => v.Barcode == barcode && v.TenantId == tenantId && v.IsActive);
    }

    public async Task<ProductVariantCombination> CreateVariantCombinationAsync(ProductVariantCombination variant)
    {
        // Check if combination already exists
        var existing = await _context.ProductVariantCombinations
            .FirstOrDefaultAsync(v => v.TenantId == variant.TenantId 
                && v.ProductId == variant.ProductId 
                && v.Size == variant.Size 
                && v.Color == variant.Color);

        if (existing != null)
        {
            throw new InvalidOperationException($"Variant combination with Size '{variant.Size}' and Color '{variant.Color}' already exists for this product.");
        }

        // Check barcode uniqueness if provided
        if (!string.IsNullOrEmpty(variant.Barcode))
        {
            var existingBarcode = await _context.ProductVariantCombinations
                .FirstOrDefaultAsync(v => v.TenantId == variant.TenantId && v.Barcode == variant.Barcode);
            
            if (existingBarcode != null)
            {
                throw new InvalidOperationException($"Barcode '{variant.Barcode}' already exists.");
            }
        }

        variant.CreatedAt = DateTime.UtcNow;
        variant.UpdatedAt = DateTime.UtcNow;
        _context.ProductVariantCombinations.Add(variant);
        await _context.SaveChangesAsync();
        return variant;
    }

    public async Task<ProductVariantCombination> UpdateVariantCombinationAsync(ProductVariantCombination variant)
    {
        var existing = await _context.ProductVariantCombinations
            .FirstOrDefaultAsync(v => v.Id == variant.Id && v.TenantId == variant.TenantId);

        if (existing == null)
        {
            throw new InvalidOperationException("Variant combination not found.");
        }

        // Check if new combination already exists (excluding current)
        var duplicate = await _context.ProductVariantCombinations
            .FirstOrDefaultAsync(v => v.TenantId == variant.TenantId 
                && v.ProductId == variant.ProductId 
                && v.Size == variant.Size 
                && v.Color == variant.Color
                && v.Id != variant.Id);

        if (duplicate != null)
        {
            throw new InvalidOperationException($"Variant combination with Size '{variant.Size}' and Color '{variant.Color}' already exists for this product.");
        }

        // Check barcode uniqueness if changed
        if (!string.IsNullOrEmpty(variant.Barcode) && variant.Barcode != existing.Barcode)
        {
            var existingBarcode = await _context.ProductVariantCombinations
                .FirstOrDefaultAsync(v => v.TenantId == variant.TenantId && v.Barcode == variant.Barcode && v.Id != variant.Id);
            
            if (existingBarcode != null)
            {
                throw new InvalidOperationException($"Barcode '{variant.Barcode}' already exists.");
            }
        }

        existing.Size = variant.Size;
        existing.Color = variant.Color;
        existing.SKU = variant.SKU;
        existing.Barcode = variant.Barcode;
        existing.CostPrice = variant.CostPrice;
        existing.SellingPrice = variant.SellingPrice;
        existing.StockQuantity = variant.StockQuantity;
        existing.ImageUrl = variant.ImageUrl;
        existing.IsActive = variant.IsActive;
        existing.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return existing;
    }

    public async Task<bool> DeleteVariantCombinationAsync(int id, int tenantId)
    {
        var variant = await _context.ProductVariantCombinations
            .FirstOrDefaultAsync(v => v.Id == id && v.TenantId == tenantId);

        if (variant == null) return false;

        // Soft delete
        variant.IsActive = false;
        variant.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<ProductVariantCombination>> BulkCreateVariantsAsync(int productId, int tenantId, List<ProductVariantCombination> variants)
    {
        var createdVariants = new List<ProductVariantCombination>();
        var now = DateTime.UtcNow;

        foreach (var variant in variants)
        {
            variant.ProductId = productId;
            variant.TenantId = tenantId;
            variant.CreatedAt = now;
            variant.UpdatedAt = now;

            // Check for duplicates
            var existing = await _context.ProductVariantCombinations
                .FirstOrDefaultAsync(v => v.TenantId == tenantId 
                    && v.ProductId == productId 
                    && v.Size == variant.Size 
                    && v.Color == variant.Color);

            if (existing == null)
            {
                _context.ProductVariantCombinations.Add(variant);
                createdVariants.Add(variant);
            }
        }

        await _context.SaveChangesAsync();
        return createdVariants;
    }

    public async Task<Dictionary<string, int>> GetStockBySizeAndColorAsync(int productId, int tenantId)
    {
        var variants = await _context.ProductVariantCombinations
            .Where(v => v.ProductId == productId && v.TenantId == tenantId && v.IsActive)
            .ToListAsync();

        var stockDict = new Dictionary<string, int>();
        foreach (var variant in variants)
        {
            var key = $"{variant.Size}-{variant.Color}";
            stockDict[key] = variant.StockQuantity;
        }

        return stockDict;
    }

    public async Task<int> GetStockByVariantAsync(int productId, string size, string color, int tenantId)
    {
        var variant = await _context.ProductVariantCombinations
            .FirstOrDefaultAsync(v => v.ProductId == productId 
                && v.TenantId == tenantId 
                && v.Size == size 
                && v.Color == color 
                && v.IsActive);

        return variant?.StockQuantity ?? 0;
    }
}

