using Microsoft.EntityFrameworkCore;
using SwollenHippo.Api.Models;

namespace SwollenHippo.Api.Data;

public sealed class SwollenHippoDbContext(DbContextOptions<SwollenHippoDbContext> objOptions)
    : DbContext(objOptions)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Job> Jobs => Set<Job>();

    protected override void OnModelCreating(ModelBuilder objModelBuilder)
    {
        base.OnModelCreating(objModelBuilder);

        objModelBuilder.Entity<User>(objEntity =>
        {
            objEntity.HasKey(objUser => objUser.Id);
            objEntity.HasIndex(objUser => objUser.Username).IsUnique();
            objEntity.Property(objUser => objUser.Username).HasMaxLength(100).IsRequired();
            objEntity.Property(objUser => objUser.PasswordHash).HasMaxLength(255).IsRequired();
            objEntity.Property(objUser => objUser.Role).HasConversion<string>().HasMaxLength(30).IsRequired();
        });

        objModelBuilder.Entity<Job>(objEntity =>
        {
            objEntity.HasKey(objJob => objJob.Id);
            objEntity.Property(objJob => objJob.Title).HasMaxLength(200).IsRequired();
            objEntity.Property(objJob => objJob.Status).HasConversion<string>().HasMaxLength(30).IsRequired();
            objEntity.Property(objJob => objJob.CreatedAt).HasColumnType("datetime(6)").IsRequired();
            objEntity.HasOne(objJob => objJob.AssignedUser)
                .WithMany(objUser => objUser.AssignedJobs)
                .HasForeignKey(objJob => objJob.AssignedUserId)
                .OnDelete(DeleteBehavior.SetNull);
        });
    }
}
