-- Create SupportTickets Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[SupportTickets]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[SupportTickets] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [TenantId] INT NOT NULL,
        [UserId] INT NULL,
        [TicketNumber] NVARCHAR(50) NOT NULL,
        [Subject] NVARCHAR(200) NOT NULL,
        [Description] NVARCHAR(MAX) NOT NULL,
        [Email] NVARCHAR(100) NOT NULL,
        [Phone] NVARCHAR(20) NOT NULL,
        [Priority] NVARCHAR(20) NOT NULL DEFAULT 'Medium',
        [Status] NVARCHAR(20) NOT NULL DEFAULT 'Open',
        [AssignedTo] NVARCHAR(100) NULL,
        [Resolution] NVARCHAR(MAX) NULL,
        [ResolvedAt] DATETIME2 NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [UpdatedAt] DATETIME2 NULL,
        FOREIGN KEY ([TenantId]) REFERENCES [Tenants]([Id]),
        FOREIGN KEY ([UserId]) REFERENCES [Users]([Id])
    );
    
    -- Create unique index on TicketNumber
    CREATE UNIQUE INDEX IX_SupportTickets_TicketNumber ON [SupportTickets]([TicketNumber]);
    
    -- Create index on TenantId and Status for faster queries
    CREATE INDEX IX_SupportTickets_TenantId_Status ON [SupportTickets]([TenantId], [Status]);
    
    -- Create index on CreatedAt for sorting
    CREATE INDEX IX_SupportTickets_CreatedAt ON [SupportTickets]([CreatedAt] DESC);
    
    PRINT 'SupportTickets table created successfully';
END
ELSE
BEGIN
    PRINT 'SupportTickets table already exists';
END
GO

