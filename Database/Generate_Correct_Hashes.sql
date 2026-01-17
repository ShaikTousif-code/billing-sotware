-- This script will be updated after we get the correct hash from the API
-- For now, let's use the Register endpoint or test hash endpoint to generate correct hashes

USE BillingDB;
GO

PRINT '========================================';
PRINT 'To get correct password hashes:';
PRINT '1. Start the API';
PRINT '2. Call GET /api/TestHash/hash/Password123!';
PRINT '3. Call GET /api/TestHash/hash/Admin@123';
PRINT '4. Update this script with the correct hashes';
PRINT '========================================';
GO

