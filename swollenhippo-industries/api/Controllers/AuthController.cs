using System.Globalization;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SwollenHippo.Api.Data;
using SwollenHippo.Api.Dtos;
using SwollenHippo.Api.Models;

namespace SwollenHippo.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class AuthController(AppDbContext objDbContext, IConfiguration objConfiguration)
    : ControllerBase
{
    private const int intMinimumPasswordLength = 12;
    private const int intMaximumPasswordBytes = 72;

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register(
        [FromBody] UserRegisterDto objRegisterDto,
        CancellationToken objCancellationToken)
    {
        string strUsername = objRegisterDto.Username.Trim();
        if (strUsername.Length is < 3 or > 100)
        {
            return BadRequest("Username must be between 3 and 100 characters.");
        }

        if (objRegisterDto.Password.Length < intMinimumPasswordLength ||
            Encoding.UTF8.GetByteCount(objRegisterDto.Password) > intMaximumPasswordBytes)
        {
            return BadRequest("Password must be at least 12 characters and no more than 72 UTF-8 bytes.");
        }

        bool blnUsernameExists = await objDbContext.Users
            .AnyAsync(objUser => objUser.Username == strUsername, objCancellationToken);
        if (blnUsernameExists)
        {
            return BadRequest("That username is already registered.");
        }

        User objUserToRegister = new()
        {
            Username = strUsername,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(objRegisterDto.Password, workFactor: 12),
            Role = UserRole.Customer
        };
        objDbContext.Users.Add(objUserToRegister);

        try
        {
            await objDbContext.SaveChangesAsync(objCancellationToken);
        }
        catch (DbUpdateException)
        {
            bool blnUsernameNowExists = await objDbContext.Users
                .AnyAsync(objUser => objUser.Username == strUsername, objCancellationToken);
            if (blnUsernameNowExists)
            {
                return BadRequest("That username is already registered.");
            }

            throw;
        }

        return StatusCode(StatusCodes.Status201Created, new { message = "Account registered." });
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponseDto>> Login(
        [FromBody] UserLoginDto objLoginDto,
        CancellationToken objCancellationToken)
    {
        string strUsername = objLoginDto.Username.Trim();
        User? objUser = await objDbContext.Users
            .SingleOrDefaultAsync(objExistingUser => objExistingUser.Username == strUsername, objCancellationToken);

        if (objUser is null ||
            Encoding.UTF8.GetByteCount(objLoginDto.Password) > intMaximumPasswordBytes ||
            !BCrypt.Net.BCrypt.Verify(objLoginDto.Password, objUser.PasswordHash))
        {
            return Unauthorized(new { message = "Invalid credentials." });
        }

        string? strJwtKey = objConfiguration["Jwt:Key"];
        string? strJwtIssuer = objConfiguration["Jwt:Issuer"];
        string? strJwtAudience = objConfiguration["Jwt:Audience"];
        if (string.IsNullOrWhiteSpace(strJwtKey) ||
            Encoding.UTF8.GetByteCount(strJwtKey) < 64 ||
            string.IsNullOrWhiteSpace(strJwtIssuer) ||
            string.IsNullOrWhiteSpace(strJwtAudience))
        {
            throw new InvalidOperationException("JWT issuer, audience, and a signing key of at least 64 bytes must be configured for HMAC-SHA512.");
        }

        DateTime dtmExpiresAtUtc = DateTime.UtcNow.AddHours(2);
        Claim[] arrClaims =
        [
            new Claim(ClaimTypes.NameIdentifier, objUser.Id.ToString(CultureInfo.InvariantCulture)),
            new Claim(ClaimTypes.Name, objUser.Username),
            new Claim(ClaimTypes.Role, objUser.Role.ToString())
        ];

        SigningCredentials objSigningCredentials = new(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(strJwtKey)),
            SecurityAlgorithms.HmacSha512Signature);
        JwtSecurityToken objToken = new(
            issuer: strJwtIssuer,
            audience: strJwtAudience,
            claims: arrClaims,
            notBefore: DateTime.UtcNow,
            expires: dtmExpiresAtUtc,
            signingCredentials: objSigningCredentials);

        return Ok(new AuthResponseDto(
            new JwtSecurityTokenHandler().WriteToken(objToken),
            "Bearer",
            dtmExpiresAtUtc));
    }
}
