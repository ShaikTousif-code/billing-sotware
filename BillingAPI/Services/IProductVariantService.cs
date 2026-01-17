using BillingAPI.Models;

namespace BillingAPI.Services;

public interface IProductVariantService
{
    Task<List<ProductVariant>> GetVariantsByProductIdAsync(int productId);
    Task<ProductVariant?> GetVariantByIdAsync(int id);
    Task<ProductVariant> CreateVariantAsync(ProductVariant variant);
    Task<ProductVariant> UpdateVariantAsync(ProductVariant variant);
    Task<bool> DeleteVariantAsync(int id);
}

