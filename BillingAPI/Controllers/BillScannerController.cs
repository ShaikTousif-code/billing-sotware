using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BillingAPI.Services;
using BillingAPI.Models;
using BillingAPI.DTOs;
using System.Security.Claims;

namespace BillingAPI.Controllers;

[ApiController]
[Route("api/bill-scanner")]
[Authorize]
public class BillScannerController : ControllerBase
{
    private readonly IBillScannerService _billScannerService;
    private readonly IProductService _productService;
    private readonly IInventoryService _inventoryService;

    public BillScannerController(IBillScannerService billScannerService, IProductService productService, IInventoryService inventoryService)
    {
        _billScannerService = billScannerService;
        _productService = productService;
        _inventoryService = inventoryService;
    }

    [HttpPost("scan")]
    public async Task<IActionResult> ScanBill(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("No file uploaded");

        try
        {
            var tenantId = GetTenantId();
            var scannedData = await _billScannerService.ScanBillAsync(file, tenantId);

            return Ok(scannedData);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Error scanning bill: {ex.Message}");
        }
    }

    [HttpPost("extract-raw")]
    public async Task<IActionResult> ExtractRawBillData(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("No file uploaded");

        try
        {
            var tenantId = GetTenantId();
            var rawData = await _billScannerService.ExtractRawBillDataAsync(file, tenantId);

            return Ok(rawData);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Error extracting raw bill data: {ex.Message}");
        }
    }

    [HttpPost("create-products")]
    public async Task<IActionResult> CreateProductsFromScan([FromBody] List<ExtractedProduct> products)
    {
        if (products == null || !products.Any())
            return BadRequest("No products provided");

        var tenantId = GetTenantId();
        var userId = GetUserId();
        var createdCount = 0;

        foreach (var productData in products)
        {
            try
            {
                var product = new Product
                {
                    TenantId = tenantId,
                    Name = productData.Name,
                    CostPrice = productData.UnitPrice,
                    SellingPrice = productData.UnitPrice * 1.2m, // 20% markup by default
                    TaxRate = 18, // Default GST rate
                    StockQuantity = (int)productData.Quantity,
                    HSNCode = productData.HsnCode,
                    Description = productData.Description,
                    TrackInventory = true,
                    IsActive = true
                };

                // Auto-generate SKU if not provided
                if (string.IsNullOrWhiteSpace(product.SKU))
                {
                    product.SKU = await GenerateUniqueSKUAsync(tenantId, product.Name);
                }

                await _productService.CreateProductAsync(product);
                createdCount++;
            }
            catch (Exception ex)
            {
                // Log error but continue with other products
                Console.WriteLine($"Error creating product {productData.Name}: {ex.Message}");
            }
        }

        return Ok(new { createdCount, message = $"{createdCount} products created successfully out of {products.Count} products" });
    }

    [HttpPost("create-products-bulk")]
    public async Task<IActionResult> CreateProductsBulk([FromBody] BulkProductCreationRequest request)
    {
        if (request?.Products == null || !request.Products.Any())
            return BadRequest("No products provided");

        var tenantId = GetTenantId();
        var createdCount = 0;
        var errors = new List<string>();

        foreach (var productData in request.Products)
        {
            try
            {
                // Validate required fields
                if (string.IsNullOrWhiteSpace(productData.Name))
                {
                    errors.Add($"Product at index {request.Products.IndexOf(productData)}: Name is required");
                    continue;
                }

                if (productData.CostPrice <= 0)
                {
                    errors.Add($"Product '{productData.Name}': Cost price must be greater than 0");
                    continue;
                }

                // Validate quantity - allow 0 as minimum, prevent negative quantities
                var quantity = productData.StockQuantity ?? (productData.PurchaseQuantity.HasValue ? (int)Math.Round(productData.PurchaseQuantity.Value) : 0);
                if (quantity < 0)
                {
                    errors.Add($"Product '{productData.Name}': Cannot create product with negative quantity");
                    continue;
                }

                var product = new Product
                {
                    TenantId = tenantId,
                    Name = productData.Name,
                    SKU = productData.Sku,
                    HSNCode = productData.HsnCode,
                    SACCode = productData.SacCode,
                    Description = productData.Description,
                    CategoryId = productData.CategoryId,
                    CostPrice = productData.CostPrice,
                    SellingPrice = productData.SellingPrice ?? (productData.Mrp.HasValue ? productData.Mrp.Value * 0.9M : productData.CostPrice * 1.2M),
                    MRP = productData.Mrp,
                    TaxRate = productData.TaxRate ?? 18,
                    TaxType = productData.TaxType ?? "GST",
                    StockQuantity = productData.StockQuantity ?? (productData.PurchaseQuantity.HasValue ? (int)Math.Round(productData.PurchaseQuantity.Value) : 0),
                    LowStockAlert = productData.LowStockAlert ?? (productData.PurchaseQuantity.HasValue ? (int)Math.Round(productData.PurchaseQuantity.Value * 0.2M) : 10),
                    Unit = productData.Unit ?? "PCS",
                    Type = productData.Type == "Service" ? ProductType.Service : ProductType.Product,
                    IsActive = productData.IsActive ?? true,
                    TrackInventory = productData.TrackInventory ?? true,
                    // Enhanced purchase invoice fields
                    BatchNo = productData.BatchNo,
                    ExpiryDate = !string.IsNullOrWhiteSpace(productData.ExpiryDate) ? DateTime.Parse(productData.ExpiryDate) : null,
                    Manufacturer = productData.Manufacturer,
                    // Purchase tracking
                    LastPurchasePrice = productData.CostPrice,
                    LastPurchaseQuantity = productData.PurchaseQuantity ?? 0,
                    LastPurchaseDate = !string.IsNullOrWhiteSpace(request.BillDate) ? DateTime.Parse(request.BillDate) : DateTime.UtcNow,
                    SupplierName = request.SupplierName
                };

                // Auto-generate SKU if not provided
                if (string.IsNullOrWhiteSpace(product.SKU))
                {
                    product.SKU = await GenerateUniqueSKUAsync(tenantId, product.Name);
                }

                var createdProduct = await _productService.CreateProductAsync(product);

                // Initialize inventory if tracking is enabled
                if (createdProduct.TrackInventory)
                {
                    await _inventoryService.UpdateInventoryAsync(createdProduct.Id, tenantId, createdProduct.StockQuantity ?? 0, createdProduct.CostPrice, addToExisting: false);
                }

                createdCount++;
            }
            catch (Exception ex)
            {
                errors.Add($"Error creating product '{productData.Name}': {ex.Message}");
                Console.WriteLine($"Error creating product {productData.Name}: {ex.Message}");
            }
        }

        return Ok(new {
            createdCount,
            totalRequested = request.Products.Count,
            errors,
            message = $"{createdCount} products created successfully out of {request.Products.Count} products",
            billInfo = new {
                supplierName = request.SupplierName,
                billNumber = request.BillNumber,
                billDate = request.BillDate,
                totalAmount = request.TotalAmount
            }
        });
    }

    [HttpGet("test")]
    [AllowAnonymous]
    public IActionResult Test()
    {
        return Ok(new { message = "BillScanner controller is working" });
    }

    [HttpPut("update-product/{id}")]
    public async Task<IActionResult> UpdateProductForInvoice(int id, [FromBody] BulkProductRequest request,
        [FromQuery] string? billDate = null, [FromQuery] string? supplierName = null)
    {
        try
        {
            var tenantId = GetTenantId();
            var product = await _productService.GetProductByIdAsync(id, tenantId);

            if (product == null)
                return NotFound(new { message = "Product not found" });

            // Update product fields from invoice
            product.CostPrice = request.CostPrice;
            if (request.SellingPrice.HasValue)
                product.SellingPrice = request.SellingPrice.Value;
            if (request.Mrp.HasValue)
                product.MRP = request.Mrp.Value;
            if (request.TaxRate.HasValue)
                product.TaxRate = request.TaxRate.Value;
            if (!string.IsNullOrWhiteSpace(request.TaxType))
                product.TaxType = request.TaxType;
            if (!string.IsNullOrWhiteSpace(request.Unit))
                product.Unit = request.Unit;

            // Add to existing stock quantity
            if (request.StockQuantity.HasValue)
                product.StockQuantity = (product.StockQuantity ?? 0) + request.StockQuantity.Value;

            // Update purchase tracking
            product.LastPurchasePrice = request.CostPrice;
            product.LastPurchaseQuantity = request.PurchaseQuantity ?? 0;
            product.LastPurchaseDate = !string.IsNullOrWhiteSpace(billDate) ? DateTime.Parse(billDate) : DateTime.UtcNow;
            product.SupplierName = supplierName;

            // Update enhanced fields
            if (!string.IsNullOrWhiteSpace(request.BatchNo))
                product.BatchNo = request.BatchNo;
            if (!string.IsNullOrWhiteSpace(request.ExpiryDate))
                product.ExpiryDate = DateTime.Parse(request.ExpiryDate);
            if (!string.IsNullOrWhiteSpace(request.Manufacturer))
                product.Manufacturer = request.Manufacturer;

            product.UpdatedAt = DateTime.UtcNow;

            await _productService.UpdateProductAsync(product);

            // Update inventory if tracking is enabled
            if (product.TrackInventory && request.StockQuantity.HasValue)
            {
                await _inventoryService.UpdateInventoryAsync(product.Id, tenantId, request.StockQuantity.Value, request.CostPrice, addToExisting: true);
            }

            return Ok(new { message = "Product updated successfully", product });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error updating product {id}: {ex.Message}");
            return StatusCode(500, new { message = "Failed to update product", error = ex.Message });
        }
    }

    [HttpPost("save-invoice")]
    public async Task<IActionResult> SaveInvoice([FromBody] SaveInvoiceRequest request)
    {
        try
        {
            var tenantId = GetTenantId();

            // Here you could save invoice data to a database table
            // For now, we'll just log it and return success
            // In a real implementation, you'd create an Invoice entity and save it

            Console.WriteLine($"Invoice saved for tenant {tenantId}:");
            Console.WriteLine($"Supplier: {request.SupplierName}");
            Console.WriteLine($"Bill Number: {request.BillNumber}");
            Console.WriteLine($"Bill Date: {request.BillDate}");
            Console.WriteLine($"Total Amount: {request.TotalAmount}");
            Console.WriteLine($"Products processed: {request.ProcessedProducts}");
            Console.WriteLine($"New products: {request.NewProducts}");
            Console.WriteLine($"Updated products: {request.UpdatedProducts}");

            // TODO: Save to database
            // var invoice = new Invoice
            // {
            //     TenantId = tenantId,
            //     SupplierName = request.SupplierName,
            //     BillNumber = request.BillNumber,
            //     BillDate = DateTime.Parse(request.BillDate),
            //     TotalAmount = request.TotalAmount,
            //     OcrText = request.OcrText,
            //     ProcessedProducts = request.ProcessedProducts,
            //     NewProducts = request.NewProducts,
            //     UpdatedProducts = request.UpdatedProducts,
            //     FileName = request.FileName,
            //     FileSize = request.FileSize,
            //     CreatedAt = DateTime.UtcNow
            // };
            // await _context.Invoices.AddAsync(invoice);
            // await _context.SaveChangesAsync();

            return Ok(new { message = "Invoice data saved successfully" });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error saving invoice: {ex.Message}");
            return StatusCode(500, new { message = "Failed to save invoice data", error = ex.Message });
        }
    }

    [HttpPost("test-headers")]
    [AllowAnonymous]
    public IActionResult TestHeaderDetection([FromBody] TestHeaderRequest request)
    {
        try
        {
            var rawData = new RawBillData
            {
                RawText = request.Text,
                TextLines = request.Text.Split('\n').Select(l => l.Trim()).Where(l => !string.IsNullOrWhiteSpace(l)).ToArray()
            };

            // Initialize collections
            rawData.Header = new BillHeader { DetectedFields = new Dictionary<string, string>() };
            rawData.ProductLines = new List<RawProductLine>();
            rawData.Footer = new BillFooter { DetectedFields = new Dictionary<string, string>() };
            rawData.DetectedFields = new Dictionary<string, dynamic>();
            rawData.FieldMappings = new List<MappingSuggestion>();

            var billScannerService = HttpContext.RequestServices.GetService(typeof(IBillScannerService)) as BillScannerService;
            if (billScannerService == null)
            {
                return BadRequest("Service not available");
            }

            // Test the header detection
            var detectTableHeadersMethod = typeof(BillScannerService).GetMethod("DetectTableHeaders",
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);

            detectTableHeadersMethod?.Invoke(billScannerService, new object[] { rawData });

            // Generate mappings
            var generateMappingsMethod = typeof(BillScannerService).GetMethod("GenerateFieldMappings",
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);

            generateMappingsMethod?.Invoke(billScannerService, new object[] { rawData });

            return Ok(new
            {
                detectedFields = rawData.Header.DetectedFields,
                fieldMappings = rawData.FieldMappings.Select(m => new
                {
                    sourceField = m.SourceField,
                    suggestedTargetField = m.SuggestedTargetField,
                    detectedValue = m.DetectedValue,
                    confidence = m.Confidence
                })
            });
        }
        catch (Exception ex)
        {
            return BadRequest($"Error testing header detection: {ex.Message}");
        }
    }

    private int GetTenantId()
    {
        return int.Parse(User.FindFirst("TenantId")?.Value ?? "0");
    }

    private string GetUserId()
    {
        return User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "";
    }

    private async Task<string> GenerateUniqueSKUAsync(int tenantId, string productName)
    {
        // Generate a unique SKU based on tenant, timestamp, and product name
        var timestamp = DateTime.UtcNow.ToString("yyyyMMddHHmmss");
        var namePart = productName.Length > 3 ? productName.Substring(0, 3).ToUpper() : productName.ToUpper();
        var sku = $"T{tenantId}-{namePart}-{timestamp}";

        // Ensure uniqueness (in a real implementation, you'd check against database)
        return sku;
    }
}
