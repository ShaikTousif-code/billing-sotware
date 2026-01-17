-- =============================================
-- FIX Invoice PaidAmount - Recalculate from Payments
-- =============================================
-- This script recalculates PaidAmount and BalanceAmount
-- based on actual payments in the Payments table
-- =============================================

USE [smartbillingsoluition]
GO

PRINT '========================================';
PRINT 'Fixing Invoice PaidAmount Calculations';
PRINT '========================================';
GO

-- Recalculate PaidAmount for all invoices based on actual payments
UPDATE i
SET 
    i.PaidAmount = ISNULL((
        SELECT SUM(p.Amount)
        FROM Payments p
        WHERE p.InvoiceId = i.Id
    ), 0),
    i.BalanceAmount = i.TotalAmount - ISNULL((
        SELECT SUM(p.Amount)
        FROM Payments p
        WHERE p.InvoiceId = i.Id
    ), 0)
FROM Invoices i
GO

-- Update invoice status based on balance
UPDATE Invoices
SET Status = CASE
    WHEN BalanceAmount <= 0 AND Status != 'Cancelled' THEN 'Completed'
    WHEN BalanceAmount > 0 AND Status = 'Completed' AND TotalAmount > 0 THEN 'Draft'
    ELSE Status
END
WHERE BalanceAmount <= 0 OR (BalanceAmount > 0 AND Status = 'Completed')
GO

-- Show invoices with discrepancies
PRINT '';
PRINT '========================================';
PRINT 'Invoices with Payment Discrepancies:';
PRINT '========================================';

SELECT 
    i.Id,
    i.InvoiceNumber,
    i.TotalAmount,
    i.PaidAmount AS CurrentPaidAmount,
    ISNULL(SUM(p.Amount), 0) AS ActualPaidFromPayments,
    i.PaidAmount - ISNULL(SUM(p.Amount), 0) AS Difference,
    i.BalanceAmount,
    i.Status
FROM Invoices i
LEFT JOIN Payments p ON p.InvoiceId = i.Id
GROUP BY i.Id, i.InvoiceNumber, i.TotalAmount, i.PaidAmount, i.BalanceAmount, i.Status
HAVING ABS(i.PaidAmount - ISNULL(SUM(p.Amount), 0)) > 0.01
ORDER BY ABS(i.PaidAmount - ISNULL(SUM(p.Amount), 0)) DESC;
GO

-- Show summary
PRINT '';
PRINT '========================================';
PRINT 'Summary:';
PRINT '========================================';

DECLARE @TotalInvoices INT;
DECLARE @FixedInvoices INT;
DECLARE @TotalDiscrepancy DECIMAL(18,2);

SELECT @TotalInvoices = COUNT(*) FROM Invoices;
SELECT @FixedInvoices = COUNT(*) FROM Invoices WHERE ABS(PaidAmount - ISNULL((SELECT SUM(Amount) FROM Payments WHERE InvoiceId = Invoices.Id), 0)) <= 0.01;
SELECT @TotalDiscrepancy = SUM(ABS(PaidAmount - ISNULL((SELECT SUM(Amount) FROM Payments WHERE InvoiceId = Invoices.Id), 0))) 
FROM Invoices 
WHERE ABS(PaidAmount - ISNULL((SELECT SUM(Amount) FROM Payments WHERE InvoiceId = Invoices.Id), 0)) > 0.01;

PRINT 'Total Invoices: ' + CAST(@TotalInvoices AS VARCHAR);
PRINT 'Invoices with correct PaidAmount: ' + CAST(@FixedInvoices AS VARCHAR);
PRINT 'Invoices with discrepancies: ' + CAST(@TotalInvoices - @FixedInvoices AS VARCHAR);
IF @TotalDiscrepancy IS NOT NULL
    PRINT 'Total Discrepancy Amount: ₹' + CAST(@TotalDiscrepancy AS VARCHAR);
GO

PRINT '';
PRINT '========================================';
PRINT 'Fix completed!';
PRINT '========================================';
PRINT 'All invoice PaidAmount values have been recalculated';
PRINT 'based on actual payments in the Payments table.';
PRINT '========================================';
GO

