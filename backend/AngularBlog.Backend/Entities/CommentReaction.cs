using System.ComponentModel.DataAnnotations;
using System.Xml.Linq;

namespace AngularBlog.Backend.Entities;

public class CommentReaction
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required, MaxLength(20)]
    public string Type { get; set; } // "like", "fire", "laugh" и т.д.

    public Guid CommentId { get; set; }
    public Comment? Comment { get; set; }

    public Guid UserId { get; set; }
    public User? User { get; set; }
}
