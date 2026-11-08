
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { CreatePostComponent } from './create-post.component';
import { PostService } from '../../services/post.service';
import { AuthService } from '../../services/auth.service';

describe('CreatePostComponent', () => {
  let component: CreatePostComponent;
  let fixture: ComponentFixture<CreatePostComponent>;
  let postService: jasmine.SpyObj<PostService>;

  beforeEach(async () => {
    postService = jasmine.createSpyObj('PostService', ['createPost']);
    postService.createPost.and.returnValue(of({} as any));

    await TestBed.configureTestingModule({
      imports: [CreatePostComponent],
      providers: [
        { provide: PostService, useValue: postService },
        {
          provide: AuthService,
          useValue: { currentUser: { username: 'Tester' } }
        }
      ]
    })
      .overrideComponent(CreatePostComponent, {
        set: { template: '' }
      })
      .compileComponents();

    fixture = TestBed.createComponent(CreatePostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('должен создаваться', () => {
    expect(component).toBeTruthy();
  });

  it('должен создавать пост с заполненными полями', () => {
    component.postTitle = 'Путешествие в Италию';
    component.postDescription = 'Описание путешествия';
    component.postDate = '2026-11-08';

    const emitSpy = spyOn(component.postCreated, 'emit');

    component.submitPost();

    expect(postService.createPost).toHaveBeenCalled();
    expect(emitSpy).toHaveBeenCalled();
    expect(component.postTitle).toBe('');
    expect(component.postDescription).toBe('');
  });
});
