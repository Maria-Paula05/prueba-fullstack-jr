using AuthCrud.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace AuthCrud.Api.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext context)
    {
        await context.Database.MigrateAsync();

        if (!await context.Users.AnyAsync(u => u.Email == "admin@demo.com"))
        {
            context.Users.Add(new User
            {
                Email = "admin@demo.com",
                Name = "Admin Demo",
                Role = "admin",
                IsActive = true,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!"),
                CreatedAt = DateTime.UtcNow
            });
        }

        if (!await context.Users.AnyAsync(u => u.Email == "user@demo.com"))
        {
            context.Users.Add(new User
            {
                Email = "user@demo.com",
                Name = "User Demo",
                Role = "user",
                IsActive = true,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("User123!"),
                CreatedAt = DateTime.UtcNow
            });
        }

        await context.SaveChangesAsync();
    }
}