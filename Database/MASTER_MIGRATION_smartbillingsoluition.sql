-- =============================================
-- MASTER MIGRATION SCRIPT
-- Database: smartbillingsoluition
-- =============================================
-- This script runs ALL migrations in the correct order:
-- 1. B2B/B2C Features
-- 2. New Features
-- 3. RMG Features
-- =============================================

USE [smartbillingsoluition]
GO

PRINT '========================================';
PRINT 'Starting Master Migration';
PRINT 'Database: smartbillingsoluition';
PRINT '========================================';
PRINT '';
GO

-- =============================================
-- PART 1: B2B/B2C FEATURES MIGRATION
-- =============================================
PRINT 'PART 1: B2B/B2C Features Migration...';
PRINT '----------------------------------------';
GO

-- Add B2B/B2C fields to Customers table
IF COL_LENGTH('Customers', 'CustomerType') IS NULL
BEGIN
    ALTER TABLE Customers ADD CustomerType NVARCHAR(10) NULL;
    PRINT '✓ Added CustomerType to Customers';
END
GO

IF COL_LENGTH('Customers', 'CustomerGroupId') IS NULL
BEGIN
    ALTER TABLE Customers ADD CustomerGroupId INT NULL;
    PRINT '✓ Added CustomerGroupId to Customers';
END
GO

IF COL_LENGTH('Customers', 'GSTIN') IS NULL
BEGIN
    ALTER TABLE Customers ADD GSTIN NVARCHAR(15) NULL;
    PRINT '✓ Added GSTIN to Customers';
END
GO

IF COL_LENGTH('Customers', 'PaymentTerms') IS NULL
BEGIN
    ALTER TABLE Customers ADD PaymentTerms NVARCHAR(50) NULL;
    PRINT '✓ Added PaymentTerms to Customers';
END
GO

IF COL_LENGTH('Customers', 'CreditDays') IS NULL
BEGIN
    ALTER TABLE Customers ADD CreditDays INT NULL;
    PRINT '✓ Added CreditDays to Customers';
END
GO

IF COL_LENGTH('Customers', 'CreditLimit') IS NULL
BEGIN
    ALTER TABLE Customers ADD CreditLimit DECIMAL(18,2) NULL DEFAULT 0;
    PRINT '✓ Added CreditLimit to Customers';
END
GO

IF COL_LENGTH('Customers', 'OutstandingBalance') IS NULL
BEGIN
    ALTER TABLE Customers ADD OutstandingBalance DECIMAL(18,2) NULL DEFAULT 0;
    PRINT '✓ Added OutstandingBalance to Customers';
END
GO

IF COL_LENGTH('Customers', 'LoyaltyPoints') IS NULL
BEGIN
    ALTER TABLE Customers ADD LoyaltyPoints DECIMAL(18,2) NULL DEFAULT 0;
    PRINT '✓ Added LoyaltyPoints to Customers';
END
GO

IF COL_LENGTH('Customers', 'WalletBalance') IS NULL
BEGIN
    ALTER TABLE Customers ADD WalletBalance DECIMAL(18,2) NULL DEFAULT 0;
    PRINT '✓ Added WalletBalance to Customers';
END
GO

-- Add Barcode to Products
IF COL_LENGTH('Products', 'Barcode') IS NULL
BEGIN
    ALTER TABLE Products ADD Barcode NVARCHAR(100) NULL;
    PRINT '✓ Added Barcode to Products';
END
GO

-- Create BulkPricing table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'BulkPricing')
BEGIN
    CREATE TABLE BulkPricing (
        Id INT PRIMARY KEY IDENTITY(1,1),
        TenantId INT NOT NULL,
        ProductId INT NOT NULL,
        MinQuantity DECIMAL(18,2) NOT NULL,
        MaxQuantity DECIMAL(18,2) NULL,
        Price DECIMAL(18,2) NOT NULL,
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        FOREIGN KEY (TenantId) REFERENCES Tenants(Id),
        FOREIGN KEY (ProductId) REFERENCES Products(Id)
    );
    PRINT '✓ Created BulkPricing table';
END
GO

-- Create LoyaltyTransactions table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'LoyaltyTransactions')
BEGIN
    CREATE TABLE LoyaltyTransactions (
        Id INT PRIMARY KEY IDENTITY(1,1),
        TenantId INT NOT NULL,
        CustomerId INT NOT NULL,
        TransactionType NVARCHAR(20) NOT NULL, -- Earned, Redeemed, Expired
        Points DECIMAL(18,2) NOT NULL,
        ReferenceType NVARCHAR(50) NULL, -- Invoice, Return, etc.
        ReferenceId INT NULL,
        Description NVARCHAR(500) NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        FOREIGN KEY (TenantId) REFERENCES Tenants(Id),
        FOREIGN KEY (CustomerId) REFERENCES Customers(Id)
    );
    PRINT '✓ Created LoyaltyTransactions table';
END
GO

-- Create BundleProducts table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'BundleProducts')
BEGIN
    CREATE TABLE BundleProducts (
        Id INT PRIMARY KEY IDENTITY(1,1),
        TenantId INT NOT NULL,
        Name NVARCHAR(200) NOT NULL,
        Description NVARCHAR(1000) NULL,
        SKU NVARCHAR(100) NULL,
        SellingPrice DECIMAL(18,2) NOT NULL,
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        FOREIGN KEY (TenantId) REFERENCES Tenants(Id)
    );
    PRINT '✓ Created BundleProducts table';
END
GO

-- Create BundleItems table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'BundleItems')
BEGIN
    CREATE TABLE BundleItems (
        Id INT PRIMARY KEY IDENTITY(1,1),
        BundleProductId INT NOT NULL,
        ProductId INT NOT NULL,
        Quantity DECIMAL(18,2) NOT NULL DEFAULT 1,
        FOREIGN KEY (BundleProductId) REFERENCES BundleProducts(Id) ON DELETE CASCADE,
        FOREIGN KEY (ProductId) REFERENCES Products(Id)
    );
    PRINT '✓ Created BundleItems table';
END
GO

PRINT '✓ B2B/B2C Features Migration Completed';
PRINT '';
GO

-- =============================================
-- PART 2: NEW FEATURES MIGRATION
-- =============================================
PRINT 'PART 2: New Features Migration...';
PRINT '----------------------------------------';
GO

-- Add fields to InvoiceItems for B2B/B2C
IF COL_LENGTH('InvoiceItems', 'PaymentTerms') IS NULL
BEGIN
    ALTER TABLE InvoiceItems ADD PaymentTerms NVARCHAR(50) NULL;
    PRINT '✓ Added PaymentTerms to InvoiceItems';
END
GO

IF COL_LENGTH('InvoiceItems', 'DueDate') IS NULL
BEGIN
    ALTER TABLE InvoiceItems ADD DueDate DATETIME2 NULL;
    PRINT '✓ Added DueDate to InvoiceItems';
END
GO

IF COL_LENGTH('InvoiceItems', 'IsTaxInvoice') IS NULL
BEGIN
    ALTER TABLE InvoiceItems ADD IsTaxInvoice BIT NULL DEFAULT 0;
    PRINT '✓ Added IsTaxInvoice to InvoiceItems';
END
GO

IF COL_LENGTH('InvoiceItems', 'PlaceOfSupply') IS NULL
BEGIN
    ALTER TABLE InvoiceItems ADD PlaceOfSupply NVARCHAR(100) NULL;
    PRINT '✓ Added PlaceOfSupply to InvoiceItems';
END
GO

IF COL_LENGTH('InvoiceItems', 'LoyaltyPointsEarned') IS NULL
BEGIN
    ALTER TABLE InvoiceItems ADD LoyaltyPointsEarned DECIMAL(18,2) NULL DEFAULT 0;
    PRINT '✓ Added LoyaltyPointsEarned to InvoiceItems';
END
GO

IF COL_LENGTH('InvoiceItems', 'LoyaltyPointsRedeemed') IS NULL
BEGIN
    ALTER TABLE InvoiceItems ADD LoyaltyPointsRedeemed DECIMAL(18,2) NULL DEFAULT 0;
    PRINT '✓ Added LoyaltyPointsRedeemed to InvoiceItems';
END
GO

PRINT '✓ New Features Migration Completed';
PRINT '';
GO

-- =============================================
-- PART 3: RMG FEATURES MIGRATION
-- =============================================
PRINT 'PART 3: RMG Features Migration...';
PRINT '----------------------------------------';
GO

-- Add RMG fields to Products table
IF COL_LENGTH('Products', 'StyleCode') IS NULL
BEGIN
    ALTER TABLE Products ADD StyleCode NVARCHAR(50) NULL;
    PRINT '✓ Added StyleCode to Products';
END
GO

IF COL_LENGTH('Products', 'Season') IS NULL
BEGIN
    ALTER TABLE Products ADD Season NVARCHAR(50) NULL;
    PRINT '✓ Added Season to Products';
END
GO

IF COL_LENGTH('Products', 'Collection') IS NULL
BEGIN
    ALTER TABLE Products ADD Collection NVARCHAR(100) NULL;
    PRINT '✓ Added Collection to Products';
END
GO

IF COL_LENGTH('Products', 'Gender') IS NULL
BEGIN
    ALTER TABLE Products ADD Gender NVARCHAR(20) NULL;
    PRINT '✓ Added Gender to Products';
END
GO

IF COL_LENGTH('Products', 'FabricType') IS NULL
BEGIN
    ALTER TABLE Products ADD FabricType NVARCHAR(50) NULL;
    PRINT '✓ Added FabricType to Products';
END
GO

IF COL_LENGTH('Products', 'SizeChartId') IS NULL
BEGIN
    ALTER TABLE Products ADD SizeChartId INT NULL;
    PRINT '✓ Added SizeChartId to Products';
END
GO

-- Create SizeCharts table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SizeCharts')
BEGIN
    CREATE TABLE SizeCharts (
        Id INT PRIMARY KEY IDENTITY(1,1),
        TenantId INT NOT NULL,
        Name NVARCHAR(100) NOT NULL,
        SizeValues NVARCHAR(MAX) NOT NULL, -- JSON or comma-separated
        Description NVARCHAR(500) NULL,
        IsDefault BIT NOT NULL DEFAULT 0,
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        FOREIGN KEY (TenantId) REFERENCES Tenants(Id)
    );
    PRINT '✓ Created SizeCharts table';
END
ELSE
BEGIN
    -- Add IsDefault column if table exists but column is missing
    IF COL_LENGTH('SizeCharts', 'IsDefault') IS NULL
    BEGIN
        ALTER TABLE SizeCharts ADD IsDefault BIT NOT NULL DEFAULT 0;
        PRINT '✓ Added IsDefault column to existing SizeCharts table';
    END
END
GO

-- Create ProductVariantCombinations table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ProductVariantCombinations')
BEGIN
    CREATE TABLE ProductVariantCombinations (
        Id INT PRIMARY KEY IDENTITY(1,1),
        TenantId INT NOT NULL,
        ProductId INT NOT NULL,
        Size NVARCHAR(20) NOT NULL,
        Color NVARCHAR(50) NOT NULL,
        StyleCode NVARCHAR(50) NULL,
        SKU NVARCHAR(100) NULL,
        Barcode NVARCHAR(100) NULL,
        CostPrice DECIMAL(18,2) NULL,
        SellingPrice DECIMAL(18,2) NULL,
        StockQuantity INT NOT NULL DEFAULT 0,
        ImageUrl NVARCHAR(500) NULL,
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        FOREIGN KEY (TenantId) REFERENCES Tenants(Id),
        FOREIGN KEY (ProductId) REFERENCES Products(Id) ON DELETE CASCADE,
        UNIQUE (ProductId, Size, Color)
    );
    PRINT '✓ Created ProductVariantCombinations table';
END
GO

-- Add variant fields to InvoiceItems
IF COL_LENGTH('InvoiceItems', 'VariantCombinationId') IS NULL
BEGIN
    ALTER TABLE InvoiceItems ADD VariantCombinationId INT NULL;
    PRINT '✓ Added VariantCombinationId to InvoiceItems';
END
GO

IF COL_LENGTH('InvoiceItems', 'Size') IS NULL
BEGIN
    ALTER TABLE InvoiceItems ADD Size NVARCHAR(20) NULL;
    PRINT '✓ Added Size to InvoiceItems';
END
GO

IF COL_LENGTH('InvoiceItems', 'Color') IS NULL
BEGIN
    ALTER TABLE InvoiceItems ADD Color NVARCHAR(50) NULL;
    PRINT '✓ Added Color to InvoiceItems';
END
GO

-- Add variant fields to Inventories
IF COL_LENGTH('Inventories', 'VariantCombinationId') IS NULL
BEGIN
    ALTER TABLE Inventories ADD VariantCombinationId INT NULL;
    PRINT '✓ Added VariantCombinationId to Inventories';
END
GO

-- Add variant fields to StockTransactions
IF COL_LENGTH('StockTransactions', 'VariantCombinationId') IS NULL
BEGIN
    ALTER TABLE StockTransactions ADD VariantCombinationId INT NULL;
    PRINT '✓ Added VariantCombinationId to StockTransactions';
END
GO

IF COL_LENGTH('StockTransactions', 'Size') IS NULL
BEGIN
    ALTER TABLE StockTransactions ADD Size NVARCHAR(20) NULL;
    PRINT '✓ Added Size to StockTransactions';
END
GO

IF COL_LENGTH('StockTransactions', 'Color') IS NULL
BEGIN
    ALTER TABLE StockTransactions ADD Color NVARCHAR(50) NULL;
    PRINT '✓ Added Color to StockTransactions';
END
GO

-- Create SalesReturns table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SalesReturns')
BEGIN
    CREATE TABLE SalesReturns (
        Id INT PRIMARY KEY IDENTITY(1,1),
        TenantId INT NOT NULL,
        InvoiceId INT NOT NULL,
        ReturnNumber NVARCHAR(50) NOT NULL,
        ReturnDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        Reason NVARCHAR(500) NOT NULL,
        TotalAmount DECIMAL(18,2) NOT NULL DEFAULT 0,
        TotalTaxAmount DECIMAL(18,2) NOT NULL DEFAULT 0,
        TotalDiscountAmount DECIMAL(18,2) NOT NULL DEFAULT 0,
        Status NVARCHAR(20) NOT NULL DEFAULT 'Pending',
        Notes NVARCHAR(1000) NULL,
        CreatedById INT NOT NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        ProcessedAt DATETIME2 NULL,
        FOREIGN KEY (TenantId) REFERENCES Tenants(Id),
        FOREIGN KEY (InvoiceId) REFERENCES Invoices(Id),
        FOREIGN KEY (CreatedById) REFERENCES Users(Id)
    );
    PRINT '✓ Created SalesReturns table';
END
GO

-- Create SalesReturnItems table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SalesReturnItems')
BEGIN
    CREATE TABLE SalesReturnItems (
        Id INT PRIMARY KEY IDENTITY(1,1),
        SalesReturnId INT NOT NULL,
        InvoiceItemId INT NOT NULL,
        ProductId INT NOT NULL,
        VariantCombinationId INT NULL,
        ProductName NVARCHAR(200) NOT NULL,
        Size NVARCHAR(20) NULL,
        Color NVARCHAR(50) NULL,
        Quantity DECIMAL(18,2) NOT NULL,
        UnitPrice DECIMAL(18,2) NOT NULL,
        DiscountAmount DECIMAL(18,2) NOT NULL DEFAULT 0,
        TaxRate DECIMAL(18,2) NOT NULL DEFAULT 0,
        TaxAmount DECIMAL(18,2) NOT NULL DEFAULT 0,
        TotalAmount DECIMAL(18,2) NOT NULL,
        ReturnReason NVARCHAR(500) NULL,
        FOREIGN KEY (SalesReturnId) REFERENCES SalesReturns(Id) ON DELETE CASCADE,
        FOREIGN KEY (InvoiceItemId) REFERENCES InvoiceItems(Id),
        FOREIGN KEY (ProductId) REFERENCES Products(Id),
        FOREIGN KEY (VariantCombinationId) REFERENCES ProductVariantCombinations(Id)
    );
    PRINT '✓ Created SalesReturnItems table';
END
GO

-- Create SalesExchanges table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SalesExchanges')
BEGIN
    CREATE TABLE SalesExchanges (
        Id INT PRIMARY KEY IDENTITY(1,1),
        TenantId INT NOT NULL,
        OriginalInvoiceId INT NOT NULL,
        NewInvoiceId INT NULL,
        ExchangeNumber NVARCHAR(50) NOT NULL,
        ExchangeDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        Reason NVARCHAR(500) NOT NULL,
        OriginalItemsTotalAmount DECIMAL(18,2) NOT NULL DEFAULT 0,
        NewItemsTotalAmount DECIMAL(18,2) NOT NULL DEFAULT 0,
        PriceDifferenceAmount DECIMAL(18,2) NOT NULL DEFAULT 0,
        PriceDifferencePaymentMode NVARCHAR(20) NOT NULL DEFAULT 'Cash',
        Status NVARCHAR(20) NOT NULL DEFAULT 'Pending',
        Notes NVARCHAR(1000) NULL,
        CreatedById INT NOT NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CompletedAt DATETIME2 NULL,
        FOREIGN KEY (TenantId) REFERENCES Tenants(Id),
        FOREIGN KEY (OriginalInvoiceId) REFERENCES Invoices(Id),
        FOREIGN KEY (NewInvoiceId) REFERENCES Invoices(Id),
        FOREIGN KEY (CreatedById) REFERENCES Users(Id)
    );
    PRINT '✓ Created SalesExchanges table';
END
GO

-- Create SalesExchangeItems table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SalesExchangeItems')
BEGIN
    CREATE TABLE SalesExchangeItems (
        Id INT PRIMARY KEY IDENTITY(1,1),
        SalesExchangeId INT NOT NULL,
        OriginalInvoiceItemId INT NULL,
        ProductId INT NOT NULL,
        VariantCombinationId INT NULL,
        ProductName NVARCHAR(200) NOT NULL,
        Size NVARCHAR(20) NULL,
        Color NVARCHAR(50) NULL,
        Quantity DECIMAL(18,2) NOT NULL,
        UnitPrice DECIMAL(18,2) NOT NULL,
        DiscountAmount DECIMAL(18,2) NOT NULL DEFAULT 0,
        TaxRate DECIMAL(18,2) NOT NULL DEFAULT 0,
        TaxAmount DECIMAL(18,2) NOT NULL DEFAULT 0,
        TotalAmount DECIMAL(18,2) NOT NULL,
        ItemType NVARCHAR(20) NOT NULL DEFAULT 'ExchangedOut',
        FOREIGN KEY (SalesExchangeId) REFERENCES SalesExchanges(Id) ON DELETE CASCADE,
        FOREIGN KEY (OriginalInvoiceItemId) REFERENCES InvoiceItems(Id),
        FOREIGN KEY (ProductId) REFERENCES Products(Id),
        FOREIGN KEY (VariantCombinationId) REFERENCES ProductVariantCombinations(Id)
    );
    PRINT '✓ Created SalesExchangeItems table';
END
GO

-- Add foreign key for SizeChartId in Products
IF NOT EXISTS (
    SELECT 1 FROM sys.foreign_keys 
    WHERE name = 'FK_Products_SizeCharts_SizeChartId'
)
BEGIN
    ALTER TABLE Products 
    ADD CONSTRAINT FK_Products_SizeCharts_SizeChartId 
    FOREIGN KEY (SizeChartId) REFERENCES SizeCharts(Id) ON DELETE SET NULL;
    PRINT '✓ Added foreign key for SizeChartId';
END
GO

PRINT '✓ RMG Features Migration Completed';
PRINT '';
GO

-- =============================================
-- FINAL VERIFICATION
-- =============================================
PRINT '========================================';
PRINT 'Migration Verification';
PRINT '========================================';

-- Check Products columns
DECLARE @ProductColumns INT = 0;
IF COL_LENGTH('Products', 'Barcode') IS NOT NULL SET @ProductColumns = @ProductColumns + 1;
IF COL_LENGTH('Products', 'StyleCode') IS NOT NULL SET @ProductColumns = @ProductColumns + 1;
IF COL_LENGTH('Products', 'Season') IS NOT NULL SET @ProductColumns = @ProductColumns + 1;
IF COL_LENGTH('Products', 'Collection') IS NOT NULL SET @ProductColumns = @ProductColumns + 1;
IF COL_LENGTH('Products', 'Gender') IS NOT NULL SET @ProductColumns = @ProductColumns + 1;
IF COL_LENGTH('Products', 'FabricType') IS NOT NULL SET @ProductColumns = @ProductColumns + 1;
IF COL_LENGTH('Products', 'SizeChartId') IS NOT NULL SET @ProductColumns = @ProductColumns + 1;

PRINT 'Products RMG columns: ' + CAST(@ProductColumns AS VARCHAR) + '/7';

-- Check Customers columns
DECLARE @CustomerColumns INT = 0;
IF COL_LENGTH('Customers', 'CustomerType') IS NOT NULL SET @CustomerColumns = @CustomerColumns + 1;
IF COL_LENGTH('Customers', 'GSTIN') IS NOT NULL SET @CustomerColumns = @CustomerColumns + 1;
IF COL_LENGTH('Customers', 'CreditLimit') IS NOT NULL SET @CustomerColumns = @CustomerColumns + 1;
IF COL_LENGTH('Customers', 'LoyaltyPoints') IS NOT NULL SET @CustomerColumns = @CustomerColumns + 1;

PRINT 'Customers B2B/B2C columns: ' + CAST(@CustomerColumns AS VARCHAR) + '/4';

-- Check tables
DECLARE @Tables INT = 0;
IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'BulkPricing') SET @Tables = @Tables + 1;
IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'LoyaltyTransactions') SET @Tables = @Tables + 1;
IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'BundleProducts') SET @Tables = @Tables + 1;
IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'SizeCharts') SET @Tables = @Tables + 1;
IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'ProductVariantCombinations') SET @Tables = @Tables + 1;
IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'SalesReturns') SET @Tables = @Tables + 1;
IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'SalesExchanges') SET @Tables = @Tables + 1;

PRINT 'New tables created: ' + CAST(@Tables AS VARCHAR) + '/7';

PRINT '';
PRINT '========================================';
PRINT '✓ MASTER MIGRATION COMPLETED!';
PRINT '========================================';
PRINT 'Please restart your BillingAPI application.';
PRINT '========================================';
GO

