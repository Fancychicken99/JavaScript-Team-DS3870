<<<<<<< Updated upstream
# SwollenHippo Industries API

## Create and install (from the `swollenhippo-industries` directory)

```sh
dotnet new webapi --name SwollenHippo.Api --framework net8.0 --use-controllers
cd SwollenHippo.Api
dotnet add package Pomelo.EntityFrameworkCore.MySql --version 8.0.3
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer --version 8.0.31
dotnet add package Microsoft.EntityFrameworkCore.Design --version 8.0.22
dotnet tool install --global dotnet-ef --version 8.0.22
```

The checked-in scaffold already contains these project/package references. Install the .NET 8 SDK first if `dotnet` is unavailable.

## Local configuration

Use user secrets for local development instead of committing database credentials or the JWT signing key:

```sh
dotnet user-secrets init
dotnet user-secrets set "ConnectionStrings:SwollenHippo" "Server=localhost;Port=3306;Database=swollenhippo;User=YOUR_DB_USER;Password=YOUR_DB_PASSWORD;"
dotnet user-secrets set "Jwt:Issuer" "SwollenHippo.Api"
dotnet user-secrets set "Jwt:Audience" "SwollenHippo.Client"
dotnet user-secrets set "Jwt:SigningKey" "replace-with-a-random-secret-at-least-32-bytes-long"
dotnet run
```

The API scaffold enables JWT bearer validation and authorization middleware. Login/token issuance and API controllers are intentionally left for the next implementation step. Create/apply schema migrations after configuring MariaDB, using `dotnet ef migrations add InitialCreate` and `dotnet ef database update`.
=======
# SwollenHippo Industries .NET 8 API

## Requirements

- .NET 8 SDK
- MariaDB

## Configure local secrets

Run commands from this directory. User secrets are kept outside the repository and are loaded by ASP.NET Core in the Development environment.

```powershell
dotnet user-secrets set "ConnectionStrings:MariaDb" "Server=localhost;Port=3306;Database=swollenhippo;User=YOUR_DB_USER;Password=YOUR_DB_PASSWORD;"
dotnet user-secrets set "Jwt:Issuer" "SwollenHippo.Api"
dotnet user-secrets set "Jwt:Audience" "SwollenHippo.Client"
$keyBytes = New-Object byte[] 64
$rng = [Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($keyBytes)
$jwtKey = [Convert]::ToBase64String($keyBytes)
dotnet user-secrets set "Jwt:Key" $jwtKey
$rng.Dispose()
```

Replace the database credentials with real local values. The JWT key is generated as a random 64-byte value for HMAC-SHA512. Never commit credentials or the signing key.

## Create the database schema and run

```powershell
dotnet tool install --global dotnet-ef --version 8.0.22
dotnet ef migrations add InitialCreate
dotnet ef database update
dotnet run
```

## Authentication endpoints

- `POST /api/auth/register` accepts `{"username":"...","password":"..."}`. New accounts are always assigned the `Customer` role.
- `POST /api/auth/login` accepts the same fields and returns a bearer access token valid for two hours.

Send the returned token in the `Authorization: Bearer <token>` header to call authorized endpoints. There is intentionally no public admin registration. To bootstrap an administrator, register the intended account and promote it through a trusted MariaDB administrator connection:

```sql
UPDATE Users SET Role = 'Admin' WHERE Username = 'your-admin-username';
```

## Job endpoints

- `GET /api/jobs/my-jobs` lists the authenticated customer's assigned jobs.
- `PATCH /api/jobs/{id}/status` updates a job status and requires an Admin token. The JSON body must use one of `Pending`, `InProgress`, `Complete`, or `Shipped`.
>>>>>>> Stashed changes
