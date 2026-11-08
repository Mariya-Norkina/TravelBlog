
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { PostCommentsComponent } from './comments.component.';
import { PostService, TravelPost, PostComment } from '../../services/post.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { TuiNotificationService } from '@taiga-ui/core';

describe('PostCommentsComponent', () => {
  let component: PostCommentsComponent;
  let fixture: ComponentFixture<PostCommentsComponent>;
  let postService: jasmine.SpyObj<PostService>;

  const mockPost: TravelPost = {
    id: 'post-1',
    title: 'Путешествие в Италию',
    description: 'Описание путешествия',
    date: '2026-11-08',
    author: 'User',
    likes: [],
    likesCount: 0,
    comments: []
  };

  const mockComment: PostComment = {
    id: 'comment-1',
    username: 'User',
    text: 'Отличное путешествие!',
    date: '2026-11-08',
    reactions: {}
  };

  beforeEach(async () => {
    postService = jasmine.createSpyObj<PostService>(
      'PostService',
      ['addComment']
    );

    await TestBed.configureTestingModule({
      imports: [PostCommentsComponent],
      providers: [
        { provide: PostService, useValue: postService },
        {
          provide: AuthService,
          useValue: {
            currentUser: { id: 'user-1', username: 'User' },
            isLoggedIn: jasmine.createSpy().and.returnValue(true)
          }
        },
        {
          provide: Router,
          useValue: jasmine.createSpyObj('Router', ['navigate'])
        },
        {
          provide: TuiNotificationService,
          useValue: {
            open: jasmine.createSpy().and.returnValue(of(null))
          }
        }
      ]
    })
      .overrideComponent(PostCommentsComponent, {
        set: { template: '' }
      })
      .compileComponents();

    fixture = TestBed.createComponent(PostCommentsComponent);
    component = fixture.componentInstance;
    component.post = { ...mockPost, comments: [] };

    fixture.detectChanges();
  });

  it('должен отправлять комментарий и добавлять ответ сервера в список', () => {
    postService.addComment.and.returnValue(of(mockComment));
    component.newCommentText = '  Отличное путешествие!  ';

    component.submitComment();

    expect(postService.addComment).toHaveBeenCalledWith(
      'post-1',
      'Отличное путешествие!'
    );
    expect(component.post.comments).toEqual([mockComment]);
    expect(component.newCommentText).toBe('');
  });
});
