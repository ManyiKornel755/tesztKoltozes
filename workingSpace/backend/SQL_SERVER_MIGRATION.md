# SQL Server Migráció Útmutató

## Elvégzett Változtatások

### 1. Telepített Csomag
```bash
npm install mssql
```

### 2. Frissített Fájlok

#### `.env`
```env
# SQL Server Configuration
DB_SERVER=localhost\\SQLEXPRESS
DB_NAME=WaveAlertDB
DB_USER=webuser
DB_PASSWORD=ErősJelszó123
DB_ENCRYPT=true
DB_TRUST_CERT=true
```

#### `src/config/database.js`
- Átállítva MySQL-ről SQL Server-re
- Használ `mssql` csomagot `mysql2` helyett
- Connection pool konfiguráció SQL Server-hez

## SQL Server Beállítása

### 1. SQL Server Authentication Engedélyezése

1. Nyisd meg az **SQL Server Management Studio (SSMS)**-t
2. Csatlakozz a `localhost\SQLEXPRESS` szerverhez
3. Jobb klikk a szerveren → **Properties** → **Security**
4. Válaszd ki: **SQL Server and Windows Authentication mode**
5. Kattints **OK**-ra és indítsd újra az SQL Server szolgáltatást

### 2. Felhasználó és Adatbázis Létrehozása

Futtasd le az alábbi SQL script-et SSMS-ben:

```sql
-- Adatbázis létrehozása
CREATE DATABASE WaveAlertDB;
GO

USE WaveAlertDB;
GO

-- Login létrehozása
CREATE LOGIN webuser WITH PASSWORD = 'ErősJelszó123';
GO

-- User létrehozása az adatbázisban
CREATE USER webuser FOR LOGIN webuser;
GO

-- Jogosultságok megadása
ALTER ROLE db_owner ADD MEMBER webuser;
GO
```

### 3. Tűzfal Beállítások (Ha szükséges)

Ha a szerver távoli eléréséhez:
1. Windows Firewall → Új szabály
2. Port: 1433 (SQL Server alapértelmezett portja)
3. Engedélyezd a bejövő kapcsolatokat

## Query Szintaxis Különbségek

### MySQL vs SQL Server

| Feature | MySQL | SQL Server |
|---------|-------|------------|
| Paraméterek | `?` | `@param` |
| String összefűzés | `CONCAT()` vagy `GROUP_CONCAT()` | `STRING_AGG()` vagy `+` |
| Auto increment | `AUTO_INCREMENT` | `IDENTITY(1,1)` |
| Limit | `LIMIT n` | `TOP n` vagy `OFFSET-FETCH` |
| Idézőjelek | Backtick ` `` ` vagy `"` | Square brackets `[]` vagy `"` |
| Utolsó ID lekérése | `LAST_INSERT_ID()` | `SCOPE_IDENTITY()` vagy `OUTPUT INSERTED.*` |

### Példa Kód Átírásra

**Régi (MySQL):**
```javascript
const [rows] = await pool.query(
  'SELECT * FROM users WHERE id = ?',
  [id]
);
return rows[0];
```

**Új (SQL Server):**
```javascript
const pool = await poolPromise;
const result = await pool.request()
  .input('id', sql.Int, id)
  .query('SELECT * FROM users WHERE id = @id');
return result.recordset[0];
```

## Modell Átírási Útmutató

Lásd a példát: `src/models/User.example.mssql.js`

### Főbb változtatások:

1. **Import változás:**
   ```javascript
   const { sql, poolPromise } = require('../config/database');
   ```

2. **Pool használat:**
   ```javascript
   const pool = await poolPromise;
   ```

3. **Query paraméterek:**
   ```javascript
   .input('paramNév', sql.Típus, érték)
   ```

4. **Eredmény kezelés:**
   - MySQL: `rows[0]` vagy `[rows]`
   - SQL Server: `result.recordset[0]`

5. **SQL típusok:**
   - `sql.Int` - egész szám
   - `sql.VarChar(length)` - szöveg (ASCII)
   - `sql.NVarChar(length)` - Unicode szöveg (magyar ékezetek!)
   - `sql.Bit` - boolean
   - `sql.DateTime` - dátum/idő
   - `sql.Decimal(precision, scale)` - tizedes szám

## Táblák Létrehozása

Példa SQL script az adatbázis tábláinak létrehozásához:

```sql
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

CREATE TABLE roles (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(50) UNIQUE NOT NULL,
    description NVARCHAR(255),
    created_at DATETIME2 DEFAULT GETDATE()
);

CREATE TABLE user_roles (
    user_id INT NOT NULL,
    role_id INT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);
```

## Kapcsolat Tesztelése

```bash
npm run dev
```

Ha sikeres a kapcsolat, a következő üzenetet látod:
```
✅ SQL Server connected successfully
Server running on port 5000
```

## Hibaelhárítás

### "Login failed for user"
- Ellenőrizd, hogy az SQL Server Authentication engedélyezve van-e
- Ellenőrizd a felhasználónév/jelszó helyességét

### "Cannot connect to server"
- Ellenőrizd, hogy az SQL Server szolgáltatás fut-e
- Ellenőrizd a szerver nevét (.env fájlban)
- Windows esetén: `localhost\\SQLEXPRESS` (dupla backslash!)

### "Database does not exist"
- Futtasd le az adatbázis létrehozó script-et SSMS-ben

## Következő Lépések

1. ✅ Telepítve: mssql csomag
2. ✅ Frissítve: database config
3. ✅ Frissítve: .env fájl
4. ⏳ **TODO:** Modell fájlok átírása (User.example.mssql.js alapján)
5. ⏳ **TODO:** SQL táblák létrehozása az adatbázisban
6. ⏳ **TODO:** Tesztelés és hibakeresés

## Kapcsolódó Dokumentáció

- [mssql npm package](https://www.npmjs.com/package/mssql)
- [SQL Server T-SQL Referencia](https://docs.microsoft.com/en-us/sql/t-sql/)
