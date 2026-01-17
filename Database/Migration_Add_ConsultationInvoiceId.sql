USE [BillingDB]
GO

PRINT 'Starting Migration: Add ConsultationInvoiceId to Appointments table...'
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Appointments') AND name = 'ConsultationInvoiceId')
BEGIN
    ALTER TABLE [Appointments]
    ADD [ConsultationInvoiceId] INT NULL;
    
    -- Add foreign key constraint if needed (optional)
    -- ALTER TABLE [Appointments]
    -- ADD CONSTRAINT FK_Appointments_ConsultationInvoice 
    -- FOREIGN KEY ([ConsultationInvoiceId]) REFERENCES [Invoices]([Id]);
    
    PRINT 'ConsultationInvoiceId column added successfully to Appointments table.'
END
ELSE
BEGIN
    PRINT 'ConsultationInvoiceId column already exists in Appointments table. Skipping.'
END
GO

PRINT 'Migration: Add ConsultationInvoiceId to Appointments table completed.'
GO

