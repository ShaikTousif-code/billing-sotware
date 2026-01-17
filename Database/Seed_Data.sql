-- ============================================
-- SEED DATA SCRIPT
-- Creates Super Admin and Sample Tenants
-- ============================================

USE smartbillingsoluition;
GO

-- ============================================
-- 1. CREATE ROLES (if they don't exist)
-- ============================================
IF NOT EXISTS (SELECT * FROM [Roles] WHERE [Name] = 'SuperAdmin')
BEGIN
    INSERT INTO [Roles] ([Name], [Description]) 
    VALUES ('SuperAdmin', 'System super administrator with full access');
    PRINT 'SuperAdmin role created.';
END
GO

IF NOT EXISTS (SELECT * FROM [Roles] WHERE [Name] = 'Owner')
BEGIN
    INSERT INTO [Roles] ([Name], [Description]) 
    VALUES ('Owner', 'Full access to all features');
    PRINT 'Owner role created.';
END
GO

IF NOT EXISTS (SELECT * FROM [Roles] WHERE [Name] = 'Manager')
BEGIN
    INSERT INTO [Roles] ([Name], [Description]) 
    VALUES ('Manager', 'Can manage products, customers, and view reports');
    PRINT 'Manager role created.';
END
GO

IF NOT EXISTS (SELECT * FROM [Roles] WHERE [Name] = 'Accountant')
BEGIN
    INSERT INTO [Roles] ([Name], [Description]) 
    VALUES ('Accountant', 'Can view reports and manage financial data');
    PRINT 'Accountant role created.';
END
GO

IF NOT EXISTS (SELECT * FROM [Roles] WHERE [Name] = 'Cashier')
BEGIN
    INSERT INTO [Roles] ([Name], [Description]) 
    VALUES ('Cashier', 'Can create invoices and process payments');
    PRINT 'Cashier role created.';
END
GO

-- ============================================
-- 2. CREATE SYSTEM TENANT FOR SUPER ADMIN
-- ============================================
IF NOT EXISTS (SELECT * FROM [Tenants] WHERE [Code] = 'SYSTEM')
BEGIN
    INSERT INTO [Tenants] ([Name], [Code], [BusinessType], [ContactEmail], [ContactPhone], [Address], [IsActive], [PlanType], [CreatedAt]) 
    VALUES ('System Administration', 'SYSTEM', 'System', 'admin@system.com', '+91-9999999999', 'System Headquarters', 1, 'Enterprise', GETUTCDATE());
    PRINT 'SYSTEM tenant created.';
END
ELSE
BEGIN
    PRINT 'SYSTEM tenant already exists.';
END
GO

-- ============================================
-- 3. CREATE SUPER ADMIN USER
-- Password: SuperAdmin@123
-- Hash: SHA256 of "SuperAdmin@123" = Base64 encoded
-- ============================================
DECLARE @SystemTenantId INT;
SELECT @SystemTenantId = [Id] FROM [Tenants] WHERE [Code] = 'SYSTEM';

IF NOT EXISTS (SELECT * FROM [Users] WHERE [Email] = 'superadmin@system.com' AND [TenantId] = @SystemTenantId)
BEGIN
    -- Password: SuperAdmin@123
    -- Hash calculated using SHA256 + Base64 encoding
    -- Using same hash method as Admin@123 for consistency
    -- Note: In production, use proper password hashing
    INSERT INTO [Users] ([TenantId], [Email], [PasswordHash], [FirstName], [LastName], [Phone], [IsActive], [CreatedAt]) 
    VALUES (@SystemTenantId, 'superadmin@system.com', 'j0NDRmRki7YvMK4slV25ABg5S32epF46FszPFShs7w=', 'Super', 'Admin', '+91-9999999999', 1, GETUTCDATE());
    PRINT 'Super Admin user created.';
END
ELSE
BEGIN
    PRINT 'Super Admin user already exists.';
END
GO

-- Assign SuperAdmin role to super admin user
DECLARE @SuperAdminUserId INT;
DECLARE @SuperAdminRoleId INT;
DECLARE @SystemTenantId2 INT;

SELECT @SystemTenantId2 = [Id] FROM [Tenants] WHERE [Code] = 'SYSTEM';
SELECT @SuperAdminUserId = [Id] FROM [Users] WHERE [Email] = 'superadmin@system.com' AND [TenantId] = @SystemTenantId2;
SELECT @SuperAdminRoleId = [Id] FROM [Roles] WHERE [Name] = 'SuperAdmin';

IF @SuperAdminUserId IS NOT NULL AND @SuperAdminRoleId IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT * FROM [UserRoles] WHERE [UserId] = @SuperAdminUserId AND [RoleId] = @SuperAdminRoleId)
    BEGIN
        INSERT INTO [UserRoles] ([UserId], [RoleId]) 
        VALUES (@SuperAdminUserId, @SuperAdminRoleId);
        PRINT 'SuperAdmin role assigned to super admin user.';
    END
    ELSE
    BEGIN
        PRINT 'SuperAdmin role already assigned.';
    END
END
GO

-- ============================================
-- 4. CREATE SCHOOL TENANT
-- ============================================
IF NOT EXISTS (SELECT * FROM [Tenants] WHERE [Code] = 'SCHOOL001')
BEGIN
    INSERT INTO [Tenants] ([Name], [Code], [BusinessType], [ContactEmail], [ContactPhone], [Address], [IsActive], [PlanType], [CreatedAt]) 
    VALUES ('Greenwood High School', 'SCHOOL001', 'School', 'admin@greenwood.edu', '+91-9876543210', '123 Education Street, City, State 123456', 1, 'Premium', GETUTCDATE());
    PRINT 'School tenant created.';
END
ELSE
BEGIN
    PRINT 'School tenant already exists.';
END
GO

-- Create admin user for School
DECLARE @SchoolTenantId INT;
SELECT @SchoolTenantId = [Id] FROM [Tenants] WHERE [Code] = 'SCHOOL001';

IF NOT EXISTS (SELECT * FROM [Users] WHERE [Email] = 'admin@greenwood.edu' AND [TenantId] = @SchoolTenantId)
BEGIN
    -- Password: Admin@123
    INSERT INTO [Users] ([TenantId], [Email], [PasswordHash], [FirstName], [LastName], [Phone], [IsActive], [CreatedAt]) 
    VALUES (@SchoolTenantId, 'admin@greenwood.edu', 'jGl25bVBBBW96Qi9Te4V37Fnqchz/Eu4qB9vKrRIqRg=', 'Principal', 'Admin', '+91-9876543210', 1, GETUTCDATE());
    PRINT 'School admin user created.';
END

-- Assign Owner role to school admin
DECLARE @SchoolAdminUserId INT;
DECLARE @OwnerRoleId INT;

SELECT @SchoolAdminUserId = [Id] FROM [Users] WHERE [Email] = 'admin@greenwood.edu' AND [TenantId] = @SchoolTenantId;
SELECT @OwnerRoleId = [Id] FROM [Roles] WHERE [Name] = 'Owner';

IF @SchoolAdminUserId IS NOT NULL AND @OwnerRoleId IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT * FROM [UserRoles] WHERE [UserId] = @SchoolAdminUserId AND [RoleId] = @OwnerRoleId)
    BEGIN
        INSERT INTO [UserRoles] ([UserId], [RoleId]) VALUES (@SchoolAdminUserId, @OwnerRoleId);
    END
END

-- Create tenant configuration for School
IF NOT EXISTS (SELECT * FROM [TenantConfigurations] WHERE [TenantId] = @SchoolTenantId)
BEGIN
    INSERT INTO [TenantConfigurations] ([TenantId], [FinancialYearStart], [InvoicePrefix], [InvoiceNumberStart], [DecimalPlaces], [EnableInventory], [EnableGST], [Currency], [Language]) 
    VALUES (@SchoolTenantId, '04-01', 'FEE', 1, 2, 0, 0, 'INR', 'en');
    PRINT 'School tenant configuration created.';
END
GO

-- ============================================
-- 5. CREATE COLLEGE TENANT
-- ============================================
IF NOT EXISTS (SELECT * FROM [Tenants] WHERE [Code] = 'COLLEGE001')
BEGIN
    INSERT INTO [Tenants] ([Name], [Code], [BusinessType], [ContactEmail], [ContactPhone], [Address], [IsActive], [PlanType], [CreatedAt]) 
    VALUES ('Metropolitan College', 'COLLEGE001', 'College', 'admin@metrocollege.edu', '+91-9876543211', '456 University Avenue, City, State 123457', 1, 'Premium', GETUTCDATE());
    PRINT 'College tenant created.';
END
ELSE
BEGIN
    PRINT 'College tenant already exists.';
END
GO

-- Create admin user for College
DECLARE @CollegeTenantId INT;
SELECT @CollegeTenantId = [Id] FROM [Tenants] WHERE [Code] = 'COLLEGE001';

IF NOT EXISTS (SELECT * FROM [Users] WHERE [Email] = 'admin@metrocollege.edu' AND [TenantId] = @CollegeTenantId)
BEGIN
    -- Password: Admin@123
    INSERT INTO [Users] ([TenantId], [Email], [PasswordHash], [FirstName], [LastName], [Phone], [IsActive], [CreatedAt]) 
    VALUES (@CollegeTenantId, 'admin@metrocollege.edu', 'jGl25bVBBBW96Qi9Te4V37Fnqchz/Eu4qB9vKrRIqRg=', 'Dean', 'Administrator', '+91-9876543211', 1, GETUTCDATE());
    PRINT 'College admin user created.';
END

-- Assign Owner role to college admin
DECLARE @CollegeAdminUserId INT;
DECLARE @OwnerRoleId2 INT;

SELECT @CollegeAdminUserId = [Id] FROM [Users] WHERE [Email] = 'admin@metrocollege.edu' AND [TenantId] = @CollegeTenantId;
SELECT @OwnerRoleId2 = [Id] FROM [Roles] WHERE [Name] = 'Owner';

IF @CollegeAdminUserId IS NOT NULL AND @OwnerRoleId2 IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT * FROM [UserRoles] WHERE [UserId] = @CollegeAdminUserId AND [RoleId] = @OwnerRoleId2)
    BEGIN
        INSERT INTO [UserRoles] ([UserId], [RoleId]) VALUES (@CollegeAdminUserId, @OwnerRoleId2);
    END
END

-- Create tenant configuration for College
IF NOT EXISTS (SELECT * FROM [TenantConfigurations] WHERE [TenantId] = @CollegeTenantId)
BEGIN
    INSERT INTO [TenantConfigurations] ([TenantId], [FinancialYearStart], [InvoicePrefix], [InvoiceNumberStart], [DecimalPlaces], [EnableInventory], [EnableGST], [Currency], [Language]) 
    VALUES (@CollegeTenantId, '04-01', 'FEE', 1, 2, 0, 0, 'INR', 'en');
    PRINT 'College tenant configuration created.';
END
GO

-- ============================================
-- 6. CREATE RETAIL SHOP TENANT
-- ============================================
IF NOT EXISTS (SELECT * FROM [Tenants] WHERE [Code] = 'RETAIL001')
BEGIN
    INSERT INTO [Tenants] ([Name], [Code], [BusinessType], [ContactEmail], [ContactPhone], [Address], [IsActive], [PlanType], [CreatedAt]) 
    VALUES ('QuickMart Retail Store', 'RETAIL001', 'Retail', 'admin@quickmart.com', '+91-9876543212', '789 Shopping Mall, City, State 123458', 1, 'Premium', GETUTCDATE());
    PRINT 'Retail shop tenant created.';
END
ELSE
BEGIN
    PRINT 'Retail shop tenant already exists.';
END
GO

-- Create admin user for Retail Shop
DECLARE @RetailTenantId INT;
SELECT @RetailTenantId = [Id] FROM [Tenants] WHERE [Code] = 'RETAIL001';

IF NOT EXISTS (SELECT * FROM [Users] WHERE [Email] = 'admin@quickmart.com' AND [TenantId] = @RetailTenantId)
BEGIN
    -- Password: Admin@123
    INSERT INTO [Users] ([TenantId], [Email], [PasswordHash], [FirstName], [LastName], [Phone], [IsActive], [CreatedAt]) 
    VALUES (@RetailTenantId, 'admin@quickmart.com', 'jGl25bVBBBW96Qi9Te4V37Fnqchz/Eu4qB9vKrRIqRg=', 'Store', 'Manager', '+91-9876543212', 1, GETUTCDATE());
    PRINT 'Retail shop admin user created.';
END

-- Assign Owner role to retail admin
DECLARE @RetailAdminUserId INT;
DECLARE @OwnerRoleId3 INT;

SELECT @RetailAdminUserId = [Id] FROM [Users] WHERE [Email] = 'admin@quickmart.com' AND [TenantId] = @RetailTenantId;
SELECT @OwnerRoleId3 = [Id] FROM [Roles] WHERE [Name] = 'Owner';

IF @RetailAdminUserId IS NOT NULL AND @OwnerRoleId3 IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT * FROM [UserRoles] WHERE [UserId] = @RetailAdminUserId AND [RoleId] = @OwnerRoleId3)
    BEGIN
        INSERT INTO [UserRoles] ([UserId], [RoleId]) VALUES (@RetailAdminUserId, @OwnerRoleId3);
    END
END

-- Create tenant configuration for Retail Shop
IF NOT EXISTS (SELECT * FROM [TenantConfigurations] WHERE [TenantId] = @RetailTenantId)
BEGIN
    INSERT INTO [TenantConfigurations] ([TenantId], [FinancialYearStart], [InvoicePrefix], [InvoiceNumberStart], [DecimalPlaces], [EnableInventory], [EnableGST], [Currency], [Language]) 
    VALUES (@RetailTenantId, '04-01', 'INV', 1, 2, 1, 1, 'INR', 'en');
    PRINT 'Retail shop tenant configuration created.';
END
GO

-- ============================================
-- 7. CREATE OFFICE TENANT
-- ============================================
IF NOT EXISTS (SELECT * FROM [Tenants] WHERE [Code] = 'OFFICE001')
BEGIN
    INSERT INTO [Tenants] ([Name], [Code], [BusinessType], [ContactEmail], [ContactPhone], [Address], [IsActive], [PlanType], [CreatedAt]) 
    VALUES ('TechSolutions Office', 'OFFICE001', 'Office', 'admin@techsolutions.com', '+91-9876543213', '321 Business Park, City, State 123459', 1, 'Premium', GETUTCDATE());
    PRINT 'Office tenant created.';
END
ELSE
BEGIN
    PRINT 'Office tenant already exists.';
END
GO

-- Create admin user for Office
DECLARE @OfficeTenantId INT;
SELECT @OfficeTenantId = [Id] FROM [Tenants] WHERE [Code] = 'OFFICE001';

IF NOT EXISTS (SELECT * FROM [Users] WHERE [Email] = 'admin@techsolutions.com' AND [TenantId] = @OfficeTenantId)
BEGIN
    -- Password: Admin@123
    INSERT INTO [Users] ([TenantId], [Email], [PasswordHash], [FirstName], [LastName], [Phone], [IsActive], [CreatedAt]) 
    VALUES (@OfficeTenantId, 'admin@techsolutions.com', 'jGl25bVBBBW96Qi9Te4V37Fnqchz/Eu4qB9vKrRIqRg=', 'Office', 'Administrator', '+91-9876543213', 1, GETUTCDATE());
    PRINT 'Office admin user created.';
END

-- Assign Owner role to office admin
DECLARE @OfficeAdminUserId INT;
DECLARE @OwnerRoleId4 INT;

SELECT @OfficeAdminUserId = [Id] FROM [Users] WHERE [Email] = 'admin@techsolutions.com' AND [TenantId] = @OfficeTenantId;
SELECT @OwnerRoleId4 = [Id] FROM [Roles] WHERE [Name] = 'Owner';

IF @OfficeAdminUserId IS NOT NULL AND @OwnerRoleId4 IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT * FROM [UserRoles] WHERE [UserId] = @OfficeAdminUserId AND [RoleId] = @OwnerRoleId4)
    BEGIN
        INSERT INTO [UserRoles] ([UserId], [RoleId]) VALUES (@OfficeAdminUserId, @OwnerRoleId4);
    END
END

-- Create tenant configuration for Office
IF NOT EXISTS (SELECT * FROM [TenantConfigurations] WHERE [TenantId] = @OfficeTenantId)
BEGIN
    INSERT INTO [TenantConfigurations] ([TenantId], [FinancialYearStart], [InvoicePrefix], [InvoiceNumberStart], [DecimalPlaces], [EnableInventory], [EnableGST], [Currency], [Language]) 
    VALUES (@OfficeTenantId, '04-01', 'INV', 1, 2, 0, 1, 'INR', 'en');
    PRINT 'Office tenant configuration created.';
END
GO

-- ============================================
-- SUMMARY
-- ============================================
PRINT '';
PRINT '========================================';
PRINT 'SEED DATA CREATION COMPLETE!';
PRINT '========================================';
PRINT '';
PRINT 'SUPER ADMIN:';
PRINT '  Email: superadmin@system.com';
PRINT '  Password: SuperAdmin@123';
PRINT '  Tenant Code: SYSTEM';
PRINT '';
PRINT 'SCHOOL TENANT:';
PRINT '  Tenant Code: SCHOOL001';
PRINT '  Email: admin@greenwood.edu';
PRINT '  Password: Admin@123';
PRINT '';
PRINT 'COLLEGE TENANT:';
PRINT '  Tenant Code: COLLEGE001';
PRINT '  Email: admin@metrocollege.edu';
PRINT '  Password: Admin@123';
PRINT '';
PRINT 'RETAIL SHOP TENANT:';
PRINT '  Tenant Code: RETAIL001';
PRINT '  Email: admin@quickmart.com';
PRINT '  Password: Admin@123';
PRINT '';
PRINT 'OFFICE TENANT:';
PRINT '  Tenant Code: OFFICE001';
PRINT '  Email: admin@techsolutions.com';
PRINT '  Password: Admin@123';
PRINT '';
PRINT '========================================';
GO

