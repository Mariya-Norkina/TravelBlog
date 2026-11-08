
import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';

import { PostService, TravelPost } from './post.service';

describe('PostService', () => {
  let service: PostService;
  let httpMock: HttpTestingController;

  const apiUrl = '/api/posts';

  const mockPost: TravelPost = {
    id: 'post-1',
    title: 'Путешествие в Италию',
    description: 'Описание путешествия',
    date: '2026-11-08',
    author: 'User',
    likes: [],
    likesCount: 0
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PostService]
    });

    service = TestBed.inject(PostService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('должен создаваться', () => {
    expect(service).toBeTruthy();
  });

  it('должен получать список постов через GET', () => {
    service.getPosts().subscribe(posts => {
      expect(posts.length).toBe(1);
      expect(posts[0].title).toBe(mockPost.title);
    });

    const req = httpMock.expectOne(apiUrl);

    expect(req.request.method).toBe('GET');

    req.flush([mockPost]);
  });

  it('должен создавать пост через POST', () => {
    const newPost = {
    title: mockPost.title,
    description: mockPost.description,
    date: mockPost.date,
    author: mockPost.author,
    likes: [],
    likesCount: 0
    };

    service.createPost(newPost).subscribe(post => {
      expect(post.id).toBe(mockPost.id);
    });

    const req = httpMock.expectOne(apiUrl);

    expect(req.request.method).toBe('POST');
    expect(req.request.body.title).toBe(newPost.title);
    expect(req.request.body.description).toBe(newPost.description);

    req.flush(mockPost);
  });

  it('должен обновлять пост через PUT', () => {
    service.updatePost(mockPost).subscribe(post => {
      expect(post.title).toBe(mockPost.title);
    });

    const req = httpMock.expectOne(`${apiUrl}/${mockPost.id}`);

    expect(req.request.method).toBe('PUT');
    expect(req.request.body.title).toBe(mockPost.title);

    req.flush(mockPost);
  });

  it('должен удалять пост через DELETE', () => {
    service.deletePost(mockPost.id).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/${mockPost.id}`);

    expect(req.request.method).toBe('DELETE');

    req.flush(null);
  });

  it('должен удалять лайк пользователя при повторном нажатии', () => {
    const likedPost = {
      ...mockPost,
      likes: ['user-1']
    };

    service.toggleLike(likedPost, 'user-1').subscribe();

    const req = httpMock.expectOne(`${apiUrl}/${mockPost.id}`);

    expect(req.request.method).toBe('PUT');
    expect(req.request.body.likes).not.toContain('user-1');

    req.flush(mockPost);
  });

  it('должен добавлять комментарий через POST', () => {
    const commentText = 'Отличное путешествие!';

    service.addComment(mockPost.id, commentText).subscribe();

    const req = httpMock.expectOne(
      `${apiUrl}/${mockPost.id}/comments`
    );

    expect(req.request.method).toBe('POST');
    expect(req.request.body.text).toBe(commentText);

    req.flush({
      id: 'comment-1',
      username: 'User',
      text: commentText,
      date: '2026-11-08'
    });
  });
});
