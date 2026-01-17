-- =============================================
-- CREATE READYMADE GARMENTS (RMG) TENANT AND USER
-- =============================================
-- This script creates:
-- 1. RMG Tenant (Readymade Garments business)
-- 2. RMG Admin User with login credentials
-- 3. Assigns Owner role to the user
-- =============================================

USE [smartbillingsoluition]
GO

PRINT '========================================';
PRINT 'Creating RMG Tenant and User...';
PRINT '========================================';
GO

-- =============================================
-- 1. CREATE RMG TENANT
-- =============================================
IF NOT EXISTS (SELECT * FROM [Tenants] WHERE [Code] = 'RMG001')
BEGIN
    INSERT INTO [Tenants] (
        [Name], 
        [Code], 
        [BusinessType], 
        [ContactEmail], 
        [ContactPhone], 
        [Address], 
        [IsActive], 
        [PlanType], 
        [CreatedAt]
    ) 
    VALUES (
        'Fashion Store - Readymade Garments', 
        'RMG001', 
        'General',  -- General/Retail billing type for RMG
        'admin@rmgstore.com', 
        '+91-9876543210', 
        '123 Fashion Street, Garment District, City, State 123456', 
        1, 
        'Premium', 
        GETUTCDATE()
    );
    PRINT '✓ RMG Tenant created successfully';
    PRINT '  Tenant Code: RMG001';
    PRINT '  Business Type: General (Retail)';
END
ELSE
BEGIN
    PRINT 'RMG Tenant (RMG001) already exists';
END
GO

-- =============================================
-- 2. GET RMG TENANT ID
-- =============================================
DECLARE @RMGTenantId INT;
SELECT @RMGTenantId = [Id] FROM [Tenants] WHERE [Code] = 'RMG001';

IF @RMGTenantId IS NULL
BEGIN
    PRINT 'ERROR: Could not find RMG Tenant. Please check the tenant creation.';
    RETURN;
END

PRINT 'RMG Tenant ID: ' + CAST(@RMGTenantId AS VARCHAR);
GO

-- =============================================
-- 3. ENSURE ROLES EXIST
-- =============================================
IF NOT EXISTS (SELECT * FROM [Roles] WHERE [Name] = 'Owner')
BEGIN
    INSERT INTO [Roles] ([Name], [Description]) 
    VALUES ('Owner', 'Full access to all features including RMG-specific features');
    PRINT '✓ Created Owner role';
END
GO

IF NOT EXISTS (SELECT * FROM [Roles] WHERE [Name] = 'Manager')
BEGIN
    INSERT INTO [Roles] ([Name], [Description]) 
    VALUES ('Manager', 'Can manage products, customers, invoices, and view reports');
    PRINT '✓ Created Manager role';
END
GO

-- =============================================
-- 4. CREATE RMG ADMIN USER
-- =============================================
DECLARE @RMGTenantId2 INT;
SELECT @RMGTenantId2 = [Id] FROM [Tenants] WHERE [Code] = 'RMG001';

IF NOT EXISTS (SELECT * FROM [Users] WHERE [Email] = 'admin@rmgstore.com' AND [TenantId] = @RMGTenantId2)
BEGIN
    -- Password: Admin@123
    -- Hash: SHA256 + Base64 encoding
    -- Same hash method as other admin users for consistency
    INSERT INTO [Users] (
        [TenantId], 
        [Email], 
        [PasswordHash], 
        [FirstName], 
        [LastName], 
        [Phone], 
        [IsActive], 
        [CreatedAt]
    ) 
    VALUES (
        @RMGTenantId2, 
        'admin@rmgstore.com', 
        'jGl25bVBBBW96Qi9Te4V37Fnqchz/Eu4qB9vKrRIqRg=',  -- Hash for "Admin@123"
        'RMG', 
        'Admin', 
        '+91-9876543210', 
        1, 
        GETUTCDATE()
    );
    PRINT '✓ RMG Admin user created successfully';
    PRINT '  Email: admin@rmgstore.com';
    PRINT '  Password: Admin@123';
END
ELSE
BEGIN
    PRINT 'RMG Admin user already exists';
END
GO

-- =============================================
-- 5. ASSIGN OWNER ROLE TO RMG ADMIN
-- =============================================
DECLARE @RMGAdminUserId INT;
DECLARE @OwnerRoleId INT;
DECLARE @RMGTenantId3 INT;

SELECT @RMGTenantId3 = [Id] FROM [Tenants] WHERE [Code] = 'RMG001';
SELECT @RMGAdminUserId = [Id] FROM [Users] WHERE [Email] = 'admin@rmgstore.com' AND [TenantId] = @RMGTenantId3;
SELECT @OwnerRoleId = [Id] FROM [Roles] WHERE [Name] = 'Owner';

IF @RMGAdminUserId IS NOT NULL AND @OwnerRoleId IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT * FROM [UserRoles] WHERE [UserId] = @RMGAdminUserId AND [RoleId] = @OwnerRoleId)
    BEGIN
        INSERT INTO [UserRoles] ([UserId], [RoleId]) 
        VALUES (@RMGAdminUserId, @OwnerRoleId);
        PRINT '✓ Owner role assigned to RMG Admin user';
    END
    ELSE
    BEGIN
        PRINT 'Owner role already assigned to RMG Admin user';
    END
END
ELSE
BEGIN
    PRINT 'WARNING: Could not assign role. User ID or Role ID is NULL';
    PRINT '  User ID: ' + ISNULL(CAST(@RMGAdminUserId AS VARCHAR), 'NULL');
    PRINT '  Role ID: ' + ISNULL(CAST(@OwnerRoleId AS VARCHAR), 'NULL');
END
GO

-- =============================================
-- 6. VERIFICATION
-- =============================================
PRINT '';
PRINT '========================================';
PRINT 'RMG Tenant and User Setup Summary';
PRINT '========================================';

DECLARE @RMGTenantId4 INT;
SELECT @RMGTenantId4 = [Id] FROM [Tenants] WHERE [Code] = 'RMG001';

IF @RMGTenantId4 IS NOT NULL
BEGIN
    SELECT 
        t.[Id] AS TenantId,
        t.[Name] AS TenantName,
        t.[Code] AS TenantCode,
        t.[BusinessType],
        t.[ContactEmail] AS TenantEmail,
        u.[Id] AS UserId,
        u.[Email] AS UserEmail,
        u.[FirstName] + ' ' + u.[LastName] AS UserName,
        r.[Name] AS UserRole
    FROM [Tenants] t
    LEFT JOIN [Users] u ON u.[TenantId] = t.[Id] AND u.[Email] = 'admin@rmgstore.com'
    LEFT JOIN [UserRoles] ur ON ur.[UserId] = u.[Id]
    LEFT JOIN [Roles] r ON r.[Id] = ur.[RoleId]
    WHERE t.[Code] = 'RMG001';
    
    PRINT '';
    PRINT '========================================';
    PRINT 'LOGIN CREDENTIALS:';
    PRINT '========================================';
    PRINT 'Email: admin@rmgstore.com';
    PRINT 'Password: Admin@123';
    PRINT 'Tenant Code: RMG001';
    PRINT '========================================';
    PRINT '';
    PRINT '✓ RMG Tenant and User setup completed successfully!';
    PRINT 'You can now login with the credentials above.';
END
ELSE
BEGIN
    PRINT '✗ ERROR: RMG Tenant was not created. Please check for errors above.';
END
GO

PRINT '';
PRINT '========================================';
PRINT 'Next Steps:';
PRINT '========================================';
PRINT '1. Login with: admin@rmgstore.com / Admin@123';
PRINT '2. Set billing type to "General" (Retail)';
PRINT '3. Start creating products with RMG fields';
PRINT '4. Create size charts';
PRINT '5. Add variant combinations (Size + Color)';
PRINT '========================================';
GO

