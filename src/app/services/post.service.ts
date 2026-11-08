import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface TravelPost {
  id: string;
  title: string;
  description: string;
  date: string;
  author: string;
  photoBase64?: string;
  likes?: string[]; // Массив ID пользователей, лайкнувших пост
  additionalPhotos?: string[]; 
  comments?: PostComment[];
  likesCount: number;
  likedByUsers?: string[];
  viewsCount?: number;
  slug?: string;
}

export interface PostComment {
  id: string;
  username: string;
  text: string;
  date: string;
  isEdited?: boolean;
  reactions?: { [emoji: string]: string[] };
}

@Injectable({
  providedIn: 'root'
})
export class PostService {
  private apiUrl = '/api/posts';

  constructor(private http: HttpClient) {}

  getPosts(): Observable<TravelPost[]> {
    return this.http.get<TravelPost[]>(this.apiUrl);
  }

  // Бэкенд сам создаст Guid. Передаем объект согласно TravelPostDto
  createPost(post: Omit<TravelPost, 'id'>): Observable<TravelPost> {
    const dto = {
      title: post.title,
      description: post.description,
      photoBase64: post.photoBase64,
      likes: post.likes || []
    };
    return this.http.post<TravelPost>(this.apiUrl, dto);
  }

  // Бэкенд ожидает PUT-запрос на /api/posts/{id} и TravelPostDto в теле
  updatePost(post: TravelPost): Observable<TravelPost> {
    const dto = {
      title: post.title,
      description: post.description,
      photoBase64: post.photoBase64,
      likes: post.likes || []
    };
    return this.http.put<TravelPost>(`${this.apiUrl}/${post.id}`, dto);
  }

  deletePost(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // Метод toggleLike шлет PUT запрос на тот же эндпоинт, обновляя массив likes
  toggleLike(post: TravelPost, currentUserId: string): Observable<any> {
    const likes = [...(post.likes || [])];

    const index = likes.indexOf(currentUserId);

    if (index !== -1) {
      likes.splice(index, 1);
    } else {
      likes.push(currentUserId);
    }

    const dto = {
      title: post.title,
      description: post.description,
      photoBase64: post.photoBase64,
      likes
    };

    return this.http.put(
      `${this.apiUrl}/${post.id}`,
      dto
    );
  }

    addComment(postId: string, text: string): Observable<PostComment> {
      return this.http.post<PostComment>(
        `${this.apiUrl}/${postId}/comments`,
        { text }
      );
    }

    toggleCommentReaction(
      postId: string,
      commentId: string,
      emoji: string
    ): Observable<PostComment> {
      return this.http.post<PostComment>(
        `${this.apiUrl}/${postId}/comments/${commentId}/react`,
        { emoji }
      );
    } 

      updateComment(
        postId: string,
        commentId: string,
        text: string
      ): Observable<PostComment> {
        return this.http.put<PostComment>(
          `${this.apiUrl}/${postId}/comments/${commentId}`,
          { text }
        );
      }

      deleteComment(
        postId: string,
        commentId: string
      ): Observable<any> {
        return this.http.delete(
          `${this.apiUrl}/${postId}/comments/${commentId}`
        );
      }

}
