using System.ComponentModel.DataAnnotations;

namespace AngularBlog.Backend.Entities;

public class Comment
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required, MaxLength(1000)]
    public string Text { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Guid PostId { get; set; }
    public Post? Post { get; set; }

    public Guid UserId { get; set; }
    public User? User { get; set; }

    public ICollection<CommentReaction> Reactions { get; set; } = new List<CommentReaction>();
}
