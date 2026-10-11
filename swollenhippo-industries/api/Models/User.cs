namespace SwollenHippo.Api.Models;

public sealed class User
{
    public int Id { get; set; }
    public required string Username { get; set; }
    public required string PasswordHash { get; set; }
    public UserRole Role { get; set; } = UserRole.Customer;
    public ICollection<Job> AssignedJobs { get; set; } = new List<Job>();
}

public enum UserRole
{
    Customer,
    Employee,
    Admin
}
