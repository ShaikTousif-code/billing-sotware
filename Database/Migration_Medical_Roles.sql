-- Migration: Add Medical-Specific User Roles
-- Description: Adds Doctor, Reception, and Medical Biller roles for hospital workflow
-- Date: 2024-12-29

USE [BillingDB]
GO

PRINT 'Starting Medical Roles Migration...'
GO

-- Check if Roles table exists
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Roles')
BEGIN
    PRINT 'Roles table exists. Adding medical roles...'
    
    -- Add Doctor role
    IF NOT EXISTS (SELECT * FROM [Roles] WHERE [Name] = 'Doctor')
    BEGIN
        INSERT INTO [Roles] ([Name], [Description])
        VALUES ('Doctor', 'Can view appointments, create medical records, add prescriptions, and complete consultations');
        PRINT 'Added Doctor role.'
    END
    ELSE
    BEGIN
        PRINT 'Doctor role already exists.'
    END
    
    -- Add Reception role
    IF NOT EXISTS (SELECT * FROM [Roles] WHERE [Name] = 'Reception')
    BEGIN
        INSERT INTO [Roles] ([Name], [Description])
        VALUES ('Reception', 'Can book appointments, confirm appointments, and manage patient check-in/check-out');
        PRINT 'Added Reception role.'
    END
    ELSE
    BEGIN
        PRINT 'Reception role already exists.'
    END
    
    -- Add Medical Biller role
    IF NOT EXISTS (SELECT * FROM [Roles] WHERE [Name] = 'Medical Biller')
    BEGIN
        INSERT INTO [Roles] ([Name], [Description])
        VALUES ('Medical Biller', 'Can generate bills from medical records, review invoices, and manage medical billing');
        PRINT 'Added Medical Biller role.'
    END
    ELSE
    BEGIN
        PRINT 'Medical Biller role already exists.'
    END
    
    PRINT 'Medical roles migration completed successfully!'
END
ELSE
BEGIN
    PRINT 'ERROR: Roles table does not exist. Please run the base migration first.'
END
GO

PRINT 'Migration completed.'
GO
