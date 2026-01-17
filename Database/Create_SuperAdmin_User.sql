-- =============================================
-- CREATE SUPER ADMIN USER
-- =============================================
-- This script creates:
-- 1. SYSTEM Tenant (if it doesn't exist)
-- 2. SuperAdmin Role (if it doesn't exist)
-- 3. SuperAdmin User with login credentials
-- 4. Assigns SuperAdmin role to the user
-- =============================================

USE [smartbillingsoluition]
GO

PRINT '========================================';
PRINT 'Creating SuperAdmin User...';
PRINT '========================================';
GO

-- =============================================
-- 1. CREATE SYSTEM TENANT (if not exists)
-- =============================================
IF NOT EXISTS (SELECT * FROM [Tenants] WHERE [Code] = 'SYSTEM')
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
        'System Administration', 
        'SYSTEM', 
        'System', 
        'admin@system.com', 
        '+91-0000000000', 
        'System', 
        1, 
        'Premium', 
        GETUTCDATE()
    );
    PRINT '✓ SYSTEM Tenant created successfully';
END
ELSE
BEGIN
    PRINT 'SYSTEM Tenant already exists';
END
GO

-- =============================================
-- 2. GET SYSTEM TENANT ID
-- =============================================
DECLARE @SystemTenantId INT;
SELECT @SystemTenantId = [Id] FROM [Tenants] WHERE [Code] = 'SYSTEM';

IF @SystemTenantId IS NULL
BEGIN
    PRINT 'ERROR: Could not find SYSTEM Tenant. Please check the tenant creation.';
    RETURN;
END

PRINT 'SYSTEM Tenant ID: ' + CAST(@SystemTenantId AS VARCHAR);
GO

-- =============================================
-- 3. ENSURE SUPERADMIN ROLE EXISTS
-- =============================================
IF NOT EXISTS (SELECT * FROM [Roles] WHERE [Name] = 'SuperAdmin')
BEGIN
    INSERT INTO [Roles] ([Name], [Description]) 
    VALUES ('SuperAdmin', 'System administrator with full access to all tenants and features');
    PRINT '✓ Created SuperAdmin role';
END
ELSE
BEGIN
    PRINT 'SuperAdmin role already exists';
END
GO

-- =============================================
-- 4. GET SUPERADMIN ROLE ID
-- =============================================
DECLARE @SuperAdminRoleId INT;
SELECT @SuperAdminRoleId = [Id] FROM [Roles] WHERE [Name] = 'SuperAdmin';

IF @SuperAdminRoleId IS NULL
BEGIN
    PRINT 'ERROR: Could not find SuperAdmin Role. Please check the role creation.';
    RETURN;
END

PRINT 'SuperAdmin Role ID: ' + CAST(@SuperAdminRoleId AS VARCHAR);
GO

-- =============================================
-- 5. CREATE SUPERADMIN USER
-- =============================================
-- Default credentials:
-- Email: admin@system.com
-- Password: Admin@123
-- You can change these values below
-- =============================================

DECLARE @SystemTenantId2 INT;
SELECT @SystemTenantId2 = [Id] FROM [Tenants] WHERE [Code] = 'SYSTEM';

DECLARE @SuperAdminEmail NVARCHAR(255) = 'admin@system.com';
DECLARE @SuperAdminPassword NVARCHAR(255) = 'Admin@123';
DECLARE @SuperAdminFirstName NVARCHAR(100) = 'Super';
DECLARE @SuperAdminLastName NVARCHAR(100) = 'Admin';
DECLARE @SuperAdminPhone NVARCHAR(20) = '+91-0000000000';

-- Check if user already exists
IF NOT EXISTS (SELECT * FROM [Users] WHERE [Email] = @SuperAdminEmail AND [TenantId] = @SystemTenantId2)
BEGIN
    -- Password: Admin@123
    -- Hash: SHA256 + Base64 encoding
    -- Pre-calculated hash for "Admin@123" (same as used in other admin users)
    DECLARE @PasswordHash NVARCHAR(MAX) = 'jGl25bVBBBW96Qi9Te4V37Fnqchz/Eu4qB9vKrRIqRg=';
    
    INSERT INTO [Users] (
        [TenantId],
        [Email],
        [FirstName],
        [LastName],
        [Phone],
        [PasswordHash],
        [IsActive],
        [CreatedAt]
    )
    VALUES (
        @SystemTenantId2,
        @SuperAdminEmail,
        @SuperAdminFirstName,
        @SuperAdminLastName,
        @SuperAdminPhone,
        @PasswordHash,
        1,
        GETUTCDATE()
    );
    
    PRINT '✓ SuperAdmin User created successfully';
    PRINT '  Email: ' + @SuperAdminEmail;
    PRINT '  Password: ' + @SuperAdminPassword;
    PRINT '  Name: ' + @SuperAdminFirstName + ' ' + @SuperAdminLastName;
END
ELSE
BEGIN
    PRINT 'SuperAdmin User already exists with email: ' + @SuperAdminEmail;
END
GO

-- =============================================
-- 6. ASSIGN SUPERADMIN ROLE TO USER
-- =============================================
DECLARE @SystemTenantId3 INT;
SELECT @SystemTenantId3 = [Id] FROM [Tenants] WHERE [Code] = 'SYSTEM';

DECLARE @SuperAdminUserId INT;
SELECT @SuperAdminUserId = [Id] FROM [Users] WHERE [Email] = 'admin@system.com' AND [TenantId] = @SystemTenantId3;

DECLARE @SuperAdminRoleId2 INT;
SELECT @SuperAdminRoleId2 = [Id] FROM [Roles] WHERE [Name] = 'SuperAdmin';

IF @SuperAdminUserId IS NOT NULL AND @SuperAdminRoleId2 IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT * FROM [UserRoles] WHERE [UserId] = @SuperAdminUserId AND [RoleId] = @SuperAdminRoleId2)
    BEGIN
        INSERT INTO [UserRoles] ([UserId], [RoleId])
        VALUES (@SuperAdminUserId, @SuperAdminRoleId2);
        PRINT '✓ SuperAdmin role assigned to user';
    END
    ELSE
    BEGIN
        PRINT 'SuperAdmin role already assigned to user';
    END
END
ELSE
BEGIN
    PRINT 'ERROR: Could not find SuperAdmin User or Role';
END
GO

PRINT '========================================';
PRINT 'SuperAdmin User Setup Complete!';
PRINT '========================================';
PRINT 'Login Credentials:';
PRINT '  Email: admin@system.com';
PRINT '  Password: Admin@123';
PRINT '  Tenant Code: (leave empty or SYSTEM)';
PRINT '========================================';
GO

