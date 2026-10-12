namespace SwollenHippo.Api.Dtos;

public sealed record AuthResponseDto(
    string AccessToken,
    string TokenType,
    DateTime ExpiresAtUtc);
