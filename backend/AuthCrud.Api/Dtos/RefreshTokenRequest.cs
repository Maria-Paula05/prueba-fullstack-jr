using System.ComponentModel.DataAnnotations;

namespace AuthCrud.Api.Dtos;

public class RefreshTokenRequest
{
    [Required(ErrorMessage = "El refresh token es obligatorio.")]
    public string RefreshToken { get; set; } = string.Empty;
}