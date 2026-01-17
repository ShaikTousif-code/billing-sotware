using Microsoft.EntityFrameworkCore;
using BillingAPI.Data;
using BillingAPI.Models;

namespace BillingAPI.Services;

public class SalesExchangeService : ISalesExchangeService
{
    private readonly ApplicationDbContext _context;
    private readonly IInventoryService _inventoryService;

    public SalesExchangeService(ApplicationDbContext context, IInventoryService inventoryService)
    {
        _context = context;
        _inventoryService = inventoryService;
    }

    public async Task<List<SalesExchange>> GetSalesExchangesAsync(int tenantId, DateTime? fromDate = null, DateTime? toDate = null)
    {
        var query = _context.SalesExchanges
            .Include(se => se.Invoice)
            .Include(se => se.Items)
            .ThenInclude(item => item.Product)
            .Where(se => se.TenantId == tenantId);

        if (fromDate.HasValue)
        {
            query = query.Where(se => se.ExchangeDate >= fromDate.Value);
        }

        if (toDate.HasValue)
        {
            query = query.Where(se => se.ExchangeDate <= toDate.Value);
        }

        return await query.OrderByDescending(se => se.ExchangeDate).ToListAsync();
    }

    public async Task<SalesExchange?> GetSalesExchangeByIdAsync(int id, int tenantId)
    {
        return await _context.SalesExchanges
            .Include(se => se.Invoice)
            .Include(se => se.Items)
            .ThenInclude(item => item.Product)
            .FirstOrDefaultAsync(se => se.Id == id && se.TenantId == tenantId);
    }

    public async Task<List<SalesExchange>> GetSalesExchangesByInvoiceIdAsync(int invoiceId, int tenantId)
    {
        return await _context.SalesExchanges
            .Include(se => se.Items)
            .Where(se => se.InvoiceId == invoiceId && se.TenantId == tenantId)
            .OrderByDescending(se => se.ExchangeDate)
            .ToListAsync();
    }

    public async Task<SalesExchange> CreateSalesExchangeAsync(SalesExchange exchange)
    {
        // Validate invoice exists and is completed
        var invoice = await _context.Invoices
            .Include(i => i.Items)
            .FirstOrDefaultAsync(i => i.Id == exchange.InvoiceId && i.TenantId == exchange.TenantId);

        if (invoice == null)
        {
            throw new InvalidOperationException("Invoice not found.");
        }

        if (invoice.Status != "Completed")
        {
            throw new InvalidOperationException("Can only exchange items from completed invoices.");
        }

        var originalItems = exchange.Items.Where(i => i.Type == "Original").ToList();
        var newItems = exchange.Items.Where(i => i.Type == "New").ToList();

        if (originalItems.Count == 0)
        {
            throw new InvalidOperationException("At least one original item must be specified.");
        }

        if (newItems.Count == 0)
        {
            throw new InvalidOperationException("At least one new item must be specified.");
        }

        // Validate original items
        foreach (var originalItem in originalItems)
        {
            var invoiceItem = invoice.Items.FirstOrDefault(i => i.Id == originalItem.InvoiceItemId);
            if (invoiceItem == null)
            {
                throw new InvalidOperationException($"Invoice item {originalItem.InvoiceItemId} not found in invoice.");
            }

            // Check size/color match
            if (!string.IsNullOrEmpty(originalItem.Size) && invoiceItem.Size != originalItem.Size)
            {
                throw new InvalidOperationException($"Size mismatch for invoice item {originalItem.InvoiceItemId}.");
            }

            if (!string.IsNullOrEmpty(originalItem.Color) && invoiceItem.Color != originalItem.Color)
            {
                throw new InvalidOperationException($"Color mismatch for invoice item {originalItem.InvoiceItemId}.");
            }

            // Populate original item details
            originalItem.ProductName = invoiceItem.ProductName;
            originalItem.ProductId = invoiceItem.ProductId;
            originalItem.UnitPrice = invoiceItem.UnitPrice;
            originalItem.TotalAmount = originalItem.Quantity * originalItem.UnitPrice;
        }

        // Validate and populate new items
        foreach (var newItem in newItems)
        {
            var product = await _context.Products
                .FirstOrDefaultAsync(p => p.Id == newItem.ProductId && p.TenantId == exchange.TenantId);

            if (product == null)
            {
                throw new InvalidOperationException($"Product {newItem.ProductId} not found.");
            }

            newItem.ProductName = product.Name;

            // Get price from variant if applicable
            if (newItem.VariantCombinationId.HasValue)
            {
                var variant = await _context.ProductVariantCombinations
                    .FirstOrDefaultAsync(v => v.Id == newItem.VariantCombinationId.Value);

                if (variant != null)
                {
                    newItem.UnitPrice = variant.SellingPrice ?? product.SellingPrice;
                }
                else
                {
                    newItem.UnitPrice = product.SellingPrice;
                }
            }
            else
            {
                newItem.UnitPrice = product.SellingPrice;
            }

            newItem.TotalAmount = newItem.Quantity * newItem.UnitPrice;

            // Check stock availability
            if (product.TrackInventory)
            {
                int availableStock;
                if (newItem.VariantCombinationId.HasValue)
                {
                    var variant = await _context.ProductVariantCombinations
                        .FirstOrDefaultAsync(v => v.Id == newItem.VariantCombinationId.Value);
                    availableStock = variant?.StockQuantity ?? 0;
                }
                else
                {
                    availableStock = product.StockQuantity ?? 0;
                }

                if (availableStock < newItem.Quantity)
                {
                    throw new InvalidOperationException(
                        $"Insufficient stock for product '{product.Name}'. Available: {availableStock}, Required: {newItem.Quantity}");
                }
            }
        }

        // Calculate price difference
        exchange.PriceDifference = await CalculatePriceDifferenceAsync(exchange);

        // Generate exchange number
        if (string.IsNullOrEmpty(exchange.ExchangeNumber))
        {
            exchange.ExchangeNumber = await GenerateExchangeNumberAsync(exchange.TenantId);
        }

        exchange.CreatedAt = DateTime.UtcNow;

        _context.SalesExchanges.Add(exchange);
        await _context.SaveChangesAsync();
        return exchange;
    }

    public async Task<bool> ApproveSalesExchangeAsync(int exchangeId, int tenantId)
    {
        var exchange = await _context.SalesExchanges
            .FirstOrDefaultAsync(se => se.Id == exchangeId && se.TenantId == tenantId);

        if (exchange == null) return false;

        if (exchange.Status != "Pending")
        {
            throw new InvalidOperationException($"Cannot approve exchange. Current status: {exchange.Status}");
        }

        exchange.Status = "Approved";
        exchange.ApprovedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ProcessSalesExchangeAsync(int exchangeId, int tenantId)
    {
        var exchange = await _context.SalesExchanges
            .Include(se => se.Items)
            .ThenInclude(item => item.InvoiceItem)
            .Include(se => se.Invoice)
            .FirstOrDefaultAsync(se => se.Id == exchangeId && se.TenantId == tenantId);

        if (exchange == null) return false;

        if (exchange.Status != "Approved" && exchange.Status != "Pending")
        {
            throw new InvalidOperationException($"Cannot process exchange. Current status: {exchange.Status}");
        }

        var originalItems = exchange.Items.Where(i => i.Type == "Original").ToList();
        var newItems = exchange.Items.Where(i => i.Type == "New").ToList();

        // Return original items to inventory
        foreach (var originalItem in originalItems)
        {
            var product = await _context.Products.FindAsync(originalItem.ProductId);
            if (product != null && product.TrackInventory)
            {
                // Update variant inventory if applicable
                if (originalItem.VariantCombinationId.HasValue)
                {
                    var variant = await _context.ProductVariantCombinations
                        .FirstOrDefaultAsync(v => v.Id == originalItem.VariantCombinationId.Value);
                    
                    if (variant != null)
                    {
                        variant.StockQuantity += (int)originalItem.Quantity;
                        variant.UpdatedAt = DateTime.UtcNow;
                    }
                }
                else
                {
                    // Update product-level inventory
                    await _inventoryService.UpdateInventoryAsync(
                        originalItem.ProductId, 
                        tenantId, 
                        (int)originalItem.Quantity, 
                        null, 
                        true);
                }

                // Record stock transaction
                var stockTransaction = new StockTransaction
                {
                    TenantId = tenantId,
                    ProductId = originalItem.ProductId,
                    VariantCombinationId = originalItem.VariantCombinationId,
                    TransactionType = "In",
                    Quantity = (int)originalItem.Quantity,
                    ReferenceType = "Exchange",
                    ReferenceId = exchangeId,
                    Size = originalItem.Size,
                    Color = originalItem.Color,
                    Notes = $"Exchange Return: {exchange.ExchangeNumber}",
                    TransactionDate = DateTime.UtcNow,
                    CreatedById = exchange.CreatedById
                };
                _context.StockTransactions.Add(stockTransaction);
            }
        }

        // Remove new items from inventory
        foreach (var newItem in newItems)
        {
            var product = await _context.Products.FindAsync(newItem.ProductId);
            if (product != null && product.TrackInventory)
            {
                // Update variant inventory if applicable
                if (newItem.VariantCombinationId.HasValue)
                {
                    var variant = await _context.ProductVariantCombinations
                        .FirstOrDefaultAsync(v => v.Id == newItem.VariantCombinationId.Value);
                    
                    if (variant != null)
                    {
                        if (variant.StockQuantity < newItem.Quantity)
                        {
                            throw new InvalidOperationException(
                                $"Insufficient stock for variant. Available: {variant.StockQuantity}, Required: {newItem.Quantity}");
                        }
                        variant.StockQuantity -= (int)newItem.Quantity;
                        variant.UpdatedAt = DateTime.UtcNow;
                    }
                }
                else
                {
                    // Update product-level inventory
                    await _inventoryService.UpdateInventoryAsync(
                        newItem.ProductId, 
                        tenantId, 
                        -(int)newItem.Quantity, 
                        null, 
                        true);
                }

                // Record stock transaction
                var stockTransaction = new StockTransaction
                {
                    TenantId = tenantId,
                    ProductId = newItem.ProductId,
                    VariantCombinationId = newItem.VariantCombinationId,
                    TransactionType = "Out",
                    Quantity = (int)newItem.Quantity,
                    ReferenceType = "Exchange",
                    ReferenceId = exchangeId,
                    Size = newItem.Size,
                    Color = newItem.Color,
                    Notes = $"Exchange Sale: {exchange.ExchangeNumber}",
                    TransactionDate = DateTime.UtcNow,
                    CreatedById = exchange.CreatedById
                };
                _context.StockTransactions.Add(stockTransaction);
            }
        }

        exchange.Status = "Processed";
        exchange.ProcessedAt = DateTime.UtcNow;

        // Update invoice balance if price difference is positive (customer owes more)
        if (exchange.PriceDifference > 0 && exchange.Invoice != null)
        {
            exchange.Invoice.BalanceAmount += exchange.PriceDifference;
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<decimal> CalculatePriceDifferenceAsync(SalesExchange exchange)
    {
        var originalTotal = exchange.Items
            .Where(i => i.Type == "Original")
            .Sum(i => i.TotalAmount);

        var newTotal = exchange.Items
            .Where(i => i.Type == "New")
            .Sum(i => i.TotalAmount);

        return newTotal - originalTotal; // Positive = customer pays more, Negative = customer gets refund
    }

    public async Task<bool> ValidateExchangeAsync(int invoiceItemId, string? oldSize, string? oldColor, string? newSize, string? newColor, int tenantId)
    {
        var invoiceItem = await _context.InvoiceItems
            .Include(ii => ii.Invoice)
            .FirstOrDefaultAsync(ii => ii.Id == invoiceItemId);

        if (invoiceItem == null || invoiceItem.Invoice?.TenantId != tenantId)
        {
            return false;
        }

        if (invoiceItem.Invoice.Status != "Completed")
        {
            return false;
        }

        // Check old size/color match
        if (!string.IsNullOrEmpty(oldSize) && invoiceItem.Size != oldSize)
        {
            return false;
        }

        if (!string.IsNullOrEmpty(oldColor) && invoiceItem.Color != oldColor)
        {
            return false;
        }

        return true;
    }

    private async Task<string> GenerateExchangeNumberAsync(int tenantId)
    {
        var year = DateTime.UtcNow.Year;
        var lastExchange = await _context.SalesExchanges
            .Where(se => se.TenantId == tenantId && se.ExchangeNumber.StartsWith($"EX-{year}"))
            .OrderByDescending(se => se.ExchangeNumber)
            .FirstOrDefaultAsync();

        int nextNumber = 1;
        if (lastExchange != null)
        {
            var parts = lastExchange.ExchangeNumber.Split('-');
            if (parts.Length >= 3 && int.TryParse(parts[^1], out var lastNum))
            {
                nextNumber = lastNum + 1;
            }
        }

        return $"EX-{year}-{nextNumber:D6}";
    }
}

