using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SwollenHippo.Api.Data;

WebApplicationBuilder objBuilder = WebApplication.CreateBuilder(args);
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
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(strJwtSigningKey)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(1)
        };
    });
objBuilder.Services.AddAuthorization();

WebApplication objApp = objBuilder.Build();
objApp.UseHttpsRedirection();
objApp.UseAuthentication();
objApp.UseAuthorization();
objApp.MapControllers();
objApp.Run();
