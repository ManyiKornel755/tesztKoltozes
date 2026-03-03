-- =============================================
-- Migration Script: Add Missing Columns
-- WaveAlertDB - SQL Server
-- =============================================

USE WaveAlertDB;
GO

-- Add missing 'address' column to users table
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS
               WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'address')
BEGIN
    ALTER TABLE users ADD address NVARCHAR(500) NULL;
    PRINT 'Added address column to users table';
END
ELSE
BEGIN
    PRINT 'address column already exists in users table';
END
GO

-- Add missing 'is_deleted' column to groups table
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS
               WHERE TABLE_NAME = 'groups' AND COLUMN_NAME = 'is_deleted')
BEGIN
    ALTER TABLE groups ADD is_deleted BIT DEFAULT 0;
    PRINT 'Added is_deleted column to groups table';
END
ELSE
BEGIN
    PRINT 'is_deleted column already exists in groups table';
END
GO

-- Add missing 'created_at' column to messages table
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS
               WHERE TABLE_NAME = 'messages' AND COLUMN_NAME = 'created_at')
BEGIN
    ALTER TABLE messages ADD created_at DATETIME2 DEFAULT GETDATE();
    PRINT 'Added created_at column to messages table';
END
ELSE
BEGIN
    PRINT 'created_at column already exists in messages table';
END
GO

PRINT '';
PRINT 'Migration completed successfully!';
GO
