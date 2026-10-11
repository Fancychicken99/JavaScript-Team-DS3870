namespace SwollenHippo.Api.Models;

public sealed class Job
{
    public int Id { get; set; }
    public required string Title { get; set; }
    public JobStatus Status { get; set; } = JobStatus.Pending;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public int? AssignedUserId { get; set; }
    public User? AssignedUser { get; set; }
}

public enum JobStatus
{
    Pending,
    InProgress,
    Complete,
    Shipped
}
