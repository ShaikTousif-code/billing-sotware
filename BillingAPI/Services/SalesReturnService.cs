using Microsoft.EntityFrameworkCore;
using BillingAPI.Data;
using BillingAPI.Models;

namespace BillingAPI.Services;

public class SalesReturnService : ISalesReturnService
{
    private readonly ApplicationDbContext _context;
    private readonly ICreditNoteService _creditNoteService;
    private readonly IInventoryService _inventoryService;

    public SalesReturnService(ApplicationDbContext context, ICreditNoteService creditNoteService, IInventoryService inventoryService)
    {
        _context = context;
        _creditNoteService = creditNoteService;
        _inventoryService = inventoryService;
    }

    public async Task<List<SalesReturn>> GetSalesReturnsAsync(int tenantId, DateTime? fromDate = null, DateTime? toDate = null)
    {
        var query = _context.SalesReturns
            .Include(sr => sr.Invoice)
            .Include(sr => sr.Items)
            .ThenInclude(item => item.Product)
            .Where(sr => sr.TenantId == tenantId);

        if (fromDate.HasValue)
        {
            query = query.Where(sr => sr.ReturnDate >= fromDate.Value);
        }

        if (toDate.HasValue)
        {
            query = query.Where(sr => sr.ReturnDate <= toDate.Value);
        }

        return await query.OrderByDescending(sr => sr.ReturnDate).ToListAsync();
    }

    public async Task<SalesReturn?> GetSalesReturnByIdAsync(int id, int tenantId)
    {
        return await _context.SalesReturns
            .Include(sr => sr.Invoice)
            .Include(sr => sr.Items)
            .ThenInclude(item => item.Product)
            .Include(sr => sr.CreditNote)
            .FirstOrDefaultAsync(sr => sr.Id == id && sr.TenantId == tenantId);
    }

    public async Task<List<SalesReturn>> GetSalesReturnsByInvoiceIdAsync(int invoiceId, int tenantId)
    {
        return await _context.SalesReturns
            .Include(sr => sr.Items)
            .Where(sr => sr.InvoiceId == invoiceId && sr.TenantId == tenantId)
            .OrderByDescending(sr => sr.ReturnDate)
            .ToListAsync();
    }

    public async Task<SalesReturn> CreateSalesReturnAsync(SalesReturn salesReturn)
    {
        // Validate invoice exists and is completed
        var invoice = await _context.Invoices
            .Include(i => i.Items)
            .FirstOrDefaultAsync(i => i.Id == salesReturn.InvoiceId && i.TenantId == salesReturn.TenantId);

        if (invoice == null)
        {
            throw new InvalidOperationException("Invoice not found.");
        }

        if (invoice.Status != "Completed")
        {
            throw new InvalidOperationException("Can only return items from completed invoices.");
        }

        // Validate return items
        foreach (var returnItem in salesReturn.Items)
        {
            var invoiceItem = invoice.Items.FirstOrDefault(i => i.Id == returnItem.InvoiceItemId);
            if (invoiceItem == null)
            {
                throw new InvalidOperationException($"Invoice item {returnItem.InvoiceItemId} not found in invoice.");
            }

            // Check if size/color match if variant was used
            if (!string.IsNullOrEmpty(returnItem.Size) && invoiceItem.Size != returnItem.Size)
            {
                throw new InvalidOperationException($"Size mismatch for invoice item {returnItem.InvoiceItemId}.");
            }

            if (!string.IsNullOrEmpty(returnItem.Color) && invoiceItem.Color != returnItem.Color)
            {
                throw new InvalidOperationException($"Color mismatch for invoice item {returnItem.InvoiceItemId}.");
            }

            // Check if quantity is valid
            if (returnItem.Quantity > invoiceItem.Quantity)
            {
                throw new InvalidOperationException($"Return quantity ({returnItem.Quantity}) cannot exceed invoice quantity ({invoiceItem.Quantity}) for item {returnItem.InvoiceItemId}.");
            }

            // Check already returned quantity
            var alreadyReturned = await _context.SalesReturnItems
                .Where(sri => sri.InvoiceItemId == returnItem.InvoiceItemId && sri.SalesReturn.Status == "Processed")
                .SumAsync(sri => sri.Quantity);

            if (alreadyReturned + returnItem.Quantity > invoiceItem.Quantity)
            {
                throw new InvalidOperationException($"Total return quantity ({alreadyReturned + returnItem.Quantity}) exceeds invoice quantity ({invoiceItem.Quantity}) for item {returnItem.InvoiceItemId}.");
            }

            // Populate product details
            returnItem.ProductName = invoiceItem.ProductName;
            returnItem.ProductId = invoiceItem.ProductId;
            returnItem.UnitPrice = invoiceItem.UnitPrice;
            returnItem.TotalAmount = returnItem.Quantity * returnItem.UnitPrice;
        }

        // Generate return number
        if (string.IsNullOrEmpty(salesReturn.ReturnNumber))
        {
            salesReturn.ReturnNumber = await GenerateReturnNumberAsync(salesReturn.TenantId);
        }

        // Calculate total
        salesReturn.TotalAmount = salesReturn.Items.Sum(i => i.TotalAmount);
        salesReturn.CreatedAt = DateTime.UtcNow;

        _context.SalesReturns.Add(salesReturn);
        await _context.SaveChangesAsync();
        return salesReturn;
    }

    public async Task<bool> ApproveSalesReturnAsync(int returnId, int tenantId)
    {
        var salesReturn = await _context.SalesReturns
            .FirstOrDefaultAsync(sr => sr.Id == returnId && sr.TenantId == tenantId);

        if (salesReturn == null) return false;

        if (salesReturn.Status != "Pending")
        {
            throw new InvalidOperationException($"Cannot approve return. Current status: {salesReturn.Status}");
        }

        salesReturn.Status = "Approved";
        salesReturn.ApprovedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ProcessSalesReturnAsync(int returnId, int tenantId)
    {
        var salesReturn = await _context.SalesReturns
            .Include(sr => sr.Items)
            .ThenInclude(item => item.InvoiceItem)
            .Include(sr => sr.Invoice)
            .FirstOrDefaultAsync(sr => sr.Id == returnId && sr.TenantId == tenantId);

        if (salesReturn == null) return false;

        if (salesReturn.Status != "Approved" && salesReturn.Status != "Pending")
        {
            throw new InvalidOperationException($"Cannot process return. Current status: {salesReturn.Status}");
        }

        // Update inventory for each returned item
        foreach (var returnItem in salesReturn.Items)
        {
            var product = await _context.Products.FindAsync(returnItem.ProductId);
            if (product != null && product.TrackInventory)
            {
                // Update variant inventory if applicable
                if (returnItem.VariantCombinationId.HasValue)
                {
                    var variant = await _context.ProductVariantCombinations
                        .FirstOrDefaultAsync(v => v.Id == returnItem.VariantCombinationId.Value);
                    
                    if (variant != null)
                    {
                        variant.StockQuantity += (int)returnItem.Quantity;
                        variant.UpdatedAt = DateTime.UtcNow;
                    }
                }
                else
                {
                    // Update product-level inventory
                    await _inventoryService.UpdateInventoryAsync(
                        returnItem.ProductId, 
                        tenantId, 
                        (int)returnItem.Quantity, 
                        null, 
                        true);
                }

                // Record stock transaction
                var stockTransaction = new StockTransaction
                {
                    TenantId = tenantId,
                    ProductId = returnItem.ProductId,
                    VariantCombinationId = returnItem.VariantCombinationId,
                    TransactionType = "In",
                    Quantity = (int)returnItem.Quantity,
                    ReferenceType = "Return",
                    ReferenceId = returnId,
                    Size = returnItem.Size,
                    Color = returnItem.Color,
                    Notes = $"Return: {salesReturn.ReturnNumber}",
                    TransactionDate = DateTime.UtcNow,
                    CreatedById = salesReturn.CreatedById
                };
                _context.StockTransactions.Add(stockTransaction);
            }
        }

        // Create credit note
        var creditNote = new CreditNote
        {
            TenantId = tenantId,
            InvoiceId = salesReturn.InvoiceId,
            CreditNoteDate = DateTime.UtcNow,
            Reason = salesReturn.Reason,
            Status = "Processed",
            Notes = $"Created from Sales Return {salesReturn.ReturnNumber}",
            CreatedById = salesReturn.CreatedById
        };

        foreach (var returnItem in salesReturn.Items)
        {
            var invoiceItem = returnItem.InvoiceItem;
            if (invoiceItem != null)
            {
                creditNote.Items.Add(new CreditNoteItem
                {
                    InvoiceItemId = returnItem.InvoiceItemId,
                    ProductId = returnItem.ProductId,
                    ProductName = returnItem.ProductName,
                    Quantity = returnItem.Quantity,
                    UnitPrice = returnItem.UnitPrice,
                    TaxAmount = (returnItem.TotalAmount * invoiceItem.TaxRate) / 100,
                    TotalAmount = returnItem.TotalAmount
                });
            }
        }

        creditNote.Amount = creditNote.Items.Sum(i => i.TotalAmount - i.TaxAmount);
        creditNote.TaxAmount = creditNote.Items.Sum(i => i.TaxAmount);
        creditNote.TotalAmount = creditNote.Items.Sum(i => i.TotalAmount);

        await _creditNoteService.CreateCreditNoteAsync(creditNote);

        // Link credit note to return
        salesReturn.CreditNoteId = creditNote.Id;
        salesReturn.Status = "Processed";
        salesReturn.ProcessedAt = DateTime.UtcNow;

        // Update invoice balance
        if (salesReturn.Invoice != null)
        {
            salesReturn.Invoice.BalanceAmount -= creditNote.TotalAmount;
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ValidateReturnAsync(int invoiceItemId, decimal quantity, string? size, string? color, int tenantId)
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

        // Check size/color match if variant was used
        if (!string.IsNullOrEmpty(size) && invoiceItem.Size != size)
        {
            return false;
        }

        if (!string.IsNullOrEmpty(color) && invoiceItem.Color != color)
        {
            return false;
        }

        // Check quantity
        if (quantity > invoiceItem.Quantity)
        {
            return false;
        }

        // Check already returned quantity
        var alreadyReturned = await _context.SalesReturnItems
            .Where(sri => sri.InvoiceItemId == invoiceItemId && sri.SalesReturn.Status == "Processed")
            .SumAsync(sri => (decimal?)sri.Quantity) ?? 0;

        return (alreadyReturned + quantity) <= invoiceItem.Quantity;
    }

    private async Task<string> GenerateReturnNumberAsync(int tenantId)
    {
        var year = DateTime.UtcNow.Year;
        var lastReturn = await _context.SalesReturns
            .Where(sr => sr.TenantId == tenantId && sr.ReturnNumber.StartsWith($"SR-{year}"))
            .OrderByDescending(sr => sr.ReturnNumber)
            .FirstOrDefaultAsync();

        int nextNumber = 1;
        if (lastReturn != null)
        {
            var parts = lastReturn.ReturnNumber.Split('-');
            if (parts.Length >= 3 && int.TryParse(parts[^1], out var lastNum))
            {
                nextNumber = lastNum + 1;
            }
        }

        return $"SR-{year}-{nextNumber:D6}";
    }
}

