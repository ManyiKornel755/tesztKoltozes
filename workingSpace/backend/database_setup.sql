-- =============================================
-- WaveAlert SQL Server Adatbázis Beállítás
-- Futtasd ezt a scriptet SQL Server Management Studio-ban
-- =============================================

-- 1. Adatbázis létrehozása
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'WaveAlertDB')
BEGIN
    CREATE DATABASE WaveAlertDB;
END
GO

USE WaveAlertDB;
GO

-- 2. Login és User létrehozása
-- FIGYELEM: Cseréld ki a jelszót production környezetben!
IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = 'webuser')
BEGIN
    CREATE LOGIN webuser WITH PASSWORD = 'ErősJelszó123';
END
GO

IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'webuser')
BEGIN
    CREATE USER webuser FOR LOGIN webuser;
    ALTER ROLE db_owner ADD MEMBER webuser;
END
GO

-- =============================================
-- 3. Táblák létrehozása
-- =============================================

-- Users tábla
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'users')
BEGIN
    CREATE TABLE users (
        id INT IDENTITY(1,1) PRIMARY KEY,
        email NVARCHAR(255) UNIQUE NOT NULL,
        password_hash NVARCHAR(255) NOT NULL,
        first_name NVARCHAR(100) NOT NULL,
        last_name NVARCHAR(100) NOT NULL,
        phone NVARCHAR(20),
        is_member BIT DEFAULT 0,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE()
    );

    CREATE INDEX idx_users_email ON users(email);
END
GO

-- Roles tábla
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'roles')
BEGIN
    CREATE TABLE roles (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(50) UNIQUE NOT NULL,
        description NVARCHAR(255),
        created_at DATETIME2 DEFAULT GETDATE()
    );
END
GO

-- User_Roles kapcsolótábla
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'user_roles')
BEGIN
    CREATE TABLE user_roles (
        user_id INT NOT NULL,
        role_id INT NOT NULL,
        assigned_at DATETIME2 DEFAULT GETDATE(),
        PRIMARY KEY (user_id, role_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
    );
END
GO

-- Members tábla
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'members')
BEGIN
    CREATE TABLE members (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT UNIQUE,
        membership_number NVARCHAR(50) UNIQUE,
        join_date DATE,
        membership_type NVARCHAR(50),
        status NVARCHAR(20) DEFAULT 'active',
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
END
GO

-- Groups tábla
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'groups')
BEGIN
    CREATE TABLE groups (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(100) NOT NULL,
        description NVARCHAR(MAX),
        created_by INT,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (created_by) REFERENCES users(id)
    );
END
GO

-- Group_Members kapcsolótábla
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'group_members')
BEGIN
    CREATE TABLE group_members (
        group_id INT NOT NULL,
        user_id INT NOT NULL,
        joined_at DATETIME2 DEFAULT GETDATE(),
        PRIMARY KEY (group_id, user_id),
        FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
END
GO

-- Messages tábla
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'messages')
BEGIN
    CREATE TABLE messages (
        id INT IDENTITY(1,1) PRIMARY KEY,
        sender_id INT NOT NULL,
        group_id INT,
        subject NVARCHAR(255),
        content NVARCHAR(MAX) NOT NULL,
        priority NVARCHAR(20) DEFAULT 'normal',
        sent_at DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (sender_id) REFERENCES users(id),
        FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
    );

    CREATE INDEX idx_messages_sent_at ON messages(sent_at DESC);
END
GO

-- Events tábla
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'events')
BEGIN
    CREATE TABLE events (
        id INT IDENTITY(1,1) PRIMARY KEY,
        title NVARCHAR(255) NOT NULL,
        description NVARCHAR(MAX),
        event_date DATETIME2 NOT NULL,
        location NVARCHAR(255),
        organizer_id INT,
        max_participants INT,
        status NVARCHAR(20) DEFAULT 'upcoming',
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (organizer_id) REFERENCES users(id)
    );

    CREATE INDEX idx_events_date ON events(event_date);
END
GO

-- Event_Participants kapcsolótábla
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'event_participants')
BEGIN
    CREATE TABLE event_participants (
        event_id INT NOT NULL,
        user_id INT NOT NULL,
        status NVARCHAR(20) DEFAULT 'registered',
        registered_at DATETIME2 DEFAULT GETDATE(),
        PRIMARY KEY (event_id, user_id),
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
END
GO

-- Trainings tábla
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'trainings')
BEGIN
    CREATE TABLE trainings (
        id INT IDENTITY(1,1) PRIMARY KEY,
        title NVARCHAR(255) NOT NULL,
        description NVARCHAR(MAX),
        trainer_id INT,
        training_date DATETIME2 NOT NULL,
        duration_minutes INT,
        location NVARCHAR(255),
        max_participants INT,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (trainer_id) REFERENCES users(id)
    );
END
GO

-- Documents tábla
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'documents')
BEGIN
    CREATE TABLE documents (
        id INT IDENTITY(1,1) PRIMARY KEY,
        title NVARCHAR(255) NOT NULL,
        description NVARCHAR(MAX),
        file_path NVARCHAR(500) NOT NULL,
        file_type NVARCHAR(50),
        file_size INT,
        uploaded_by INT,
        category NVARCHAR(100),
        is_public BIT DEFAULT 0,
        uploaded_at DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (uploaded_by) REFERENCES users(id)
    );

    CREATE INDEX idx_documents_category ON documents(category);
END
GO

-- User_Documents kapcsolótábla (hozzáférési jogok)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'user_documents')
BEGIN
    CREATE TABLE user_documents (
        user_id INT NOT NULL,
        document_id INT NOT NULL,
        can_view BIT DEFAULT 1,
        can_edit BIT DEFAULT 0,
        granted_at DATETIME2 DEFAULT GETDATE(),
        PRIMARY KEY (user_id, document_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
    );
END
GO

-- Race_Reports tábla
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'race_reports')
BEGIN
    CREATE TABLE race_reports (
        id INT IDENTITY(1,1) PRIMARY KEY,
        race_name NVARCHAR(255) NOT NULL,
        race_date DATE NOT NULL,
        location NVARCHAR(255),
        boat_name NVARCHAR(100),
        crew_members NVARCHAR(MAX),
        placement INT,
        notes NVARCHAR(MAX),
        weather_conditions NVARCHAR(MAX),
        submitted_by INT,
        submitted_at DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (submitted_by) REFERENCES users(id)
    );

    CREATE INDEX idx_race_reports_date ON race_reports(race_date DESC);
END
GO

-- Transactions tábla (pénzügyi tranzakciók)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'transactions')
BEGIN
    CREATE TABLE transactions (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        transaction_type NVARCHAR(50) NOT NULL,
        description NVARCHAR(255),
        transaction_date DATETIME2 DEFAULT GETDATE(),
        status NVARCHAR(20) DEFAULT 'completed',
        FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE INDEX idx_transactions_date ON transactions(transaction_date DESC);
    CREATE INDEX idx_transactions_user ON transactions(user_id);
END
GO

-- =============================================
-- 4. Alapértelmezett adatok beszúrása
-- =============================================

-- Alapértelmezett szerepkörök
IF NOT EXISTS (SELECT * FROM roles WHERE name = 'admin')
BEGIN
    INSERT INTO roles (name, description) VALUES
    ('admin', 'Rendszergazda - teljes hozzáférés'),
    ('member', 'Egyesületi tag'),
    ('trainer', 'Edző'),
    ('captain', 'Kapitány'),
    ('guest', 'Vendég felhasználó');
END
GO

-- =============================================
-- 5. Trigger létrehozása updated_at mezőkhöz
-- =============================================

-- Users tábla trigger
IF NOT EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_users_updated')
BEGIN
    EXEC('
    CREATE TRIGGER trg_users_updated
    ON users
    AFTER UPDATE
    AS
    BEGIN
        SET NOCOUNT ON;
        UPDATE users
        SET updated_at = GETDATE()
        FROM users u
        INNER JOIN inserted i ON u.id = i.id;
    END
    ');
END
GO

-- Events tábla trigger
IF NOT EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_events_updated')
BEGIN
    EXEC('
    CREATE TRIGGER trg_events_updated
    ON events
    AFTER UPDATE
    AS
    BEGIN
        SET NOCOUNT ON;
        UPDATE events
        SET updated_at = GETDATE()
        FROM events e
        INNER JOIN inserted i ON e.id = i.id;
    END
    ');
END
GO

-- Members tábla trigger
IF NOT EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_members_updated')
BEGIN
    EXEC('
    CREATE TRIGGER trg_members_updated
    ON members
    AFTER UPDATE
    AS
    BEGIN
        SET NOCOUNT ON;
        UPDATE members
        SET updated_at = GETDATE()
        FROM members m
        INNER JOIN inserted i ON m.id = i.id;
    END
    ');
END
GO

-- Groups tábla trigger
IF NOT EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_groups_updated')
BEGIN
    EXEC('
    CREATE TRIGGER trg_groups_updated
    ON groups
    AFTER UPDATE
    AS
    BEGIN
        SET NOCOUNT ON;
        UPDATE groups
        SET updated_at = GETDATE()
        FROM groups g
        INNER JOIN inserted i ON g.id = i.id;
    END
    ');
END
GO

-- Trainings tábla trigger
IF NOT EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_trainings_updated')
BEGIN
    EXEC('
    CREATE TRIGGER trg_trainings_updated
    ON trainings
    AFTER UPDATE
    AS
    BEGIN
        SET NOCOUNT ON;
        UPDATE trainings
        SET updated_at = GETDATE()
        FROM trainings t
        INNER JOIN inserted i ON t.id = i.id;
    END
    ');
END
GO

PRINT '✅ Adatbázis sikeresen létrehozva és konfigurálva!';
PRINT '';
PRINT 'Következő lépések:';
PRINT '1. Ellenőrizd a .env fájlt a backend mappában';
PRINT '2. Futtasd: npm run dev';
PRINT '3. Teszteld a kapcsolatot';
GO
