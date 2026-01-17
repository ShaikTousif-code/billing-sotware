-- Migration: Add ConsultationFee to Appointments Table
-- Description: Adds ConsultationFee column to store consultation fees for appointments
-- Date: 2024-12-30

USE [BillingDB]
GO

PRINT 'Starting ConsultationFee Migration...'
GO

-- Check if Appointments table exists
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Appointments')
BEGIN
    PRINT 'Appointments table exists. Adding ConsultationFee column...'
    
    -- Add ConsultationFee column (nullable decimal)
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Appointments') AND name = 'ConsultationFee')
    BEGIN
        ALTER TABLE [Appointments]
        ADD [ConsultationFee] DECIMAL(18, 2) NULL;
        PRINT 'Added ConsultationFee column.'
    END
    ELSE
    BEGIN
        PRINT 'ConsultationFee column already exists.'
    END
    
    PRINT 'ConsultationFee migration completed successfully!'
END
ELSE
BEGIN
    PRINT 'ERROR: Appointments table does not exist. Please run the base migration first.'
END
GO

PRINT 'Migration completed.'
GO

