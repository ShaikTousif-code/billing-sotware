-- ============================================
-- FIX USER PASSWORD HASH
-- Updates the password hash for admin@demoshop.com
-- Password: Admin@123
-- ============================================

USE BillingDB;
GO

-- Update password hash for admin user
-- Correct hash for "Admin@123" using SHA256 + Base64
UPDATE [Users]
SET [PasswordHash] = '6G94qKPK8LYNjnTllCqm2G3BUM08AzOK7yW30tfjrMc='
WHERE [Email] = 'admin@demoshop.com' AND [TenantId] = (SELECT [Id] FROM [Tenants] WHERE [Code] = 'DEMO001');

IF @@ROWCOUNT > 0
BEGIN
    PRINT 'Password hash updated successfully for admin@demoshop.com';
END
ELSE
BEGIN
    PRINT 'User not found or already updated.';
END
GO

PRINT '========================================';
PRINT 'Password hash fix complete!';
PRINT 'Login credentials:';
PRINT '  Tenant Code: DEMO001';
PRINT '  Email: admin@demoshop.com';
PRINT '  Password: Admin@123';
PRINT '========================================';
GO

