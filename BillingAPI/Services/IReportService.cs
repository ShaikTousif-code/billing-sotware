using BillingAPI.Models;

namespace BillingAPI.Services;

public interface IReportService
{
    Task<SalesReport> GetSalesReportAsync(int tenantId, DateTime fromDate, DateTime toDate);
    Task<ProductSalesReport> GetProductSalesReportAsync(int tenantId, DateTime fromDate, DateTime toDate, int? productId = null);
    Task<StockSummaryReport> GetStockSummaryAsync(int tenantId);
    Task<CustomerLedgerReport> GetCustomerLedgerAsync(int tenantId, int customerId, DateTime? fromDate = null, DateTime? toDate = null);
    Task<TaxSummaryReport> GetTaxSummaryAsync(int tenantId, DateTime fromDate, DateTime toDate);
    Task<ProfitLossReport> GetProfitLossReportAsync(int tenantId, DateTime fromDate, DateTime toDate);
    Task<PaymentModeReport> GetPaymentModeReportAsync(int tenantId, DateTime fromDate, DateTime toDate);
}

public class SalesReport
{
    public decimal TotalSales { get; set; }
    public decimal TotalTax { get; set; }
    public decimal TotalDiscount { get; set; }
    public int TotalInvoices { get; set; }
    public decimal? TotalCost { get; set; }
    public decimal? TotalProfit { get; set; }
    public List<DailySales> DailySales { get; set; } = new();
}

public class DailySales
{
    public DateTime Date { get; set; }
    public decimal Amount { get; set; }
    public int InvoiceCount { get; set; }
}

public class ProductSalesReport
{
    public List<ProductSalesItem> Items { get; set; } = new();
}

public class ProductSalesItem
{
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal TotalCost { get; set; }
    public decimal Profit { get; set; }
}

public class StockSummaryReport
{
    public List<StockSummaryItem> Items { get; set; } = new();
    public int LowStockCount { get; set; }
    public decimal TotalValue { get; set; }
}

public class StockSummaryItem
{
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal AverageCost { get; set; }
    public decimal TotalValue { get; set; }
    public bool IsLowStock { get; set; }
}

public class CustomerLedgerReport
{
    public Customer? Customer { get; set; }
    public decimal OpeningBalance { get; set; }
    public decimal TotalDebit { get; set; }
    public decimal TotalCredit { get; set; }
    public decimal ClosingBalance { get; set; }
    public List<LedgerTransaction> Transactions { get; set; } = new();
}

public class LedgerTransaction
{
    public DateTime Date { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Reference { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Debit { get; set; }
    public decimal Credit { get; set; }
    public decimal Balance { get; set; }
}

public class TaxSummaryReport
{
    public List<TaxSummaryItem> Items { get; set; } = new();
    public decimal TotalTaxableAmount { get; set; }
    public decimal TotalTaxAmount { get; set; }
}

public class TaxSummaryItem
{
    public string TaxName { get; set; } = string.Empty;
    public decimal TaxRate { get; set; }
    public decimal TaxableAmount { get; set; }
    public decimal TaxAmount { get; set; }
}

public class ProfitLossReport
{
    public decimal TotalRevenue { get; set; }
    public decimal TotalCostOfGoodsSold { get; set; }
    public decimal GrossProfit { get; set; }
    public decimal GrossProfitMargin { get; set; }
    public decimal TotalExpenses { get; set; }
    public decimal NetProfit { get; set; }
    public decimal NetProfitMargin { get; set; }
    public List<RevenueItem> RevenueItems { get; set; } = new();
    public List<ExpenseItem> ExpenseItems { get; set; } = new();
}

public class RevenueItem
{
    public string Category { get; set; } = string.Empty;
    public decimal Amount { get; set; }
}

public class ExpenseItem
{
    public string Category { get; set; } = string.Empty;
    public decimal Amount { get; set; }
}

public class PaymentModeReport
{
    public List<PaymentModeItem> Items { get; set; } = new();
    public decimal TotalAmount { get; set; }
}

public class PaymentModeItem
{
    public string PaymentMode { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public int Count { get; set; }
    public decimal Percentage { get; set; }
}

