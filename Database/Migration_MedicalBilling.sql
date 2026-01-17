-- Migration Script for Medical Billing Module
-- Run this after Deploy_Complete_All_Tables.sql

USE BillingDB;
GO

-- ============================================
-- PATIENTS TABLE
-- ============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Patients')
BEGIN
    CREATE TABLE [dbo].[Patients] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [TenantId] INT NOT NULL,
        [PatientId] NVARCHAR(50) NOT NULL,
        [FirstName] NVARCHAR(100) NOT NULL,
        [LastName] NVARCHAR(100) NOT NULL,
        [DateOfBirth] DATETIME2 NOT NULL,
        [Gender] NVARCHAR(20) NOT NULL,
        [Email] NVARCHAR(256) NULL,
        [Phone] NVARCHAR(20) NULL,
        [Mobile] NVARCHAR(20) NULL,
        [Address] NVARCHAR(500) NULL,
        [City] NVARCHAR(100) NULL,
        [State] NVARCHAR(100) NULL,
        [ZipCode] NVARCHAR(20) NULL,
        [Country] NVARCHAR(100) NULL,
        [BloodGroup] NVARCHAR(10) NULL,
        [Allergies] NVARCHAR(MAX) NULL,
        [MedicalHistory] NVARCHAR(MAX) NULL,
        [CurrentMedications] NVARCHAR(MAX) NULL,
        [EmergencyContactName] NVARCHAR(200) NULL,
        [EmergencyContactPhone] NVARCHAR(20) NULL,
        [EmergencyContactRelation] NVARCHAR(50) NULL,
        [InsuranceProvider] NVARCHAR(200) NULL,
        [InsurancePolicyNumber] NVARCHAR(100) NULL,
        [InsuranceGroupNumber] NVARCHAR(100) NULL,
        [InsuranceExpiryDate] DATETIME2 NULL,
        [InsuranceCardNumber] NVARCHAR(100) NULL,
        [Status] NVARCHAR(50) NOT NULL DEFAULT 'Active',
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [UpdatedAt] DATETIME2 NULL,
        FOREIGN KEY ([TenantId]) REFERENCES [Tenants]([Id])
    );
    
    CREATE UNIQUE INDEX IX_Patients_TenantId_PatientId ON [Patients]([TenantId], [PatientId]);
    CREATE INDEX IX_Patients_TenantId ON [Patients]([TenantId]);
    CREATE INDEX IX_Patients_Status ON [Patients]([Status]);
    PRINT 'Table Patients created.';
END
ELSE
    PRINT 'Table Patients already exists.';
GO

-- ============================================
-- MEDICAL RECORDS TABLE
-- ============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'MedicalRecords')
BEGIN
    CREATE TABLE [dbo].[MedicalRecords] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [TenantId] INT NOT NULL,
        [PatientId] INT NOT NULL,
        [ProviderId] INT NULL,
        [VisitNumber] NVARCHAR(50) NOT NULL,
        [VisitDate] DATETIME2 NOT NULL,
        [VisitType] NVARCHAR(50) NOT NULL DEFAULT 'Consultation',
        [ChiefComplaint] NVARCHAR(MAX) NULL,
        [HistoryOfPresentIllness] NVARCHAR(MAX) NULL,
        [ReviewOfSystems] NVARCHAR(MAX) NULL,
        [PhysicalExamination] NVARCHAR(MAX) NULL,
        [Assessment] NVARCHAR(MAX) NULL,
        [Plan] NVARCHAR(MAX) NULL,
        [Notes] NVARCHAR(MAX) NULL,
        [Height] DECIMAL(5,2) NULL,
        [Weight] DECIMAL(5,2) NULL,
        [BloodPressureSystolic] DECIMAL(5,2) NULL,
        [BloodPressureDiastolic] DECIMAL(5,2) NULL,
        [Temperature] DECIMAL(4,2) NULL,
        [Pulse] INT NULL,
        [RespiratoryRate] INT NULL,
        [OxygenSaturation] DECIMAL(5,2) NULL,
        [Status] NVARCHAR(50) NOT NULL DEFAULT 'Active',
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [UpdatedAt] DATETIME2 NULL,
        FOREIGN KEY ([TenantId]) REFERENCES [Tenants]([Id]),
        FOREIGN KEY ([PatientId]) REFERENCES [Patients]([Id]),
        FOREIGN KEY ([ProviderId]) REFERENCES [Users]([Id])
    );
    
    CREATE UNIQUE INDEX IX_MedicalRecords_TenantId_VisitNumber ON [MedicalRecords]([TenantId], [VisitNumber]);
    CREATE INDEX IX_MedicalRecords_TenantId_PatientId ON [MedicalRecords]([TenantId], [PatientId]);
    CREATE INDEX IX_MedicalRecords_VisitDate ON [MedicalRecords]([VisitDate]);
    PRINT 'Table MedicalRecords created.';
END
ELSE
    PRINT 'Table MedicalRecords already exists.';
GO

-- ============================================
-- DIAGNOSES TABLE
-- ============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Diagnoses')
BEGIN
    CREATE TABLE [dbo].[Diagnoses] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [TenantId] INT NOT NULL,
        [MedicalRecordId] INT NOT NULL,
        [ICD10Code] NVARCHAR(20) NOT NULL,
        [Description] NVARCHAR(500) NOT NULL,
        [Type] NVARCHAR(50) NOT NULL DEFAULT 'Primary',
        [Notes] NVARCHAR(MAX) NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        FOREIGN KEY ([TenantId]) REFERENCES [Tenants]([Id]),
        FOREIGN KEY ([MedicalRecordId]) REFERENCES [MedicalRecords]([Id]) ON DELETE CASCADE
    );
    
    CREATE INDEX IX_Diagnoses_TenantId ON [Diagnoses]([TenantId]);
    CREATE INDEX IX_Diagnoses_MedicalRecordId ON [Diagnoses]([MedicalRecordId]);
    CREATE INDEX IX_Diagnoses_ICD10Code ON [Diagnoses]([ICD10Code]);
    PRINT 'Table Diagnoses created.';
END
ELSE
    PRINT 'Table Diagnoses already exists.';
GO

-- ============================================
-- PROCEDURES TABLE
-- ============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Procedures')
BEGIN
    CREATE TABLE [dbo].[Procedures] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [TenantId] INT NOT NULL,
        [MedicalRecordId] INT NOT NULL,
        [CPTCode] NVARCHAR(20) NOT NULL,
        [Description] NVARCHAR(500) NOT NULL,
        [Quantity] DECIMAL(10,2) NOT NULL DEFAULT 1,
        [UnitPrice] DECIMAL(18,2) NOT NULL,
        [TotalAmount] DECIMAL(18,2) NOT NULL,
        [Modifier] NVARCHAR(10) NULL,
        [Notes] NVARCHAR(MAX) NULL,
        [ProcedureDate] DATETIME2 NOT NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        FOREIGN KEY ([TenantId]) REFERENCES [Tenants]([Id]),
        FOREIGN KEY ([MedicalRecordId]) REFERENCES [MedicalRecords]([Id]) ON DELETE CASCADE
    );
    
    CREATE INDEX IX_Procedures_TenantId ON [Procedures]([TenantId]);
    CREATE INDEX IX_Procedures_MedicalRecordId ON [Procedures]([MedicalRecordId]);
    CREATE INDEX IX_Procedures_CPTCode ON [Procedures]([CPTCode]);
    PRINT 'Table Procedures created.';
END
ELSE
    PRINT 'Table Procedures already exists.';
GO

-- ============================================
-- PRESCRIPTIONS TABLE
-- ============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Prescriptions')
BEGIN
    CREATE TABLE [dbo].[Prescriptions] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [TenantId] INT NOT NULL,
        [MedicalRecordId] INT NOT NULL,
        [PatientId] INT NOT NULL,
        [PrescriptionNumber] NVARCHAR(50) NOT NULL,
        [MedicationName] NVARCHAR(200) NOT NULL,
        [GenericName] NVARCHAR(200) NULL,
        [Dosage] NVARCHAR(100) NOT NULL,
        [Frequency] NVARCHAR(100) NOT NULL,
        [Duration] NVARCHAR(100) NOT NULL,
        [Quantity] INT NOT NULL,
        [Instructions] NVARCHAR(MAX) NULL,
        [Schedule] NVARCHAR(20) NULL,
        [PrescribedDate] DATETIME2 NOT NULL,
        [StartDate] DATETIME2 NULL,
        [EndDate] DATETIME2 NULL,
        [Status] NVARCHAR(50) NOT NULL DEFAULT 'Active',
        [Notes] NVARCHAR(MAX) NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        FOREIGN KEY ([TenantId]) REFERENCES [Tenants]([Id]),
        FOREIGN KEY ([MedicalRecordId]) REFERENCES [MedicalRecords]([Id]) ON DELETE CASCADE,
        FOREIGN KEY ([PatientId]) REFERENCES [Patients]([Id])
    );
    
    CREATE UNIQUE INDEX IX_Prescriptions_TenantId_PrescriptionNumber ON [Prescriptions]([TenantId], [PrescriptionNumber]);
    CREATE INDEX IX_Prescriptions_TenantId_PatientId ON [Prescriptions]([TenantId], [PatientId]);
    CREATE INDEX IX_Prescriptions_MedicalRecordId ON [Prescriptions]([MedicalRecordId]);
    PRINT 'Table Prescriptions created.';
END
ELSE
    PRINT 'Table Prescriptions already exists.';
GO

-- ============================================
-- ICD-10 CODES REFERENCE TABLE
-- ============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ICD10Codes')
BEGIN
    CREATE TABLE [dbo].[ICD10Codes] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [Code] NVARCHAR(20) NOT NULL UNIQUE,
        [Description] NVARCHAR(500) NOT NULL,
        [Category] NVARCHAR(200) NULL,
        [Chapter] NVARCHAR(200) NULL,
        [IsActive] BIT NOT NULL DEFAULT 1,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE()
    );
    
    CREATE INDEX IX_ICD10Codes_Code ON [ICD10Codes]([Code]);
    CREATE INDEX IX_ICD10Codes_Category ON [ICD10Codes]([Category]);
    PRINT 'Table ICD10Codes created.';
END
ELSE
    PRINT 'Table ICD10Codes already exists.';
GO

-- ============================================
-- CPT CODES REFERENCE TABLE
-- ============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'CPTCodes')
BEGIN
    CREATE TABLE [dbo].[CPTCodes] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [Code] NVARCHAR(20) NOT NULL UNIQUE,
        [Description] NVARCHAR(500) NOT NULL,
        [Category] NVARCHAR(200) NULL,
        [TypicalFee] DECIMAL(18,2) NULL,
        [IsActive] BIT NOT NULL DEFAULT 1,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE()
    );
    
    CREATE INDEX IX_CPTCodes_Code ON [CPTCodes]([Code]);
    CREATE INDEX IX_CPTCodes_Category ON [CPTCodes]([Category]);
    PRINT 'Table CPTCodes created.';
END
ELSE
    PRINT 'Table CPTCodes already exists.';
GO

-- ============================================
-- INSERT SAMPLE ICD-10 CODES
-- ============================================
IF NOT EXISTS (SELECT * FROM [ICD10Codes] WHERE Code = 'E11.9')
BEGIN
    INSERT INTO [ICD10Codes] ([Code], [Description], [Category], [Chapter]) VALUES
    ('E11.9', 'Type 2 diabetes mellitus without complications', 'Endocrine, nutritional and metabolic diseases', 'Chapter 4'),
    ('I10', 'Essential (primary) hypertension', 'Diseases of the circulatory system', 'Chapter 9'),
    ('J06.9', 'Acute upper respiratory infection, unspecified', 'Diseases of the respiratory system', 'Chapter 10'),
    ('M79.3', 'Panniculitis, unspecified', 'Diseases of the musculoskeletal system', 'Chapter 13'),
    ('K21.9', 'Gastro-esophageal reflux disease without esophagitis', 'Diseases of the digestive system', 'Chapter 11'),
    ('F41.1', 'Generalized anxiety disorder', 'Mental and behavioural disorders', 'Chapter 5'),
    ('M54.5', 'Low back pain', 'Diseases of the musculoskeletal system', 'Chapter 13'),
    ('R50.9', 'Fever, unspecified', 'Symptoms, signs and abnormal clinical and laboratory findings', 'Chapter 18');
    PRINT 'Sample ICD-10 codes inserted.';
END
ELSE
    PRINT 'ICD-10 codes already exist.';
GO

-- ============================================
-- INSERT SAMPLE CPT CODES
-- ============================================
IF NOT EXISTS (SELECT * FROM [CPTCodes] WHERE Code = '99213')
BEGIN
    INSERT INTO [CPTCodes] ([Code], [Description], [Category], [TypicalFee]) VALUES
    ('99213', 'Office or other outpatient visit for the evaluation and management of an established patient', 'Evaluation and Management', 150.00),
    ('99214', 'Office or other outpatient visit for the evaluation and management of an established patient', 'Evaluation and Management', 200.00),
    ('99215', 'Office or other outpatient visit for the evaluation and management of an established patient', 'Evaluation and Management', 250.00),
    ('36415', 'Routine venipuncture for collection of specimen(s)', 'Pathology and Laboratory', 25.00),
    ('85025', 'Complete blood count (CBC)', 'Pathology and Laboratory', 50.00),
    ('80053', 'Comprehensive metabolic panel', 'Pathology and Laboratory', 75.00),
    ('93000', 'Electrocardiogram, routine ECG with at least 12 leads', 'Medicine', 100.00),
    ('71020', 'Radiologic examination, chest, 2 views', 'Radiology', 150.00);
    PRINT 'Sample CPT codes inserted.';
END
ELSE
    PRINT 'CPT codes already exist.';
GO

PRINT 'Medical Billing module migration completed successfully!';
GO

