using Microsoft.EntityFrameworkCore;
using BillingAPI.Data;

namespace BillingAPI.Services;

public class ReportService : IReportService
{
    private readonly ApplicationDbContext _context;

    public ReportService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<SalesReport> GetSalesReportAsync(int tenantId, DateTime fromDate, DateTime toDate)
    {
        var invoices = await _context.Invoices
            .Where(i => i.TenantId == tenantId 
                && i.InvoiceDate >= fromDate 
                && i.InvoiceDate <= toDate
                && i.Status == "Completed")
            .ToListAsync();

        var report = new SalesReport
        {
            TotalSales = invoices.Sum(i => i.TotalAmount),
            TotalTax = invoices.Sum(i => i.TaxAmount),
            TotalDiscount = invoices.Sum(i => i.DiscountAmount),
            TotalInvoices = invoices.Count
        };

        var dailySales = invoices
            .GroupBy(i => i.InvoiceDate.Date)
            .Select(g => new DailySales
            {
                Date = g.Key,
                Amount = g.Sum(i => i.TotalAmount),
                InvoiceCount = g.Count()
            })
            .OrderBy(d => d.Date)
            .ToList();

        report.DailySales = dailySales;
        return report;
    }

    public async Task<ProductSalesReport> GetProductSalesReportAsync(int tenantId, DateTime fromDate, DateTime toDate)
    {
        var invoiceItems = await _context.InvoiceItems
            .Include(i => i.Invoice)
            .Include(i => i.Product)
            .Where(i => i.Invoice!.TenantId == tenantId
                && i.Invoice.InvoiceDate >= fromDate
                && i.Invoice.InvoiceDate <= toDate
                && i.Invoice.Status == "Completed")
            .ToListAsync();

        var items = invoiceItems
            .GroupBy(i => new { i.ProductId, i.ProductName })
            .Select(g => new ProductSalesItem
            {
                ProductId = g.Key.ProductId,
                ProductName = g.Key.ProductName,
                Quantity = g.Sum(i => i.Quantity),
                TotalAmount = g.Sum(i => i.TotalAmount)
            })
            .OrderByDescending(i => i.TotalAmount)
            .ToList();

        return new ProductSalesReport { Items = items };
    }

    public async Task<StockSummaryReport> GetStockSummaryAsync(int tenantId)
    {
        var inventories = await _context.Inventories
            .Include(i => i.Product)
            .Where(i => i.TenantId == tenantId && i.Product!.IsActive)
            .ToListAsync();

        var items = inventories.Select(i => new StockSummaryItem
        {
            ProductId = i.ProductId,
            ProductName = i.Product?.Name ?? "",
            Quantity = i.Quantity,
            AverageCost = i.AverageCost,
            TotalValue = i.Quantity * i.AverageCost,
            IsLowStock = i.Product != null && i.Product.LowStockAlert.HasValue && i.Quantity <= i.Product.LowStockAlert.Value
        }).ToList();

        return new StockSummaryReport
        {
            Items = items,
            LowStockCount = items.Count(i => i.IsLowStock),
            TotalValue = items.Sum(i => i.TotalValue)
        };
    }

    public async Task<CustomerLedgerReport> GetCustomerLedgerAsync(int tenantId, int customerId, DateTime? fromDate = null, DateTime? toDate = null)
    {
        var customer = await _context.Customers
            .FirstOrDefaultAsync(c => c.Id == customerId && c.TenantId == tenantId);

        if (customer == null)
            throw new Exception("Customer not found");

        var transactions = new List<LedgerTransaction>();
        decimal balance = 0;

        // Get invoices
        var invoicesQuery = _context.Invoices
            .Where(i => i.TenantId == tenantId && i.CustomerId == customerId);

        if (fromDate.HasValue)
            invoicesQuery = invoicesQuery.Where(i => i.InvoiceDate >= fromDate.Value);
        if (toDate.HasValue)
            invoicesQuery = invoicesQuery.Where(i => i.InvoiceDate <= toDate.Value);

        var invoices = await invoicesQuery.OrderBy(i => i.InvoiceDate).ToListAsync();
        foreach (var invoice in invoices)
        {
            balance += invoice.TotalAmount;
            transactions.Add(new LedgerTransaction
            {
                Date = invoice.InvoiceDate,
                Type = "Invoice",
                Reference = invoice.InvoiceNumber,
                Debit = invoice.TotalAmount,
                Credit = 0,
                Balance = balance
            });
        }

        // Get payments
        var paymentsQuery = _context.Payments
            .Include(p => p.Invoice)
            .Where(p => p.TenantId == tenantId && p.Invoice!.CustomerId == customerId);

        if (fromDate.HasValue)
            paymentsQuery = paymentsQuery.Where(p => p.PaymentDate >= fromDate.Value);
        if (toDate.HasValue)
            paymentsQuery = paymentsQuery.Where(p => p.PaymentDate <= toDate.Value);

        var payments = await paymentsQuery.OrderBy(p => p.PaymentDate).ToListAsync();
        foreach (var payment in payments)
        {
            balance -= payment.Amount;
            transactions.Add(new LedgerTransaction
            {
                Date = payment.PaymentDate,
                Type = "Payment",
                Reference = payment.Invoice?.InvoiceNumber ?? "",
                Debit = 0,
                Credit = payment.Amount,
                Balance = balance
            });
        }

        return new CustomerLedgerReport
        {
            Customer = customer,
            OpeningBalance = 0, // TODO: Calculate from before fromDate
            TotalDebit = transactions.Sum(t => t.Debit),
            TotalCredit = transactions.Sum(t => t.Credit),
            ClosingBalance = balance,
            Transactions = transactions.OrderBy(t => t.Date).ToList()
        };
    }

    public async Task<TaxSummaryReport> GetTaxSummaryAsync(int tenantId, DateTime fromDate, DateTime toDate)
    {
        var invoiceItems = await _context.InvoiceItems
            .Include(i => i.Invoice)
            .Where(i => i.Invoice!.TenantId == tenantId
                && i.Invoice.InvoiceDate >= fromDate
                && i.Invoice.InvoiceDate <= toDate
                && i.Invoice.Status == "Completed")
            .ToListAsync();

        var taxGroups = invoiceItems
            .GroupBy(i => new { TaxRate = i.TaxRate })
            .Select(g => new TaxSummaryItem
            {
                TaxName = $"GST {g.Key.TaxRate}%",
                TaxRate = g.Key.TaxRate,
                TaxableAmount = g.Sum(i => i.UnitPrice * i.Quantity - i.DiscountAmount),
                TaxAmount = g.Sum(i => i.TaxAmount)
            })
            .ToList();

        return new TaxSummaryReport
        {
            Items = taxGroups,
            TotalTaxableAmount = taxGroups.Sum(t => t.TaxableAmount),
            TotalTaxAmount = taxGroups.Sum(t => t.TaxAmount)
        };
    }

    public async Task<ProfitLossReport> GetProfitLossReportAsync(int tenantId, DateTime fromDate, DateTime toDate)
    {
        var invoices = await _context.Invoices
            .Include(i => i.Items)
            .ThenInclude(item => item.Product)
            .Where(i => i.TenantId == tenantId
                && i.InvoiceDate >= fromDate
                && i.InvoiceDate <= toDate
                && i.Status == "Completed")
            .ToListAsync();

        var totalRevenue = invoices.Sum(i => i.TotalAmount);
        var totalCost = invoices
            .SelectMany(i => i.Items)
            .Sum(item => (item.Product?.CostPrice ?? 0) * item.Quantity);

        var grossProfit = totalRevenue - totalCost;
        var grossProfitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

        // TODO: Add expenses from a separate expenses table
        var totalExpenses = 0m;
        var netProfit = grossProfit - totalExpenses;
        var netProfitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

        return new ProfitLossReport
        {
            TotalRevenue = totalRevenue,
            TotalCostOfGoodsSold = totalCost,
            GrossProfit = grossProfit,
            GrossProfitMargin = grossProfitMargin,
            TotalExpenses = totalExpenses,
            NetProfit = netProfit,
            NetProfitMargin = netProfitMargin,
            RevenueItems = new List<RevenueItem>
            {
                new RevenueItem { Category = "Sales", Amount = totalRevenue }
            },
            ExpenseItems = new List<ExpenseItem>()
        };
    }

    public async Task<PaymentModeReport> GetPaymentModeReportAsync(int tenantId, DateTime fromDate, DateTime toDate)
    {
        var payments = await _context.Payments
            .Include(p => p.Invoice)
            .Where(p => p.TenantId == tenantId
                && p.PaymentDate >= fromDate
                && p.PaymentDate <= toDate
                && p.Invoice!.Status == "Completed")
            .ToListAsync();

        var totalAmount = payments.Sum(p => p.Amount);
        var items = payments
            .GroupBy(p => p.PaymentMode)
            .Select(g => new PaymentModeItem
            {
                PaymentMode = g.Key,
                Amount = g.Sum(p => p.Amount),
                Count = g.Count(),
                Percentage = totalAmount > 0 ? (g.Sum(p => p.Amount) / totalAmount) * 100 : 0
            })
            .OrderByDescending(i => i.Amount)
            .ToList();

        return new PaymentModeReport
        {
            Items = items,
            TotalAmount = totalAmount
        };
    }
}

