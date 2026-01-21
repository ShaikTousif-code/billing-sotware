using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BillingAPI.Models;
using BillingAPI.Services;
using BillingAPI.DTOs;
using BillingAPI.Data;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace BillingAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class InventoryController : ControllerBase
{
    private readonly IInventoryService _inventoryService;
    private readonly ApplicationDbContext _context;

    public InventoryController(IInventoryService inventoryService, ApplicationDbContext context)
    {
        _inventoryService = inventoryService;
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetInventory()
    {
        var tenantId = GetTenantId();
        var inventory = await _inventoryService.GetInventoryAsync(tenantId);
        return Ok(ApiResponse<List<Inventory>>.SuccessResponse(inventory));
    }

    [HttpGet("product/{productId}")]
    public async Task<IActionResult> GetInventoryByProduct(int productId)
    {
        var tenantId = GetTenantId();
        var inventory = await _inventoryService.GetInventoryByProductIdAsync(productId, tenantId);
        if (inventory == null)
        {
            return NotFound(ApiResponse<Inventory?>.ErrorResponse("Inventory not found for this product"));
        }
        return Ok(ApiResponse<Inventory>.SuccessResponse(inventory));
    }

    [HttpPost("adjust")]
    public async Task<IActionResult> AdjustInventory([FromBody] AdjustInventoryRequest request)
    {
        var tenantId = GetTenantId();
        try
        {
            var inventory = await _inventoryService.UpdateInventoryAsync(
                request.ProductId,
                tenantId,
                request.Quantity,
                request.UnitCost,
                request.AddToExisting
            );
            return Ok(ApiResponse<Inventory>.SuccessResponse(inventory));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<Inventory>.ErrorResponse(ex.Message));
        }
    }

    [HttpGet("transactions")]
    public async Task<IActionResult> GetStockTransactions([FromQuery] int? productId = null)
    {
        var tenantId = GetTenantId();
        var transactions = await _inventoryService.GetStockTransactionsAsync(tenantId, productId);
        return Ok(ApiResponse<List<StockTransaction>>.SuccessResponse(transactions));
    }

    [HttpPost("stock-in")]
    public async Task<IActionResult> StockIn([FromBody] ManualStockInRequest request)
    {
        var tenantId = GetTenantId();
        var userId = GetUserId();

        if (request.Quantity <= 0)
        {
            return BadRequest(ApiResponse<object>.ErrorResponse("Quantity must be greater than 0"));
        }
        if (request.UnitCost.HasValue && request.UnitCost.Value < 0)
        {
            return BadRequest(ApiResponse<object>.ErrorResponse("Unit cost cannot be negative"));
        }
        if (request.CostPrice.HasValue && request.CostPrice.Value < 0)
        {
            return BadRequest(ApiResponse<object>.ErrorResponse("Cost price cannot be negative"));
        }
        if (request.SellingPrice.HasValue && request.SellingPrice.Value < 0)
        {
            return BadRequest(ApiResponse<object>.ErrorResponse("Selling price cannot be negative"));
        }
        if (request.CostPrice.HasValue && request.SellingPrice.HasValue && request.SellingPrice.Value < request.CostPrice.Value)
        {
            return BadRequest(ApiResponse<object>.ErrorResponse("Selling price should be greater than or equal to cost price"));
        }

        Product product;

        if (request.ProductId.HasValue)
        {
            product = await _context.Products
                .FirstOrDefaultAsync(p => p.Id == request.ProductId.Value && p.TenantId == tenantId);

            if (product == null)
            {
                return NotFound(ApiResponse<object>.ErrorResponse("Product not found"));
            }
        }
        else
        {
            if (string.IsNullOrWhiteSpace(request.Name))
            {
                return BadRequest(ApiResponse<object>.ErrorResponse("Medicine name is required"));
            }

            product = new Product
            {
                TenantId = tenantId,
                Name = request.Name.Trim(),
                SKU = request.SKU,
                HSNCode = request.HSNCode,
                Barcode = request.Barcode,
                Manufacturer = request.Manufacturer,
                BatchNo = request.BatchNo,
                ExpiryDate = request.ExpiryDate,
                CostPrice = request.CostPrice ?? request.UnitCost ?? 0,
                SellingPrice = request.SellingPrice ?? 0,
                MRP = request.MRP,
                Unit = request.Unit,
                TrackInventory = true,
                IsActive = true,
                // Expiry configuration
                ExpiryType = request.ExpiryType ?? "FIXED_DATE",
                ExpireAfterValue = request.ExpireAfterValue,
                ExpireAfterUnit = request.ExpireAfterUnit,
                AlertBeforeValue = request.AlertBeforeValue ?? 30,
                AlertBeforeUnit = request.AlertBeforeUnit ?? "DAYS",
                IsExpiryEnabled = request.IsExpiryEnabled ?? false
            };

            _context.Products.Add(product);
            await _context.SaveChangesAsync();
        }

        // Update product fields if provided
        if (!string.IsNullOrWhiteSpace(request.Name))
        {
            product.Name = request.Name.Trim();
        }
        if (!string.IsNullOrWhiteSpace(request.SKU))
        {
            product.SKU = request.SKU;
        }
        if (!string.IsNullOrWhiteSpace(request.HSNCode))
        {
            product.HSNCode = request.HSNCode;
        }
        if (!string.IsNullOrWhiteSpace(request.Barcode))
        {
            product.Barcode = request.Barcode;
        }
        if (!string.IsNullOrWhiteSpace(request.Manufacturer))
        {
            product.Manufacturer = request.Manufacturer;
        }
        if (!string.IsNullOrWhiteSpace(request.BatchNo))
        {
            product.BatchNo = request.BatchNo;
        }
        if (request.ExpiryDate.HasValue)
        {
            product.ExpiryDate = request.ExpiryDate;
        }
        if (request.CostPrice.HasValue)
        {
            product.CostPrice = request.CostPrice.Value;
        }
        if (request.SellingPrice.HasValue)
        {
            product.SellingPrice = request.SellingPrice.Value;
        }
        if (request.MRP.HasValue)
        {
            product.MRP = request.MRP.Value;
        }
        if (!string.IsNullOrWhiteSpace(request.Unit))
        {
            product.Unit = request.Unit;
        }
        // Update expiry configuration if provided
        if (!string.IsNullOrWhiteSpace(request.ExpiryType))
        {
            product.ExpiryType = request.ExpiryType;
        }
        if (request.ExpireAfterValue.HasValue)
        {
            product.ExpireAfterValue = request.ExpireAfterValue;
        }
        if (!string.IsNullOrWhiteSpace(request.ExpireAfterUnit))
        {
            product.ExpireAfterUnit = request.ExpireAfterUnit;
        }
        if (request.AlertBeforeValue.HasValue)
        {
            product.AlertBeforeValue = request.AlertBeforeValue;
        }
        if (!string.IsNullOrWhiteSpace(request.AlertBeforeUnit))
        {
            product.AlertBeforeUnit = request.AlertBeforeUnit;
        }
        if (request.IsExpiryEnabled.HasValue)
        {
            product.IsExpiryEnabled = request.IsExpiryEnabled.Value;
        }
        product.LastPurchasePrice = request.UnitCost ?? request.CostPrice ?? product.CostPrice;
        product.LastPurchaseQuantity = request.Quantity;
        product.LastPurchaseDate = DateTime.UtcNow;
        product.SupplierName = request.SupplierName;
        product.UpdatedAt = DateTime.UtcNow;

        // Apply inventory update (add to existing)
        var inventory = await _inventoryService.UpdateInventoryAsync(
            product.Id,
            tenantId,
            request.Quantity,
            request.UnitCost ?? request.CostPrice,
            addToExisting: true
        );

        // Calculate expiry date if manufacturing date is provided and product has expiry configuration
        DateTime? calculatedExpiryDate = request.ExpiryDate;
        if (request.ManufacturingDate.HasValue && product.IsExpiryEnabled && product.ExpiryType == "DURATION")
        {
            calculatedExpiryDate = ExpiryService.CalculateExpiryDate(request.ManufacturingDate, product);
        }

        // Create batch record if:
        // 1. Batch details provided (batch number, manufacturing date, or expiry date), OR
        // 2. Product has expiry enabled (to track expiry even without explicit batch details)
        if (!string.IsNullOrWhiteSpace(request.BatchNo) || request.ManufacturingDate.HasValue || calculatedExpiryDate.HasValue || product.IsExpiryEnabled)
        {
            // If expiry is enabled but no manufacturing date provided, use current date as fallback for DURATION type
            DateTime? manufacturingDate = request.ManufacturingDate;
            if (product.IsExpiryEnabled && product.ExpiryType == "DURATION" && !manufacturingDate.HasValue && !calculatedExpiryDate.HasValue)
            {
                manufacturingDate = DateTime.UtcNow.Date;
                calculatedExpiryDate = ExpiryService.CalculateExpiryDate(manufacturingDate, product);
            }

            var batchStatus = ExpiryService.EvaluateBatchStatus(calculatedExpiryDate, product);
            var batch = new Batch
            {
                TenantId = tenantId,
                ProductId = product.Id,
                BatchNumber = request.BatchNo ?? $"BATCH-{DateTime.UtcNow:yyyyMMddHHmmss}",
                ManufacturingDate = manufacturingDate,
                ExpiryDate = calculatedExpiryDate,
                Quantity = request.Quantity,
                UnitCost = request.UnitCost ?? request.CostPrice ?? product.CostPrice,
                IsExpired = batchStatus == "EXPIRED",
                Status = batchStatus
            };
            _context.Batches.Add(batch);
        }

        _context.StockTransactions.Add(new StockTransaction
        {
            TenantId = tenantId,
            ProductId = product.Id,
            TransactionType = "In",
            Quantity = request.Quantity,
            UnitCost = request.UnitCost ?? request.CostPrice,
            ReferenceType = "ManualStockIn",
            Notes = request.Notes,
            CreatedById = userId,
            TransactionDate = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        return Ok(ApiResponse<Inventory>.SuccessResponse(inventory, "Stock added successfully"));
    }

    private int GetTenantId()
    {
        return int.Parse(User.FindFirst("TenantId")?.Value ?? "0");
    }

    [HttpGet("product/{productId}/batches/fifo")]
    public async Task<IActionResult> GetFIFOBatches(int productId, [FromQuery] int quantity = 1)
    {
        var tenantId = GetTenantId();
        
        // Get batches ordered by expiry date (earliest first) and then by creation date (FIFO)
        var batches = await _context.Batches
            .Include(b => b.Product)
            .Where(b => b.TenantId == tenantId
                && b.ProductId == productId
                && b.Quantity > 0
                && (b.Status != "EXPIRED" || b.Status == null))
            .OrderBy(b => b.ExpiryDate ?? DateTime.MaxValue) // Expiring soon first
            .ThenBy(b => b.CreatedAt) // Then oldest first (FIFO)
            .ToListAsync();

        var selectedBatches = new List<object>();
        var remainingQuantity = quantity;

        foreach (var batch in batches)
        {
            if (remainingQuantity <= 0) break;

            var quantityToUse = Math.Min(remainingQuantity, batch.Quantity);
            selectedBatches.Add(new
            {
                batchId = batch.Id,
                batchNumber = batch.BatchNumber,
                expiryDate = batch.ExpiryDate,
                manufacturingDate = batch.ManufacturingDate,
                status = batch.Status ?? "ACTIVE",
                availableQuantity = batch.Quantity,
                quantityToUse = quantityToUse,
                unitCost = batch.UnitCost
            });

            remainingQuantity -= quantityToUse;
        }

        return Ok(ApiResponse<object>.SuccessResponse(new
        {
            productId,
            requestedQuantity = quantity,
            selectedBatches,
            canFulfill = remainingQuantity == 0
        }));
    }

    private int GetUserId()
    {
        return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
    }
}

public class AdjustInventoryRequest
{
    public int ProductId { get; set; }
    public int Quantity { get; set; }
    public decimal? UnitCost { get; set; }
    public bool AddToExisting { get; set; } = false;
}

public class ManualStockInRequest
{
    public int? ProductId { get; set; }
    public string? Name { get; set; }
    public string? SKU { get; set; }
    public string? HSNCode { get; set; }
    public string? Barcode { get; set; }
    public string? Manufacturer { get; set; }
    public string? BatchNo { get; set; }
    public DateTime? ManufacturingDate { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public string? Unit { get; set; }
    public decimal? CostPrice { get; set; }
    public decimal? UnitCost { get; set; }
    public decimal? SellingPrice { get; set; }
    public decimal? MRP { get; set; }
    public int Quantity { get; set; }
    public string? SupplierName { get; set; }
    public string? Notes { get; set; }
    // Expiry configuration
    public string? ExpiryType { get; set; } // "FIXED_DATE" or "DURATION"
    public int? ExpireAfterValue { get; set; }
    public string? ExpireAfterUnit { get; set; } // "DAYS", "MONTHS", "YEARS"
    public int? AlertBeforeValue { get; set; }
    public string? AlertBeforeUnit { get; set; } // "DAYS", "MONTHS"
    public bool? IsExpiryEnabled { get; set; }
}

