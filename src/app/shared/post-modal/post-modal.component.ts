import { Component, HostListener, OnInit, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TravelPost, PostService } from '../../services/post.service';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { PostCommentsComponent } from '../comments/comments.component.';
import { TuiAnimated } from '@taiga-ui/cdk';
import { TuiNotificationService } from '@taiga-ui/core';
import { Title, Meta } from '@angular/platform-browser';

@Component({
  selector: 'app-post-modal',
  standalone: true,
  imports: [CommonModule, PostCommentsComponent, TuiAnimated],
  templateUrl: './post-modal.component.html',
  styleUrls: ['./post-modal.component.css']
})
export class PostModalComponent implements OnInit {
  private readonly notifications = inject(TuiNotificationService);
  @Input() post!: TravelPost;
  isLoading: boolean = true;

  activeFullImageIndex: number | null = null;
  authorAvatarUrl: string = 'assets/img/profile.png';
  authorTotalPostsCount: number = 0;

  constructor(
    private route: ActivatedRoute, // Считывает параметры URL (:slug)
    private router: Router,        // Позволяет вернуться назад на страницу блога
    private postService: PostService,
    private userService: UserService,
    public authService: AuthService,
    private titleService: Title,
    private metaService: Meta
  ) {}

  private showToast(message: string): void {
    this.notifications.open(message, {
      label: '',
      autoClose: 3500
    }).subscribe();
  }

  showAuthorPopover(): void {
  console.log('MOUSE ENTER AUTHOR');
}

hideAuthorPopover(): void {
  console.log('MOUSE LEAVE AUTHOR');
}

  ngOnInit(): void {
    if (this.post) {
    this.isLoading = false;
    this.loadAuthorStats();
    return;
    }
    // 1. Считываем slug из адресной строки
    const postSlug = this.route.snapshot.paramMap.get('slug');

    if (!postSlug) {
      this.router.navigate(['/blog']);
      return;
    }

    // 2. Ищем пост в базе данных по совпадению slug
        this.postService.getPosts().subscribe({
      next: (allPosts: TravelPost[]) => {

        // ВСПЛЫВАЮЩАЯ ФУНКЦИЯ ТРАНСЛИТЕРАЦИИ ДЛЯ СТАРЫХ ПОСТОВ
        const makeSlug = (text: string) => {
          const cyr = {
            'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'zh','з':'z',
            'и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r',
            'с':'s','т':'t','у':'u','ф':'f','х':'kh','ц':'ts','ч':'ch','ш':'sh','щ':'sch',
            'ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya'
          } as { [key: string]: string };
          return text.toLowerCase().split('').map(c => cyr[c] !== undefined ? cyr[c] : c).join('')
            .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
        };

        // === УНИВЕРСАЛЬНЫЙ ПОИСК ПОСТА ===
        const foundPost = allPosts.find(p =>
          p.id === postSlug ||
          p.slug === postSlug ||
          makeSlug(p.title) === postSlug
        );

        if (!foundPost) {
          alert('Статья не найдена!');
          this.router.navigate(['/blog']);
          return;
        }

        this.post = foundPost;
        this.isLoading = false;

        this.titleService.setTitle(
          `${this.post.title} — Блог о путешествиях`
        );

        this.metaService.updateTag({
          name: 'description',
          content: `Читайте публикацию «${this.post.title}» от автора ${this.post.author} в блоге о путешествиях.`
        });

        this.metaService.updateTag({
          property: 'og:type',
          content: 'article'
        });

        this.metaService.updateTag({
          property: 'og:title',
          content: this.post.title
        });

        if (this.post.viewsCount !== undefined) {
          this.post.viewsCount++;
        } else {
          this.post.viewsCount = 1;
        }

        this.loadAuthorStats();
      },
      error: (err) => {
        console.error(err);
        this.router.navigate(['/blog']);
      }
    });
  }

  private loadAuthorStats(): void {
    if (!this.post || !this.post.author) return;

    this.userService.getUsers().subscribe((users: any[]) => {
      const authorUser = users.find(u => u.username === this.post.author);
      if (authorUser && authorUser.avatarBase64) {
        this.authorAvatarUrl = authorUser.avatarBase64;
      }
    });

    this.postService.getPosts().subscribe((allPosts: TravelPost[]) => {
      this.authorTotalPostsCount = allPosts.filter(p => p.author === this.post.author).length;
    });
  }

    isPostLiked(post: TravelPost): boolean {
      const currentUserId = this.authService.currentUser?.id;

      if (!currentUserId || !post?.likes) {
        return false;
      }

      return post.likes.some(
        id => id.toLowerCase() === currentUserId.toLowerCase()
      );
    }

    onLikeClick(event: MouseEvent): void {
      event.stopPropagation();

      const currentUserId = this.authService.currentUser?.id;

      if (!this.authService.isLoggedIn() || !currentUserId) {
        this.showToast('Необходимо авторизоваться, чтобы ставить лайки!');
        return;
      }

      this.postService.toggleLike(this.post, currentUserId).subscribe({
        next: (updatedPost: TravelPost) => {
          this.post.likes = updatedPost.likes || [];
          this.post.likesCount = updatedPost.likesCount ?? this.post.likes.length;
          this.post.likedByUsers = updatedPost.likedByUsers || [];
        },
        error: (err) => {
          console.error('Ошибка при сохранении лайка:', err);
          this.showToast('Не удалось сохранить лайк. Попробуйте ещё раз.');
        }
      });
    }

    goBackToBlog(): void {
      const navigationState = this.router.getCurrentNavigation()?.extras.state || window.history.state;

      if (navigationState && navigationState.fromProfile) {
        this.router.navigate(['/login'], {
          state: { activeTab: 'liked' }
        });
      } else {
        this.router.navigate(['/blog']);
      }
    }

  openFullImage(index: number): void { this.activeFullImageIndex = index; }
  closeFullImage(): void { this.activeFullImageIndex = null; }
  prevImage(event: Event): void {
    event.stopPropagation();
    if (this.activeFullImageIndex !== null && this.activeFullImageIndex > 0) this.activeFullImageIndex--;
  }
  nextImage(event: Event): void {
    event.stopPropagation();
    if (this.activeFullImageIndex !== null && this.post.additionalPhotos && this.activeFullImageIndex < this.post.additionalPhotos.length - 1) this.activeFullImageIndex++;
  }
  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (this.activeFullImageIndex === null) return;
    if (event.key === 'ArrowRight' || event.key === 'Right') {
      if (this.post.additionalPhotos && this.activeFullImageIndex < this.post.additionalPhotos.length - 1) this.activeFullImageIndex++;
    } else if (event.key === 'ArrowLeft' || event.key === 'Left') {
      if (this.activeFullImageIndex > 0) this.activeFullImageIndex--;
    } else if (event.key === 'Escape') {
      this.closeFullImage();
    }
  }
}
