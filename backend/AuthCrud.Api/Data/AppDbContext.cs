using AuthCrud.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace AuthCrud.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();

    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(u => u.Email).IsUnique();

            entity.Property(u => u.Email)
                .HasMaxLength(256)
                .IsRequired();

            entity.Property(u => u.Name)
                .HasMaxLength(150)
                .IsRequired();

            entity.Property(u => u.Role)
                .HasMaxLength(20)
                .IsRequired();

            entity.Property(u => u.IsActive)
                .HasDefaultValue(true);

            entity.Property(u => u.CreatedAt)
                .HasDefaultValueSql("SYSUTCDATETIME()");

            entity.HasMany(u => u.RefreshTokens)
                .WithOne(rt => rt.User)
                .HasForeignKey(rt => rt.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.HasIndex(rt => rt.TokenHash).IsUnique();

            entity.Property(rt => rt.TokenHash)
                .IsRequired();

            entity.Property(rt => rt.CreatedAt)
                .HasDefaultValueSql("SYSUTCDATETIME()");

            entity.Property(rt => rt.ExpiresAt)
                .IsRequired();
        });
    }
}