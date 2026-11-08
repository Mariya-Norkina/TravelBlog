using AngularBlog.Backend.Entities;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Collections.Generic;
using System.Reflection.Emit;
using System.Security.Claims;
using System.Text;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<BlogDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddCors(options =>
{
    options.AddPolicy("AngularCorsPolicy", policy =>
    {
        policy.WithOrigins(
                "http://localhost:4200",
                "https://Mariya-Norkina.github.io")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var secretKey = builder.Configuration["JwtSettings:Secret"]
    ?? throw new InvalidOperationException(
        "JWT Secret не настроен в appsettings.json");

var key = Encoding.UTF8.GetBytes(secretKey);

builder.Services.AddAuthentication(options =>
{
options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
options.RequireHttpsMetadata = false;
options.SaveToken = true;
options.TokenValidationParameters = new TokenValidationParameters
{
    ValidateIssuerSigningKey = true,
    IssuerSigningKey = new SymmetricSecurityKey(key),
    ValidateIssuer = false,
    ValidateAudience = false,
    ValidateLifetime = true,
    ClockSkew = TimeSpan.Zero
};
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

var app = builder.Build();

app.UseCors("AngularCorsPolicy");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// 4. СКРИПТ ПЕРЕНОСА ДАННЫХ ИЗ DB.JSON
//using (var scope = app.Services.CreateScope())
//{
//    var context = scope.ServiceProvider.GetRequiredService<BlogDbContext>();

//    context.Database.EnsureCreated();

//    if (!context.Users.Any() && File.Exists("db.json"))
//    {
//        try
//        {
//            var jsonString = File.ReadAllText("db.json");
//            using var jsonDoc = JsonDocument.Parse(jsonString);

//            var userGuidMap = new Dictionary<string, Guid>(); // Карта старый ID -> новый Guid
//            var userNameMap = new Dictionary<string, Guid>(); // Карта имя -> новый Guid
//            var passwordHasher = new PasswordHasher<User>();

//            // 1. ИМПОРТ ПОЛЬЗОВАТЕЛЕЙ
//            if (jsonDoc.RootElement.TryGetProperty("users", out var usersArray))
//            {
//                foreach (var userEl in usersArray.EnumerateArray())
//                {
//                    var oldId = userEl.GetProperty("id").ToString();
//                    var username = userEl.GetProperty("username").GetString() ?? "user";
//                    var newGuid = Guid.NewGuid();

//                    userGuidMap[oldId] = newGuid;
//                    userNameMap[username.ToLower()] = newGuid;

//                    var user = new User
//                    {
//                        Id = newGuid,
//                        Username = username,
//                        Email = $"{username}@blog.com",
//                        CreatedAt = DateTime.UtcNow
//                    };

//                    var plainPassword = userEl.TryGetProperty("password", out var p) ? p.GetString() : "123456";
//                    // Хэшируем без привязки к объекту для стабильного логина
//                    user.PasswordHash = passwordHasher.HashPassword(null!, plainPassword ?? "123456");

//                    context.Users.Add(user);
//                }
//                context.SaveChanges();
//            }

//            // 2. ИМПОРТ ПОСТОВ И ИХ КОММЕНТАРИЕВ
//            if (jsonDoc.RootElement.TryGetProperty("posts", out var postsArray))
//            {
//                foreach (var postEl in postsArray.EnumerateArray())
//                {
//                    var newPostId = Guid.NewGuid();
//                    Guid targetUserId = userGuidMap.Values.FirstOrDefault();

//                    if (postEl.TryGetProperty("userId", out var uidProp) && userGuidMap.TryGetValue(uidProp.ToString(), out var g1))
//                        targetUserId = g1;
//                    else if (postEl.TryGetProperty("author", out var authProp) && userNameMap.TryGetValue(authProp.ToString().ToLower(), out var g2))
//                        targetUserId = g2;

//                    // Парсим оригинальную дату из json
//                    DateTime postDate = DateTime.UtcNow;
//                    if (postEl.TryGetProperty("date", out var dateProp) && DateTime.TryParse(dateProp.GetString(), out var parsedDate))
//                    {
//                        postDate = DateTime.SpecifyKind(parsedDate, DateTimeKind.Utc);
//                    }

//                    // Парсим просмотры
//                    int views = postEl.TryGetProperty("viewsCount", out var vProp) ? vProp.GetInt32() : 0;

//                    // Парсим дополнительную галерею
//                    var additionalPhotosList = new List<string>();
//                    if (postEl.TryGetProperty("additionalPhotos", out var photosArr))
//                    {
//                        foreach (var photoEl in photosArr.EnumerateArray())
//                        {
//                            string photoStr = photoEl.GetString() ?? "";
//                            if (!string.IsNullOrEmpty(photoStr) && !photoStr.StartsWith("http") && !photoStr.StartsWith("data:image"))
//                            {
//                                photoStr = $"data:image/jpeg;base64,{photoStr}";
//                            }
//                            additionalPhotosList.Add(photoStr);
//                        }
//                    }

//                    var post = new Post
//                    {
//                        Id = newPostId,
//                        Title = postEl.TryGetProperty("title", out var t) ? t.GetString() ?? "Без названия" : "Без названия",
//                        Content = postEl.TryGetProperty("description", out var d) ? d.GetString() ?? "" : "",
//                        ImageUrl = postEl.TryGetProperty("photoBase64", out var img) ? img.GetString() : null,
//                        UserId = targetUserId,
//                        ViewsCount = views,
//                        CreatedAt = postDate,
//                        // ТЕПЕРЬ СОХРАНЯЕМ КАК СТРОКУ ЧЕРЕЗ РАЗДЕЛИТЕЛЬ '|'
//                        AdditionalPhotos = additionalPhotosList.Any() ? string.Join("|", additionalPhotosList) : null
//                    };
//                    context.Posts.Add(post);

//                    // ПАРСИНГ И ИМПОРТ КОММЕНТАРИЕВ К ЭТОМУ ПОСТУ
//                    if (postEl.TryGetProperty("comments", out var commentsArray))
//                    {
//                        foreach (var commentEl in commentsArray.EnumerateArray())
//                        {
//                            var commentAuthorName = commentEl.TryGetProperty("username", out var cu) ? cu.GetString()?.ToLower() ?? "" : "";
//                            Guid commentUserId = userNameMap.TryGetValue(commentAuthorName, out var cuGuid) ? cuGuid : targetUserId;

//                            DateTime commentDate = DateTime.UtcNow;
//                            if (commentEl.TryGetProperty("date", out var cdProp) && DateTime.TryParse(cdProp.GetString(), out var pCommentDate))
//                            {
//                                commentDate = DateTime.SpecifyKind(pCommentDate, DateTimeKind.Utc);
//                            }

//                            var comment = new Comment
//                            {
//                                Id = Guid.NewGuid(),
//                                PostId = newPostId,
//                                UserId = commentUserId,
//                                Text = commentEl.TryGetProperty("text", out var ct) ? ct.GetString() ?? "" : "",
//                                CreatedAt = commentDate
//                            };
//                            context.Comments.Add(comment);
//                        }
//                    }
//                }
//                context.SaveChanges();
//                Console.WriteLine("=== УЛЬТИМАТИВНЫЙ ИМПОРТ ДАННЫХ ИЗ JSON УСПЕШНО ЗАВЕРШЕН ===");
//            }
//        }
//        catch (Exception ex)
//        {
//            Console.WriteLine($"Ошибка импорта: {ex.Message}");
//        }
//    }
//}


using (var scope = app.Services.CreateScope())
{
  var context = scope.ServiceProvider.GetRequiredService<BlogDbContext>();
  context.Database.EnsureCreated();
}

app.Run();

public class BlogDbContext : DbContext
{
    public BlogDbContext(DbContextOptions<BlogDbContext> options) : base(options) { }

    public DbSet<User> Users { get; set; } = null!;
    public DbSet<Post> Posts { get; set; } = null!;
    public DbSet<Comment> Comments { get; set; } = null!;
    public DbSet<PostRating> PostRatings { get; set; } = null!;
    public DbSet<CommentReaction> CommentReactions { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<PostRating>().HasIndex(r => new { r.UserId, r.PostId }).IsUnique();
        modelBuilder.Entity<CommentReaction>().HasIndex(r => new { r.UserId, r.CommentId, r.Type }).IsUnique();
    }

}
