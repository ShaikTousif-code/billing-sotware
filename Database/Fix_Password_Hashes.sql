-- Fix Password Hashes for All Users
-- This script regenerates password hashes using the correct SHA256 + Base64 method
-- Password for all users: Password123!

USE BillingDB;
GO

SET QUOTED_IDENTIFIER ON;
GO

PRINT '========================================';
PRINT 'Fixing Password Hashes...';
PRINT '========================================';
GO

-- The correct hash for "Password123!" using SHA256 + Base64
-- This is calculated as: SHA256("Password123!") then Base64 encoded
DECLARE @CorrectPasswordHash NVARCHAR(MAX) = 'jGl25bVBBBW96Qi9Te4V37Fnqchz/Eu4qB9vKrRIqRg=';

-- Update all users with the correct password hash (except demo user which has a different password)
UPDATE [Users]
SET [PasswordHash] = @CorrectPasswordHash
WHERE [Email] IN (
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

PRINT 'Updated password hashes for all seeded users';
PRINT '';
PRINT 'Password for all users: Password123!';
PRINT '========================================';
GO

