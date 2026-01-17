USE BillingDB;
GO

SET QUOTED_IDENTIFIER ON;
GO

PRINT '========================================';
PRINT 'Starting comprehensive seed script...';
PRINT '========================================';
GO

-- ============================================
-- 1. CLEAR EXISTING DATA (Optional - Comment out if you want to keep existing data)
-- ============================================
/*
PRINT 'Clearing existing data...';
DELETE FROM [UserRoles];
DELETE FROM [Users];
DELETE FROM [RolePermissions];
DELETE FROM [Permissions];
DELETE FROM [Roles];
DELETE FROM [Tenants];
PRINT 'Existing data cleared.';
GO
*/

-- ============================================
-- 2. ROLES
-- ============================================
PRINT 'Creating Roles...';

IF NOT EXISTS (SELECT * FROM [Roles] WHERE [Name] = 'Owner')
BEGIN
    INSERT INTO [Roles] ([Name], [Description])
    VALUES ('Owner', 'Full system access with all permissions');
    PRINT 'Created Role: Owner';
END

IF NOT EXISTS (SELECT * FROM [Roles] WHERE [Name] = 'Manager')
BEGIN
    INSERT INTO [Roles] ([Name], [Description])
    VALUES ('Manager', 'Management access with most permissions except user management');
    PRINT 'Created Role: Manager';
END

IF NOT EXISTS (SELECT * FROM [Roles] WHERE [Name] = 'Cashier')
BEGIN
    INSERT INTO [Roles] ([Name], [Description])
    VALUES ('Cashier', 'Can create invoices and process payments');
    PRINT 'Created Role: Cashier';
END

IF NOT EXISTS (SELECT * FROM [Roles] WHERE [Name] = 'Accountant')
BEGIN
    INSERT INTO [Roles] ([Name], [Description])
    VALUES ('Accountant', 'Can view reports and manage financial data');
    PRINT 'Created Role: Accountant';
END

IF NOT EXISTS (SELECT * FROM [Roles] WHERE [Name] = 'Doctor')
BEGIN
    INSERT INTO [Roles] ([Name], [Description])
    VALUES ('Doctor', 'Medical professional with access to patient records');
    PRINT 'Created Role: Doctor';
END

IF NOT EXISTS (SELECT * FROM [Roles] WHERE [Name] = 'Nurse')
BEGIN
    INSERT INTO [Roles] ([Name], [Description])
    VALUES ('Nurse', 'Can view and update patient records');
    PRINT 'Created Role: Nurse';
END

IF NOT EXISTS (SELECT * FROM [Roles] WHERE [Name] = 'Teacher')
BEGIN
    INSERT INTO [Roles] ([Name], [Description])
    VALUES ('Teacher', 'Can view student records and fees');
    PRINT 'Created Role: Teacher';
END

IF NOT EXISTS (SELECT * FROM [Roles] WHERE [Name] = 'Medical Biller')
BEGIN
    INSERT INTO [Roles] ([Name], [Description])
    VALUES ('Medical Biller', 'Can generate medical bills and process insurance claims');
    PRINT 'Created Role: Medical Biller';
END

IF NOT EXISTS (SELECT * FROM [Roles] WHERE [Name] = 'Reception')
BEGIN
    INSERT INTO [Roles] ([Name], [Description])
    VALUES ('Reception', 'Front desk staff with limited access');
    PRINT 'Created Role: Reception';
END

IF NOT EXISTS (SELECT * FROM [Roles] WHERE [Name] = 'Staff')
BEGIN
    INSERT INTO [Roles] ([Name], [Description])
    VALUES ('Staff', 'General staff with basic viewing permissions');
    PRINT 'Created Role: Staff';
END

GO

-- ============================================
-- 3. PERMISSIONS
-- ============================================
PRINT 'Creating Permissions...';

DECLARE @PermissionId INT;

-- Products Permissions
IF NOT EXISTS (SELECT * FROM [Permissions] WHERE [Name] = 'products.view')
    INSERT INTO [Permissions] ([Name], [Description], [Category]) VALUES ('products.view', 'View products', 'Products');
IF NOT EXISTS (SELECT * FROM [Permissions] WHERE [Name] = 'products.create')
    INSERT INTO [Permissions] ([Name], [Description], [Category]) VALUES ('products.create', 'Create products', 'Products');
IF NOT EXISTS (SELECT * FROM [Permissions] WHERE [Name] = 'products.update')
    INSERT INTO [Permissions] ([Name], [Description], [Category]) VALUES ('products.update', 'Update products', 'Products');
IF NOT EXISTS (SELECT * FROM [Permissions] WHERE [Name] = 'products.delete')
    INSERT INTO [Permissions] ([Name], [Description], [Category]) VALUES ('products.delete', 'Delete products', 'Products');

-- Customers Permissions
IF NOT EXISTS (SELECT * FROM [Permissions] WHERE [Name] = 'customers.view')
    INSERT INTO [Permissions] ([Name], [Description], [Category]) VALUES ('customers.view', 'View customers', 'Customers');
IF NOT EXISTS (SELECT * FROM [Permissions] WHERE [Name] = 'customers.create')
    INSERT INTO [Permissions] ([Name], [Description], [Category]) VALUES ('customers.create', 'Create customers', 'Customers');
IF NOT EXISTS (SELECT * FROM [Permissions] WHERE [Name] = 'customers.update')
    INSERT INTO [Permissions] ([Name], [Description], [Category]) VALUES ('customers.update', 'Update customers', 'Customers');
IF NOT EXISTS (SELECT * FROM [Permissions] WHERE [Name] = 'customers.delete')
    INSERT INTO [Permissions] ([Name], [Description], [Category]) VALUES ('customers.delete', 'Delete customers', 'Customers');

-- Invoices Permissions
IF NOT EXISTS (SELECT * FROM [Permissions] WHERE [Name] = 'invoices.view')
    INSERT INTO [Permissions] ([Name], [Description], [Category]) VALUES ('invoices.view', 'View invoices', 'Invoices');
IF NOT EXISTS (SELECT * FROM [Permissions] WHERE [Name] = 'invoices.create')
    INSERT INTO [Permissions] ([Name], [Description], [Category]) VALUES ('invoices.create', 'Create invoices', 'Invoices');
IF NOT EXISTS (SELECT * FROM [Permissions] WHERE [Name] = 'invoices.update')
    INSERT INTO [Permissions] ([Name], [Description], [Category]) VALUES ('invoices.update', 'Update invoices', 'Invoices');
IF NOT EXISTS (SELECT * FROM [Permissions] WHERE [Name] = 'invoices.delete')
    INSERT INTO [Permissions] ([Name], [Description], [Category]) VALUES ('invoices.delete', 'Delete invoices', 'Invoices');

-- Payments Permissions
IF NOT EXISTS (SELECT * FROM [Permissions] WHERE [Name] = 'payments.view')
    INSERT INTO [Permissions] ([Name], [Description], [Category]) VALUES ('payments.view', 'View payments', 'Payments');
IF NOT EXISTS (SELECT * FROM [Permissions] WHERE [Name] = 'payments.create')
    INSERT INTO [Permissions] ([Name], [Description], [Category]) VALUES ('payments.create', 'Create payments', 'Payments');

-- Reports Permissions
IF NOT EXISTS (SELECT * FROM [Permissions] WHERE [Name] = 'reports.view')
    INSERT INTO [Permissions] ([Name], [Description], [Category]) VALUES ('reports.view', 'View reports', 'Reports');

-- Users Permissions
IF NOT EXISTS (SELECT * FROM [Permissions] WHERE [Name] = 'users.view')
    INSERT INTO [Permissions] ([Name], [Description], [Category]) VALUES ('users.view', 'View users', 'Users');
IF NOT EXISTS (SELECT * FROM [Permissions] WHERE [Name] = 'users.create')
    INSERT INTO [Permissions] ([Name], [Description], [Category]) VALUES ('users.create', 'Create users', 'Users');
IF NOT EXISTS (SELECT * FROM [Permissions] WHERE [Name] = 'users.update')
    INSERT INTO [Permissions] ([Name], [Description], [Category]) VALUES ('users.update', 'Update users', 'Users');
IF NOT EXISTS (SELECT * FROM [Permissions] WHERE [Name] = 'users.delete')
    INSERT INTO [Permissions] ([Name], [Description], [Category]) VALUES ('users.delete', 'Delete users', 'Users');

-- Patients Permissions (Medical)
IF NOT EXISTS (SELECT * FROM [Permissions] WHERE [Name] = 'patients.view')
    INSERT INTO [Permissions] ([Name], [Description], [Category]) VALUES ('patients.view', 'View patients', 'Medical');
IF NOT EXISTS (SELECT * FROM [Permissions] WHERE [Name] = 'patients.create')
    INSERT INTO [Permissions] ([Name], [Description], [Category]) VALUES ('patients.create', 'Create patients', 'Medical');
IF NOT EXISTS (SELECT * FROM [Permissions] WHERE [Name] = 'patients.update')
    INSERT INTO [Permissions] ([Name], [Description], [Category]) VALUES ('patients.update', 'Update patients', 'Medical');

-- Students Permissions (School)
IF NOT EXISTS (SELECT * FROM [Permissions] WHERE [Name] = 'students.view')
    INSERT INTO [Permissions] ([Name], [Description], [Category]) VALUES ('students.view', 'View students', 'School');
IF NOT EXISTS (SELECT * FROM [Permissions] WHERE [Name] = 'students.create')
    INSERT INTO [Permissions] ([Name], [Description], [Category]) VALUES ('students.create', 'Create students', 'School');

PRINT 'Permissions created.';
GO

-- ============================================
-- 4. ROLE-PERMISSION MAPPINGS
-- ============================================
PRINT 'Creating Role-Permission mappings...';

-- Owner gets all permissions
INSERT INTO [RolePermissions] ([RoleId], [PermissionId])
SELECT r.[Id], p.[Id]
FROM [Roles] r
CROSS JOIN [Permissions] p
WHERE r.[Name] = 'Owner'
AND NOT EXISTS (
    SELECT 1 FROM [RolePermissions] rp 
    WHERE rp.[RoleId] = r.[Id] AND rp.[PermissionId] = p.[Id]
);

-- Manager gets most permissions except user management
INSERT INTO [RolePermissions] ([RoleId], [PermissionId])
SELECT r.[Id], p.[Id]
FROM [Roles] r
CROSS JOIN [Permissions] p
WHERE r.[Name] = 'Manager'
AND p.[Name] NOT LIKE 'users.%'
AND NOT EXISTS (
    SELECT 1 FROM [RolePermissions] rp 
    WHERE rp.[RoleId] = r.[Id] AND rp.[PermissionId] = p.[Id]
);

-- Cashier gets invoice and payment permissions
INSERT INTO [RolePermissions] ([RoleId], [PermissionId])
SELECT r.[Id], p.[Id]
FROM [Roles] r
CROSS JOIN [Permissions] p
WHERE r.[Name] = 'Cashier'
AND (p.[Name] LIKE 'invoices.%' OR p.[Name] LIKE 'payments.%' OR p.[Name] LIKE 'products.view' OR p.[Name] LIKE 'customers.view')
AND NOT EXISTS (
    SELECT 1 FROM [RolePermissions] rp 
    WHERE rp.[RoleId] = r.[Id] AND rp.[PermissionId] = p.[Id]
);

-- Accountant gets view permissions
INSERT INTO [RolePermissions] ([RoleId], [PermissionId])
SELECT r.[Id], p.[Id]
FROM [Roles] r
CROSS JOIN [Permissions] p
WHERE r.[Name] = 'Accountant'
AND (p.[Name] LIKE '%.view' OR p.[Name] LIKE 'reports.%')
AND NOT EXISTS (
    SELECT 1 FROM [RolePermissions] rp 
    WHERE rp.[RoleId] = r.[Id] AND rp.[PermissionId] = p.[Id]
);

-- Doctor gets medical permissions
INSERT INTO [RolePermissions] ([RoleId], [PermissionId])
SELECT r.[Id], p.[Id]
FROM [Roles] r
CROSS JOIN [Permissions] p
WHERE r.[Name] = 'Doctor'
AND (p.[Category] = 'Medical' OR p.[Name] LIKE 'invoices.%' OR p.[Name] LIKE 'payments.%')
AND NOT EXISTS (
    SELECT 1 FROM [RolePermissions] rp 
    WHERE rp.[RoleId] = r.[Id] AND rp.[PermissionId] = p.[Id]
);

-- Nurse gets view medical permissions
INSERT INTO [RolePermissions] ([RoleId], [PermissionId])
SELECT r.[Id], p.[Id]
FROM [Roles] r
CROSS JOIN [Permissions] p
WHERE r.[Name] = 'Nurse'
AND p.[Category] = 'Medical'
AND p.[Name] LIKE '%.view'
AND NOT EXISTS (
    SELECT 1 FROM [RolePermissions] rp 
    WHERE rp.[RoleId] = r.[Id] AND rp.[PermissionId] = p.[Id]
);

-- Teacher gets school permissions
INSERT INTO [RolePermissions] ([RoleId], [PermissionId])
SELECT r.[Id], p.[Id]
FROM [Roles] r
CROSS JOIN [Permissions] p
WHERE r.[Name] = 'Teacher'
AND (p.[Category] = 'School' OR p.[Name] LIKE 'reports.view')
AND NOT EXISTS (
    SELECT 1 FROM [RolePermissions] rp 
    WHERE rp.[RoleId] = r.[Id] AND rp.[PermissionId] = p.[Id]
);

-- Medical Biller gets medical and invoice permissions
INSERT INTO [RolePermissions] ([RoleId], [PermissionId])
SELECT r.[Id], p.[Id]
FROM [Roles] r
CROSS JOIN [Permissions] p
WHERE r.[Name] = 'Medical Biller'
AND (p.[Category] = 'Medical' OR p.[Name] LIKE 'invoices.%' OR p.[Name] LIKE 'payments.%')
AND NOT EXISTS (
    SELECT 1 FROM [RolePermissions] rp 
    WHERE rp.[RoleId] = r.[Id] AND rp.[PermissionId] = p.[Id]
);

-- Reception gets view permissions
INSERT INTO [RolePermissions] ([RoleId], [PermissionId])
SELECT r.[Id], p.[Id]
FROM [Roles] r
CROSS JOIN [Permissions] p
WHERE r.[Name] = 'Reception'
AND (p.[Name] LIKE '%.view' OR p.[Name] LIKE 'customers.create' OR p.[Name] LIKE 'patients.create')
AND NOT EXISTS (
    SELECT 1 FROM [RolePermissions] rp 
    WHERE rp.[RoleId] = r.[Id] AND rp.[PermissionId] = p.[Id]
);

-- Staff gets basic view permissions
INSERT INTO [RolePermissions] ([RoleId], [PermissionId])
SELECT r.[Id], p.[Id]
FROM [Roles] r
CROSS JOIN [Permissions] p
WHERE r.[Name] = 'Staff'
AND p.[Name] LIKE '%.view'
AND NOT EXISTS (
    SELECT 1 FROM [RolePermissions] rp 
    WHERE rp.[RoleId] = r.[Id] AND rp.[PermissionId] = p.[Id]
);

PRINT 'Role-Permission mappings created.';
GO

-- ============================================
-- 5. TENANTS
-- ============================================
PRINT 'Creating Tenants...';

DECLARE @RetailTenantId INT;
DECLARE @MedicalTenantId INT;
DECLARE @SchoolTenantId INT;
DECLARE @OfficeTenantId INT;

-- Retail Tenant
IF NOT EXISTS (SELECT * FROM [Tenants] WHERE [Code] = 'RETAIL01')
BEGIN
    INSERT INTO [Tenants] ([Name], [Code], [BusinessType], [ContactEmail], [ContactPhone], [Address], [IsActive], [PlanType], [CreatedAt])
    VALUES ('SuperMart Retail Store', 'RETAIL01', 'Retail', 'contact@supermart.com', '+1-555-0101', '123 Main Street, City, State 12345', 1, 'Premium', GETUTCDATE());
    SET @RetailTenantId = SCOPE_IDENTITY();
    PRINT 'Created Tenant: SuperMart Retail Store';
END
ELSE
    SELECT @RetailTenantId = [Id] FROM [Tenants] WHERE [Code] = 'RETAIL01';

-- Medical Tenant
IF NOT EXISTS (SELECT * FROM [Tenants] WHERE [Code] = 'MEDICAL01')
BEGIN
    INSERT INTO [Tenants] ([Name], [Code], [BusinessType], [ContactEmail], [ContactPhone], [Address], [IsActive], [PlanType], [CreatedAt])
    VALUES ('City Medical Center', 'MEDICAL01', 'Medical', 'info@citymedical.com', '+1-555-0202', '456 Health Avenue, City, State 12345', 1, 'Premium', GETUTCDATE());
    SET @MedicalTenantId = SCOPE_IDENTITY();
    PRINT 'Created Tenant: City Medical Center';
END
ELSE
    SELECT @MedicalTenantId = [Id] FROM [Tenants] WHERE [Code] = 'MEDICAL01';

-- School Tenant
IF NOT EXISTS (SELECT * FROM [Tenants] WHERE [Code] = 'SCHOOL01')
BEGIN
    INSERT INTO [Tenants] ([Name], [Code], [BusinessType], [ContactEmail], [ContactPhone], [Address], [IsActive], [PlanType], [CreatedAt])
    VALUES ('Greenwood High School', 'SCHOOL01', 'School', 'admin@greenwood.edu', '+1-555-0303', '789 Education Road, City, State 12345', 1, 'Premium', GETUTCDATE());
    SET @SchoolTenantId = SCOPE_IDENTITY();
    PRINT 'Created Tenant: Greenwood High School';
END
ELSE
    SELECT @SchoolTenantId = [Id] FROM [Tenants] WHERE [Code] = 'SCHOOL01';

-- Office/Service Tenant
IF NOT EXISTS (SELECT * FROM [Tenants] WHERE [Code] = 'OFFICE01')
BEGIN
    INSERT INTO [Tenants] ([Name], [Code], [BusinessType], [ContactEmail], [ContactPhone], [Address], [IsActive], [PlanType], [CreatedAt])
    VALUES ('Tech Solutions Inc', 'OFFICE01', 'Office', 'contact@techsolutions.com', '+1-555-0404', '321 Business Park, City, State 12345', 1, 'Premium', GETUTCDATE());
    SET @OfficeTenantId = SCOPE_IDENTITY();
    PRINT 'Created Tenant: Tech Solutions Inc';
END
ELSE
    SELECT @OfficeTenantId = [Id] FROM [Tenants] WHERE [Code] = 'OFFICE01';

GO

-- ============================================
-- 6. USERS (Password: Password123! for all users)
-- Password hash for "Password123!" using SHA256 + Base64
-- ============================================
PRINT 'Creating Users...';

DECLARE @RetailTenantId INT = (SELECT [Id] FROM [Tenants] WHERE [Code] = 'RETAIL01');
DECLARE @MedicalTenantId INT = (SELECT [Id] FROM [Tenants] WHERE [Code] = 'MEDICAL01');
DECLARE @SchoolTenantId INT = (SELECT [Id] FROM [Tenants] WHERE [Code] = 'SCHOOL01');
DECLARE @OfficeTenantId INT = (SELECT [Id] FROM [Tenants] WHERE [Code] = 'OFFICE01');

DECLARE @OwnerRoleId INT = (SELECT [Id] FROM [Roles] WHERE [Name] = 'Owner');
DECLARE @ManagerRoleId INT = (SELECT [Id] FROM [Roles] WHERE [Name] = 'Manager');
DECLARE @CashierRoleId INT = (SELECT [Id] FROM [Roles] WHERE [Name] = 'Cashier');
DECLARE @AccountantRoleId INT = (SELECT [Id] FROM [Roles] WHERE [Name] = 'Accountant');
DECLARE @DoctorRoleId INT = (SELECT [Id] FROM [Roles] WHERE [Name] = 'Doctor');
DECLARE @NurseRoleId INT = (SELECT [Id] FROM [Roles] WHERE [Name] = 'Nurse');
DECLARE @TeacherRoleId INT = (SELECT [Id] FROM [Roles] WHERE [Name] = 'Teacher');

-- Password hash for "Password123!" - SHA256 + Base64
-- Pre-calculated hash: SHA256('Password123!') then Base64 encoded
DECLARE @PasswordHash NVARCHAR(MAX) = 'jGl25bVBBBW96Qi9Te4V37Fnqchz/Eu4qB9vKrRIqRg=';

DECLARE @UserId INT;

-- Retail Tenant Users
IF NOT EXISTS (SELECT * FROM [Users] WHERE [Email] = 'owner@retail.com')
BEGIN
    INSERT INTO [Users] ([TenantId], [Email], [PasswordHash], [FirstName], [LastName], [Phone], [IsActive], [CreatedAt])
    VALUES (@RetailTenantId, 'owner@retail.com', @PasswordHash, 'John', 'Smith', '+1-555-1001', 1, GETUTCDATE());
    SET @UserId = SCOPE_IDENTITY();
    INSERT INTO [UserRoles] ([UserId], [RoleId]) VALUES (@UserId, @OwnerRoleId);
    PRINT 'Created User: owner@retail.com (Owner)';
END

IF NOT EXISTS (SELECT * FROM [Users] WHERE [Email] = 'manager@retail.com')
BEGIN
    INSERT INTO [Users] ([TenantId], [Email], [PasswordHash], [FirstName], [LastName], [Phone], [IsActive], [CreatedAt])
    VALUES (@RetailTenantId, 'manager@retail.com', @PasswordHash, 'Sarah', 'Johnson', '+1-555-1002', 1, GETUTCDATE());
    SET @UserId = SCOPE_IDENTITY();
    INSERT INTO [UserRoles] ([UserId], [RoleId]) VALUES (@UserId, @ManagerRoleId);
    PRINT 'Created User: manager@retail.com (Manager)';
END

IF NOT EXISTS (SELECT * FROM [Users] WHERE [Email] = 'cashier@retail.com')
BEGIN
    INSERT INTO [Users] ([TenantId], [Email], [PasswordHash], [FirstName], [LastName], [Phone], [IsActive], [CreatedAt])
    VALUES (@RetailTenantId, 'cashier@retail.com', @PasswordHash, 'Mike', 'Davis', '+1-555-1003', 1, GETUTCDATE());
    SET @UserId = SCOPE_IDENTITY();
    INSERT INTO [UserRoles] ([UserId], [RoleId]) VALUES (@UserId, @CashierRoleId);
    PRINT 'Created User: cashier@retail.com (Cashier)';
END

-- Medical Tenant Users
IF NOT EXISTS (SELECT * FROM [Users] WHERE [Email] = 'admin@medical.com')
BEGIN
    INSERT INTO [Users] ([TenantId], [Email], [PasswordHash], [FirstName], [LastName], [Phone], [IsActive], [CreatedAt])
    VALUES (@MedicalTenantId, 'admin@medical.com', @PasswordHash, 'Dr. Robert', 'Williams', '+1-555-2001', 1, GETUTCDATE());
    SET @UserId = SCOPE_IDENTITY();
    INSERT INTO [UserRoles] ([UserId], [RoleId]) VALUES (@UserId, @OwnerRoleId);
    PRINT 'Created User: admin@medical.com (Owner/Doctor)';
END

IF NOT EXISTS (SELECT * FROM [Users] WHERE [Email] = 'doctor@medical.com')
BEGIN
    INSERT INTO [Users] ([TenantId], [Email], [PasswordHash], [FirstName], [LastName], [Phone], [IsActive], [CreatedAt])
    VALUES (@MedicalTenantId, 'doctor@medical.com', @PasswordHash, 'Dr. Emily', 'Brown', '+1-555-2002', 1, GETUTCDATE());
    SET @UserId = SCOPE_IDENTITY();
    INSERT INTO [UserRoles] ([UserId], [RoleId]) VALUES (@UserId, @DoctorRoleId);
    PRINT 'Created User: doctor@medical.com (Doctor)';
END

IF NOT EXISTS (SELECT * FROM [Users] WHERE [Email] = 'nurse@medical.com')
BEGIN
    INSERT INTO [Users] ([TenantId], [Email], [PasswordHash], [FirstName], [LastName], [Phone], [IsActive], [CreatedAt])
    VALUES (@MedicalTenantId, 'nurse@medical.com', @PasswordHash, 'Lisa', 'Anderson', '+1-555-2003', 1, GETUTCDATE());
    SET @UserId = SCOPE_IDENTITY();
    INSERT INTO [UserRoles] ([UserId], [RoleId]) VALUES (@UserId, @NurseRoleId);
    PRINT 'Created User: nurse@medical.com (Nurse)';
END

-- School Tenant Users
IF NOT EXISTS (SELECT * FROM [Users] WHERE [Email] = 'principal@school.com')
BEGIN
    INSERT INTO [Users] ([TenantId], [Email], [PasswordHash], [FirstName], [LastName], [Phone], [IsActive], [CreatedAt])
    VALUES (@SchoolTenantId, 'principal@school.com', @PasswordHash, 'Principal', 'Thompson', '+1-555-3001', 1, GETUTCDATE());
    SET @UserId = SCOPE_IDENTITY();
    INSERT INTO [UserRoles] ([UserId], [RoleId]) VALUES (@UserId, @OwnerRoleId);
    PRINT 'Created User: principal@school.com (Owner)';
END

IF NOT EXISTS (SELECT * FROM [Users] WHERE [Email] = 'teacher@school.com')
BEGIN
    INSERT INTO [Users] ([TenantId], [Email], [PasswordHash], [FirstName], [LastName], [Phone], [IsActive], [CreatedAt])
    VALUES (@SchoolTenantId, 'teacher@school.com', @PasswordHash, 'Mary', 'Wilson', '+1-555-3002', 1, GETUTCDATE());
    SET @UserId = SCOPE_IDENTITY();
    INSERT INTO [UserRoles] ([UserId], [RoleId]) VALUES (@UserId, @TeacherRoleId);
    PRINT 'Created User: teacher@school.com (Teacher)';
END

IF NOT EXISTS (SELECT * FROM [Users] WHERE [Email] = 'accountant@school.com')
BEGIN
    INSERT INTO [Users] ([TenantId], [Email], [PasswordHash], [FirstName], [LastName], [Phone], [IsActive], [CreatedAt])
    VALUES (@SchoolTenantId, 'accountant@school.com', @PasswordHash, 'David', 'Martinez', '+1-555-3003', 1, GETUTCDATE());
    SET @UserId = SCOPE_IDENTITY();
    INSERT INTO [UserRoles] ([UserId], [RoleId]) VALUES (@UserId, @AccountantRoleId);
    PRINT 'Created User: accountant@school.com (Accountant)';
END

-- Office Tenant Users
IF NOT EXISTS (SELECT * FROM [Users] WHERE [Email] = 'ceo@office.com')
BEGIN
    INSERT INTO [Users] ([TenantId], [Email], [PasswordHash], [FirstName], [LastName], [Phone], [IsActive], [CreatedAt])
    VALUES (@OfficeTenantId, 'ceo@office.com', @PasswordHash, 'CEO', 'Johnson', '+1-555-4001', 1, GETUTCDATE());
    SET @UserId = SCOPE_IDENTITY();
    INSERT INTO [UserRoles] ([UserId], [RoleId]) VALUES (@UserId, @OwnerRoleId);
    PRINT 'Created User: ceo@office.com (Owner)';
END

IF NOT EXISTS (SELECT * FROM [Users] WHERE [Email] = 'pm@office.com')
BEGIN
    INSERT INTO [Users] ([TenantId], [Email], [PasswordHash], [FirstName], [LastName], [Phone], [IsActive], [CreatedAt])
    VALUES (@OfficeTenantId, 'pm@office.com', @PasswordHash, 'Project', 'Manager', '+1-555-4002', 1, GETUTCDATE());
    SET @UserId = SCOPE_IDENTITY();
    INSERT INTO [UserRoles] ([UserId], [RoleId]) VALUES (@UserId, @ManagerRoleId);
    PRINT 'Created User: pm@office.com (Manager)';
END

GO

-- ============================================
-- 7. TENANT CONFIGURATIONS
-- ============================================
PRINT 'Creating Tenant Configurations...';

DECLARE @RetailTenantId INT = (SELECT [Id] FROM [Tenants] WHERE [Code] = 'RETAIL01');
DECLARE @MedicalTenantId INT = (SELECT [Id] FROM [Tenants] WHERE [Code] = 'MEDICAL01');
DECLARE @SchoolTenantId INT = (SELECT [Id] FROM [Tenants] WHERE [Code] = 'SCHOOL01');
DECLARE @OfficeTenantId INT = (SELECT [Id] FROM [Tenants] WHERE [Code] = 'OFFICE01');

IF NOT EXISTS (SELECT * FROM [TenantConfigurations] WHERE [TenantId] = @RetailTenantId)
BEGIN
    INSERT INTO [TenantConfigurations] ([TenantId], [InvoicePrefix], [Currency], [EnableGST], [EnableInventory])
    VALUES (@RetailTenantId, 'INV', 'USD', 1, 1);
    PRINT 'Created configuration for Retail tenant';
END

IF NOT EXISTS (SELECT * FROM [TenantConfigurations] WHERE [TenantId] = @MedicalTenantId)
BEGIN
    INSERT INTO [TenantConfigurations] ([TenantId], [InvoicePrefix], [Currency], [EnableGST], [EnableInventory])
    VALUES (@MedicalTenantId, 'BILL', 'USD', 0, 1);
    PRINT 'Created configuration for Medical tenant';
END

IF NOT EXISTS (SELECT * FROM [TenantConfigurations] WHERE [TenantId] = @SchoolTenantId)
BEGIN
    INSERT INTO [TenantConfigurations] ([TenantId], [InvoicePrefix], [Currency], [EnableGST], [EnableInventory])
    VALUES (@SchoolTenantId, 'FEE', 'USD', 0, 0);
    PRINT 'Created configuration for School tenant';
END

IF NOT EXISTS (SELECT * FROM [TenantConfigurations] WHERE [TenantId] = @OfficeTenantId)
BEGIN
    INSERT INTO [TenantConfigurations] ([TenantId], [InvoicePrefix], [Currency], [EnableGST], [EnableInventory])
    VALUES (@OfficeTenantId, 'INV', 'USD', 1, 0);
    PRINT 'Created configuration for Office tenant';
END

GO

-- ============================================
-- 8. RETAIL TENANT - CUSTOMERS & PRODUCTS
-- ============================================
PRINT 'Creating Retail test data...';

DECLARE @RetailTenantId INT = (SELECT [Id] FROM [Tenants] WHERE [Code] = 'RETAIL01');
DECLARE @CustomerId INT;
DECLARE @ProductId INT;

-- Customers
IF NOT EXISTS (SELECT * FROM [Customers] WHERE [TenantId] = @RetailTenantId AND [Email] = 'customer1@example.com')
BEGIN
    INSERT INTO [Customers] ([TenantId], [Name], [Email], [Phone], [Address], [GSTIN], [IsActive], [CreatedAt])
    VALUES (@RetailTenantId, 'Alice Johnson', 'customer1@example.com', '+1-555-5001', '100 Customer St', 'GST123456789', 1, GETUTCDATE());
    SET @CustomerId = SCOPE_IDENTITY();
    PRINT 'Created Customer: Alice Johnson';
END

IF NOT EXISTS (SELECT * FROM [Customers] WHERE [TenantId] = @RetailTenantId AND [Email] = 'customer2@example.com')
BEGIN
    INSERT INTO [Customers] ([TenantId], [Name], [Email], [Phone], [Address], [IsActive], [CreatedAt])
    VALUES (@RetailTenantId, 'Bob Smith', 'customer2@example.com', '+1-555-5002', '200 Buyer Ave', 1, GETUTCDATE());
    PRINT 'Created Customer: Bob Smith';
END

-- Products
IF NOT EXISTS (SELECT * FROM [Products] WHERE [TenantId] = @RetailTenantId AND [SKU] = 'PROD001')
BEGIN
    INSERT INTO [Products] ([TenantId], [Name], [SKU], [HSNCode], [Description], [CostPrice], [SellingPrice], [TaxRate], [TaxType], [StockQuantity], [LowStockAlert], [Unit], [IsActive], [TrackInventory], [CreatedAt], [UpdatedAt])
    VALUES (@RetailTenantId, 'Laptop Computer', 'PROD001', '8471', 'High-performance laptop', 800.00, 1200.00, 18.00, 'GST', 50, 10, 'PCS', 1, 1, GETUTCDATE(), GETUTCDATE());
    PRINT 'Created Product: Laptop Computer';
END

IF NOT EXISTS (SELECT * FROM [Products] WHERE [TenantId] = @RetailTenantId AND [SKU] = 'PROD002')
BEGIN
    INSERT INTO [Products] ([TenantId], [Name], [SKU], [HSNCode], [Description], [CostPrice], [SellingPrice], [TaxRate], [TaxType], [StockQuantity], [LowStockAlert], [Unit], [IsActive], [TrackInventory], [CreatedAt], [UpdatedAt])
    VALUES (@RetailTenantId, 'Wireless Mouse', 'PROD002', '8517', 'Ergonomic wireless mouse', 15.00, 25.00, 18.00, 'GST', 200, 50, 'PCS', 1, 1, GETUTCDATE(), GETUTCDATE());
    PRINT 'Created Product: Wireless Mouse';
END

IF NOT EXISTS (SELECT * FROM [Products] WHERE [TenantId] = @RetailTenantId AND [SKU] = 'PROD003')
BEGIN
    INSERT INTO [Products] ([TenantId], [Name], [SKU], [HSNCode], [Description], [CostPrice], [SellingPrice], [TaxRate], [TaxType], [StockQuantity], [LowStockAlert], [Unit], [IsActive], [TrackInventory], [CreatedAt], [UpdatedAt])
    VALUES (@RetailTenantId, 'USB Keyboard', 'PROD003', '8517', 'Mechanical keyboard', 40.00, 65.00, 18.00, 'GST', 150, 30, 'PCS', 1, 1, GETUTCDATE(), GETUTCDATE());
    PRINT 'Created Product: USB Keyboard';
END

GO

-- ============================================
-- 9. MEDICAL TENANT - PATIENTS & MEDICAL DATA
-- ============================================
PRINT 'Creating Medical test data...';

DECLARE @MedicalTenantId INT = (SELECT [Id] FROM [Tenants] WHERE [Code] = 'MEDICAL01');
DECLARE @PatientId INT;
DECLARE @MedicalRecordId INT;
DECLARE @PrescriptionId INT;
DECLARE @ICD10CodeId INT;
DECLARE @CPTCodeId INT;

-- Patients
IF NOT EXISTS (SELECT * FROM [Patients] WHERE [TenantId] = @MedicalTenantId AND [PatientId] = 'PAT-2024-000001')
BEGIN
    INSERT INTO [Patients] ([TenantId], [PatientId], [FirstName], [LastName], [DateOfBirth], [Gender], [Email], [Phone], [Address], [City], [State], [ZipCode], [BloodGroup], [Status], [CreatedAt])
    VALUES (@MedicalTenantId, 'PAT-2024-000001', 'John', 'Doe', '1980-05-15', 'Male', 'john.doe@email.com', '+1-555-6001', '123 Health St', 'City', 'State', '12345', 'O+', 'Active', GETUTCDATE());
    SET @PatientId = SCOPE_IDENTITY();
    PRINT 'Created Patient: John Doe';
END
ELSE
    SELECT @PatientId = [Id] FROM [Patients] WHERE [TenantId] = @MedicalTenantId AND [PatientId] = 'PAT-2024-000001';

IF NOT EXISTS (SELECT * FROM [Patients] WHERE [TenantId] = @MedicalTenantId AND [PatientId] = 'PAT-2024-000002')
BEGIN
    INSERT INTO [Patients] ([TenantId], [PatientId], [FirstName], [LastName], [DateOfBirth], [Gender], [Email], [Phone], [Address], [City], [State], [ZipCode], [BloodGroup], [Status], [CreatedAt])
    VALUES (@MedicalTenantId, 'PAT-2024-000002', 'Jane', 'Smith', '1990-08-20', 'Female', 'jane.smith@email.com', '+1-555-6002', '456 Wellness Ave', 'City', 'State', '12345', 'A+', 'Active', GETUTCDATE());
    PRINT 'Created Patient: Jane Smith';
END

-- Medical Records
IF NOT EXISTS (SELECT * FROM [MedicalRecords] WHERE [TenantId] = @MedicalTenantId AND [VisitNumber] = 'VISIT-2024-000001')
BEGIN
    DECLARE @ProviderId INT = (SELECT TOP 1 [Id] FROM [Users] WHERE [TenantId] = @MedicalTenantId AND [Email] = 'doctor@medical.com');
    INSERT INTO [MedicalRecords] ([TenantId], [PatientId], [ProviderId], [VisitNumber], [VisitDate], [VisitType], [ChiefComplaint], [Status], [CreatedAt])
    VALUES (@MedicalTenantId, @PatientId, @ProviderId, 'VISIT-2024-000001', GETUTCDATE(), 'Consultation', 'Fever and cough', 'Completed', GETUTCDATE());
    SET @MedicalRecordId = SCOPE_IDENTITY();
    PRINT 'Created Medical Record: VISIT-2024-000001';
END
ELSE
    SELECT @MedicalRecordId = [Id] FROM [MedicalRecords] WHERE [TenantId] = @MedicalTenantId AND [VisitNumber] = 'VISIT-2024-000001';

-- Prescriptions
IF NOT EXISTS (SELECT * FROM [Prescriptions] WHERE [TenantId] = @MedicalTenantId AND [PrescriptionNumber] = 'RX-2024-000001')
BEGIN
    INSERT INTO [Prescriptions] ([TenantId], [MedicalRecordId], [PatientId], [PrescriptionNumber], [MedicationName], [Dosage], [Frequency], [Duration], [Quantity], [UnitPrice], [TotalPrice], [PrescribedDate], [Status], [CreatedAt])
    VALUES (@MedicalTenantId, @MedicalRecordId, @PatientId, 'RX-2024-000001', 'Paracetamol 500mg', '500mg', 'Twice daily', '5 days', 10, 2.50, 25.00, GETUTCDATE(), 'Active', GETUTCDATE());
    PRINT 'Created Prescription: RX-2024-000001';
END

GO

-- ============================================
-- 10. SCHOOL TENANT - STUDENTS & FEES
-- ============================================
PRINT 'Creating School test data...';

DECLARE @SchoolTenantId INT = (SELECT [Id] FROM [Tenants] WHERE [Code] = 'SCHOOL01');

-- Students
IF NOT EXISTS (SELECT * FROM [Students] WHERE [TenantId] = @SchoolTenantId AND [StudentId] = 'STU-2024-000001')
BEGIN
    INSERT INTO [Students] ([TenantId], [StudentId], [FirstName], [LastName], [Email], [Phone], [DateOfBirth], [Gender], [Address], [City], [State], [Pincode], [Course], [Department], [AcademicYear], [Status], [TotalFees], [PaidFees], [OutstandingFees], [CreatedAt])
    VALUES (@SchoolTenantId, 'STU-2024-000001', 'Emma', 'Watson', 'emma.watson@school.com', '+1-555-7001', '2010-03-15', 'Female', '789 Student Lane', 'City', 'State', '12345', 'High School', 'Science', '2024-2025', 'Active', 5000.00, 3000.00, 2000.00, GETUTCDATE());
    PRINT 'Created Student: Emma Watson';
END

IF NOT EXISTS (SELECT * FROM [Students] WHERE [TenantId] = @SchoolTenantId AND [StudentId] = 'STU-2024-000002')
BEGIN
    INSERT INTO [Students] ([TenantId], [StudentId], [FirstName], [LastName], [Email], [Phone], [DateOfBirth], [Gender], [Address], [City], [State], [Pincode], [Course], [Department], [AcademicYear], [Status], [TotalFees], [PaidFees], [OutstandingFees], [CreatedAt])
    VALUES (@SchoolTenantId, 'STU-2024-000002', 'James', 'Bond', 'james.bond@school.com', '+1-555-7002', '2009-07-22', 'Male', '321 Scholar Road', 'City', 'State', '12345', 'High School', 'Arts', '2024-2025', 'Active', 5000.00, 5000.00, 0.00, GETUTCDATE());
    PRINT 'Created Student: James Bond';
END

GO

-- ============================================
-- 11. OFFICE TENANT - CLIENTS & PROJECTS
-- ============================================
PRINT 'Creating Office test data...';

DECLARE @OfficeTenantId INT = (SELECT [Id] FROM [Tenants] WHERE [Code] = 'OFFICE01');

-- Office Clients
IF NOT EXISTS (SELECT * FROM [OfficeClients] WHERE [TenantId] = @OfficeTenantId AND [Email] = 'client1@company.com')
BEGIN
    INSERT INTO [OfficeClients] ([TenantId], [ClientCode], [CompanyName], [Email], [Phone], [Address], [Status], [CreatedAt])
    VALUES (@OfficeTenantId, 'CLI-001', 'ABC Corporation', 'client1@company.com', '+1-555-8001', '100 Business Park', 'Active', GETUTCDATE());
    PRINT 'Created Office Client: ABC Corporation';
END

-- Projects
IF NOT EXISTS (SELECT * FROM [Projects] WHERE [TenantId] = @OfficeTenantId AND [ProjectCode] = 'PRJ-2024-0001')
BEGIN
    DECLARE @ClientId INT = (SELECT TOP 1 [Id] FROM [OfficeClients] WHERE [TenantId] = @OfficeTenantId);
    INSERT INTO [Projects] ([TenantId], [ClientId], [ProjectCode], [ProjectName], [Description], [StartDate], [EndDate], [Budget], [Status], [CreatedAt])
    VALUES (@OfficeTenantId, @ClientId, 'PRJ-2024-0001', 'Website Development', 'E-commerce website development project', GETUTCDATE(), DATEADD(MONTH, 3, GETUTCDATE()), 50000.00, 'In Progress', GETUTCDATE());
    PRINT 'Created Project: Website Development';
END

GO

-- ============================================
-- 12. PRODUCT CATEGORIES (RETAIL)
-- ============================================
PRINT 'Creating Product Categories...';

DECLARE @RetailTenantId INT = (SELECT [Id] FROM [Tenants] WHERE [Code] = 'RETAIL01');
DECLARE @MedicalTenantId INT = (SELECT [Id] FROM [Tenants] WHERE [Code] = 'MEDICAL01');
DECLARE @ElectronicsCategoryId INT;
DECLARE @AccessoriesCategoryId INT;
DECLARE @MedicinesCategoryId INT;

-- Retail Categories
IF NOT EXISTS (SELECT * FROM [ProductCategories] WHERE [TenantId] = @RetailTenantId AND [Name] = 'Electronics')
BEGIN
    INSERT INTO [ProductCategories] ([TenantId], [Name], [Description], [IsActive], [CreatedAt])
    VALUES (@RetailTenantId, 'Electronics', 'Electronic devices and gadgets', 1, GETUTCDATE());
    SET @ElectronicsCategoryId = SCOPE_IDENTITY();
    PRINT 'Created Category: Electronics';
END
ELSE
    SELECT @ElectronicsCategoryId = [Id] FROM [ProductCategories] WHERE [TenantId] = @RetailTenantId AND [Name] = 'Electronics';

IF NOT EXISTS (SELECT * FROM [ProductCategories] WHERE [TenantId] = @RetailTenantId AND [Name] = 'Accessories')
BEGIN
    INSERT INTO [ProductCategories] ([TenantId], [Name], [Description], [IsActive], [CreatedAt])
    VALUES (@RetailTenantId, 'Accessories', 'Computer and device accessories', 1, GETUTCDATE());
    SET @AccessoriesCategoryId = SCOPE_IDENTITY();
    PRINT 'Created Category: Accessories';
END
ELSE
    SELECT @AccessoriesCategoryId = [Id] FROM [ProductCategories] WHERE [TenantId] = @RetailTenantId AND [Name] = 'Accessories';

-- Medical Categories
IF NOT EXISTS (SELECT * FROM [ProductCategories] WHERE [TenantId] = @MedicalTenantId AND [Name] = 'Medicines')
BEGIN
    INSERT INTO [ProductCategories] ([TenantId], [Name], [Description], [IsActive], [CreatedAt])
    VALUES (@MedicalTenantId, 'Medicines', 'Pharmaceutical products', 1, GETUTCDATE());
    SET @MedicinesCategoryId = SCOPE_IDENTITY();
    PRINT 'Created Category: Medicines';
END
ELSE
    SELECT @MedicinesCategoryId = [Id] FROM [ProductCategories] WHERE [TenantId] = @MedicalTenantId AND [Name] = 'Medicines';

-- Update existing products with categories
UPDATE [Products] SET [CategoryId] = @ElectronicsCategoryId 
WHERE [TenantId] = @RetailTenantId AND [SKU] = 'PROD001';

UPDATE [Products] SET [CategoryId] = @AccessoriesCategoryId 
WHERE [TenantId] = @RetailTenantId AND [SKU] IN ('PROD002', 'PROD003');

GO

-- ============================================
-- 13. MEDICAL PRODUCTS (MEDICINES)
-- ============================================
PRINT 'Creating Medical Products...';

DECLARE @MedicalTenantId INT = (SELECT [Id] FROM [Tenants] WHERE [Code] = 'MEDICAL01');
DECLARE @MedicinesCategoryId INT = (SELECT [Id] FROM [ProductCategories] WHERE [TenantId] = @MedicalTenantId AND [Name] = 'Medicines');

IF NOT EXISTS (SELECT * FROM [Products] WHERE [TenantId] = @MedicalTenantId AND [SKU] = 'MED001')
BEGIN
    INSERT INTO [Products] ([TenantId], [Name], [SKU], [HSNCode], [Description], [CostPrice], [SellingPrice], [TaxRate], [TaxType], [StockQuantity], [LowStockAlert], [Unit], [CategoryId], [IsActive], [TrackInventory], [CreatedAt], [UpdatedAt])
    VALUES (@MedicalTenantId, 'Paracetamol 500mg', 'MED001', '3004', 'Paracetamol tablets 500mg', 1.50, 2.50, 0.00, 'Exempt', 1000, 100, 'TAB', @MedicinesCategoryId, 1, 1, GETUTCDATE(), GETUTCDATE());
    PRINT 'Created Product: Paracetamol 500mg';
END

IF NOT EXISTS (SELECT * FROM [Products] WHERE [TenantId] = @MedicalTenantId AND [SKU] = 'MED002')
BEGIN
    INSERT INTO [Products] ([TenantId], [Name], [SKU], [HSNCode], [Description], [CostPrice], [SellingPrice], [TaxRate], [TaxType], [StockQuantity], [LowStockAlert], [Unit], [CategoryId], [IsActive], [TrackInventory], [CreatedAt], [UpdatedAt])
    VALUES (@MedicalTenantId, 'Amoxicillin 250mg', 'MED002', '3004', 'Amoxicillin capsules 250mg', 3.00, 5.00, 0.00, 'Exempt', 500, 50, 'CAP', @MedicinesCategoryId, 1, 1, GETUTCDATE(), GETUTCDATE());
    PRINT 'Created Product: Amoxicillin 250mg';
END

IF NOT EXISTS (SELECT * FROM [Products] WHERE [TenantId] = @MedicalTenantId AND [SKU] = 'MED003')
BEGIN
    INSERT INTO [Products] ([TenantId], [Name], [SKU], [HSNCode], [Description], [CostPrice], [SellingPrice], [TaxRate], [TaxType], [StockQuantity], [LowStockAlert], [Unit], [CategoryId], [IsActive], [TrackInventory], [CreatedAt], [UpdatedAt])
    VALUES (@MedicalTenantId, 'Ibuprofen 400mg', 'MED003', '3004', 'Ibuprofen tablets 400mg', 2.00, 3.50, 0.00, 'Exempt', 800, 80, 'TAB', @MedicinesCategoryId, 1, 1, GETUTCDATE(), GETUTCDATE());
    PRINT 'Created Product: Ibuprofen 400mg';
END

GO

-- ============================================
-- 14. SCHOOL - CLASSES
-- ============================================
PRINT 'Creating Classes...';

DECLARE @SchoolTenantId INT = (SELECT [Id] FROM [Tenants] WHERE [Code] = 'SCHOOL01');
DECLARE @Class10Id INT;
DECLARE @Class11Id INT;

IF NOT EXISTS (SELECT * FROM [Classes] WHERE [TenantId] = @SchoolTenantId AND [Name] = 'Class 10')
BEGIN
    INSERT INTO [Classes] ([TenantId], [Name], [Code], [Type], [AcademicYear], [MaxStrength], [CurrentStrength], [IsActive], [CreatedAt])
    VALUES (@SchoolTenantId, 'Class 10', 'C10', 'School', '2024-2025', 40, 2, 1, GETUTCDATE());
    SET @Class10Id = SCOPE_IDENTITY();
    PRINT 'Created Class: Class 10';
END
ELSE
    SELECT @Class10Id = [Id] FROM [Classes] WHERE [TenantId] = @SchoolTenantId AND [Name] = 'Class 10';

IF NOT EXISTS (SELECT * FROM [Classes] WHERE [TenantId] = @SchoolTenantId AND [Name] = 'Class 11')
BEGIN
    INSERT INTO [Classes] ([TenantId], [Name], [Code], [Type], [AcademicYear], [MaxStrength], [CurrentStrength], [IsActive], [CreatedAt])
    VALUES (@SchoolTenantId, 'Class 11', 'C11', 'School', '2024-2025', 40, 0, 1, GETUTCDATE());
    SET @Class11Id = SCOPE_IDENTITY();
    PRINT 'Created Class: Class 11';
END

-- Update students with class
UPDATE [Students] SET [ClassId] = @Class10Id 
WHERE [TenantId] = @SchoolTenantId AND [StudentId] IN ('STU-2024-000001', 'STU-2024-000002');

GO

-- ============================================
-- 15. SCHOOL - FEE STRUCTURES
-- ============================================
PRINT 'Creating Fee Structures...';

DECLARE @SchoolTenantId INT = (SELECT [Id] FROM [Tenants] WHERE [Code] = 'SCHOOL01');
DECLARE @Class10Id INT = (SELECT [Id] FROM [Classes] WHERE [TenantId] = @SchoolTenantId AND [Name] = 'Class 10');
DECLARE @TuitionFeeStructureId INT;
DECLARE @LibraryFeeStructureId INT;

IF NOT EXISTS (SELECT * FROM [FeeStructures] WHERE [TenantId] = @SchoolTenantId AND [Name] = 'Tuition Fee')
BEGIN
    INSERT INTO [FeeStructures] ([TenantId], [ClassId], [Name], [FeeType], [Amount], [Frequency], [AcademicYear], [IsMandatory], [IsActive], [CreatedAt])
    VALUES (@SchoolTenantId, @Class10Id, 'Tuition Fee', 'Tuition', 3000.00, 'Monthly', '2024-2025', 1, 1, GETUTCDATE());
    SET @TuitionFeeStructureId = SCOPE_IDENTITY();
    PRINT 'Created Fee Structure: Tuition Fee';
END
ELSE
    SELECT @TuitionFeeStructureId = [Id] FROM [FeeStructures] WHERE [TenantId] = @SchoolTenantId AND [Name] = 'Tuition Fee';

IF NOT EXISTS (SELECT * FROM [FeeStructures] WHERE [TenantId] = @SchoolTenantId AND [Name] = 'Library Fee')
BEGIN
    INSERT INTO [FeeStructures] ([TenantId], [ClassId], [Name], [FeeType], [Amount], [Frequency], [AcademicYear], [IsMandatory], [IsActive], [CreatedAt])
    VALUES (@SchoolTenantId, @Class10Id, 'Library Fee', 'Library', 500.00, 'Annual', '2024-2025', 1, 1, GETUTCDATE());
    SET @LibraryFeeStructureId = SCOPE_IDENTITY();
    PRINT 'Created Fee Structure: Library Fee';
END
ELSE
    SELECT @LibraryFeeStructureId = [Id] FROM [FeeStructures] WHERE [TenantId] = @SchoolTenantId AND [Name] = 'Library Fee';

GO

-- ============================================
-- 16. SCHOOL - FEES FOR STUDENTS
-- ============================================
PRINT 'Creating Fee Records...';

DECLARE @SchoolTenantId INT = (SELECT [Id] FROM [Tenants] WHERE [Code] = 'SCHOOL01');
DECLARE @Student1Id INT = (SELECT [Id] FROM [Students] WHERE [TenantId] = @SchoolTenantId AND [StudentId] = 'STU-2024-000001');
DECLARE @Student2Id INT = (SELECT [Id] FROM [Students] WHERE [TenantId] = @SchoolTenantId AND [StudentId] = 'STU-2024-000002');
DECLARE @TuitionFeeStructureId INT = (SELECT [Id] FROM [FeeStructures] WHERE [TenantId] = @SchoolTenantId AND [Name] = 'Tuition Fee');
DECLARE @LibraryFeeStructureId INT = (SELECT [Id] FROM [FeeStructures] WHERE [TenantId] = @SchoolTenantId AND [Name] = 'Library Fee');
DECLARE @CreatedById INT = (SELECT TOP 1 [Id] FROM [Users] WHERE [TenantId] = @SchoolTenantId);

IF NOT EXISTS (SELECT * FROM [Fees] WHERE [TenantId] = @SchoolTenantId AND [FeeNumber] = 'FEE-2024-000001')
BEGIN
    INSERT INTO [Fees] ([TenantId], [StudentId], [FeeStructureId], [FeeNumber], [FeeType], [Amount], [NetAmount], [PaidAmount], [BalanceAmount], [DueDate], [Status], [Term], [CreatedAt])
    VALUES (@SchoolTenantId, @Student1Id, @TuitionFeeStructureId, 'FEE-2024-000001', 'Tuition', 3000.00, 3000.00, 1500.00, 1500.00, DATEADD(MONTH, 1, GETUTCDATE()), 'Partial', 'Term 1', GETUTCDATE());
    PRINT 'Created Fee: FEE-2024-000001';
END

IF NOT EXISTS (SELECT * FROM [Fees] WHERE [TenantId] = @SchoolTenantId AND [FeeNumber] = 'FEE-2024-000002')
BEGIN
    INSERT INTO [Fees] ([TenantId], [StudentId], [FeeStructureId], [FeeNumber], [FeeType], [Amount], [NetAmount], [PaidAmount], [BalanceAmount], [DueDate], [Status], [Term], [CreatedAt])
    VALUES (@SchoolTenantId, @Student1Id, @LibraryFeeStructureId, 'FEE-2024-000002', 'Library', 500.00, 500.00, 0.00, 500.00, DATEADD(MONTH, 1, GETUTCDATE()), 'Pending', NULL, GETUTCDATE());
    PRINT 'Created Fee: FEE-2024-000002';
END

GO

-- ============================================
-- 17. SCHOOL - FEE PAYMENTS
-- ============================================
PRINT 'Creating Fee Payments...';

DECLARE @SchoolTenantId INT = (SELECT [Id] FROM [Tenants] WHERE [Code] = 'SCHOOL01');
DECLARE @Student1Id INT = (SELECT [Id] FROM [Students] WHERE [TenantId] = @SchoolTenantId AND [StudentId] = 'STU-2024-000001');
DECLARE @Fee1Id INT = (SELECT [Id] FROM [Fees] WHERE [TenantId] = @SchoolTenantId AND [FeeNumber] = 'FEE-2024-000001');
DECLARE @CreatedById INT = (SELECT TOP 1 [Id] FROM [Users] WHERE [TenantId] = @SchoolTenantId);

IF NOT EXISTS (SELECT * FROM [FeePayments] WHERE [TenantId] = @SchoolTenantId AND [ReceiptNumber] = 'REC-2024-000001')
BEGIN
    INSERT INTO [FeePayments] ([TenantId], [FeeId], [StudentId], [ReceiptNumber], [Amount], [PaymentMode], [PaymentDate], [CreatedById], [CreatedAt])
    VALUES (@SchoolTenantId, @Fee1Id, @Student1Id, 'REC-2024-000001', 1500.00, 'Cash', GETUTCDATE(), @CreatedById, GETUTCDATE());
    PRINT 'Created Fee Payment: REC-2024-000001';
END

GO

-- ============================================
-- 18. RETAIL - SAMPLE INVOICES
-- ============================================
PRINT 'Creating Sample Invoices...';

DECLARE @RetailTenantId INT = (SELECT [Id] FROM [Tenants] WHERE [Code] = 'RETAIL01');
DECLARE @Customer1Id INT = (SELECT [Id] FROM [Customers] WHERE [TenantId] = @RetailTenantId AND [Email] = 'customer1@example.com');
DECLARE @Product1Id INT = (SELECT [Id] FROM [Products] WHERE [TenantId] = @RetailTenantId AND [SKU] = 'PROD001');
DECLARE @Product2Id INT = (SELECT [Id] FROM [Products] WHERE [TenantId] = @RetailTenantId AND [SKU] = 'PROD002');
DECLARE @CreatedById INT = (SELECT TOP 1 [Id] FROM [Users] WHERE [TenantId] = @RetailTenantId);
DECLARE @InvoiceId INT;

IF NOT EXISTS (SELECT * FROM [Invoices] WHERE [TenantId] = @RetailTenantId AND [InvoiceNumber] = 'INV-2024-000001')
BEGIN
    INSERT INTO [Invoices] ([TenantId], [InvoiceNumber], [InvoiceDate], [CustomerId], [CustomerName], [Status], [SubTotal], [TaxAmount], [DiscountAmount], [TotalAmount], [PaidAmount], [BalanceAmount], [PaymentMode], [CreatedById], [CreatedAt])
    VALUES (@RetailTenantId, 'INV-2024-000001', GETUTCDATE(), @Customer1Id, 'Alice Johnson', 'Completed', 1200.00, 216.00, 0.00, 1416.00, 1416.00, 0.00, 'Cash', @CreatedById, GETUTCDATE());
    SET @InvoiceId = SCOPE_IDENTITY();
    
    -- Invoice Items
    INSERT INTO [InvoiceItems] ([InvoiceId], [ProductId], [ProductName], [Quantity], [UnitPrice], [DiscountAmount], [TaxRate], [TaxAmount], [TotalAmount])
    VALUES (@InvoiceId, @Product1Id, 'Laptop Computer', 1, 1200.00, 0.00, 18.00, 216.00, 1416.00);
    
    PRINT 'Created Invoice: INV-2024-000001';
END

IF NOT EXISTS (SELECT * FROM [Invoices] WHERE [TenantId] = @RetailTenantId AND [InvoiceNumber] = 'INV-2024-000002')
BEGIN
    INSERT INTO [Invoices] ([TenantId], [InvoiceNumber], [InvoiceDate], [CustomerId], [CustomerName], [Status], [SubTotal], [TaxAmount], [DiscountAmount], [TotalAmount], [PaidAmount], [BalanceAmount], [PaymentMode], [CreatedById], [CreatedAt])
    VALUES (@RetailTenantId, 'INV-2024-000002', DATEADD(DAY, -5, GETUTCDATE()), @Customer1Id, 'Alice Johnson', 'Completed', 90.00, 16.20, 0.00, 106.20, 50.00, 56.20, 'UPI', @CreatedById, DATEADD(DAY, -5, GETUTCDATE()));
    SET @InvoiceId = SCOPE_IDENTITY();
    
    -- Invoice Items
    DECLARE @Product3Id INT = (SELECT [Id] FROM [Products] WHERE [TenantId] = @RetailTenantId AND [SKU] = 'PROD003');
    INSERT INTO [InvoiceItems] ([InvoiceId], [ProductId], [ProductName], [Quantity], [UnitPrice], [DiscountAmount], [TaxRate], [TaxAmount], [TotalAmount])
    VALUES 
    (@InvoiceId, @Product2Id, 'Wireless Mouse', 2, 25.00, 0.00, 18.00, 9.00, 59.00),
    (@InvoiceId, @Product3Id, 'USB Keyboard', 1, 65.00, 0.00, 18.00, 11.70, 76.70);
    
    PRINT 'Created Invoice: INV-2024-000002';
END

GO

-- ============================================
-- 19. RETAIL - SAMPLE PAYMENTS
-- ============================================
PRINT 'Creating Sample Payments...';

DECLARE @RetailTenantId INT = (SELECT [Id] FROM [Tenants] WHERE [Code] = 'RETAIL01');
DECLARE @Invoice1Id INT = (SELECT [Id] FROM [Invoices] WHERE [TenantId] = @RetailTenantId AND [InvoiceNumber] = 'INV-2024-000001');
DECLARE @Invoice2Id INT = (SELECT [Id] FROM [Invoices] WHERE [TenantId] = @RetailTenantId AND [InvoiceNumber] = 'INV-2024-000002');
DECLARE @CreatedById INT = (SELECT TOP 1 [Id] FROM [Users] WHERE [TenantId] = @RetailTenantId);

IF NOT EXISTS (SELECT * FROM [Payments] WHERE [TenantId] = @RetailTenantId AND [InvoiceId] = @Invoice1Id)
BEGIN
    INSERT INTO [Payments] ([TenantId], [InvoiceId], [Amount], [PaymentMode], [TransactionId], [PaymentDate], [CreatedById])
    VALUES (@RetailTenantId, @Invoice1Id, 1416.00, 'Cash', NULL, GETUTCDATE(), @CreatedById);
    PRINT 'Created Payment for Invoice: INV-2024-000001';
END

IF NOT EXISTS (SELECT * FROM [Payments] WHERE [TenantId] = @RetailTenantId AND [InvoiceId] = @Invoice2Id)
BEGIN
    INSERT INTO [Payments] ([TenantId], [InvoiceId], [Amount], [PaymentMode], [TransactionId], [PaymentDate], [CreatedById])
    VALUES (@RetailTenantId, @Invoice2Id, 50.00, 'UPI', 'UPI123456789', DATEADD(DAY, -5, GETUTCDATE()), @CreatedById);
    PRINT 'Created Payment for Invoice: INV-2024-000002';
END

GO

-- ============================================
-- 20. MEDICAL - UPDATE PRESCRIPTIONS WITH PRODUCTS
-- ============================================
PRINT 'Updating Prescriptions with Products...';

DECLARE @MedicalTenantId INT = (SELECT [Id] FROM [Tenants] WHERE [Code] = 'MEDICAL01');
DECLARE @ParacetamolProductId INT = (SELECT [Id] FROM [Products] WHERE [TenantId] = @MedicalTenantId AND [SKU] = 'MED001');
DECLARE @Prescription1Id INT = (SELECT [Id] FROM [Prescriptions] WHERE [TenantId] = @MedicalTenantId AND [PrescriptionNumber] = 'RX-2024-000001');

IF @Prescription1Id IS NOT NULL AND @ParacetamolProductId IS NOT NULL
BEGIN
    UPDATE [Prescriptions] 
    SET [ProductId] = @ParacetamolProductId
    WHERE [Id] = @Prescription1Id;
    PRINT 'Updated Prescription with Product';
END

-- Add more prescriptions
DECLARE @Patient1Id INT = (SELECT [Id] FROM [Patients] WHERE [TenantId] = @MedicalTenantId AND [PatientId] = 'PAT-2024-000001');
DECLARE @MedicalRecord1Id INT = (SELECT [Id] FROM [MedicalRecords] WHERE [TenantId] = @MedicalTenantId AND [VisitNumber] = 'VISIT-2024-000001');
DECLARE @AmoxicillinProductId INT = (SELECT [Id] FROM [Products] WHERE [TenantId] = @MedicalTenantId AND [SKU] = 'MED002');

IF NOT EXISTS (SELECT * FROM [Prescriptions] WHERE [TenantId] = @MedicalTenantId AND [PrescriptionNumber] = 'RX-2024-000002')
BEGIN
    INSERT INTO [Prescriptions] ([TenantId], [MedicalRecordId], [PatientId], [PrescriptionNumber], [MedicationName], [Dosage], [Frequency], [Duration], [Quantity], [UnitPrice], [TotalPrice], [ProductId], [PrescribedDate], [Status], [CreatedAt])
    VALUES (@MedicalTenantId, @MedicalRecord1Id, @Patient1Id, 'RX-2024-000002', 'Amoxicillin 250mg', '250mg', 'Three times daily', '7 days', 21, 5.00, 105.00, @AmoxicillinProductId, GETUTCDATE(), 'Active', GETUTCDATE());
    PRINT 'Created Prescription: RX-2024-000002';
END

GO

-- ============================================
-- 21. OFFICE - PROJECT INVOICES
-- ============================================
PRINT 'Creating Project Invoices...';

DECLARE @OfficeTenantId INT = (SELECT [Id] FROM [Tenants] WHERE [Code] = 'OFFICE01');
DECLARE @Project1Id INT = (SELECT [Id] FROM [Projects] WHERE [TenantId] = @OfficeTenantId AND [ProjectCode] = 'PRJ-2024-0001');
DECLARE @Client1Id INT = (SELECT TOP 1 [Id] FROM [OfficeClients] WHERE [TenantId] = @OfficeTenantId);

IF @Project1Id IS NOT NULL AND NOT EXISTS (SELECT * FROM [ProjectInvoices] WHERE [TenantId] = @OfficeTenantId AND [ProjectId] = @Project1Id)
BEGIN
    INSERT INTO [ProjectInvoices] ([TenantId], [ProjectId], [ClientId], [InvoiceNumber], [InvoiceDate], [DueDate], [SubTotal], [TaxAmount], [TotalAmount], [PaidAmount], [BalanceAmount], [Status], [CreatedAt])
    VALUES (@OfficeTenantId, @Project1Id, @Client1Id, 'INV-2024-000001', GETUTCDATE(), DATEADD(DAY, 30, GETUTCDATE()), 25000.00, 4500.00, 29500.00, 0.00, 29500.00, 'Pending', GETUTCDATE());
    PRINT 'Created Project Invoice: INV-2024-000001';
END

GO

PRINT '========================================';
PRINT 'Seed script completed successfully!';
PRINT '========================================';
PRINT '';
PRINT 'Login Credentials (Password for all: Password123!):';
PRINT 'Retail: owner@retail.com / manager@retail.com / cashier@retail.com';
PRINT 'Medical: admin@medical.com / doctor@medical.com / nurse@medical.com';
PRINT 'School: principal@school.com / teacher@school.com / accountant@school.com';
PRINT 'Office: ceo@office.com / pm@office.com';
PRINT '';
PRINT 'Tenant Codes:';
PRINT 'Retail: RETAIL01';
PRINT 'Medical: MEDICAL01';
PRINT 'School: SCHOOL01';
PRINT 'Office: OFFICE01';
PRINT '========================================';
GO

