-- Create Super Admin User and SYSTEM Tenant
-- This script creates a super admin user who can manage tenants and users

USE BillingDB;
GO

SET QUOTED_IDENTIFIER ON;
GO

PRINT '========================================';
PRINT 'Creating Super Admin System...';
PRINT '========================================';
GO

-- ============================================
-- 1. CREATE SUPERADMIN ROLE
-- ============================================
PRINT 'Creating SuperAdmin role...';

IF NOT EXISTS (SELECT * FROM [Roles] WHERE [Name] = 'SuperAdmin')
BEGIN
    INSERT INTO [Roles] ([Name], [Description])
    VALUES ('SuperAdmin', 'System administrator with full access to manage tenants and users');
    PRINT 'Created Role: SuperAdmin';
END
ELSE
    PRINT 'SuperAdmin role already exists';
GO

-- ============================================
-- 2. CREATE SYSTEM TENANT
-- ============================================
PRINT 'Creating SYSTEM tenant...';

DECLARE @SystemTenantId INT;

IF NOT EXISTS (SELECT * FROM [Tenants] WHERE [Code] = 'SYSTEM')
BEGIN
    INSERT INTO [Tenants] ([Name], [Code], [BusinessType], [IsActive], [PlanType], [CreatedAt])
    VALUES ('System Administration', 'SYSTEM', 'System', 1, 'Premium', GETUTCDATE());
    SET @SystemTenantId = SCOPE_IDENTITY();
    PRINT 'Created SYSTEM tenant';
END
ELSE
BEGIN
    SELECT @SystemTenantId = [Id] FROM [Tenants] WHERE [Code] = 'SYSTEM';
    PRINT 'SYSTEM tenant already exists';
END
GO

-- ============================================
-- 3. CREATE SUPER ADMIN USER
-- ============================================
PRINT 'Creating Super Admin user...';

DECLARE @SystemTenantId INT = (SELECT [Id] FROM [Tenants] WHERE [Code] = 'SYSTEM');
DECLARE @SuperAdminRoleId INT = (SELECT [Id] FROM [Roles] WHERE [Name] = 'SuperAdmin');
DECLARE @PasswordHash NVARCHAR(MAX) = 'jGl25bVBBBW96Qi9Te4V37Fnqchz/Eu4qB9vKrRIqRg='; -- Password123!
DECLARE @SuperAdminUserId INT;

IF NOT EXISTS (SELECT * FROM [Users] WHERE [Email] = 'superadmin@system.com' AND [TenantId] = @SystemTenantId)
BEGIN
    INSERT INTO [Users] ([TenantId], [Email], [PasswordHash], [FirstName], [LastName], [Phone], [IsActive], [CreatedAt])
    VALUES (@SystemTenantId, 'superadmin@system.com', @PasswordHash, 'Super', 'Admin', '+1-555-0000', 1, GETUTCDATE());
    SET @SuperAdminUserId = SCOPE_IDENTITY();
    
    -- Assign SuperAdmin role
    INSERT INTO [UserRoles] ([UserId], [RoleId]) VALUES (@SuperAdminUserId, @SuperAdminRoleId);
    
    PRINT 'Created Super Admin user: superadmin@system.com';
END
ELSE
BEGIN
    SELECT @SuperAdminUserId = [Id] FROM [Users] WHERE [Email] = 'superadmin@system.com' AND [TenantId] = @SystemTenantId;
    
    -- Ensure SuperAdmin role is assigned
    IF NOT EXISTS (SELECT * FROM [UserRoles] WHERE [UserId] = @SuperAdminUserId AND [RoleId] = @SuperAdminRoleId)
    BEGIN
        INSERT INTO [UserRoles] ([UserId], [RoleId]) VALUES (@SuperAdminUserId, @SuperAdminRoleId);
        PRINT 'Assigned SuperAdmin role to existing user';
    END
    ELSE
        PRINT 'Super Admin user already exists with SuperAdmin role';
END
GO

-- ============================================
-- 4. CREATE SYSTEM TENANT CONFIGURATION
-- ============================================
PRINT 'Creating SYSTEM tenant configuration...';

DECLARE @SystemTenantId INT = (SELECT [Id] FROM [Tenants] WHERE [Code] = 'SYSTEM');

IF NOT EXISTS (SELECT * FROM [TenantConfigurations] WHERE [TenantId] = @SystemTenantId)
BEGIN
    INSERT INTO [TenantConfigurations] ([TenantId], [InvoicePrefix], [Currency], [EnableGST], [EnableInventory])
    VALUES (@SystemTenantId, 'SYS', 'USD', 0, 0);
    PRINT 'Created configuration for SYSTEM tenant';
END
ELSE
    PRINT 'SYSTEM tenant configuration already exists';
GO

-- ============================================
-- 5. ADD SUPERADMIN PERMISSIONS
-- ============================================
PRINT 'Adding SuperAdmin permissions...';

DECLARE @SuperAdminRoleId INT = (SELECT [Id] FROM [Roles] WHERE [Name] = 'SuperAdmin');

-- Add tenant management permissions
IF NOT EXISTS (SELECT * FROM [Permissions] WHERE [Name] = 'tenants.view')
    INSERT INTO [Permissions] ([Name], [Description], [Category]) VALUES ('tenants.view', 'View tenants', 'Tenants');
IF NOT EXISTS (SELECT * FROM [Permissions] WHERE [Name] = 'tenants.create')
    INSERT INTO [Permissions] ([Name], [Description], [Category]) VALUES ('tenants.create', 'Create tenants', 'Tenants');
IF NOT EXISTS (SELECT * FROM [Permissions] WHERE [Name] = 'tenants.update')
    INSERT INTO [Permissions] ([Name], [Description], [Category]) VALUES ('tenants.update', 'Update tenants', 'Tenants');
IF NOT EXISTS (SELECT * FROM [Permissions] WHERE [Name] = 'tenants.delete')
    INSERT INTO [Permissions] ([Name], [Description], [Category]) VALUES ('tenants.delete', 'Delete tenants', 'Tenants');

-- Add admin user management permissions
IF NOT EXISTS (SELECT * FROM [Permissions] WHERE [Name] = 'admin.users.view')
    INSERT INTO [Permissions] ([Name], [Description], [Category]) VALUES ('admin.users.view', 'View all users', 'Admin');
IF NOT EXISTS (SELECT * FROM [Permissions] WHERE [Name] = 'admin.users.create')
    INSERT INTO [Permissions] ([Name], [Description], [Category]) VALUES ('admin.users.create', 'Create users', 'Admin');
IF NOT EXISTS (SELECT * FROM [Permissions] WHERE [Name] = 'admin.users.update')
    INSERT INTO [Permissions] ([Name], [Description], [Category]) VALUES ('admin.users.update', 'Update users', 'Admin');
IF NOT EXISTS (SELECT * FROM [Permissions] WHERE [Name] = 'admin.users.delete')
    INSERT INTO [Permissions] ([Name], [Description], [Category]) VALUES ('admin.users.delete', 'Delete users', 'Admin');

-- Assign all permissions to SuperAdmin
INSERT INTO [RolePermissions] ([RoleId], [PermissionId])
SELECT @SuperAdminRoleId, p.[Id]
FROM [Permissions] p
WHERE NOT EXISTS (
    SELECT 1 FROM [RolePermissions] rp 
    WHERE rp.[RoleId] = @SuperAdminRoleId AND rp.[PermissionId] = p.[Id]
);

PRINT 'SuperAdmin permissions assigned';
GO

PRINT '========================================';
PRINT 'Super Admin setup completed!';
PRINT '========================================';
PRINT '';
PRINT 'Super Admin Login Credentials:';
PRINT '  Tenant Code: SYSTEM (or leave empty)';
PRINT '  Email: superadmin@system.com';
PRINT '  Password: Password123!';
PRINT '';
PRINT 'Super Admin can now:';
PRINT '  - Onboard new tenants: POST /api/admin/tenants/onboard';
PRINT '  - Manage all tenants: GET /api/admin/tenants';
PRINT '  - Manage all users: GET /api/admin/users';
PRINT '  - Create users for any tenant';
PRINT '  - Reset passwords';
PRINT '========================================';
GO

