-- Additional Performance Indexes
-- Run this after all migrations for better query performance

-- Invoice Date Index (for date range queries)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Invoices_InvoiceDate')
BEGIN
    CREATE INDEX IX_Invoices_InvoiceDate ON [Invoices]([InvoiceDate]);
END
GO

-- Invoice Status Index (for filtering by status)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Invoices_Status')
BEGIN
    CREATE INDEX IX_Invoices_Status ON [Invoices]([Status]) WHERE [Status] IS NOT NULL;
END
GO

-- Invoice Tenant + Date Index (for tenant-specific date queries)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Invoices_TenantId_InvoiceDate')
BEGIN
    CREATE INDEX IX_Invoices_TenantId_InvoiceDate ON [Invoices]([TenantId], [InvoiceDate]);
END
GO

-- Payment Date Index
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Payments_PaymentDate')
BEGIN
    CREATE INDEX IX_Payments_PaymentDate ON [Payments]([PaymentDate]);
END
GO

-- Payment Tenant + Date Index
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Payments_TenantId_PaymentDate')
BEGIN
    CREATE INDEX IX_Payments_TenantId_PaymentDate ON [Payments]([TenantId], [PaymentDate]);
END
GO

-- Customer Name Index (for search)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Customers_Name')
BEGIN
    CREATE INDEX IX_Customers_Name ON [Customers]([Name]);
END
GO

-- Product Name Index (for search)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Products_Name')
BEGIN
    CREATE INDEX IX_Products_Name ON [Products]([Name]);
END
GO

-- Stock Transaction Date Index
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_StockTransactions_TransactionDate')
BEGIN
    CREATE INDEX IX_StockTransactions_TransactionDate ON [StockTransactions]([TransactionDate]);
END
GO

-- Activity Log Date Index
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ActivityLogs_ActionDate')
BEGIN
    CREATE INDEX IX_ActivityLogs_ActionDate ON [ActivityLogs]([ActionDate]);
END
GO

-- Batch Expiry Date Index (for expiry alerts)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Batches_ExpiryDate')
BEGIN
    CREATE INDEX IX_Batches_ExpiryDate ON [Batches]([ExpiryDate]) WHERE [ExpiryDate] IS NOT NULL;
END
GO

-- Purchase Order Date Index
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_PurchaseOrders_OrderDate')
BEGIN
    CREATE INDEX IX_PurchaseOrders_OrderDate ON [PurchaseOrders]([OrderDate]);
END
GO

-- CreatedAt indexes for audit queries
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Products_CreatedAt')
BEGIN
    CREATE INDEX IX_Products_CreatedAt ON [Products]([CreatedAt]);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Customers_CreatedAt')
BEGIN
    CREATE INDEX IX_Customers_CreatedAt ON [Customers]([CreatedAt]);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Invoices_CreatedAt')
BEGIN
    CREATE INDEX IX_Invoices_CreatedAt ON [Invoices]([CreatedAt]);
END
GO

