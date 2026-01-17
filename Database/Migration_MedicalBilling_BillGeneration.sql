USE BillingDB;
GO

PRINT 'Adding medical billing columns to Invoice table...';

-- Add PatientId to Invoice table
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Invoices') AND name = 'PatientId')
BEGIN
    ALTER TABLE [dbo].[Invoices] ADD [PatientId] INT NULL;
    PRINT 'Added PatientId column to Invoices';
END
GO

-- Add MedicalRecordId to Invoice table
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Invoices') AND name = 'MedicalRecordId')
BEGIN
    ALTER TABLE [dbo].[Invoices] ADD [MedicalRecordId] INT NULL;
    PRINT 'Added MedicalRecordId column to Invoices';
END
GO

-- Add foreign key constraint for PatientId
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Invoices_Patients_PatientId')
BEGIN
    ALTER TABLE [dbo].[Invoices]
    ADD CONSTRAINT [FK_Invoices_Patients_PatientId] 
    FOREIGN KEY ([PatientId]) REFERENCES [dbo].[Patients] ([Id]);
    PRINT 'Added foreign key constraint FK_Invoices_Patients_PatientId';
END
GO

-- Add foreign key constraint for MedicalRecordId
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Invoices_MedicalRecords_MedicalRecordId')
BEGIN
    ALTER TABLE [dbo].[Invoices]
    ADD CONSTRAINT [FK_Invoices_MedicalRecords_MedicalRecordId] 
    FOREIGN KEY ([MedicalRecordId]) REFERENCES [dbo].[MedicalRecords] ([Id]);
    PRINT 'Added foreign key constraint FK_Invoices_MedicalRecords_MedicalRecordId';
END
GO

PRINT 'Adding pricing columns to Prescription table...';

-- Add UnitPrice to Prescription table
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Prescriptions') AND name = 'UnitPrice')
BEGIN
    ALTER TABLE [dbo].[Prescriptions] ADD [UnitPrice] DECIMAL(18,2) NULL;
    PRINT 'Added UnitPrice column to Prescriptions';
END
GO

-- Add TotalPrice to Prescription table
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Prescriptions') AND name = 'TotalPrice')
BEGIN
    ALTER TABLE [dbo].[Prescriptions] ADD [TotalPrice] DECIMAL(18,2) NULL;
    PRINT 'Added TotalPrice column to Prescriptions';
END
GO

-- Add ProductId to Prescription table
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Prescriptions') AND name = 'ProductId')
BEGIN
    ALTER TABLE [dbo].[Prescriptions] ADD [ProductId] INT NULL;
    PRINT 'Added ProductId column to Prescriptions';
END
GO

-- Add foreign key constraint for ProductId
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Prescriptions_Products_ProductId')
BEGIN
    ALTER TABLE [dbo].[Prescriptions]
    ADD CONSTRAINT [FK_Prescriptions_Products_ProductId] 
    FOREIGN KEY ([ProductId]) REFERENCES [dbo].[Products] ([Id]);
    PRINT 'Added foreign key constraint FK_Prescriptions_Products_ProductId';
END
GO

PRINT 'Medical billing bill generation migration completed!';
GO

