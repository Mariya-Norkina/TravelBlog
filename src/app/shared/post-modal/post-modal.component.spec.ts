
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { of } from 'rxjs';

import { PostModalComponent } from './post-modal.component';
import { PostService, TravelPost } from '../../services/post.service';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { TuiNotificationService } from '@taiga-ui/core';

describe('PostModalComponent', () => {
  let component: PostModalComponent;
  let fixture: ComponentFixture<PostModalComponent>;

  const mockPost: TravelPost = {
    id: 'post-1',
    title: 'Путешествие в Италию',
    description: 'Описание путешествия',
    date: '2026-11-08',
    author: 'Tester',
    likes: ['user-1'],
    likesCount: 1,
    additionalPhotos: ['photo-1', 'photo-2']
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PostModalComponent],
      providers: [
        {
          provide: PostService,
          useValue: {
            getPosts: jasmine.createSpy().and.returnValue(of([mockPost])),
            toggleLike: jasmine.createSpy()
          }
        },
        {
          provide: UserService,
          useValue: {
            getUsers: jasmine.createSpy().and.returnValue(of([]))
          }
        },
        {
          provide: AuthService,
          useValue: {
            currentUser: null,
            isLoggedIn: jasmine.createSpy().and.returnValue(false)
          }
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: { get: () => 'post-1' }
            }
          }
        },
        {
          provide: Router,
          useValue: jasmine.createSpyObj('Router', [
            'navigate',
            'getCurrentNavigation'
          ])
        },
        {
          provide: TuiNotificationService,
          useValue: {
            open: jasmine.createSpy().and.returnValue(of(null))
          }
        },
        {
          provide: Title,
          useValue: jasmine.createSpyObj('Title', ['setTitle'])
        },
        {
          provide: Meta,
          useValue: jasmine.createSpyObj('Meta', ['updateTag'])
        }
      ]
    })
      .overrideComponent(PostModalComponent, {
        set: { template: '' }
      })
      .compileComponents();

    fixture = TestBed.createComponent(PostModalComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('post', mockPost);

    fixture.detectChanges();
  });

  it('должен создаваться', () => {
    expect(component).toBeTruthy();
  });
});
