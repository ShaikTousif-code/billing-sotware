using Microsoft.EntityFrameworkCore;
using BillingAPI.Data;
using BillingAPI.Models;

namespace BillingAPI.Services;

public class ProductService : IProductService
{
    private readonly ApplicationDbContext _context;

    public ProductService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<Product>> GetProductsAsync(int tenantId, bool includeInactive = false)
    {
        var query = _context.Products
            .Include(p => p.Category)
            .Where(p => p.TenantId == tenantId);

        if (!includeInactive)
        {
            query = query.Where(p => p.IsActive);
        }

        return await query.OrderBy(p => p.Name).ToListAsync();
    }

    public async Task<Product?> GetProductByIdAsync(int id, int tenantId)
    {
        return await _context.Products
            .Include(p => p.Category)
            .FirstOrDefaultAsync(p => p.Id == id && p.TenantId == tenantId);
    }

    public async Task<Product> CreateProductAsync(Product product)
    {
        product.CreatedAt = DateTime.UtcNow;
        product.UpdatedAt = DateTime.UtcNow;
        
        // Auto-generate SKU if not provided
        if (string.IsNullOrWhiteSpace(product.SKU))
        {
            product.SKU = await GenerateUniqueSKUAsync(product.TenantId, product.Name);
        }
        
        // Initialize StockQuantity if TrackInventory is enabled
        if (product.TrackInventory && !product.StockQuantity.HasValue)
        {
            product.StockQuantity = 0;
        }
        
        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        // Create inventory record if tracking is enabled
        if (product.TrackInventory && product.StockQuantity.HasValue)
        {
            var inventory = new Inventory
            {
                TenantId = product.TenantId,
                ProductId = product.Id,
                Quantity = product.StockQuantity.Value,
                AverageCost = product.CostPrice,
                LastUpdatedAt = DateTime.UtcNow
            };
            _context.Inventories.Add(inventory);
            await _context.SaveChangesAsync();
        }
        
        return product;
    }

    private async Task<string> GenerateUniqueSKUAsync(int tenantId, string productName)
    {
        // Generate base SKU from product name (first 8 alphanumeric characters)
        var baseSku = new string(productName
            .ToUpper()
            .Where(c => char.IsLetterOrDigit(c))
            .Take(8)
            .ToArray());
        
        if (string.IsNullOrEmpty(baseSku))
        {
            baseSku = "PROD";
        }
        
        // Check if SKU already exists and append number if needed
        var existingSkus = await _context.Products
            .Where(p => p.TenantId == tenantId && p.SKU != null && p.SKU.StartsWith(baseSku))
            .Select(p => p.SKU!)
            .ToListAsync();
        
        if (!existingSkus.Any())
        {
            return baseSku;
        }
        
        // Find next available number
        var numbers = existingSkus
            .Where(s => s.Length > baseSku.Length)
            .Select(s => 
            {
                var suffix = s.Substring(baseSku.Length);
                return int.TryParse(suffix, out var num) ? num : 0;
            })
            .ToList();
        
        var nextNumber = numbers.Any() ? numbers.Max() + 1 : 1;
        return $"{baseSku}{nextNumber:D3}";
    }

    public async Task<Product> UpdateProductAsync(Product product)
    {
        // Load existing product to check for stock quantity changes
        var existingProduct = await _context.Products
            .FirstOrDefaultAsync(p => p.Id == product.Id && p.TenantId == product.TenantId);

        if (existingProduct == null)
        {
            throw new InvalidOperationException($"Product with ID {product.Id} not found");
        }

        // Update the tracked entity instead of calling Update() on a new instance
        existingProduct.Name = product.Name;
        existingProduct.SKU = product.SKU;
        existingProduct.HSNCode = product.HSNCode;
        existingProduct.SACCode = product.SACCode;
        existingProduct.Barcode = product.Barcode;
        existingProduct.Description = product.Description;
        existingProduct.CategoryId = product.CategoryId;
        existingProduct.CostPrice = product.CostPrice;
        existingProduct.SellingPrice = product.SellingPrice;
        existingProduct.MRP = product.MRP;
        existingProduct.TaxRate = product.TaxRate;
        existingProduct.TaxType = product.TaxType;
        existingProduct.StockQuantity = product.StockQuantity;
        existingProduct.LowStockAlert = product.LowStockAlert;
        existingProduct.Unit = product.Unit;
        existingProduct.ImageUrl = product.ImageUrl;
        existingProduct.Type = product.Type;
        existingProduct.IsActive = product.IsActive;
        existingProduct.TrackInventory = product.TrackInventory;
        existingProduct.BatchNo = product.BatchNo;
        existingProduct.ManufacturingDate = product.ManufacturingDate;
        existingProduct.ExpiryDate = product.ExpiryDate;
        existingProduct.Manufacturer = product.Manufacturer;
        // Expiry configuration
        existingProduct.ExpiryType = product.ExpiryType;
        existingProduct.ExpireAfterValue = product.ExpireAfterValue;
        existingProduct.ExpireAfterUnit = product.ExpireAfterUnit;
        existingProduct.AlertBeforeValue = product.AlertBeforeValue;
        existingProduct.AlertBeforeUnit = product.AlertBeforeUnit;
        existingProduct.IsExpiryEnabled = product.IsExpiryEnabled;
        // Purchase tracking
        existingProduct.LastPurchasePrice = product.LastPurchasePrice;
        existingProduct.LastPurchaseQuantity = product.LastPurchaseQuantity;
        existingProduct.LastPurchaseDate = product.LastPurchaseDate;
        existingProduct.SupplierName = product.SupplierName;
        // RMG fields
        existingProduct.StyleCode = product.StyleCode;
        existingProduct.Season = product.Season;
        existingProduct.Collection = product.Collection;
        existingProduct.Gender = product.Gender;
        existingProduct.FabricType = product.FabricType;
        existingProduct.SizeChartId = product.SizeChartId;
        existingProduct.UpdatedAt = DateTime.UtcNow;
        
        // Initialize StockQuantity if TrackInventory is enabled and it's null
        if (existingProduct.TrackInventory && !existingProduct.StockQuantity.HasValue)
        {
            existingProduct.StockQuantity = 0;
        }
        
        // Sync inventory if tracking is enabled
        if (existingProduct.TrackInventory)
        {
            var inventory = await _context.Inventories
                .FirstOrDefaultAsync(i => i.ProductId == existingProduct.Id && i.TenantId == existingProduct.TenantId);

            if (inventory != null)
            {
                // Update inventory to match product stock quantity
                inventory.Quantity = existingProduct.StockQuantity ?? 0;
                inventory.AverageCost = existingProduct.CostPrice; // Update cost if changed
                inventory.LastUpdatedAt = DateTime.UtcNow;
            }
            else if (existingProduct.StockQuantity.HasValue)
            {
                // Create inventory record if it doesn't exist
                var newInventory = new Inventory
                {
                    TenantId = existingProduct.TenantId,
                    ProductId = existingProduct.Id,
                    Quantity = existingProduct.StockQuantity.Value,
                    AverageCost = existingProduct.CostPrice,
                    LastUpdatedAt = DateTime.UtcNow
                };
                _context.Inventories.Add(newInventory);
            }
        }
        else
        {
            // If tracking is disabled, remove inventory record if it exists
            var inventory = await _context.Inventories
                .FirstOrDefaultAsync(i => i.ProductId == existingProduct.Id && i.TenantId == existingProduct.TenantId);
            
            if (inventory != null)
            {
                _context.Inventories.Remove(inventory);
            }
        }

        await _context.SaveChangesAsync();
        return existingProduct;
    }

    public async Task<bool> DeleteProductAsync(int id, int tenantId)
    {
        var product = await _context.Products
            .FirstOrDefaultAsync(p => p.Id == id && p.TenantId == tenantId);

        if (product == null) return false;

        product.IsActive = false;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<ProductCategory>> GetCategoriesAsync(int tenantId)
    {
        return await _context.ProductCategories
            .Where(c => c.TenantId == tenantId && c.IsActive)
            .OrderBy(c => c.Name)
            .ToListAsync();
    }

}

