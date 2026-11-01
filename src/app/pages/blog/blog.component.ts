import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostService, TravelPost } from '../../services/post.service';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { PostCardComponent } from '../../shared/post-card/post-card.component';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-blog',
  standalone: true,
  templateUrl: './blog.component.html',
  styleUrls: ['./blog.component.css'],
  imports: [CommonModule, PostCardComponent, FormsModule, RouterModule] 
})
export class BlogComponent implements OnInit {

  publishedPosts: TravelPost[] = [];
  filteredPosts: TravelPost[] = [];
  selectedPost: TravelPost | null = null;
  searchQuery: string = '';
  currentPage: number = 1;
  pageSize: number = 12;
  selectedDate: string = '';

  constructor(
    private postService: PostService,
    public authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.updatePageSize(window.innerWidth);
    this.loadPosts();
  }

    // Декоратор HostListener отслеживает изменение размеров экрана на лету
  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    this.updatePageSize(event.target.innerWidth);
  }

  private updatePageSize(width: number): void {
    const oldPageSize = this.pageSize;
    this.pageSize = width <= 576 ? 6 : 12;

    // Если размер страницы изменился прямо на экране, сбрасываем на 1 страницу во избежание багов
    if (oldPageSize !== this.pageSize) {
      this.currentPage = 1;
    }
  }

  private loadPosts(): void {
    this.postService.getPosts().subscribe(posts => {
      this.publishedPosts = posts.reverse();
      this.filteredPosts = [...this.publishedPosts]; // Изначально показываем все посты
      this.currentPage = 1;
    });
  }

  onSearch(): void {
    const query = this.searchQuery.trim().toLowerCase();
    
    if (!query) {
      this.filteredPosts = [...this.publishedPosts];
    } else {
      this.filteredPosts = this.publishedPosts.filter(post => 
        post.title.toLowerCase().includes(query) || 
        post.author.toLowerCase().includes(query)
      );
    }
    this.currentPage = 1;
  }

private applyFilters(): void {
  const query = this.searchQuery.trim().toLowerCase();
  
  this.filteredPosts = this.publishedPosts.filter(post => {
    // Проверка текстового соответствия
    const matchesText = !query || 
      post.title.toLowerCase().includes(query) || 
      post.author.toLowerCase().includes(query);

    // Проверка соответствия дате
    // Примечание: предполагается, что у вашего post.date формат строки начинается так же: "YYYY-MM-DD"
    // Если в посте дата сохранена как ISO-строка, то post.date.startsWith(this.selectedDate) отработает идеально.
    const matchesDate = !this.selectedDate || 
      (post.date && post.date.startsWith(this.selectedDate));

    return matchesText && matchesDate;
  });

  this.currentPage = 1; // Сбрасываем на первую страницу при любом изменении фильтров
}

// Срабатывает при выборе даты в календаре
onDateChange(): void {
  this.applyFilters();
}

// Очищает календарь
clearDate(): void {
  this.selectedDate = '';
  this.applyFilters();
}

// Обновите этот метод, чтобы автосброс текста учитывал и дату
onSearchInputChange(): void {
  if (!this.searchQuery || this.searchQuery.trim() === '') {
    this.applyFilters();
  }
}

  get paginatedPosts(): TravelPost[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredPosts.slice(startIndex, startIndex + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredPosts.length / this.pageSize) || 1;
  }

  goToPrevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  goToNextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  openPost(post: TravelPost): void {
    const generateSlugFn = (text: string): string => {
      const cyr: { [key: string]: string } = {
        'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'zh','з':'z',
        'и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r',
        'с':'s','т':'t','у':'u','ф':'f','х':'kh','ц':'ts','ч':'ch','ш':'sh','щ':'sch',
        'ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya'
      };
      return text.toLowerCase().split('').map(c => cyr[c] !== undefined ? cyr[c] : c).join('')
        .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
    };

    const postSlug = post.slug || generateSlugFn(post.title);
    this.router.navigate(['/blog', postSlug]);
  }

  closeModal(): void {
    this.selectedPost = null;
  }
  
  toggleLike(post: TravelPost): void {
    const currentUser = this.authService.currentUser?.username;
    if (!currentUser) return;

    if (!post.likes) post.likes = [];

    const index = post.likes.indexOf(currentUser);
    if (index !== -1) {
      post.likes.splice(index, 1); 
    } else {
      post.likes.push(currentUser);
    }

    this.postService.updatePost(post).subscribe({
      next: updated => {
        const idx = this.publishedPosts.findIndex(p => p.id === updated.id);
        const fIdx = this.filteredPosts.findIndex(p => p.id === updated.id);
        if (idx !== -1) this.publishedPosts[idx] = updated;
      },
      error: err => console.error('Ошибка при обновлении лайка:', err)
    });
  }

  hasUserLiked(post: TravelPost): boolean {
    const currentUser = this.authService.currentUser?.username;
    return currentUser ? post.likes?.includes(currentUser) ?? false : false;
  }
}
