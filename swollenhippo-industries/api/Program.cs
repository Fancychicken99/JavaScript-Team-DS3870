using System.Text;
<<<<<<< Updated upstream
=======
using System.Text.Json.Serialization;
>>>>>>> Stashed changes
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SwollenHippo.Api.Data;

WebApplicationBuilder objBuilder = WebApplication.CreateBuilder(args);
<<<<<<< Updated upstream
string? strConnectionString = objBuilder.Configuration.GetConnectionString("SwollenHippo");
string? strJwtIssuer = objBuilder.Configuration["Jwt:Issuer"];
string? strJwtAudience = objBuilder.Configuration["Jwt:Audience"];
string? strJwtSigningKey = objBuilder.Configuration["Jwt:SigningKey"];

if (string.IsNullOrWhiteSpace(strConnectionString))
{
    throw new InvalidOperationException("ConnectionStrings:SwollenHippo must be configured.");
}

if (string.IsNullOrWhiteSpace(strJwtIssuer) ||
    string.IsNullOrWhiteSpace(strJwtAudience) ||
    string.IsNullOrWhiteSpace(strJwtSigningKey) ||
    Encoding.UTF8.GetByteCount(strJwtSigningKey) < 32)
{
    throw new InvalidOperationException("Configure Jwt:Issuer, Jwt:Audience, and a Jwt:SigningKey of at least 32 bytes.");
}

objBuilder.Services.AddControllers();
objBuilder.Services.AddDbContext<SwollenHippoDbContext>(objOptions =>
=======

string? strConnectionString = objBuilder.Configuration.GetConnectionString("MariaDb");
string? strJwtKey = objBuilder.Configuration["Jwt:Key"];
string? strJwtIssuer = objBuilder.Configuration["Jwt:Issuer"];
string? strJwtAudience = objBuilder.Configuration["Jwt:Audience"];

if (string.IsNullOrWhiteSpace(strConnectionString))
{
    throw new InvalidOperationException("ConnectionStrings:MariaDb must be configured.");
}

if (string.IsNullOrWhiteSpace(strJwtKey) ||
    Encoding.UTF8.GetByteCount(strJwtKey) < 64 ||
    string.IsNullOrWhiteSpace(strJwtIssuer) ||
    string.IsNullOrWhiteSpace(strJwtAudience))
{
    throw new InvalidOperationException(
        "Configure Jwt:Issuer, Jwt:Audience, and a Jwt:Key of at least 64 bytes for HMAC-SHA512.");
}

objBuilder.Services.AddControllers()
    .AddJsonOptions(objOptions =>
        objOptions.JsonSerializerOptions.Converters.Add(
            new JsonStringEnumConverter(namingPolicy: null, allowIntegerValues: false)));
objBuilder.Services.AddDbContext<AppDbContext>(objOptions =>
>>>>>>> Stashed changes
    objOptions.UseMySql(
        strConnectionString,
        ServerVersion.AutoDetect(strConnectionString)));

objBuilder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(objOptions =>
    {
        objOptions.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = strJwtIssuer,
            ValidateAudience = true,
            ValidAudience = strJwtAudience,
            ValidateIssuerSigningKey = true,
<<<<<<< Updated upstream
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(strJwtSigningKey)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(1)
=======
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(strJwtKey)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(1),
            NameClaimType = System.Security.Claims.ClaimTypes.Name,
            RoleClaimType = System.Security.Claims.ClaimTypes.Role
>>>>>>> Stashed changes
        };
    });
objBuilder.Services.AddAuthorization();

WebApplication objApp = objBuilder.Build();
objApp.UseHttpsRedirection();
objApp.UseAuthentication();
objApp.UseAuthorization();
objApp.MapControllers();
objApp.Run();
