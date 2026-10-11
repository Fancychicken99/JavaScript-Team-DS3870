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
