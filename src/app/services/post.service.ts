import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

export interface TravelPost {
  id: string;
  title: string;
  description: string;
  date: string;
  author: string;
  photoBase64?: string;
  likes?: string[];
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

export function generateSlug(text: string): string {
  const cyrillicToLatin: { [key: string]: string } = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh', 'з': 'z',
    'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r',
    'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
    'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
  };

  return text
    .toLowerCase()
    .split('')
    .map(char => cyrillicToLatin[char] !== undefined ? cyrillicToLatin[char] : char)
    .join('')
    .replace(/[^a-z0-9\s-]/g, '') // Удаляем спецсимволы
    .replace(/\s+/g, '-')         // Заменяем пробелы на дефисы
    .replace(/-+/g, '-');         // Удаляем дублирующиеся дефисы
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

  createPost(post: Omit<TravelPost, 'id'>): Observable<TravelPost> {
    const newPost = { ...post, id: uuidv4() };
    return this.http.post<TravelPost>(this.apiUrl, newPost);
  }

  updatePost(post: TravelPost): Observable<TravelPost> {
    return this.http.put<TravelPost>(`${this.apiUrl}/${post.id}`, post);
  }

  deletePost(id: string) {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // toggleLike(postId: string, username: string): Observable<TravelPost> {
  //   return this.http.post<TravelPost>(`${this.apiUrl}/${postId}/like`, { username });
  // }

  toggleLike(post: TravelPost, username: string): Observable<TravelPost> {
  if (!post.likes) post.likes = [];
  
  const index = post.likes.indexOf(username);
  if (index !== -1) {
    post.likes.splice(index, 1);
    if (post.likesCount > 0) post.likesCount--;
  } else {
    post.likes.push(username);
    post.likesCount++;
  }

  // Вместо мифического /like отправляем стандартный PUT запрос на обновление всего объекта
  return this.http.put<TravelPost>(`${this.apiUrl}/${post.id}`, post);
}

}