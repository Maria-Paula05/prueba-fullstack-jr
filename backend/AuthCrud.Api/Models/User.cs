using System.ComponentModel.DataAnnotations;

namespace AuthCrud.Api.Models;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(256)]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string PasswordHash { get; set; } = string.Empty;

    [Required]
    [MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(20)]
    public string Role { get; set; } = "user";

    public bool IsActive { get; set; } = true;

    [MaxLength(500)]
    public string? AvatarUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    public Guid? CreatedBy { get; set; }

    public Guid? UpdatedBy { get; set; }
    public int FailedLoginAttempts { get; set; } = 0;  
    public DateTime? LockoutEnd { get; set; }
    public List<RefreshToken> RefreshTokens { get; set; } = new();
}