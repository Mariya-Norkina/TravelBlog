using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AngularBlog.Backend.Entities;

namespace AngularBlog.Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PostsController : ControllerBase
{
    private readonly BlogDbContext _context;

    public PostsController(BlogDbContext context)
    {
        _context = context;
    }

    //getPosts()
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var posts = await _context.Posts
            .AsSplitQuery()
            .Include(p => p.User)
            .Include(p => p.Ratings)
            .Include(p => p.Comments!)
                .ThenInclude(c => c.User)
            .Include(p => p.Comments!)
                .ThenInclude(c => c.Reactions)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();

        var result = posts.Select(p => {
            string? photo = p.ImageUrl;
            if (!string.IsNullOrEmpty(photo) && !photo.StartsWith("http") && !photo.StartsWith("data:image"))
            {
                photo = $"data:image/jpeg;base64,{photo}";
            }

            return new
            {
                id = p.Id.ToString(),
                title = p.Title,
                description = p.Content,
                photoBase64 = photo,
                additionalPhotos = !string.IsNullOrEmpty(p.AdditionalPhotos)? p.AdditionalPhotos.Split('|') : Array.Empty<string>(),
                date = p.CreatedAt.ToString("yyyy-MM-dd"),
                author = p.User != null ? p.User.Username : "Путешественник",
                viewsCount = p.ViewsCount,
                likesCount = p.Ratings.Count,
                likes = p.Ratings.Select(r => r.UserId.ToString()).ToArray(),
                comments = p.Comments?.Select(c => new
                {
                    id = c.Id.ToString(),
                    username = c.User != null ? c.User.Username : "Аноним",
                    text = c.Text,
                    date = c.CreatedAt.ToString("yyyy-MM-dd"),

                    reactions = c.Reactions
                        .GroupBy(r => r.Type)
                        .ToDictionary(
                            g => g.Key,
                            g => g.Select(r => r.UserId.ToString()).ToArray()
                        )
                }).ToArray() ?? Array.Empty<object>()
            };
        });

        return Ok(result);
    }



    //createPost()
    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] TravelPostDto dto)
    {
        var userId = GetCurrentUserId();
        if (userId == null) return Unauthorized();

        var post = new Post
        {
            Id = Guid.NewGuid(),
            Title = dto.Title,
            Content = dto.Description,
            ImageUrl = dto.PhotoBase64,
            UserId = userId.Value,
            CreatedAt = DateTime.UtcNow
        };

        _context.Posts.Add(post);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            id = post.Id.ToString(),
            title = post.Title,
            description = post.Content,
            photoBase64 = post.ImageUrl,
            date = post.CreatedAt.ToString("yyyy-MM-dd"),
            author = User.FindFirst(ClaimTypes.Name)?.Value ?? "Автор"
        });
    }

    //updatePost() и toggleLike()
    [Authorize]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] TravelPostDto dto)
    {
        var post = await _context.Posts
            .Include(p => p.Ratings)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (post == null) return NotFound();

        var userId = GetCurrentUserId();
        if (userId == null) return Unauthorized();

        if (dto.Likes != null)
        {
            var userRating = post.Ratings.FirstOrDefault(r => r.UserId == userId);

            bool frontendHasLike = dto.Likes.Contains(userId.Value.ToString());

            if (frontendHasLike && userRating == null)
            {
                _context.PostRatings.Add(new PostRating { Id = Guid.NewGuid(), PostId = id, UserId = userId.Value, Value = 5 });
            }
            else if (!frontendHasLike && userRating != null)
            {
                _context.PostRatings.Remove(userRating);
            }
        }

        if (post.UserId == userId)
        {
            post.Title = dto.Title;
            post.Content = dto.Description;
            post.ImageUrl = dto.PhotoBase64;
        }

        await _context.SaveChangesAsync();
        return Ok(dto);
    }

    //deletePost()
    [Authorize]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var post = await _context.Posts.FindAsync(id);
        if (post == null) return NotFound();

        var userId = GetCurrentUserId();
        if (post.UserId != userId) return Forbid();

        _context.Posts.Remove(post);
        await _context.SaveChangesAsync();
        return Ok(new { message = "Пост удален" });
    }

    // POST: api/posts/{id}/comments
    [Authorize]
    [HttpPost("{id}/comments")]
    public async Task<IActionResult> AddComment(Guid id, [FromBody] CommentCreateDto dto)
    {
        var post = await _context.Posts.FindAsync(id);
        if (post == null) return NotFound("Пост не найден");

        var userId = GetCurrentUserId();
        if (userId == null) return Unauthorized();

        var comment = new Comment
        {
            Id = Guid.NewGuid(),
            PostId = id,
            UserId = userId.Value,
            Text = dto.Text,
            CreatedAt = DateTime.UtcNow
        };

        _context.Comments.Add(comment);
        await _context.SaveChangesAsync();

        var user = await _context.Users.FindAsync(userId.Value);

        return Ok(new
        {
            id = comment.Id.ToString(),
            username = user?.Username ?? "Автор",
            text = comment.Text,
            date = comment.CreatedAt.ToString("yyyy-MM-dd"),
            reactions = new Dictionary<string, string[]>()
        });
    }

    public class CommentCreateDto
    {
        public string Text { get; set; } = string.Empty;
    }


    private Guid? GetCurrentUserId()
    {
        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        return Guid.TryParse(userIdStr, out var guid) ? guid : null;
    }

    [Authorize]
    [HttpPost("{postId}/comments/{commentId}/react")] //хмммм
    public async Task<IActionResult> ToggleCommentReaction(
    Guid postId,
    Guid commentId,
    [FromBody] CommentReactionDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Emoji))
            return BadRequest("Не указана реакция");

        if (dto.Emoji.Length > 20)
            return BadRequest("Слишком длинная реакция");

        var userId = GetCurrentUserId();

        if (userId == null)
            return Unauthorized();

        var comment = await _context.Comments
            .Include(c => c.Reactions)
            .Include(c => c.User)
            .FirstOrDefaultAsync(c =>
                c.Id == commentId && c.PostId == postId);

        if (comment == null)
            return NotFound("Комментарий не найден");

        var existingReaction = comment.Reactions.FirstOrDefault(r =>
            r.UserId == userId.Value &&
            r.Type == dto.Emoji);

        if (existingReaction != null)
        {
            _context.CommentReactions.Remove(existingReaction);
        }
        else
        {
            var reaction = new CommentReaction
            {
                Id = Guid.NewGuid(),
                CommentId = commentId,
                UserId = userId.Value,
                Type = dto.Emoji
            };

            _context.CommentReactions.Add(reaction);
        }

        await _context.SaveChangesAsync();

        var reactions = await _context.CommentReactions
            .Where(r => r.CommentId == commentId)
            .GroupBy(r => r.Type)
            .ToDictionaryAsync(
                g => g.Key,
                g => g.Select(r => r.UserId.ToString()).ToArray()
            );

        return Ok(new
        {
            id = comment.Id.ToString(),
            username = comment.User?.Username ?? "Аноним",
            text = comment.Text,
            date = comment.CreatedAt.ToString("yyyy-MM-dd"),
            reactions
        });
    }

    public class CommentReactionDto
    {
        public string Emoji { get; set; } = string.Empty;
    }

    [Authorize]
    [HttpPut("{postId}/comments/{commentId}")]
    public async Task<IActionResult> UpdateComment(
    Guid postId,
    Guid commentId,
    [FromBody] CommentCreateDto dto)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized();

        var comment = await _context.Comments
            .Include(c => c.User)
            .Include(c => c.Reactions)
            .FirstOrDefaultAsync(c =>
                c.Id == commentId && c.PostId == postId);

        if (comment == null)
            return NotFound("Комментарий не найден");

        if (comment.UserId != userId.Value)
            return Forbid();

        var text = dto.Text?.Trim();

        if (string.IsNullOrWhiteSpace(text))
            return BadRequest("Комментарий не может быть пустым");

        if (text.Length > 1000)
            return BadRequest("Максимальная длина комментария — 1000 символов");

        comment.Text = text;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            id = comment.Id.ToString(),
            username = comment.User?.Username ?? "Аноним",
            text = comment.Text,
            date = comment.CreatedAt.ToString("yyyy-MM-dd"),
            reactions = comment.Reactions
                .GroupBy(r => r.Type)
                .ToDictionary(
                    g => g.Key,
                    g => g.Select(r => r.UserId.ToString()).ToArray()
                )
        });
    }

    [Authorize]
    [HttpDelete("{postId}/comments/{commentId}")]
    public async Task<IActionResult> DeleteComment(
    Guid postId,
    Guid commentId)
    {
        var userId = GetCurrentUserId();

        if (userId == null)
            return Unauthorized();

        var comment = await _context.Comments
            .FirstOrDefaultAsync(c =>
                c.Id == commentId && c.PostId == postId);

        if (comment == null)
            return NotFound("Комментарий не найден");

        if (comment.UserId != userId.Value)
            return Forbid();

        _context.Comments.Remove(comment);

        await _context.SaveChangesAsync();

        return Ok(new { message = "Комментарий удалён" });
    }
}

public class TravelPostDto
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? PhotoBase64 { get; set; }
    public string[]? Likes { get; set; }
}
