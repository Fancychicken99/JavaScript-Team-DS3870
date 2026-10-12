using System.ComponentModel.DataAnnotations;

namespace SwollenHippo.Api.Dtos;

public sealed class UserLoginDto
{
    [Required]
    [StringLength(100, MinimumLength = 3)]
    public required string Username { get; init; }

    [Required]
    public required string Password { get; init; }
}
