-- Migration: Enhanced Appointments for Hospital Patient Booking
-- Description: Adds Patient linking and hospital-specific fields to Appointments table
-- Date: 2024-12-29

USE [BillingDB]
GO

PRINT 'Starting Enhanced Appointments Migration...'
GO

-- Check if Appointments table exists
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Appointments')
BEGIN
    PRINT 'Appointments table exists. Adding new columns...'
    
    -- Add PatientId column (nullable, for medical appointments)
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Appointments') AND name = 'PatientId')
    BEGIN
        ALTER TABLE [Appointments]
        ADD [PatientId] INT NULL;
        PRINT 'Added PatientId column.'
    END
    ELSE
    BEGIN
        PRINT 'PatientId column already exists.'
    END
    
    -- Add AppointmentType column
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Appointments') AND name = 'AppointmentType')
    BEGIN
        ALTER TABLE [Appointments]
        ADD [AppointmentType] NVARCHAR(50) NULL;
        PRINT 'Added AppointmentType column.'
    END
    ELSE
    BEGIN
        PRINT 'AppointmentType column already exists.'
    END
    
    -- Add Specialty column
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Appointments') AND name = 'Specialty')
    BEGIN
        ALTER TABLE [Appointments]
        ADD [Specialty] NVARCHAR(100) NULL;
        PRINT 'Added Specialty column.'
    END
    ELSE
    BEGIN
        PRINT 'Specialty column already exists.'
    END
    
    -- Add DurationMinutes column
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Appointments') AND name = 'DurationMinutes')
    BEGIN
        DECLARE @rowCount INT
        SELECT @rowCount = COUNT(*) FROM [Appointments]
        
        IF @rowCount = 0
        BEGIN
            -- Table is empty, can add directly as NOT NULL with DEFAULT
            ALTER TABLE [Appointments]
            ADD [DurationMinutes] INT NOT NULL DEFAULT 30;
            PRINT 'Added DurationMinutes column with default value.'
        END
        ELSE
        BEGIN
            -- Table has rows, need to add as NULL, update, then make NOT NULL
            ALTER TABLE [Appointments]
            ADD [DurationMinutes] INT NULL;
            
            EXEC('UPDATE [Appointments] SET [DurationMinutes] = 30 WHERE [DurationMinutes] IS NULL');
            
            ALTER TABLE [Appointments]
            ALTER COLUMN [DurationMinutes] INT NOT NULL;
            
            -- Check if default constraint already exists
            IF NOT EXISTS (SELECT * FROM sys.default_constraints WHERE parent_object_id = OBJECT_ID('Appointments') AND parent_column_id = COLUMNPROPERTY(OBJECT_ID('Appointments'), 'DurationMinutes', 'ColumnId'))
            BEGIN
                ALTER TABLE [Appointments]
                ADD CONSTRAINT [DF_Appointments_DurationMinutes] DEFAULT 30 FOR [DurationMinutes];
            END
            PRINT 'Added DurationMinutes column and updated existing rows.'
        END
    END
    ELSE
    BEGIN
        PRINT 'DurationMinutes column already exists.'
    END
    
    -- Add CancellationReason column
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Appointments') AND name = 'CancellationReason')
    BEGIN
        ALTER TABLE [Appointments]
        ADD [CancellationReason] NVARCHAR(500) NULL;
        PRINT 'Added CancellationReason column.'
    END
    ELSE
    BEGIN
        PRINT 'CancellationReason column already exists.'
    END
    
    -- Add CancelledAt column
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Appointments') AND name = 'CancelledAt')
    BEGIN
        ALTER TABLE [Appointments]
        ADD [CancelledAt] DATETIME2 NULL;
        PRINT 'Added CancelledAt column.'
    END
    ELSE
    BEGIN
        PRINT 'CancelledAt column already exists.'
    END
    
    -- Add DoctorName column
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Appointments') AND name = 'DoctorName')
    BEGIN
        ALTER TABLE [Appointments]
        ADD [DoctorName] NVARCHAR(200) NULL;
        PRINT 'Added DoctorName column.'
    END
    ELSE
    BEGIN
        PRINT 'DoctorName column already exists.'
    END
    
    -- Add Location column
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Appointments') AND name = 'Location')
    BEGIN
        ALTER TABLE [Appointments]
        ADD [Location] NVARCHAR(200) NULL;
        PRINT 'Added Location column.'
    END
    ELSE
    BEGIN
        PRINT 'Location column already exists.'
    END
    
    -- Add ReasonForVisit column
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Appointments') AND name = 'ReasonForVisit')
    BEGIN
        ALTER TABLE [Appointments]
        ADD [ReasonForVisit] NVARCHAR(500) NULL;
        PRINT 'Added ReasonForVisit column.'
    END
    ELSE
    BEGIN
        PRINT 'ReasonForVisit column already exists.'
    END
    
    -- Add IsRecurring column
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Appointments') AND name = 'IsRecurring')
    BEGIN
        DECLARE @rowCount2 INT
        SELECT @rowCount2 = COUNT(*) FROM [Appointments]
        
        IF @rowCount2 = 0
        BEGIN
            -- Table is empty, can add directly as NOT NULL with DEFAULT
            ALTER TABLE [Appointments]
            ADD [IsRecurring] BIT NOT NULL DEFAULT 0;
            PRINT 'Added IsRecurring column with default value.'
        END
        ELSE
        BEGIN
            -- Table has rows, need to add as NULL, update, then make NOT NULL
            ALTER TABLE [Appointments]
            ADD [IsRecurring] BIT NULL;
            
            EXEC('UPDATE [Appointments] SET [IsRecurring] = 0 WHERE [IsRecurring] IS NULL');
            
            ALTER TABLE [Appointments]
            ALTER COLUMN [IsRecurring] BIT NOT NULL;
            
            -- Check if default constraint already exists
            IF NOT EXISTS (SELECT * FROM sys.default_constraints WHERE parent_object_id = OBJECT_ID('Appointments') AND parent_column_id = COLUMNPROPERTY(OBJECT_ID('Appointments'), 'IsRecurring', 'ColumnId'))
            BEGIN
                ALTER TABLE [Appointments]
                ADD CONSTRAINT [DF_Appointments_IsRecurring] DEFAULT 0 FOR [IsRecurring];
            END
            PRINT 'Added IsRecurring column and updated existing rows.'
        END
    END
    ELSE
    BEGIN
        PRINT 'IsRecurring column already exists.'
    END
    
    -- Add RecurringParentId column
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Appointments') AND name = 'RecurringParentId')
    BEGIN
        ALTER TABLE [Appointments]
        ADD [RecurringParentId] INT NULL;
        PRINT 'Added RecurringParentId column.'
    END
    ELSE
    BEGIN
        PRINT 'RecurringParentId column already exists.'
    END
    
    -- Add InvoiceId column (for billing integration)
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Appointments') AND name = 'InvoiceId')
    BEGIN
        ALTER TABLE [Appointments]
        ADD [InvoiceId] INT NULL;
        PRINT 'Added InvoiceId column.'
    END
    ELSE
    BEGIN
        PRINT 'InvoiceId column already exists.'
    END
    
    -- Add MedicalRecordId column (for linking to medical records)
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Appointments') AND name = 'MedicalRecordId')
    BEGIN
        ALTER TABLE [Appointments]
        ADD [MedicalRecordId] INT NULL;
        PRINT 'Added MedicalRecordId column.'
    END
    ELSE
    BEGIN
        PRINT 'MedicalRecordId column already exists.'
    END
    
    -- Add UpdatedAt column
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Appointments') AND name = 'UpdatedAt')
    BEGIN
        ALTER TABLE [Appointments]
        ADD [UpdatedAt] DATETIME2 NULL;
        PRINT 'Added UpdatedAt column.'
    END
    ELSE
    BEGIN
        PRINT 'UpdatedAt column already exists.'
    END
    
    -- Add ConfirmedAt column
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Appointments') AND name = 'ConfirmedAt')
    BEGIN
        ALTER TABLE [Appointments]
        ADD [ConfirmedAt] DATETIME2 NULL;
        PRINT 'Added ConfirmedAt column.'
    END
    ELSE
    BEGIN
        PRINT 'ConfirmedAt column already exists.'
    END
    
    -- Add CompletedAt column
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Appointments') AND name = 'CompletedAt')
    BEGIN
        ALTER TABLE [Appointments]
        ADD [CompletedAt] DATETIME2 NULL;
        PRINT 'Added CompletedAt column.'
    END
    ELSE
    BEGIN
        PRINT 'CompletedAt column already exists.'
    END
    
    -- Add CreatedById column
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Appointments') AND name = 'CreatedById')
    BEGIN
        ALTER TABLE [Appointments]
        ADD [CreatedById] INT NULL;
        PRINT 'Added CreatedById column.'
    END
    ELSE
    BEGIN
        PRINT 'CreatedById column already exists.'
    END
    
    -- Make CustomerId nullable (since we now support PatientId)
    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Appointments') AND name = 'CustomerId' AND is_nullable = 0)
    BEGIN
        ALTER TABLE [Appointments]
        ALTER COLUMN [CustomerId] INT NULL;
        PRINT 'Made CustomerId nullable.'
    END
    
    -- Expand Notes column if needed
    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Appointments') AND name = 'Notes' AND max_length < 1000)
    BEGIN
        ALTER TABLE [Appointments]
        ALTER COLUMN [Notes] NVARCHAR(1000) NULL;
        PRINT 'Expanded Notes column to NVARCHAR(1000).'
    END
    
    -- Expand Status column if needed
    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Appointments') AND name = 'Status' AND max_length < 50)
    BEGIN
        ALTER TABLE [Appointments]
        ALTER COLUMN [Status] NVARCHAR(50) NOT NULL;
        -- Update default constraint if it exists
        IF EXISTS (SELECT * FROM sys.default_constraints WHERE parent_object_id = OBJECT_ID('Appointments') AND name LIKE 'DF_Appointments_Status%')
        BEGIN
            DECLARE @constraintName NVARCHAR(200)
            SELECT @constraintName = name FROM sys.default_constraints WHERE parent_object_id = OBJECT_ID('Appointments') AND name LIKE 'DF_Appointments_Status%'
            EXEC('ALTER TABLE [Appointments] DROP CONSTRAINT ' + @constraintName)
        END
        ALTER TABLE [Appointments]
        ADD CONSTRAINT [DF_Appointments_Status] DEFAULT 'Scheduled' FOR [Status];
        PRINT 'Expanded Status column to NVARCHAR(50).'
    END
    
    -- Add Foreign Key for PatientId
    IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Appointments_Patients')
    BEGIN
        IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Patients')
        BEGIN
            ALTER TABLE [Appointments]
            ADD CONSTRAINT [FK_Appointments_Patients]
            FOREIGN KEY ([PatientId]) REFERENCES [Patients]([Id]) ON DELETE SET NULL;
            PRINT 'Added Foreign Key FK_Appointments_Patients.'
        END
        ELSE
        BEGIN
            PRINT 'Patients table does not exist. Skipping PatientId foreign key.'
        END
    END
    ELSE
    BEGIN
        PRINT 'Foreign Key FK_Appointments_Patients already exists.'
    END
    
    -- Add Foreign Key for InvoiceId
    IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Appointments_Invoices')
    BEGIN
        IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Invoices')
        BEGIN
            ALTER TABLE [Appointments]
            ADD CONSTRAINT [FK_Appointments_Invoices]
            FOREIGN KEY ([InvoiceId]) REFERENCES [Invoices]([Id]) ON DELETE SET NULL;
            PRINT 'Added Foreign Key FK_Appointments_Invoices.'
        END
        ELSE
        BEGIN
            PRINT 'Invoices table does not exist. Skipping InvoiceId foreign key.'
        END
    END
    ELSE
    BEGIN
        PRINT 'Foreign Key FK_Appointments_Invoices already exists.'
    END
    
    -- Add Foreign Key for MedicalRecordId
    IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Appointments_MedicalRecords')
    BEGIN
        IF EXISTS (SELECT * FROM sys.tables WHERE name = 'MedicalRecords')
        BEGIN
            ALTER TABLE [Appointments]
            ADD CONSTRAINT [FK_Appointments_MedicalRecords]
            FOREIGN KEY ([MedicalRecordId]) REFERENCES [MedicalRecords]([Id]) ON DELETE SET NULL;
            PRINT 'Added Foreign Key FK_Appointments_MedicalRecords.'
        END
        ELSE
        BEGIN
            PRINT 'MedicalRecords table does not exist. Skipping MedicalRecordId foreign key.'
        END
    END
    ELSE
    BEGIN
        PRINT 'Foreign Key FK_Appointments_MedicalRecords already exists.'
    END
    
    -- Add Foreign Key for RecurringParentId (self-referencing)
    IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Appointments_RecurringParent')
    BEGIN
        ALTER TABLE [Appointments]
        ADD CONSTRAINT [FK_Appointments_RecurringParent]
        FOREIGN KEY ([RecurringParentId]) REFERENCES [Appointments]([Id]) ON DELETE NO ACTION;
        PRINT 'Added Foreign Key FK_Appointments_RecurringParent.'
    END
    ELSE
    BEGIN
        PRINT 'Foreign Key FK_Appointments_RecurringParent already exists.'
    END
    
    -- Add Foreign Key for CreatedById
    IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Appointments_CreatedBy')
    BEGIN
        IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
        BEGIN
            ALTER TABLE [Appointments]
            ADD CONSTRAINT [FK_Appointments_CreatedBy]
            FOREIGN KEY ([CreatedById]) REFERENCES [Users]([Id]) ON DELETE SET NULL;
            PRINT 'Added Foreign Key FK_Appointments_CreatedBy.'
        END
        ELSE
        BEGIN
            PRINT 'Users table does not exist. Skipping CreatedById foreign key.'
        END
    END
    ELSE
    BEGIN
        PRINT 'Foreign Key FK_Appointments_CreatedBy already exists.'
    END
    
    -- Create index on PatientId for better query performance
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Appointments_PatientId')
    BEGIN
        CREATE INDEX [IX_Appointments_PatientId] ON [Appointments]([PatientId]);
        PRINT 'Created index IX_Appointments_PatientId.'
    END
    
    -- Create index on AppointmentDate and AppointmentTime for better query performance
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Appointments_Date_Time')
    BEGIN
        CREATE INDEX [IX_Appointments_Date_Time] ON [Appointments]([AppointmentDate], [AppointmentTime]);
        PRINT 'Created index IX_Appointments_Date_Time.'
    END
    
    -- Create index on AssignedToUserId for doctor schedule queries
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Appointments_Doctor_Date')
    BEGIN
        CREATE INDEX [IX_Appointments_Doctor_Date] ON [Appointments]([AssignedToUserId], [AppointmentDate]);
        PRINT 'Created index IX_Appointments_Doctor_Date.'
    END
    
    PRINT 'Enhanced Appointments migration completed successfully!'
END
ELSE
BEGIN
    PRINT 'ERROR: Appointments table does not exist. Please run the base migration first.'
END
GO

PRINT 'Migration completed.'
GO
