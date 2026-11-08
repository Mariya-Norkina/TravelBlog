using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using AngularBlog.Backend.Entities;
using System.Text.Json.Serialization;

namespace AngularBlog.Backend.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly BlogDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly PasswordHasher<User> _passwordHasher = new();

    public AuthController(BlogDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    //регистрация
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterModel model)
    {
        if (await _context.Users.AnyAsync(u => u.Username == model.username))
            return BadRequest(new { message = "Имя пользователя уже занято" });

        string userEmail = !string.IsNullOrEmpty(model.Email) ? model.Email : $"{model.username}@blog.com";

        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = model.username,
            Email = userEmail,
            CreatedAt = DateTime.UtcNow
        };

        user.PasswordHash = _passwordHasher.HashPassword(user, model.password);
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Регистрация успешна" });
    }


    //вход, выдача jwt
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginModel model)
    {
        string identifier = (
            !string.IsNullOrWhiteSpace(model.Email)
                ? model.Email
                : model.Username ?? ""
        ).Trim();

        if (string.IsNullOrWhiteSpace(identifier) ||
            string.IsNullOrWhiteSpace(model.Password))
        {
            return BadRequest(new { message = "Введите логин и пароль" });
        }

        var user = await _context.Users.FirstOrDefaultAsync(u => //ооо
            u.Username == identifier || u.Email == identifier);

        Console.WriteLine($"LOGIN IDENTIFIER: [{identifier}]");
        Console.WriteLine($"USER FOUND: {user != null}");

        if (user == null)
            return BadRequest(new { message = "Неверный логин или пароль" });

        Console.WriteLine($"USER ID: {user.Id}");
        Console.WriteLine($"PASSWORD HASH EXISTS: {!string.IsNullOrEmpty(user.PasswordHash)}");

        var result = _passwordHasher.VerifyHashedPassword( //тут тоже
            user,
            user.PasswordHash,
            model.Password
        );

        Console.WriteLine($"PASSWORD CHECK: {result}");

        if (result == PasswordVerificationResult.Failed)
            return BadRequest(new { message = "Неверный логин или пароль" });

        var tokenHandler = new JwtSecurityTokenHandler();
        var jwtSettings = _configuration.GetSection("JwtSettings");
        var secret = _configuration["JwtSettings:Secret"]
            ?? throw new InvalidOperationException(
                "JWT Secret не настроен");

        var key = Encoding.UTF8.GetBytes(secret);

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
        new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
        new Claim(ClaimTypes.Name, user.Username)
    }),
            Expires = DateTime.UtcNow.AddDays(7),
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        return Ok(new
        {
            token = tokenHandler.WriteToken(token),
            user = new { id = user.Id.ToString(), username = user.Username }
        });
    }


    // Сброс и смена пароля в лк
    [Authorize]
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordModel model)
    {
        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        if (!Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

        var user = await _context.Users.FindAsync(userId);
        if (user == null) return NotFound(new { message = "Пользователь не найден" });

        // ИСПРАВЛЕНО: Передаем null! вместо user для совместимости со всеми хэшами
        var verifyOld = _passwordHasher.VerifyHashedPassword(null!, user.PasswordHash, model.OldPassword);
        if (verifyOld == PasswordVerificationResult.Failed)
            return BadRequest(new { message = "Неверный текущий пароль" });

        // При сохранении нового пароля тоже используем null! для стабильности следующих смен
        user.PasswordHash = _passwordHasher.HashPassword(null!, model.NewPassword);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Пароль успешно изменен" });
    }

    // Удаление аккаунта
    [Authorize]
    [HttpDelete("delete-account")]
    public async Task<IActionResult> DeleteAccount()
    {
        // ИСПРАВЛЕНО: аналогично добавляем проверку короткого клейма "sub"
        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;

        if (!Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

        var user = await _context.Users.FindAsync(userId);
        if (user == null) return NotFound(new { message = "Пользователь не найден" });

        _context.Users.Remove(user);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Аккаунт успешно удален" });
    }
}

public class RegisterModel
{
    public string username { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string password { get; set; } = string.Empty; //хммммм
}

public class LoginModel
{
    [JsonPropertyName("email")]
    public string? Email { get; set; }

    [JsonPropertyName("username")]
    public string? Username { get; set; }

    [JsonPropertyName("password")]
    public string Password { get; set; } = string.Empty;
}



public class ChangePasswordModel
{
    public string OldPassword { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}
