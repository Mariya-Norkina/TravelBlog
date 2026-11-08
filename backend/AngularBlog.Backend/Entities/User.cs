using Microsoft.Extensions.Hosting;
using System.ComponentModel.DataAnnotations;
using System.Xml.Linq;

namespace AngularBlog.Backend.Entities;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required, MaxLength(50)]
    public string Username { get; set; } = string.Empty;

    [Required, EmailAddress, MaxLength(100)]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string PasswordHash { get; set; } = string.Empty;

    public string? ResetToken { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Связи
    public ICollection<Post> Posts { get; set; } = new List<Post>();
    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
    public ICollection<PostRating> Ratings { get; set; } = new List<PostRating>();
    public ICollection<CommentReaction> Reactions { get; set; } = new List<CommentReaction>();
}
