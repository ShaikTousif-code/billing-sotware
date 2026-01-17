using BillingAPI.Models;

namespace BillingAPI.Services;

public interface IProductVariantCombinationService
{
    Task<List<ProductVariantCombination>> GetVariantCombinationsByProductIdAsync(int productId, int tenantId);
    Task<ProductVariantCombination?> GetVariantCombinationByIdAsync(int id, int tenantId);
    Task<ProductVariantCombination?> GetVariantByBarcodeAsync(string barcode, int tenantId);
    Task<ProductVariantCombination> CreateVariantCombinationAsync(ProductVariantCombination variant);
    Task<ProductVariantCombination> UpdateVariantCombinationAsync(ProductVariantCombination variant);
    Task<bool> DeleteVariantCombinationAsync(int id, int tenantId);
    Task<List<ProductVariantCombination>> BulkCreateVariantsAsync(int productId, int tenantId, List<ProductVariantCombination> variants);
    Task<Dictionary<string, int>> GetStockBySizeAndColorAsync(int productId, int tenantId);
    Task<int> GetStockByVariantAsync(int productId, string size, string color, int tenantId);
}

