# Products and Inventory Stock Mapping - How It Works

## Overview

The system maintains **bidirectional synchronization** between `Product.StockQuantity` and `Inventory.Quantity` to ensure data consistency. The `Inventory` table provides detailed tracking with average cost calculation, while `Product.StockQuantity` provides quick access to stock levels.

## Database Schema

### Product Table
```csharp
public class Product
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public string Name { get; set; }
    public int? StockQuantity { get; set; }  // Quick stock reference
    public bool TrackInventory { get; set; } // Enable/disable inventory tracking
    public decimal CostPrice { get; set; }
    // ... other fields
}
```

### Inventory Table
```csharp
public class Inventory
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public int ProductId { get; set; }      // Foreign key to Product
    public int Quantity { get; set; }        // Stock quantity (synced with Product.StockQuantity)
    public decimal AverageCost { get; set; } // Weighted average cost
    public DateTime LastUpdatedAt { get; set; }
    
    // Navigation
    public Product? Product { get; set; }
}
```

**Relationship:**
- **One-to-One**: Each Product can have ONE Inventory record
- **Unique Constraint**: `(TenantId, ProductId)` ensures one inventory per product per tenant
- **Foreign Key**: `Inventory.ProductId` → `Product.Id`

## Stock Synchronization Flow

### 1. **Product Creation** (`ProductService.CreateProductAsync`)

When a product is created:

```csharp
// Step 1: Create Product
product.StockQuantity = 0; // Initialize if TrackInventory is true
_context.Products.Add(product);
await _context.SaveChangesAsync();

// Step 2: Create Inventory record (if TrackInventory = true)
if (product.TrackInventory && product.StockQuantity.HasValue)
{
    var inventory = new Inventory
    {
        TenantId = product.TenantId,
        ProductId = product.Id,
        Quantity = product.StockQuantity.Value,  // Sync from Product
        AverageCost = product.CostPrice,         // Initial cost
        LastUpdatedAt = DateTime.UtcNow
    };
    _context.Inventories.Add(inventory);
    await _context.SaveChangesAsync();
}
```

**Result:**
- `Product.StockQuantity` = 0
- `Inventory.Quantity` = 0
- Both are synchronized

---

### 2. **Product Update** (`ProductService.UpdateProductAsync`)

When a product is updated:

```csharp
// Step 1: Update Product
product.StockQuantity = newValue;
_context.Products.Update(product);

// Step 2: Sync Inventory
if (product.TrackInventory)
{
    var inventory = await _context.Inventories
        .FirstOrDefaultAsync(i => i.ProductId == product.Id);
    
    if (inventory != null)
    {
        // Sync Inventory.Quantity with Product.StockQuantity
        inventory.Quantity = product.StockQuantity ?? 0;
        inventory.AverageCost = product.CostPrice; // Update cost
        inventory.LastUpdatedAt = DateTime.UtcNow;
    }
    else
    {
        // Create inventory if it doesn't exist
        var newInventory = new Inventory { ... };
        _context.Inventories.Add(newInventory);
    }
}
```

**Result:**
- `Product.StockQuantity` and `Inventory.Quantity` stay in sync
- If `TrackInventory = false`, inventory record is removed

---

### 3. **Inventory Adjustment** (`InventoryService.UpdateInventoryAsync`)

When inventory is adjusted directly (via Inventory page):

```csharp
// Step 1: Update Inventory
if (addToExisting)
{
    finalQuantity = inventory.Quantity + quantity; // Add to existing
    // Calculate weighted average cost
    finalAverageCost = (oldQty * oldCost + newQty * newCost) / finalQuantity;
}
else
{
    finalQuantity = quantity; // Set new quantity
    finalAverageCost = unitCost ?? inventory.AverageCost;
}

inventory.Quantity = finalQuantity;
inventory.AverageCost = finalAverageCost;

// Step 2: Sync back to Product
if (product.TrackInventory)
{
    product.StockQuantity = finalQuantity; // Sync to Product
    product.UpdatedAt = DateTime.UtcNow;
}
```

**Result:**
- `Inventory.Quantity` is updated
- `Product.StockQuantity` is synchronized automatically
- Average cost is calculated using weighted average formula

**Weighted Average Cost Formula:**
```
New Average Cost = (Old Quantity × Old Cost + New Quantity × New Cost) / Total Quantity
```

---

### 4. **Invoice Completion** (`InvoiceService.UpdateInventoryForInvoiceAsync`)

When an invoice is completed (sale):

```csharp
foreach (var item in invoice.Items)
{
    var product = await _context.Products.FindAsync(item.ProductId);
    
    if (product?.TrackInventory == true)
    {
        // Step 1: Deduct from Product.StockQuantity
        product.StockQuantity -= item.Quantity;
        product.UpdatedAt = DateTime.UtcNow;
        
        // Step 2: Sync to Inventory
        var inventory = await _context.Inventories
            .FirstOrDefaultAsync(i => i.ProductId == item.ProductId);
        
        if (inventory != null)
        {
            inventory.Quantity = product.StockQuantity.Value; // Sync
            inventory.LastUpdatedAt = DateTime.UtcNow;
        }
        
        // Step 3: Create StockTransaction record
        var transaction = new StockTransaction
        {
            TransactionType = "Out",
            Quantity = item.Quantity,
            ReferenceType = "Sale",
            ReferenceId = invoice.Id,
            // ...
        };
        _context.StockTransactions.Add(transaction);
    }
}
```

**Result:**
- Stock is deducted from both `Product.StockQuantity` and `Inventory.Quantity`
- Stock transaction is recorded for audit trail

---

### 5. **Invoice Cancellation** (`InvoiceService.ReverseInventoryForInvoiceAsync`)

When an invoice is cancelled:

```csharp
// Reverse the stock deduction
product.StockQuantity += item.Quantity; // Add back
inventory.Quantity = product.StockQuantity.Value; // Sync

// Create reversal transaction
var transaction = new StockTransaction
{
    TransactionType = "In",
    Quantity = item.Quantity,
    ReferenceType = "Sale Reversal",
    ReferenceId = invoice.Id,
    // ...
};
```

**Result:**
- Stock is restored to both tables
- Reversal transaction is recorded

---

## Key Synchronization Rules

### ✅ **Always Synchronized:**
1. **Product.StockQuantity** ↔ **Inventory.Quantity** must always match
2. When `TrackInventory = true`, both values are kept in sync
3. When `TrackInventory = false`, inventory record is removed

### 🔄 **Update Sources:**

| Action | Updates | Sync Direction |
|--------|---------|----------------|
| Create Product | Product.StockQuantity → Inventory.Quantity | Product → Inventory |
| Update Product | Product.StockQuantity → Inventory.Quantity | Product → Inventory |
| Adjust Inventory | Inventory.Quantity → Product.StockQuantity | Inventory → Product |
| Complete Invoice | Both (deduct) | Both updated together |
| Cancel Invoice | Both (restore) | Both updated together |

### 📊 **Average Cost Calculation:**

The `Inventory.AverageCost` is calculated using **weighted average**:

```
Example:
- Current: 100 units @ ₹10/unit = ₹1,000
- Add: 50 units @ ₹12/unit = ₹600
- New Average = (1,000 + 600) / 150 = ₹10.67/unit
```

This ensures accurate cost tracking when stock is added at different prices.

---

## Stock Transaction Audit Trail

Every stock movement is recorded in `StockTransaction` table:

```csharp
public class StockTransaction
{
    public string TransactionType { get; set; } // "In", "Out", "Adjustment"
    public int Quantity { get; set; }
    public decimal? UnitCost { get; set; }
    public string? ReferenceType { get; set; }  // "Purchase", "Sale", "Adjustment"
    public int? ReferenceId { get; set; }       // Invoice ID, Purchase Order ID, etc.
    public DateTime TransactionDate { get; set; }
}
```

**Transaction Types:**
- **"In"**: Stock added (purchase, return, adjustment)
- **"Out"**: Stock deducted (sale, cancellation)
- **"Adjustment"**: Manual correction

---

## Best Practices

1. **Always use services** (`ProductService`, `InventoryService`) instead of direct database updates
2. **Check TrackInventory flag** before updating stock
3. **Validate stock availability** before completing invoices
4. **Use InventoryService** for manual adjustments to maintain average cost
5. **Never update Product.StockQuantity directly** - always go through services

---

## Example Flow: Complete Sale

```
1. User creates invoice with Product A (Qty: 5)
2. System checks: Product A.StockQuantity = 10 (sufficient)
3. Invoice status = "Completed"
4. System deducts:
   - Product A.StockQuantity: 10 → 5
   - Inventory.Quantity: 10 → 5
5. System creates StockTransaction:
   - Type: "Out"
   - Quantity: 5
   - Reference: Invoice #123
6. Both tables remain synchronized ✅
```

---

## Troubleshooting

### Issue: Stock mismatch between Product and Inventory

**Solution:**
```csharp
// Re-sync manually
var product = await _context.Products.FindAsync(productId);
var inventory = await _context.Inventories
    .FirstOrDefaultAsync(i => i.ProductId == productId);

if (inventory != null)
{
    inventory.Quantity = product.StockQuantity ?? 0;
    await _context.SaveChangesAsync();
}
```

### Issue: Inventory record missing

**Solution:**
```csharp
// Create inventory if product has TrackInventory = true
if (product.TrackInventory && !inventoryExists)
{
    var inventory = new Inventory
    {
        ProductId = product.Id,
        Quantity = product.StockQuantity ?? 0,
        AverageCost = product.CostPrice
    };
    _context.Inventories.Add(inventory);
}
```

---

## Summary

- **Product.StockQuantity**: Quick reference, always synced with Inventory
- **Inventory.Quantity**: Detailed tracking with average cost
- **Bidirectional Sync**: Changes to either table sync to the other
- **Transaction Log**: All movements recorded in StockTransaction
- **Weighted Average**: Cost calculated automatically when stock is added

The system ensures data consistency by maintaining synchronization between both tables at all times.

