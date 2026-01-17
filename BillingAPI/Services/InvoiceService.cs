using Microsoft.EntityFrameworkCore;
using BillingAPI.Data;
using BillingAPI.Models;

namespace BillingAPI.Services;

public class InvoiceService : IInvoiceService
{
    private readonly ApplicationDbContext _context;

    public InvoiceService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<Invoice>> GetInvoicesAsync(int tenantId, DateTime? fromDate = null, DateTime? toDate = null)
    {
        var query = _context.Invoices
            .Include(i => i.Customer)
            .Include(i => i.Items)
            .ThenInclude(item => item.Product)
            .Where(i => i.TenantId == tenantId);

        if (fromDate.HasValue)
        {
            query = query.Where(i => i.InvoiceDate >= fromDate.Value);
        }

        if (toDate.HasValue)
        {
            query = query.Where(i => i.InvoiceDate <= toDate.Value);
        }

        return await query.OrderByDescending(i => i.InvoiceDate).ToListAsync();
    }

    public async Task<Invoice?> GetInvoiceByIdAsync(int id, int tenantId)
    {
        var invoice = await _context.Invoices
            .Include(i => i.Customer)
            .Include(i => i.Items)
            .ThenInclude(item => item.Product)
            .Include(i => i.Payments)
            .FirstOrDefaultAsync(i => i.Id == id && i.TenantId == tenantId);
        
        if (invoice != null)
        {
            // Sync PaidAmount with actual payments
            var actualPaidAmount = invoice.Payments?.Sum(p => p.Amount) ?? 0;
            if (Math.Abs(invoice.PaidAmount - actualPaidAmount) > 0.01m)
            {
                invoice.PaidAmount = actualPaidAmount;
                invoice.BalanceAmount = invoice.TotalAmount - invoice.PaidAmount;
                if (invoice.BalanceAmount <= 0 && invoice.Status != "Cancelled")
                {
                    invoice.Status = "Completed";
                }
                await _context.SaveChangesAsync();
            }
        }
        
        return invoice;
    }

    public async Task<Invoice> CreateInvoiceAsync(Invoice invoice)
    {
        // Load customer if provided
        Customer? customer = null;
        if (invoice.CustomerId.HasValue)
        {
            customer = await _context.Customers
                .Include(c => c.CustomerGroup)
                .FirstOrDefaultAsync(c => c.Id == invoice.CustomerId.Value && c.TenantId == invoice.TenantId);
        }

        // Determine customer type (B2B or B2C)
        var customerType = customer?.CustomerType ?? "B2C";
        invoice.IsTaxInvoice = customerType == "B2B" && !string.IsNullOrEmpty(customer?.GSTIN);

        // Populate product details in invoice items, apply pricing, and validate
        foreach (var item in invoice.Items)
        {
            if (item.ProductId > 0)
            {
                var product = await _context.Products
                    .FirstOrDefaultAsync(p => p.Id == item.ProductId && p.TenantId == invoice.TenantId);

                if (product == null)
                {
                    throw new InvalidOperationException($"Product with ID {item.ProductId} not found");
                }

                // Populate product name if not already set
                if (string.IsNullOrWhiteSpace(item.ProductName))
                {
                    item.ProductName = product.Name;
                }

                // Apply bulk pricing based on customer type and quantity
                var unitPrice = await GetBulkPriceAsync(invoice.TenantId, item.ProductId, item.Quantity, customerType, customer?.CustomerGroupId);
                if (unitPrice.HasValue && unitPrice.Value > 0)
                {
                    item.UnitPrice = unitPrice.Value;
                }
                else
                {
                    // Use product selling price if no bulk pricing found
                    item.UnitPrice = product.SellingPrice;
                }

                // Apply customer group discount for B2C
                if (customerType == "B2C" && customer?.CustomerGroup?.DiscountPercentage.HasValue == true)
                {
                    var discount = item.UnitPrice * item.Quantity * (customer.CustomerGroup.DiscountPercentage.Value / 100);
                    item.DiscountAmount += discount;
                }

                // Populate tax rate from product if not set
                if (item.TaxRate == 0 && product.TaxRate.HasValue)
                {
                    item.TaxRate = product.TaxRate.Value;
                }

                // Validate stock availability for products with inventory tracking
                if (invoice.Status == "Completed" && product.TrackInventory)
                {
                    var availableStock = product.StockQuantity ?? 0;
                    if (availableStock < item.Quantity)
                    {
                        throw new InvalidOperationException(
                            $"Insufficient stock for product '{product.Name}'. Available: {availableStock}, Required: {item.Quantity}");
                    }
                }
            }
        }

        // Validate credit limit for B2B customers
        if (customerType == "B2B" && customer != null && invoice.Status == "Completed")
        {
            var newOutstanding = customer.OutstandingBalance + invoice.TotalAmount - invoice.PaidAmount;
            if (customer.CreditLimit > 0 && newOutstanding > customer.CreditLimit)
            {
                throw new InvalidOperationException(
                    $"Credit limit exceeded for customer '{customer.Name}'. Credit Limit: {customer.CreditLimit}, " +
                    $"Current Outstanding: {customer.OutstandingBalance}, Invoice Amount: {invoice.TotalAmount - invoice.PaidAmount}, " +
                    $"Total After Invoice: {newOutstanding}");
            }
        }

        // Set payment terms and due date for B2B
        if (customerType == "B2B" && customer != null)
        {
            invoice.PaymentTerms = customer.PaymentTerms ?? "Net 30";
            if (customer.CreditDays.HasValue && customer.CreditDays.Value > 0)
            {
                invoice.DueDate = invoice.InvoiceDate.AddDays(customer.CreditDays.Value);
            }
            else
            {
                // Default to 30 days if not specified
                invoice.DueDate = invoice.InvoiceDate.AddDays(30);
            }
        }

        // Generate invoice number if not provided
        if (string.IsNullOrEmpty(invoice.InvoiceNumber))
        {
            invoice.InvoiceNumber = await GenerateInvoiceNumberAsync(invoice.TenantId);
        }

        // Calculate totals
        CalculateInvoiceTotals(invoice);

        // Calculate loyalty points for B2C (if applicable)
        if (customerType == "B2C" && customer != null)
        {
            // Earn 1 point per ₹100 spent (configurable)
            var pointsEarned = Math.Floor(invoice.TotalAmount / 100);
            invoice.LoyaltyPointsEarned = pointsEarned;
        }

        _context.Invoices.Add(invoice);
        await _context.SaveChangesAsync();

        // Update customer outstanding balance and loyalty points for completed invoices
        if (invoice.Status == "Completed" && customer != null)
        {
            if (customerType == "B2B")
            {
                customer.OutstandingBalance += invoice.BalanceAmount;
            }
            else if (customerType == "B2C")
            {
                customer.LoyaltyPoints += invoice.LoyaltyPointsEarned;
                customer.LoyaltyPointsEarned += invoice.LoyaltyPointsEarned;
            }
            await _context.SaveChangesAsync();
        }

        // Update inventory for completed invoices immediately when generated
        if (invoice.Status == "Completed")
        {
            await UpdateInventoryForInvoiceAsync(invoice);
            await _context.SaveChangesAsync();
        }

        return invoice;
    }

    private async Task<decimal?> GetBulkPriceAsync(int tenantId, int productId, decimal quantity, string customerType, int? customerGroupId)
    {
        try
        {
            // Check if BulkPricings table exists (for backward compatibility)
            var bulkPricing = await _context.BulkPricings
                .Where(bp => bp.TenantId == tenantId 
                    && bp.ProductId == productId 
                    && bp.CustomerType == customerType
                    && bp.IsActive
                    && bp.MinQuantity <= quantity
                    && (bp.MaxQuantity == null || bp.MaxQuantity >= quantity)
                    && (customerType == "B2C" ? (bp.CustomerGroupId == null || bp.CustomerGroupId == customerGroupId) : true))
                .OrderByDescending(bp => bp.MinQuantity) // Get the highest applicable tier
                .FirstOrDefaultAsync();

        if (bulkPricing != null)
        {
            if (bulkPricing.DiscountPercentage.HasValue)
            {
                // Apply discount percentage to base price
                var product = await _context.Products.FindAsync(productId);
                var basePrice = product?.SellingPrice ?? bulkPricing.UnitPrice;
                return basePrice * (1 - bulkPricing.DiscountPercentage.Value / 100);
            }
            return bulkPricing.UnitPrice;
        }

            return null;
        }
        catch (Exception)
        {
            // If BulkPricings table doesn't exist yet, return null (use default pricing)
            // This allows the API to work before migration is applied
            return null;
        }
    }

    public async Task<Invoice> UpdateInvoiceAsync(Invoice invoice)
    {
        // Load current invoice with items to compare
        var currentInvoice = await _context.Invoices
            .Include(i => i.Items)
            .AsNoTracking()
            .FirstOrDefaultAsync(i => i.Id == invoice.Id && i.TenantId == invoice.TenantId);

        if (currentInvoice == null)
        {
            throw new InvalidOperationException("Invoice not found");
        }

        var wasCompleted = currentInvoice.Status == "Completed";
        var isNowCompleted = invoice.Status == "Completed";

        // Populate product details and validate stock availability if status is changing to Completed
        if (!wasCompleted && isNowCompleted)
        {
            foreach (var item in invoice.Items)
            {
                if (item.ProductId > 0)
                {
                    var product = await _context.Products
                        .FirstOrDefaultAsync(p => p.Id == item.ProductId && p.TenantId == invoice.TenantId);

                    if (product == null)
                    {
                        throw new InvalidOperationException($"Product with ID {item.ProductId} not found");
                    }

                    // Populate product name if not already set
                    if (string.IsNullOrWhiteSpace(item.ProductName))
                    {
                        item.ProductName = product.Name;
                    }

                    // Validate stock availability
                    if (product.TrackInventory)
                    {
                        var availableStock = product.StockQuantity ?? 0;
                        if (availableStock < item.Quantity)
                        {
                            throw new InvalidOperationException(
                                $"Insufficient stock for product '{product.Name}'. Available: {availableStock}, Required: {item.Quantity}");
                        }
                    }
                }
            }
        }

        CalculateInvoiceTotals(invoice);

        // If status is being set to Completed, ensure balanceAmount is 0 and paidAmount equals totalAmount
        if (isNowCompleted && invoice.BalanceAmount > 0)
        {
            // If balanceAmount > 0 but status is Completed, it means payment was made
            // Ensure paidAmount = totalAmount and balanceAmount = 0
            if (invoice.PaidAmount < invoice.TotalAmount)
            {
                invoice.PaidAmount = invoice.TotalAmount;
            }
            invoice.BalanceAmount = 0;
        }

        // Check if inventory has already been processed for this invoice
        var hasInventoryTransactions = await _context.StockTransactions
            .AnyAsync(st => st.ReferenceType == "Sale" && st.ReferenceId == invoice.Id);

        // Only update inventory when status changes to Completed and inventory hasn't been processed yet
        if (!wasCompleted && isNowCompleted && !hasInventoryTransactions)
        {
            await UpdateInventoryForInvoiceAsync(invoice);
        }
        // If invoice was completed and is being changed back to draft, reverse inventory
        else if (wasCompleted && !isNowCompleted && hasInventoryTransactions)
        {
            await ReverseInventoryForInvoiceAsync(currentInvoice);
        }

        _context.Invoices.Update(invoice);
        await _context.SaveChangesAsync();
        return invoice;
    }

    public async Task<bool> CancelInvoiceAsync(int id, int tenantId, string reason)
    {
        var invoice = await _context.Invoices
            .Include(i => i.Items)
            .FirstOrDefaultAsync(i => i.Id == id && i.TenantId == tenantId);

        if (invoice == null || invoice.Status == "Cancelled")
            return false;

        var wasActive = invoice.Status != "Cancelled";
        invoice.Status = "Cancelled";
        invoice.CancelledAt = DateTime.UtcNow;
        invoice.CancellationReason = reason;

        // Reverse inventory for any active invoice
        if (wasActive)
        {
            await ReverseInventoryForInvoiceAsync(invoice);
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<string> GenerateInvoiceNumberAsync(int tenantId)
    {
        var config = await _context.TenantConfigurations
            .FirstOrDefaultAsync(c => c.TenantId == tenantId);

        var prefix = config?.InvoicePrefix ?? "INV";
        var year = DateTime.UtcNow.Year;
        var lastInvoice = await _context.Invoices
            .Where(i => i.TenantId == tenantId && i.InvoiceNumber.StartsWith($"{prefix}-{year}"))
            .OrderByDescending(i => i.InvoiceNumber)
            .FirstOrDefaultAsync();

        int nextNumber = 1;
        if (lastInvoice != null)
        {
            var parts = lastInvoice.InvoiceNumber.Split('-');
            if (parts.Length >= 3 && int.TryParse(parts[^1], out var lastNumber))
            {
                nextNumber = lastNumber + 1;
            }
        }

        return $"{prefix}-{year}-{nextNumber:D6}";
    }

    private void CalculateInvoiceTotals(Invoice invoice)
    {
        invoice.SubTotal = invoice.Items.Sum(i => i.UnitPrice * i.Quantity - i.DiscountAmount);
        invoice.TaxAmount = invoice.Items.Sum(i => i.TaxAmount);
        invoice.DiscountAmount = invoice.Items.Sum(i => i.DiscountAmount);
        
        // Calculate total before service charge and tips
        var totalBeforeCharges = invoice.SubTotal + invoice.TaxAmount - invoice.DiscountAmount - invoice.BillLevelDiscount;
        
        // Add service charge and tips (for restaurant/hotel)
        invoice.TotalAmount = totalBeforeCharges + invoice.ServiceCharge + invoice.Tips;
        
        invoice.RoundOff = Math.Round(invoice.TotalAmount, 0, MidpointRounding.AwayFromZero) - invoice.TotalAmount;
        invoice.TotalAmount += invoice.RoundOff;
        invoice.BalanceAmount = invoice.TotalAmount - invoice.PaidAmount;
    }

    private async Task UpdateInventoryForInvoiceAsync(Invoice invoice)
    {
        foreach (var item in invoice.Items)
        {
            // Load the product to check if inventory tracking is enabled and update stock quantity
            var product = await _context.Products
                .FirstOrDefaultAsync(p => p.Id == item.ProductId && p.TenantId == invoice.TenantId);

            if (product?.TrackInventory == true)
            {
                var quantityToDeduct = (int)item.Quantity;
                
                // Initialize StockQuantity if null
                if (!product.StockQuantity.HasValue)
                {
                    product.StockQuantity = 0;
                }

                // Update product stock quantity
                product.StockQuantity -= quantityToDeduct;
                product.UpdatedAt = DateTime.UtcNow;

                // Also update/create inventory record for detailed tracking
                var inventory = await _context.Inventories
                    .FirstOrDefaultAsync(inv => inv.TenantId == invoice.TenantId && inv.ProductId == item.ProductId);

                if (inventory != null)
                {
                    // Update inventory quantity (should match product stock quantity)
                    inventory.Quantity = product.StockQuantity.Value;
                    inventory.LastUpdatedAt = DateTime.UtcNow;
                }
                else
                {
                    // Create inventory record if it doesn't exist
                    var newInventory = new Inventory
                    {
                        TenantId = invoice.TenantId,
                        ProductId = item.ProductId,
                        Quantity = product.StockQuantity.Value, // Actual stock quantity after deduction
                        AverageCost = product.CostPrice,
                        LastUpdatedAt = DateTime.UtcNow
                    };
                    _context.Inventories.Add(newInventory);
                }

                // Create stock transaction
                var transaction = new StockTransaction
                {
                    TenantId = invoice.TenantId,
                    ProductId = item.ProductId,
                    TransactionType = "Out",
                    Quantity = quantityToDeduct,
                    UnitCost = product.CostPrice,
                    ReferenceType = "Sale",
                    ReferenceId = invoice.Id,
                    Notes = $"Invoice: {invoice.InvoiceNumber}",
                    TransactionDate = DateTime.UtcNow,
                    CreatedById = invoice.CreatedById
                };
                _context.StockTransactions.Add(transaction);
            }
        }
    }

    private async Task ReverseInventoryForInvoiceAsync(Invoice invoice)
    {
        foreach (var item in invoice.Items)
        {
            // Load the product to check if inventory tracking is enabled and restore stock quantity
            var product = await _context.Products
                .FirstOrDefaultAsync(p => p.Id == item.ProductId && p.TenantId == invoice.TenantId);

            if (product?.TrackInventory == true)
            {
                var quantityToRestore = (int)item.Quantity;
                
                // Initialize StockQuantity if null
                if (!product.StockQuantity.HasValue)
                {
                    product.StockQuantity = 0;
                }

                // Restore product stock quantity
                product.StockQuantity += quantityToRestore;
                product.UpdatedAt = DateTime.UtcNow;

                // Also restore inventory record (keep it in sync with product stock)
                var inventory = await _context.Inventories
                    .FirstOrDefaultAsync(inv => inv.TenantId == invoice.TenantId && inv.ProductId == item.ProductId);

                if (inventory != null)
                {
                    // Update inventory quantity to match product stock quantity
                    inventory.Quantity = product.StockQuantity.Value;
                    inventory.LastUpdatedAt = DateTime.UtcNow;
                }
                else
                {
                    // Create inventory record if it doesn't exist
                    var newInventory = new Inventory
                    {
                        TenantId = invoice.TenantId,
                        ProductId = item.ProductId,
                        Quantity = product.StockQuantity.Value,
                        AverageCost = product.CostPrice,
                        LastUpdatedAt = DateTime.UtcNow
                    };
                    _context.Inventories.Add(newInventory);
                }

                // Create stock transaction for reversal
                var transaction = new StockTransaction
                {
                    TenantId = invoice.TenantId,
                    ProductId = item.ProductId,
                    TransactionType = "In",
                    Quantity = quantityToRestore,
                    UnitCost = product.CostPrice,
                    ReferenceType = "Sale Reversal",
                    ReferenceId = invoice.Id,
                    Notes = $"Invoice Cancelled: {invoice.InvoiceNumber}",
                    TransactionDate = DateTime.UtcNow,
                    CreatedById = invoice.CreatedById
                };
                _context.StockTransactions.Add(transaction);
            }
        }
    }
}

