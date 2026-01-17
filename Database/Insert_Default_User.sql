-- ============================================
-- INSERT DEFAULT TENANT AND USER
-- For initial login testing
-- ============================================

USE BillingDB;
GO

-- Insert default tenant if it doesn't exist
IF NOT EXISTS (SELECT * FROM [Tenants] WHERE [Code] = 'DEMO001')
BEGIN
    INSERT INTO [Tenants] ([Name], [Code], [BusinessType], [IsActive], [PlanType], [CreatedAt]) 
    VALUES ('Demo Shop', 'DEMO001', 'Retail', 1, 'Premium', GETUTCDATE());
    PRINT 'Default tenant DEMO001 created.';
END
ELSE
BEGIN
    PRINT 'Tenant DEMO001 already exists.';
END
GO

-- Get the tenant ID and insert default tenant configuration
DECLARE @TenantId INT;
SELECT @TenantId = [Id] FROM [Tenants] WHERE [Code] = 'DEMO001';

IF NOT EXISTS (SELECT * FROM [TenantConfigurations] WHERE [TenantId] = @TenantId)
BEGIN
    INSERT INTO [TenantConfigurations] ([TenantId], [InvoicePrefix], [InvoiceNumberStart], [EnableInventory], [EnableGST], [Currency], [Language]) 
    VALUES (@TenantId, 'INV', 1, 1, 1, 'INR', 'en');
    PRINT 'Default tenant configuration created.';
END
GO

-- Insert default user if it doesn't exist
-- Password: Admin@123
-- Hash: SHA256 of "Admin@123" = jGl25bVBBBW96Qi9Te4V37Fnqchz/Eu4qB9vKrRIqRg=
DECLARE @TenantId2 INT;
SELECT @TenantId2 = [Id] FROM [Tenants] WHERE [Code] = 'DEMO001';

IF NOT EXISTS (SELECT * FROM [Users] WHERE [Email] = 'admin@demoshop.com' AND [TenantId] = @TenantId2)
BEGIN
    INSERT INTO [Users] ([TenantId], [Email], [PasswordHash], [FirstName], [LastName], [IsActive], [CreatedAt]) 
    VALUES (@TenantId2, 'admin@demoshop.com', 'jGl25bVBBBW96Qi9Te4V37Fnqchz/Eu4qB9vKrRIqRg=', 'Admin', 'User', 1, GETUTCDATE());
    PRINT 'Default user admin@demoshop.com created.';
END
ELSE
BEGIN
    PRINT 'User admin@demoshop.com already exists.';
END
GO

-- Get the user ID and assign Owner role
DECLARE @UserId INT;
DECLARE @TenantId3 INT;
DECLARE @RoleId INT;

SELECT @TenantId3 = [Id] FROM [Tenants] WHERE [Code] = 'DEMO001';
SELECT @UserId = [Id] FROM [Users] WHERE [Email] = 'admin@demoshop.com' AND [TenantId] = @TenantId3;
SELECT @RoleId = [Id] FROM [Roles] WHERE [Name] = 'Owner';

IF @UserId IS NOT NULL AND @RoleId IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT * FROM [UserRoles] WHERE [UserId] = @UserId AND [RoleId] = @RoleId)
    BEGIN
        INSERT INTO [UserRoles] ([UserId], [RoleId]) 
        VALUES (@UserId, @RoleId);
        PRINT 'Owner role assigned to admin user.';
    END
    ELSE
    BEGIN
        PRINT 'Owner role already assigned to admin user.';
    END
END
GO

PRINT '========================================';
PRINT 'Default tenant and user setup complete!';
PRINT 'Login credentials:';
PRINT '  Tenant Code: DEMO001';
PRINT '  Email: admin@demoshop.com';
PRINT '  Password: Admin@123';
PRINT '========================================';
GO
