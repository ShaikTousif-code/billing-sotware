-- Recalculate ALL password hashes correctly
-- This script will update all users to use "Password123!" with the CORRECT hash
-- The hash must be calculated exactly as C# does: SHA256(password) then Base64

USE BillingDB;
GO

SET QUOTED_IDENTIFIER ON;
GO

PRINT '========================================';
PRINT 'Recalculating ALL password hashes...';
PRINT '========================================';
GO

-- IMPORTANT: The hash must match exactly what C# AuthService generates
-- C# code: SHA256(password) -> Base64
-- For "Password123!" the correct hash is: jGl25bVBBBW96Qi9Te4V37Fnqchz/Eu4qB9vKrRIqRg=

-- However, if DEMO user can login, let's check what password they're using
-- DEMO user hash: 6G94qKPK8LYNjnTllCqm2G3BUM08AzOK7yW30tfjrMc=
-- This might be for "Admin@123" 

-- Let's update ALL users (including DEMO) to use "Password123!" for consistency
DECLARE @PasswordHash NVARCHAR(MAX) = 'jGl25bVBBBW96Qi9Te4V37Fnqchz/Eu4qB9vKrRIqRg=';

-- Update ALL users
UPDATE [Users]
SET [PasswordHash] = @PasswordHash
WHERE [Email] IN (
    'admin@demoshop.com',
    'owner@retail.com',
    'manager@retail.com',
    'cashier@retail.com',
    'admin@medical.com',
    'doctor@medical.com',
    'nurse@medical.com',
    'biller@medical.com',
    'principal@school.com',
    'teacher@school.com',
    'accountant@school.com',
    'ceo@office.com',
    'pm@office.com'
);

PRINT 'Updated password hashes for ALL users';
PRINT '';
PRINT 'ALL users now use password: Password123!';
PRINT '========================================';
GO

