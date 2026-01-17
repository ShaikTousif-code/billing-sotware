using BillingAPI.Models;

namespace BillingAPI.Services;

public interface IProductService
{
    Task<List<Product>> GetProductsAsync(int tenantId, bool includeInactive = false);
    Task<Product?> GetProductByIdAsync(int id, int tenantId);
    Task<Product> CreateProductAsync(Product product);
    Task<Product> UpdateProductAsync(Product product);
    Task<bool> DeleteProductAsync(int id, int tenantId);
    Task<List<ProductCategory>> GetCategoriesAsync(int tenantId);
}