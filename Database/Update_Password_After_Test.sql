-- Run this AFTER you get the correct hash from the Register endpoint or TestHash endpoint
-- Replace 'CORRECT_HASH_HERE' with the actual hash

USE BillingDB;
GO

SET QUOTED_IDENTIFIER ON;
GO

PRINT '========================================';
PRINT 'Updating password hashes...';
PRINT '========================================';
GO

-- Replace this with the correct hash from the API
DECLARE @CorrectHash NVARCHAR(MAX) = 'CORRECT_HASH_HERE';

-- Update all users except DEMO (keep DEMO with Admin@123)
UPDATE [Users]
SET [PasswordHash] = @CorrectHash
WHERE [Email] != 'admin@demoshop.com';

PRINT 'Updated password hashes for all users (except DEMO)';
PRINT '';
PRINT 'All users now use password: Password123!';
PRINT 'DEMO user uses: Admin@123';
PRINT '========================================';
GO

