using SwollenHippo.Api.Models;

namespace SwollenHippo.Api.Controllers;

public sealed class UpdateJobStatusDto
{
    public required JobStatus Status { get; init; }
}
