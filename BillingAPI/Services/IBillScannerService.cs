using BillingAPI.Models;

namespace BillingAPI.Services;

public interface IBillScannerService
{
    Task<ScannedBillData> ScanBillAsync(IFormFile file, int tenantId);
    Task<RawBillData> ExtractRawBillDataAsync(IFormFile file, int tenantId);
}

public class ScannedBillData
{
    public string? SupplierName { get; set; }
    public string? BillNumber { get; set; }
    public string? BillDate { get; set; }
    public List<ExtractedProduct> Products { get; set; } = new();
    public decimal? TotalAmount { get; set; }
}

public class ExtractedProduct
{
    public string Name { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TotalPrice { get; set; }
    public string? HsnCode { get; set; }
    public string? Description { get; set; }
}

public class RawBillData
{
    public string RawText { get; set; } = string.Empty;
    public string[] TextLines { get; set; } = Array.Empty<string>();
    public BillHeader Header { get; set; } = new();
    public List<RawProductLine> ProductLines { get; set; } = new();
    public BillFooter Footer { get; set; } = new();
    public Dictionary<string, object> DetectedFields { get; set; } = new();
    public List<MappingSuggestion> FieldMappings { get; set; } = new();
    public double OcrConfidence { get; set; }

    // Column mapping for structured parsing
    public Dictionary<int, string> ColumnMapping { get; set; } = new(); // position -> field name
    public int HeaderLineIndex { get; set; } = -1; // Index of the header line
}

public class BillHeader
{
    public string RawText { get; set; } = string.Empty;
    public List<string> Lines { get; set; } = new();
    public Dictionary<string, string> DetectedFields { get; set; } = new();
}

public class RawProductLine
{
    public int LineNumber { get; set; }
    public string RawText { get; set; } = string.Empty;
    public string[] Parts { get; set; } = Array.Empty<string>();
    public Dictionary<string, string> DetectedFields { get; set; } = new();
    public bool IsLikelyProductLine { get; set; }
    public double Confidence { get; set; }
}

public class BillFooter
{
    public string RawText { get; set; } = string.Empty;
    public List<string> Lines { get; set; } = new();
    public Dictionary<string, string> DetectedFields { get; set; } = new();
}

public class MappingSuggestion
{
    public string SourceField { get; set; } = string.Empty;
    public string SuggestedTargetField { get; set; } = string.Empty;
    public string DetectedValue { get; set; } = string.Empty;
    public double Confidence { get; set; }
    public List<string> AlternativeMappings { get; set; } = new();
}
