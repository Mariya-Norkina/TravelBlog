using Microsoft.Extensions.Hosting;
using System.ComponentModel.DataAnnotations;

namespace AngularBlog.Backend.Entities;

public class PostRating
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Range(1, 5)]
    public int Value { get; set; } // Оценка от 1 до 5 звезд

    public Guid PostId { get; set; }
    public Post? Post { get; set; }

    public Guid UserId { get; set; }
    public User? User { get; set; }
}
