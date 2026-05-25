using System.Security.Claims;
using AuthCrud.Api.Data;
using AuthCrud.Api.Dtos;
using AuthCrud.Api.Helpers;
using AuthCrud.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AuthCrud.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _context;

    public UsersController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> GetUsers(
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int size = 10,
        [FromQuery] string sortBy = "createdAt",
        [FromQuery] string sortDir = "desc")
    {
        page = Math.Max(page, 1);
        size = Math.Clamp(size, 1, 50);

        sortBy = sortBy.Trim().ToLower();
        sortDir = sortDir.Trim().ToLower();

        var query = _context.Users.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();

            query = query.Where(u =>
                u.Email.ToLower().Contains(term) ||
                u.Name.ToLower().Contains(term));
        }

        query = (sortBy, sortDir) switch
        {
            ("email", "asc") => query.OrderBy(u => u.Email),
            ("email", "desc") => query.OrderByDescending(u => u.Email),

            ("name", "asc") => query.OrderBy(u => u.Name),
            ("name", "desc") => query.OrderByDescending(u => u.Name),

            ("role", "asc") => query.OrderBy(u => u.Role),
            ("role", "desc") => query.OrderByDescending(u => u.Role),

            ("isactive", "asc") => query.OrderBy(u => u.IsActive),
            ("isactive", "desc") => query.OrderByDescending(u => u.IsActive),

            ("createdat", "asc") => query.OrderBy(u => u.CreatedAt),
            ("createdat", "desc") => query.OrderByDescending(u => u.CreatedAt),

            _ => query.OrderByDescending(u => u.CreatedAt)
        };

        var total = await query.CountAsync();

        var users = await query
            .Skip((page - 1) * size)
            .Take(size)
            .Select(u => ToUserResponse(u))
            .ToListAsync();

        return Ok(new
        {
            data = users,
            total,
            page,
            size,
            totalPages = (int)Math.Ceiling(total / (double)size),
            sortBy,
            sortDir
        });
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetUser(Guid id)
    {
        var currentUserId = GetCurrentUserId();

        if (currentUserId is null)
        {
            return Unauthorized(new { message = "Token inválido o sin identificador de usuario." });
        }

        if (!IsAdmin() && currentUserId.Value != id)
        {
            return Forbid();
        }

        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user is null)
        {
            return NotFound(new { message = "Usuario no encontrado." });
        }

        return Ok(ToUserResponse(user));
    }

    [HttpPost]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> CreateUser(CreateUserRequest request)
    {
        var email = request.Email.Trim().ToLower();
        var role = request.Role.Trim().ToLower();

        if (!PasswordPolicy.IsValid(request.Password, out var passwordError))
        {
            return BadRequest(new { message = passwordError });
        }

        if (role != "admin" && role != "user")
        {
            return BadRequest(new { message = "Rol inválido. Use 'admin' o 'user'." });
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
            Name = request.Name.Trim(),
            Role = role,
            IsActive = true,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            CreatedAt = DateTime.UtcNow,
            CreatedBy = GetCurrentUserId()
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetUser),
            new { id = user.Id },
            ToUserResponse(user));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateUser(Guid id, UpdateUserRequest request)
    {
        var currentUserId = GetCurrentUserId();

        if (currentUserId is null)
        {
            return Unauthorized(new { message = "Token inválido o sin identificador de usuario." });
        }

        var isAdmin = IsAdmin();

        if (!isAdmin && currentUserId.Value != id)
        {
            return Forbid();
        }

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id);

        if (user is null)
        {
            return NotFound(new { message = "Usuario no encontrado." });
        }

        if (!string.IsNullOrWhiteSpace(request.Name))
        {
            user.Name = request.Name.Trim();
        }

        if (isAdmin)
        {
            if (!string.IsNullOrWhiteSpace(request.Role))
            {
                var role = request.Role.Trim().ToLower();

                if (role != "admin" && role != "user")
                {
                    return BadRequest(new { message = "Rol inválido. Use 'admin' o 'user'." });
                }

                user.Role = role;
            }

            if (request.IsActive.HasValue)
            {
                user.IsActive = request.IsActive.Value;
            }
        }

        user.UpdatedAt = DateTime.UtcNow;
        user.UpdatedBy = currentUserId;

        await _context.SaveChangesAsync();

        return Ok(ToUserResponse(user));
    }

    [HttpPost("{id:guid}/avatar")]
    [RequestSizeLimit(2_000_000)]
    public async Task<IActionResult> UploadAvatar(Guid id, IFormFile file)
    {
        var currentUserId = GetCurrentUserId();

        if (currentUserId is null)
        {
            return Unauthorized(new { message = "Token inválido o sin identificador de usuario." });
        }

        var isAdmin = IsAdmin();

        if (!isAdmin && currentUserId.Value != id)
        {
            return Forbid();
        }

        if (file is null || file.Length == 0)
        {
            return BadRequest(new { message = "Debes seleccionar una imagen." });
        }

        const long maxSizeInBytes = 2 * 1024 * 1024;

        if (file.Length > maxSizeInBytes)
        {
            return BadRequest(new { message = "La imagen no puede superar 2 MB." });
        }

        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
        var allowedContentTypes = new[] { "image/jpeg", "image/png", "image/webp" };

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        var contentType = file.ContentType.ToLowerInvariant();

        if (!allowedExtensions.Contains(extension) || !allowedContentTypes.Contains(contentType))
        {
            return BadRequest(new
            {
                message = "Formato inválido. Solo se permiten imágenes JPG, PNG o WEBP."
            });
        }

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id);

        if (user is null)
        {
            return NotFound(new { message = "Usuario no encontrado." });
        }

        var avatarsFolder = Path.Combine(
            Directory.GetCurrentDirectory(),
            "wwwroot",
            "uploads",
            "avatars"
        );

        Directory.CreateDirectory(avatarsFolder);

        foreach (var existingFile in Directory.GetFiles(avatarsFolder, $"{id}.*"))
        {
            System.IO.File.Delete(existingFile);
        }

        var fileName = $"{id}{extension}";
        var filePath = Path.Combine(avatarsFolder, fileName);

        await using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        user.AvatarUrl = $"/uploads/avatars/{fileName}";
        user.UpdatedAt = DateTime.UtcNow;
        user.UpdatedBy = currentUserId;

        await _context.SaveChangesAsync();

        return Ok(ToUserResponse(user));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> DeleteUser(Guid id)
    {
        var currentUserId = GetCurrentUserId();

        if (currentUserId == id)
        {
            return BadRequest(new { message = "No puedes eliminar tu propio usuario administrador." });
        }

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id);

        if (user is null)
        {
            return NotFound(new { message = "Usuario no encontrado." });
        }

        _context.Users.Remove(user);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private Guid? GetCurrentUserId()
    {
        var id = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (Guid.TryParse(id, out var userId))
        {
            return userId;
        }

        return null;
    }

    private bool IsAdmin()
    {
        return User.IsInRole("admin");
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