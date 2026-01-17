-- ============================================
-- CREATE SUPER ADMIN USER AND SYSTEM TENANT
-- ============================================
-- This script creates:
-- 1. SYSTEM tenant (for super admin operations)
-- 2. SuperAdmin role
-- 3. SuperAdmin permissions
-- 4. Super admin user
-- ============================================

USE BillingDB;
GO

SET QUOTED_IDENTIFIER ON;
GO

PRINT '========================================';
PRINT 'Creating Super Admin System...';
PRINT '========================================';
GO

-- Step 1: Create SYSTEM tenant if it doesn't exist
IF NOT EXISTS (SELECT * FROM [Tenants] WHERE [Code] = 'SYSTEM')
BEGIN
    INSERT INTO [Tenants] ([Name], [Code], [BusinessType], [IsActive], [CreatedAt], [PlanType])
    VALUES ('System Administration', 'SYSTEM', 'System', 1, GETUTCDATE(), 'Enterprise');
    PRINT 'Created SYSTEM tenant';
END
ELSE
BEGIN
    PRINT 'SYSTEM tenant already exists';
END
GO

-- Step 2: Create SuperAdmin role if it doesn't exist
DECLARE @SystemTenantId INT = (SELECT [Id] FROM [Tenants] WHERE [Code] = 'SYSTEM');
DECLARE @SuperAdminRoleId INT;

IF NOT EXISTS (SELECT * FROM [Roles] WHERE [Name] = 'SuperAdmin')
BEGIN
    INSERT INTO [Roles] ([Name], [Description])
    VALUES ('SuperAdmin', 'System Administrator with full access to manage tenants and users');
    SET @SuperAdminRoleId = SCOPE_IDENTITY();
    PRINT 'Created SuperAdmin role';
END
ELSE
BEGIN
    SET @SuperAdminRoleId = (SELECT [Id] FROM [Roles] WHERE [Name] = 'SuperAdmin');
    PRINT 'SuperAdmin role already exists';
END
GO

-- Step 3: Create SuperAdmin permissions
DECLARE @SuperAdminRoleId2 INT = (SELECT [Id] FROM [Roles] WHERE [Name] = 'SuperAdmin');

-- Permission: Manage Tenants
IF NOT EXISTS (SELECT * FROM [Permissions] WHERE [Name] = 'Manage.Tenants')
BEGIN
    INSERT INTO [Permissions] ([Name], [Description], [Category])
    VALUES ('Manage.Tenants', 'Manage tenant onboarding and configuration', 'Administration');
    PRINT 'Created Manage.Tenants permission';
END

-- Permission: Manage Users
IF NOT EXISTS (SELECT * FROM [Permissions] WHERE [Name] = 'Manage.Users')
BEGIN
    INSERT INTO [Permissions] ([Name], [Description], [Category])
    VALUES ('Manage.Users', 'Manage users across all tenants', 'Administration');
    PRINT 'Created Manage.Users permission';
END

-- Permission: View All Tenants
IF NOT EXISTS (SELECT * FROM [Permissions] WHERE [Name] = 'View.AllTenants')
BEGIN
    INSERT INTO [Permissions] ([Name], [Description], [Category])
    VALUES ('View.AllTenants', 'View all tenants in the system', 'Administration');
    PRINT 'Created View.AllTenants permission';
END

-- Permission: View All Users
IF NOT EXISTS (SELECT * FROM [Permissions] WHERE [Name] = 'View.AllUsers')
BEGIN
    INSERT INTO [Permissions] ([Name], [Description], [Category])
    VALUES ('View.AllUsers', 'View all users across all tenants', 'Administration');
    PRINT 'Created View.AllUsers permission';
END
GO

-- Step 4: Assign permissions to SuperAdmin role
DECLARE @SuperAdminRoleId3 INT = (SELECT [Id] FROM [Roles] WHERE [Name] = 'SuperAdmin');

-- Assign Manage.Tenants
DECLARE @ManageTenantsPermId INT = (SELECT [Id] FROM [Permissions] WHERE [Name] = 'Manage.Tenants');
IF NOT EXISTS (SELECT * FROM [RolePermissions] WHERE [RoleId] = @SuperAdminRoleId3 AND [PermissionId] = @ManageTenantsPermId)
BEGIN
    INSERT INTO [RolePermissions] ([RoleId], [PermissionId])
    VALUES (@SuperAdminRoleId3, @ManageTenantsPermId);
    PRINT 'Assigned Manage.Tenants permission to SuperAdmin';
END

-- Assign Manage.Users
DECLARE @ManageUsersPermId INT = (SELECT [Id] FROM [Permissions] WHERE [Name] = 'Manage.Users');
IF NOT EXISTS (SELECT * FROM [RolePermissions] WHERE [RoleId] = @SuperAdminRoleId3 AND [PermissionId] = @ManageUsersPermId)
BEGIN
    INSERT INTO [RolePermissions] ([RoleId], [PermissionId])
    VALUES (@SuperAdminRoleId3, @ManageUsersPermId);
    PRINT 'Assigned Manage.Users permission to SuperAdmin';
END

-- Assign View.AllTenants
DECLARE @ViewAllTenantsPermId INT = (SELECT [Id] FROM [Permissions] WHERE [Name] = 'View.AllTenants');
IF NOT EXISTS (SELECT * FROM [RolePermissions] WHERE [RoleId] = @SuperAdminRoleId3 AND [PermissionId] = @ViewAllTenantsPermId)
BEGIN
    INSERT INTO [RolePermissions] ([RoleId], [PermissionId])
    VALUES (@SuperAdminRoleId3, @ViewAllTenantsPermId);
    PRINT 'Assigned View.AllTenants permission to SuperAdmin';
END

-- Assign View.AllUsers
DECLARE @ViewAllUsersPermId INT = (SELECT [Id] FROM [Permissions] WHERE [Name] = 'View.AllUsers');
IF NOT EXISTS (SELECT * FROM [RolePermissions] WHERE [RoleId] = @SuperAdminRoleId3 AND [PermissionId] = @ViewAllUsersPermId)
BEGIN
    INSERT INTO [RolePermissions] ([RoleId], [PermissionId])
    VALUES (@SuperAdminRoleId3, @ViewAllUsersPermId);
    PRINT 'Assigned View.AllUsers permission to SuperAdmin';
END
GO

-- Step 5: Create Super Admin user
DECLARE @SystemTenantId2 INT = (SELECT [Id] FROM [Tenants] WHERE [Code] = 'SYSTEM');
DECLARE @SuperAdminRoleId4 INT = (SELECT [Id] FROM [Roles] WHERE [Name] = 'SuperAdmin');

-- Password: Admin@123 (same as DEMO user for consistency)
-- Hash: 6G94qKPK8LYNjnTllCqm2G3BUM08AzOK7yW30tfjrMc=
IF NOT EXISTS (SELECT * FROM [Users] WHERE [Email] = 'superadmin@system.com' AND [TenantId] = @SystemTenantId2)
BEGIN
    INSERT INTO [Users] ([TenantId], [Email], [PasswordHash], [FirstName], [LastName], [IsActive], [CreatedAt])
    VALUES (@SystemTenantId2, 'superadmin@system.com', '6G94qKPK8LYNjnTllCqm2G3BUM08AzOK7yW30tfjrMc=', 'Super', 'Admin', 1, GETUTCDATE());
    
    DECLARE @SuperAdminUserId INT = SCOPE_IDENTITY();
    
    -- Assign SuperAdmin role
    INSERT INTO [UserRoles] ([UserId], [RoleId])
    VALUES (@SuperAdminUserId, @SuperAdminRoleId4);
    
    PRINT 'Created Super Admin user: superadmin@system.com';
    PRINT 'Password: Admin@123';
END
ELSE
BEGIN
    PRINT 'Super Admin user already exists';
    
    -- Ensure SuperAdmin role is assigned
    DECLARE @SuperAdminUserId2 INT = (SELECT [Id] FROM [Users] WHERE [Email] = 'superadmin@system.com' AND [TenantId] = @SystemTenantId2);
    IF NOT EXISTS (SELECT * FROM [UserRoles] WHERE [UserId] = @SuperAdminUserId2 AND [RoleId] = @SuperAdminRoleId4)
    BEGIN
        INSERT INTO [UserRoles] ([UserId], [RoleId])
        VALUES (@SuperAdminUserId2, @SuperAdminRoleId4);
        PRINT 'Assigned SuperAdmin role to existing user';
    END
END
GO

PRINT '';
PRINT '========================================';
PRINT 'Super Admin Setup Complete!';
PRINT '========================================';
PRINT '';
PRINT 'Login Credentials:';
PRINT '  Tenant Code: SYSTEM (or leave empty)';
PRINT '  Email: superadmin@system.com';
PRINT '  Password: Admin@123';
PRINT '';
PRINT 'Features:';
PRINT '  - Manage all tenants';
PRINT '  - Onboard new tenants';
PRINT '  - Manage users across all tenants';
PRINT '  - View all system data';
PRINT '========================================';
GO

