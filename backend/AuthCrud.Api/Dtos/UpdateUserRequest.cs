using System.ComponentModel.DataAnnotations;

namespace AuthCrud.Api.Dtos;

public class UpdateUserRequest
{
    [Required]
    [MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    public string? Role { get; set; }

    public bool? IsActive { get; set; }
}