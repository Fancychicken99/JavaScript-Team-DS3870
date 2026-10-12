# SwollenHippo Industries JavaScript API

The API is part of the existing Node.js/Express application and uses Sequelize with MariaDB. Run commands from `swollenhippo-industries`.

## Configure the local environment

In PowerShell, set the MariaDB connection URL, a random JWT secret, issuer, and audience:

```powershell
$env:MARIADB_URL = "mariadb://YOUR_DB_USER:YOUR_DB_PASSWORD@localhost:3306/swollenhippo"
$keyBytes = New-Object byte[] 64
$rng = [Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($keyBytes)
$env:JWT_SECRET = [Convert]::ToBase64String($keyBytes)
$rng.Dispose()
$env:JWT_ISSUER = "SwollenHippo.Api"
$env:JWT_AUDIENCE = "SwollenHippo.Client"
```

Keep these values private. Set them again in each new terminal, or store them in a local `.env` file using a locally installed environment-variable loader; never commit secrets.

## Install and initialize

```powershell
npm install
npm run db:sync
npm start
```

`db:sync` creates missing tables from the Sequelize models and does not force-drop existing tables. For deployed databases, use a reviewed migration process instead.

## Authentication

- `POST /api/auth/register` accepts `{"username":"...","password":"..."}`. Passwords must be at least 12 characters and no more than 72 UTF-8 bytes. Registration only creates `Customer` users.
- `POST /api/auth/login` accepts the same fields and returns an HS512 bearer token valid for two hours.
- Include the token in the `Authorization: Bearer <token>` header for protected routes.

There is no public Admin registration. To promote a registered account, use a trusted MariaDB administrator account:

```sql
UPDATE Users SET Role = 'Admin' WHERE Username = 'your-admin-username';
```

Log in again after promotion so the new token carries the Admin role.

## Job routes

- `GET /api/jobs/my-jobs` lists jobs assigned to the authenticated Customer.
- `PATCH /api/jobs/{id}/status` updates a job status and requires an Admin token. Its JSON body must contain one of `Pending`, `InProgress`, `Complete`, or `Shipped`.
