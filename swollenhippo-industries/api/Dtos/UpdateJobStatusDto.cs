using System.ComponentModel.DataAnnotations;
using SwollenHippo.Api.Models;

namespace SwollenHippo.Api.Dtos;

public sealed class UpdateJobStatusDto
{
    [EnumDataType(typeof(JobStatus))]
    public required JobStatus Status { get; init; }
}
