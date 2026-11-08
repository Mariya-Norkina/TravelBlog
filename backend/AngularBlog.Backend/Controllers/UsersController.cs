using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AngularBlog.Backend.Entities;
using System.Security.Claims;

namespace AngularBlog.Backend.Controllers;

[ApiController]
[Route("api/users")]
public class UsersController : ControllerBase
{
    private readonly BlogDbContext _context;
    private readonly PasswordHasher<User> _passwordHasher = new();

    public UsersController(BlogDbContext context)
    {
        _context = context;
    }

    //getUsers()
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var users = await _context.Users
            .Select(u => new
            {
                id = u.Id.ToString(),
                username = u.Username
            })
            .ToListAsync();

        return Ok(users);
    }

    //addUser()
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] UserCreateDto dto)
    {
        if (await _context.Users.AnyAsync(u => u.Username == dto.Username))
            return BadRequest(new { message = "Имя пользователя уже занято" });

        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = dto.Username,
            Email = $"{dto.Username}@blog.com",
            CreatedAt = DateTime.UtcNow
        };

        user.PasswordHash = _passwordHasher.HashPassword(user, dto.Password);

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return Ok(new { id = user.Id.ToString(), username = user.Username });
    }

    //updateUserPassword()
    [Authorize]
    [HttpPatch("{id}")]
    public async Task<IActionResult> UpdatePassword(Guid id, [FromBody] UpdatePasswordDto dto)
    {
        var currentUserIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (currentUserIdStr != id.ToString())
            return Forbid();

        var user = await _context.Users.FindAsync(id);
        if (user == null) return NotFound();

        user.PasswordHash = _passwordHasher.HashPassword(user, dto.Password);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Пароль успешно обновлен" });
    }

    //deleteUser()
    [Authorize]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var currentUserIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (currentUserIdStr != id.ToString())
            return Forbid();

        var user = await _context.Users.FindAsync(id);
        if (user == null) return NotFound();

        _context.Users.Remove(user);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Пользователь успешно удален" });
    }

    // Публичный метод для сброса пароля по имени пользователя
    [HttpPatch("reset-password")]
    public async Task<IActionResult> ResetPasswordPublic([FromBody] ResetPasswordDto dto)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == dto.Username);
        if (user == null)
            return NotFound(new { message = "Пользователь с таким именем не найден" });

        user.PasswordHash = _passwordHasher.HashPassword(user, dto.Password);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Пароль успешно обновлен" });
    }


}

// Вспомогательные DTO классы
public class UserCreateDto { public string Username { get; set; } = string.Empty; public string Password { get; set; } = string.Empty; }
public class UpdatePasswordDto { public string Password { get; set; } = string.Empty; }

public class ResetPasswordDto
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}
