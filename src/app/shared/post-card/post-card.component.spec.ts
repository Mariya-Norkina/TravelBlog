
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { PostCardComponent } from './post-card.component';
import { TravelPost } from '../../services/post.service';
import { TuiNotificationService } from '@taiga-ui/core';

describe('PostCardComponent', () => {
  let component: PostCardComponent;
  let fixture: ComponentFixture<PostCardComponent>;

  const mockPost: TravelPost = {
    id: 'post-1',
    title: 'Путешествие в Италию',
    description: 'Описание путешествия',
    date: '2026-11-08',
    author: 'Tester',
    likes: [],
    likesCount: 0
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PostCardComponent],
      providers: [
        {
          provide: TuiNotificationService,
          useValue: {
            open: jasmine.createSpy().and.returnValue(of(null))
          }
        }
      ]
    })
      .overrideComponent(PostCardComponent, {
        set: { template: '' }
      })
      .compileComponents();

    fixture = TestBed.createComponent(PostCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('post', mockPost);
  });

  it('должен создаваться', () => {
    fixture.detectChanges();

    expect(component).toBeTruthy();
  });

  it('должен отправлять событие лайка авторизованному пользователю', () => {
    fixture.componentRef.setInput('isLoggedIn', true);
    fixture.detectChanges();

    const likeSpy = spyOn(component.like, 'emit');

    component.onLikeClick(new MouseEvent('click'));

    expect(likeSpy).toHaveBeenCalledWith(mockPost);
  });
});
