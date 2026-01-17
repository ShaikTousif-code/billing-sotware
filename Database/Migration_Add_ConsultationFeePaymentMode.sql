USE [BillingDB]
GO

PRINT 'Starting Migration: Add ConsultationFeePaymentMode to Appointments table...'
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Appointments') AND name = 'ConsultationFeePaymentMode')
BEGIN
    ALTER TABLE [Appointments]
    ADD [ConsultationFeePaymentMode] NVARCHAR(50) NULL;
    
    PRINT 'ConsultationFeePaymentMode column added successfully to Appointments table.'
END
ELSE
BEGIN
    PRINT 'ConsultationFeePaymentMode column already exists in Appointments table. Skipping.'
END
GO

PRINT 'Migration: Add ConsultationFeePaymentMode to Appointments table completed.'
GO

