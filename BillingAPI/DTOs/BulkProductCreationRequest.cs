using BillingAPI.Models;

namespace BillingAPI.DTOs;

public class BulkProductCreationRequest
{
    public string? SupplierName { get; set; }
    public string? BillNumber { get; set; }
    public string? BillDate { get; set; }
    public decimal? TotalAmount { get; set; }
    public List<BulkProductRequest> Products { get; set; } = new();
}

public class BulkProductRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Sku { get; set; }
    public string? HsnCode { get; set; }
    public string? SacCode { get; set; }
    public string? Description { get; set; }
    public int? CategoryId { get; set; }
    public decimal CostPrice { get; set; }
    public decimal? SellingPrice { get; set; }
    public decimal? Mrp { get; set; } // Maximum Retail Price
    public decimal? TaxRate { get; set; }
    public string? TaxType { get; set; }
    public int? StockQuantity { get; set; }
    public int? LowStockAlert { get; set; }
    public string? Unit { get; set; }
    public string Type { get; set; } = "Product"; // "Product" or "Service"
    public bool? IsActive { get; set; }
    public bool? TrackInventory { get; set; }

    // Enhanced purchase invoice fields
    public string? BatchNo { get; set; }
    public string? ExpiryDate { get; set; }
    public string? Manufacturer { get; set; }
    public decimal? PurchaseQuantity { get; set; } // Quantity from invoice
    public decimal? PurchaseTotalPrice { get; set; } // Total price from invoice
}

public class TestHeaderRequest
{
    public string Text { get; set; } = string.Empty;
}

public class SaveInvoiceRequest
{
    public string? SupplierName { get; set; }
    public string? BillNumber { get; set; }
    public string? BillDate { get; set; }
    public decimal? TotalAmount { get; set; }
    public string? OcrText { get; set; }
    public int ProcessedProducts { get; set; }
    public int NewProducts { get; set; }
    public int UpdatedProducts { get; set; }
    public string? FileName { get; set; }
    public long? FileSize { get; set; }
}
