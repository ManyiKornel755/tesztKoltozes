# BMFVSE - Backend és Frontend Alkalmazás

Ez a projekt a BMFVSE rendszer backend és frontend implementációját tartalmazza.

## Projekt Struktúra

```
workingSpace/
├── backend/                 # Backend API
│   ├── src/
│   │   ├── config/         # Konfiguráció (database.js)
│   │   ├── middlewares/    # Middleware-ek (auth.js, errorHandler.js)
│   │   ├── models/         # Adatmodell osztályok
│   │   ├── routes/         # API útvonalak
│   │   ├── services/       # Szolgáltatások (emailService.js)
│   │   └── server.js       # Fő szerver fájl
│   ├── scripts/            # Segédszkriptek
│   │   ├── create-admin.js
│   │   └── reset-admin-password.js
│   ├── package.json
│   └── .env.example
│
└── frontend/               # Frontend alkalmazás
    ├── src/
    │   ├── pages/         # React oldalak
    │   │   ├── Login.jsx
    │   │   ├── Members.jsx
    │   │   ├── Roles.jsx
    │   │   ├── Messages.jsx
    │   │   └── Profile.jsx
    │   └── services/      # API kliensek
    │       └── api.js
    ├── package.json
    └── vite.config.js
```

## Backend Telepítés és Indítás

### 1. Függőségek telepítése

```bash
cd workingSpace/backend
npm install
```

### 2. Környezeti változók beállítása

Másold le a `.env.example` fájlt `.env` névre és töltsd ki a megfelelő értékekkel:

```bash
cp .env.example .env
```

Szerkeszd a `.env` fájlt:

```env
# Server Configuration
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# Database Configuration (Azure Database for MySQL)
DB_HOST=your-mysql-server.mysql.database.azure.com
DB_USER=your-username
DB_PASSWORD=your-password
DB_NAME=bmfvse

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# SendGrid Configuration
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@bmfvse.hu
```

### 3. Admin felhasználó létrehozása

```bash
npm run create-admin
```

Ez létrehozza az admin felhasználót:
- Email: `admin@bmfvse.hu`
- Jelszó: `admin123`

### 4. Szerver indítása

Fejlesztői módban (auto-reload):
```bash
npm run dev
```

Éles módban:
```bash
npm start
```

A szerver a `http://localhost:3000` címen fut.

## Frontend Telepítés és Indítás

### 1. Függőségek telepítése

```bash
cd workingSpace/frontend
npm install
```

### 2. Fejlesztői szerver indítása

```bash
npm run dev
```

A frontend a `http://localhost:5173` címen fut.

### 3. Production build

```bash
npm run build
```

A build fájlok a `dist/` mappába kerülnek.

## API Endpointok

### Auth
- `POST /api/auth/login` - Bejelentkezés
- `POST /api/auth/register` - Regisztráció
- `GET /api/auth/me` - Bejelentkezett felhasználó adatai

### Users
- `GET /api/users/me` - Saját profil
- `PATCH /api/users/me` - Profil szerkesztés
- `PATCH /api/users/me/password` - Jelszó változtatás
- `GET /api/users` - Összes felhasználó (admin)
- `DELETE /api/users/:id` - Felhasználó törlése (admin)

### Roles
- `GET /api/roles` - Összes szerepkör (admin)
- `POST /api/roles` - Új szerepkör (admin)
- `PUT /api/roles/:id` - Szerepkör módosítás (admin)
- `DELETE /api/roles/:id` - Szerepkör törlés (admin)
- `POST /api/roles/:id/assign/:userId` - Szerepkör hozzárendelése (admin)

### Events
- `GET /api/events` - Összes esemény
- `GET /api/events/:id` - Esemény részletei
- `POST /api/events` - Új esemény (admin)
- `PUT /api/events/:id` - Esemény módosítás (admin)
- `DELETE /api/events/:id` - Esemény törlés (admin)
- `POST /api/events/:id/register` - Jelentkezés eseményre

### Messages
- `GET /api/messages` - Összes hírlevél
- `POST /api/messages` - Új hírlevél (admin)
- `POST /api/messages/:id/send` - Hírlevél küldése (admin)

### Transactions
- `GET /api/transactions` - Tranzakciók listája
- `GET /api/transactions/stats` - Statisztikák (admin)
- `POST /api/transactions` - Új tranzakció (admin)

### User Documents
- `POST /api/user-documents/generate/:userId` - Dokumentum generálás (admin)
- `GET /api/user-documents/:userId` - Felhasználó dokumentumai (admin)
- `GET /api/user-documents/:id/download` - Dokumentum letöltése

## Kritikus szabályok

1. **Database import**: `const { pool } = require('../config/database')` - NEM default export!
2. **Auth user ID**: `req.user.id` - NEM `req.user.userId`!
3. **Users + roles**: `User.getAllWithRoles()` használata
4. **Opcionális mező**: `null` érték használata
5. **FK hivatkozás**: `user_id → users` (NEM members!)

## Git Munkafolyamat

### 1. Mindig dev-ből indulj

```bash
git checkout dev
git pull origin dev
```

### 2. Új feature branch készítése

```bash
git checkout -b feature/valami-funkcio
```

### 3. Kommitálj rendszeresen

```bash
git add src/models/User.js
git commit -m "feat(user): add getAllWithRoles method"
git push origin feature/valami-funkcio
```

## Tesztelés

Backend tesztek futtatása:
```bash
cd workingSpace/backend
npm test
```

## Hibakeresés

### Backend problémák

1. Ellenőrizd a `.env` fájlt
2. Nézd meg a konzol kimenetét
3. Ellenőrizd az adatbázis kapcsolatot

### Frontend problémák

1. Ellenőrizd, hogy a backend fut-e
2. Nézd meg a böngésző konzolt
3. Ellenőrizd a localStorage-t (token, user)

## Licenc

ISC
