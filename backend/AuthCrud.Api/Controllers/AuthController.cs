using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using AuthCrud.Api.Data;
using AuthCrud.Api.Dtos;
using AuthCrud.Api.Helpers;
using AuthCrud.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace AuthCrud.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthController(AppDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest request)
    {
        if (request is null)
        {
            return BadRequest(new { message = "La solicitud no puede estar vacía." });
        }

        var email = request.Email.Trim().ToLower();
        var name = request.Name.Trim();

        if (string.IsNullOrWhiteSpace(email) ||
            string.IsNullOrWhiteSpace(name) ||
            string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { message = "Email, nombre y contraseña son obligatorios." });
        }

        if (!PasswordPolicy.IsValid(request.Password, out var passwordError))
        {
            return BadRequest(new { message = passwordError });
        }

        var emailExists = await _context.Users.AnyAsync(u => u.Email == email);

        if (emailExists)
        {
            return Conflict(new { message = "El email ya está registrado." });
        }

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = email,
            Name = name,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = "user",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            FailedLoginAttempts = 0,
            LockoutEnd = null
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return Created($"/api/Users/{user.Id}", new
        {
            message = "Usuario registrado correctamente.",
            user = ToUserResponse(user)
        });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        if (request is null)
        {
            return BadRequest(new { message = "La solicitud no puede estar vacía." });
        }

        var email = request.Email.Trim().ToLower();

        if (string.IsNullOrWhiteSpace(email) ||
            string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { message = "Email y contraseña son obligatorios." });
        }

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);

        if (user is null)
        {
            return Unauthorized(new { message = "Email o contraseña incorrectos." });
        }

        if (!user.IsActive)
        {
            return Unauthorized(new { message = "El usuario está inactivo." });
        }

        if (user.LockoutEnd.HasValue && user.LockoutEnd.Value > DateTime.UtcNow)
        {
            var minutes = Math.Ceiling((user.LockoutEnd.Value - DateTime.UtcNow).TotalMinutes);

            return Unauthorized(new
            {
                message = $"Usuario bloqueado temporalmente. Intenta nuevamente en {minutes} minuto(s)."
            });
        }

        var passwordIsValid = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);

        if (!passwordIsValid)
        {
            user.FailedLoginAttempts += 1;

            if (user.FailedLoginAttempts >= 5)
            {
                user.FailedLoginAttempts = 0;
                user.LockoutEnd = DateTime.UtcNow.AddMinutes(15);

                await _context.SaveChangesAsync();

                return Unauthorized(new
                {
                    message = "Usuario bloqueado por 15 minutos tras varios intentos fallidos."
                });
            }

            await _context.SaveChangesAsync();

            return Unauthorized(new
            {
                message = $"Email o contraseña incorrectos. Intentos restantes: {5 - user.FailedLoginAttempts}."
            });
        }

        user.FailedLoginAttempts = 0;
        user.LockoutEnd = null;

        var accessToken = GenerateJwtToken(user);
        var refreshToken = CreateRefreshToken(user);

        await _context.SaveChangesAsync();

        return Ok(new
        {
            accessToken,
            refreshToken,
            user = ToUserResponse(user)
        });
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh(RefreshTokenRequest request)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.RefreshToken))
        {
            return BadRequest(new { message = "El refresh token es obligatorio." });
        }

        var refreshTokenHash = HashToken(request.RefreshToken);

        var storedToken = await _context.RefreshTokens
            .Include(rt => rt.User)
            .FirstOrDefaultAsync(rt => rt.TokenHash == refreshTokenHash);

        if (storedToken is null || storedToken.User is null)
        {
            return Unauthorized(new { message = "Refresh token inválido." });
        }

        if (!storedToken.IsActive)
        {
            return Unauthorized(new { message = "Refresh token expirado o revocado." });
        }

        if (!storedToken.User.IsActive)
        {
            return Unauthorized(new { message = "El usuario está inactivo." });
        }

        var accessToken = GenerateJwtToken(storedToken.User);
        var newRefreshToken = GenerateRefreshTokenValue();
        var newRefreshTokenHash = HashToken(newRefreshToken);

        storedToken.RevokedAt = DateTime.UtcNow;
        storedToken.ReplacedByTokenHash = newRefreshTokenHash;

        var replacementToken = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = storedToken.UserId,
            TokenHash = newRefreshTokenHash,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        };

        _context.RefreshTokens.Add(replacementToken);

        await _context.SaveChangesAsync();

        return Ok(new
        {
            accessToken,
            refreshToken = newRefreshToken,
            user = ToUserResponse(storedToken.User)
        });
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout(RefreshTokenRequest request)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.RefreshToken))
        {
            return BadRequest(new { message = "El refresh token es obligatorio." });
        }

        var refreshTokenHash = HashToken(request.RefreshToken);

        var storedToken = await _context.RefreshTokens
            .FirstOrDefaultAsync(rt => rt.TokenHash == refreshTokenHash);

        if (storedToken is not null && storedToken.IsActive)
        {
            storedToken.RevokedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        return Ok(new { message = "Sesión cerrada correctamente." });
    }

    private string GenerateJwtToken(User user)
    {
        var jwtKey = _configuration["Jwt:Key"];

        if (string.IsNullOrWhiteSpace(jwtKey))
        {
            throw new InvalidOperationException("La clave JWT no está configurada.");
        }

        var issuer = _configuration["Jwt:Issuer"];
        var audience = _configuration["Jwt:Audience"];

        var expiresConfig = _configuration["Jwt:ExpiresInMinutes"];
        var expiresInMinutes = double.TryParse(expiresConfig, out var minutes)
            ? minutes
            : 60;

        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role),
            new Claim("name", user.Name)
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));

        var credentials = new SigningCredentials(
            key,
            SecurityAlgorithms.HmacSha256
        );

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expiresInMinutes),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private string CreateRefreshToken(User user)
    {
        var refreshToken = GenerateRefreshTokenValue();
        var refreshTokenHash = HashToken(refreshToken);

        var storedToken = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = refreshTokenHash,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        };

        _context.RefreshTokens.Add(storedToken);

        return refreshToken;
    }

    private static string GenerateRefreshTokenValue()
    {
        var randomBytes = RandomNumberGenerator.GetBytes(64);
        return Convert.ToBase64String(randomBytes);
    }

    private static string HashToken(string token)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToHexString(bytes);
    }

 private static UserResponse ToUserResponse(User user)
{
    return new UserResponse
    {
        Id = user.Id,
        Email = user.Email,
        Name = user.Name,
        Role = user.Role,
        IsActive = user.IsActive,
        AvatarUrl = user.AvatarUrl,
        CreatedAt = user.CreatedAt,
        UpdatedAt = user.UpdatedAt,
        CreatedBy = user.CreatedBy,
        UpdatedBy = user.UpdatedBy
    };
}
}