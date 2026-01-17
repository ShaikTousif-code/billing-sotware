-- Fix Balance Amount for Completed Invoices
-- This script ensures that all completed invoices have balanceAmount = 0 and paidAmount = totalAmount

USE smartbillingsoluition;
GO

PRINT '========================================';
PRINT 'Fixing Balance Amount for Completed Invoices';
PRINT '========================================';
GO

-- Update completed invoices where balanceAmount > 0
-- Set paidAmount = totalAmount and balanceAmount = 0
UPDATE [Invoices]
SET 
    [PaidAmount] = [TotalAmount],
    [BalanceAmount] = 0
WHERE 
    [Status] = 'Completed' 
    AND [BalanceAmount] > 0
    AND [PaidAmount] < [TotalAmount];

-- Show affected invoices
SELECT 
    [Id],
    [InvoiceNumber],
    [Status],
    [TotalAmount],
    [PaidAmount],
    [BalanceAmount],
    CASE 
        WHEN [Status] = 'Completed' AND [BalanceAmount] = 0 THEN 'Fixed'
        WHEN [Status] = 'Completed' AND [BalanceAmount] > 0 THEN 'Needs Fix'
        ELSE 'OK'
    END AS [StatusCheck]
FROM [Invoices]
WHERE [Status] = 'Completed'
ORDER BY [Id] DESC;

PRINT '';
PRINT 'Completed invoices updated:';
PRINT '  - Set PaidAmount = TotalAmount';
PRINT '  - Set BalanceAmount = 0';
PRINT '========================================';
GO

