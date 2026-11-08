using System.ComponentModel.DataAnnotations;
using System.Xml.Linq;

namespace AngularBlog.Backend.Entities;

public class Post
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required, MaxLength(150)]
    public string Title { get; set; } = string.Empty;

    [Required]
    public string Content { get; set; } = string.Empty;

    public string? ImageUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public int ViewsCount { get; set; } = 0;
    public string? AdditionalPhotos { get; set; }

    // Связь с автором
    public Guid UserId { get; set; }
    public User? User { get; set; }

    // Связи с комментариями и оценками
    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
    public ICollection<PostRating> Ratings { get; set; } = new List<PostRating>();
}
