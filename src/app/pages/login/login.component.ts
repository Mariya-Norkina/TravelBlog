import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { PostService, TravelPost } from '../../services/post.service';
import { TruncateWordsPipe } from '../../pipes/truncate-words.pipe';
import { CreatePostComponent } from '../../shared/create-post/create-post.component';
import { PostCardComponent } from '../../shared/post-card/post-card.component';
import { PostModalComponent } from '../../shared/post-modal/post-modal.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    FormsModule, 
    TruncateWordsPipe, 
    CreatePostComponent, 
    PostCardComponent, 
    PostModalComponent
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  showSuccessMessage = false;
  successMessage = 'Регистрация прошла успешно!';
  
  userPostsPage: number = 1;
  likedPostsPage: number = 1;
  readonly cabinetPageSize: number = 3;

  // Управление вкладками бокового меню
  currentTab: 'profile' | 'create' | 'liked' = 'profile';

  userPosts: TravelPost[] = [];
  likedPosts: TravelPost[] = [];
  selectedPost: TravelPost | null = null;

  // Управление редактированием
  editingPost: TravelPost | null = null;
  editForm!: FormGroup;
  editPhotoPreviewUrl: string | null = null;
  editAdditionalPhotosUrls: string[] = [];
  defaultAvatarUrl: string = '../../assets/img/profile.png';

  @ViewChild('editPhotoInput') editPhotoInput!: ElementRef<HTMLInputElement>;
  @ViewChild('editGalleryInput') editGalleryInput!: ElementRef<HTMLInputElement>;
  @ViewChild('avatarInput') avatarInput!: ElementRef<HTMLInputElement>;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private postService: PostService,
    public authService: AuthService,
    private router: Router
  ) {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state as { justRegistered: boolean };
    
    if (state && state.justRegistered) {
      this.showSuccessMessage = true;
    }
  }

ngOnInit(): void {
  if (this.showSuccessMessage) {
    setTimeout(() => {
      this.showSuccessMessage = false;
    }, 3000);
  }

  if (this.authService.isLoggedIn()) {
    this.loadUserPosts();
    this.loadLikedPosts();

    const state = window.history.state;
    if (state && state.activeTab) {
      this.currentTab = state.activeTab;
    }
  } else {
    this.router.navigate(['/register']);
  }
}

  // Переключение вкладок меню с автоматическим сбросом временного контента
setTab(tab: 'profile' | 'create' | 'liked'): void {
  this.currentTab = tab;
  this.userPostsPage = 1;
  this.likedPostsPage = 1;
  this.closeEditModal();
}

// Геттеры для пагинированных постов (замените вывод в шаблоне на них)
get paginatedUserPosts(): TravelPost[] {
  const startIndex = (this.userPostsPage - 1) * this.cabinetPageSize;
  return this.userPosts.slice(startIndex, startIndex + this.cabinetPageSize);
}

get totalUserPostsPages(): number {
  return Math.ceil(this.userPosts.length / this.cabinetPageSize) || 1;
}

get paginatedLikedPosts(): TravelPost[] {
  const startIndex = (this.likedPostsPage - 1) * this.cabinetPageSize;
  return this.likedPosts.slice(startIndex, startIndex + this.cabinetPageSize);
}

get totalLikedPostsPages(): number {
  return Math.ceil(this.likedPosts.length / this.cabinetPageSize) || 1;
}

// Методы навигации для созданных постов
goToPrevUserPage(): void {
  if (this.userPostsPage > 1) this.userPostsPage--;
}

goToNextUserPage(): void {
  if (this.userPostsPage < this.totalUserPostsPages) this.userPostsPage++;
}

// Методы навигации для понравившихся постов
goToPrevLikedPage(): void {
  if (this.likedPostsPage > 1) this.likedPostsPage--;
}

goToNextLikedPage(): void {
  if (this.likedPostsPage < this.totalLikedPostsPages) this.likedPostsPage++;
}

  // Обработчик события успешного создания поста из дочерней формы
  onPostCreated(): void {
    this.successMessage = 'Пост успешно добавлен!';
    this.showSuccessMessage = true;
    
    this.loadUserPosts();
    
    setTimeout(() => {
      this.showSuccessMessage = false;
      this.currentTab = 'liked'; // Автоматический редирект на список постов
    }, 2000);
  }

  // Обработка загрузки фото для РЕДАКТИРОВАНИЯ существующего поста
  onEditFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    if (file.size > 2 * 1024 * 1024) {
      alert('Файл слишком большой (макс. 2MB)');
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => this.editPhotoPreviewUrl = reader.result as string;
    reader.readAsDataURL(file);
  }

  onEditGalleryChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const files = Array.from(input.files);

     const currentLength = this.editAdditionalPhotosUrls.length;
    if (currentLength + files.length > 10) {
      const allowedCount = 10 - currentLength;
      if (allowedCount <= 0) {
        alert('Вы уже добавили максимальное количество фотографий (10 шт.).');
      } else {
        alert(`Вы можете добавить еще не более ${allowedCount} фото. Вы попытались загрузить ${files.length}.`);
      }
      input.value = ''; // Сбрасываем выбор в инпуте
      return;
    }
    
    files.forEach(file => {
      if (file.size > 2 * 1024 * 1024) {
        alert(`Файл ${file.name} слишком большой (макс. 2MB)`);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          this.editAdditionalPhotosUrls.push(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    });

    input.value = ''; // Сбрасываем инпут для возможности повторного выбора
  }

  // === НОВЫЙ МЕТОД: Удаление конкретной картинки из редактируемой галереи ===
  removeEditGalleryImage(index: number): void {
    this.editAdditionalPhotosUrls.splice(index, 1);
  }

  onAvatarChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    
    if (file.size > 4 * 1024 * 1024) {
      alert('Файл слишком большой! Максимальный размер аватарки — 4MB.');
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64Image = reader.result as string;
      const currentUser = this.authService.currentUser;

      if (currentUser) {
        // 1. Обновляем локальные данные в сервисе авторизации (чтобы аватарка сменилась везде)
        this.authService.login(currentUser.id, currentUser.username);
        // Расширяем сохраненный объект в localStorage
        const userWithAvatar = { ...currentUser, avatarBase64: base64Image };
        localStorage.setItem('user', JSON.stringify(userWithAvatar));
        (this.authService as any).userSubject?.next(userWithAvatar); // принудительно пушим в Subject, если он доступен

        // 2. Отправляем запрос на бэкенд для обновления профиля пользователя в БД
        if (typeof this.userService['updateUserPassword'] === 'function') {
          // Используем PATCH/PUT через http-сервис, если бэкенд поддерживает частичное обновление полей
          this.userService.addUser({ ...currentUser, avatarBase64: base64Image } as any).subscribe({
            error: (err) => console.error('Не удалось сохранить аватарку на сервере:', err)
          });
        }
      }
    };
    reader.readAsDataURL(file);
  }

  removeAvatar(event: Event): void {
    event.stopPropagation();

    const currentUser = this.authService.currentUser;
    if (currentUser) {
      const userWithoutAvatar = { ...currentUser };
      delete (userWithoutAvatar as any).avatarBase64;
      localStorage.setItem('user', JSON.stringify(userWithoutAvatar));
      this.authService.login(currentUser.id, currentUser.username);
      (this.authService as any).userSubject?.next(userWithoutAvatar);
      this.userService.addUser(userWithoutAvatar as any).subscribe({
        error: (err) => console.error('Не удалось удалить аватарку с сервера:', err)
      });
    }
  }

  get avatarUrl(): string {
    return (this.authService.currentUser as any)?.avatarBase64 || this.defaultAvatarUrl;
  }

  get hasCustomAvatar(): boolean {
    const user = this.authService.currentUser as any;
    return !!(user && user.avatarBase64);
  }

  triggerAvatarUpload(event: Event): void {
  // Останавливаем всплытие события, чтобы клик не уходил на другие элементы
  event.stopPropagation(); 
  
  if (this.avatarInput && this.avatarInput.nativeElement) {
    this.avatarInput.nativeElement.click();
  } else {
    console.error('Критическая ошибка: Элемент #avatarInput не найден в DOM-дереве шаблона.');
  }
  }

  changePassword(): void {
  const currentUserId = this.authService.currentUser?.id;
  if (!currentUserId) return;

  const newPassword = prompt('Введите новый пароль для вашего аккаунта:');
  if (!newPassword || newPassword.trim().length === 0) {
    alert('Пароль не может быть пустым!');
    return;
  }

  this.userService.updateUserPassword(currentUserId, newPassword).subscribe({
    next: () => {
      alert('Пароль успешно изменен!');
    },
    error: (err) => {
      console.error(err);
      alert('Не удалось изменить пароль.');
    }
    });
  }

  deleteProfile(): void {
    const currentUserId = this.authService.currentUser?.id;

    if (!currentUserId) {
      alert('Ошибка: Идентификатор пользователя не найден.');
      return;
    }

    if (confirm('Вы уверены, что хотите навсегда удалить свой профиль и все данные аккаунта?')) {
      this.userService.deleteUser(currentUserId).subscribe({
        next: () => {
          alert('Ваш профиль был успешно удален.');
          this.logout(); // Очищает localStorage и делает редирект на /register
        },
        error: (err) => {
          console.error('Ошибка при удалении профиля:', err);
          alert('Не удалось удалить профиль. Возможно, сервер недоступен.');
        }
      });
    }
  }

  logout(): void {
    this.authService.logout();
    this.userPosts = [];
    this.likedPosts = [];
    this.selectedPost = null;
    this.editingPost = null;
    this.router.navigate(['/register']);
  }

  private loadUserPosts(): void {
    this.postService.getPosts().subscribe(posts => {
      this.userPosts = posts.filter(
        post => post.author === this.authService.currentUser?.username
      );
    });
  }

  private loadLikedPosts(): void {
    const currentUser = this.authService.currentUser?.username;
    if (!currentUser) return;

    this.postService.getPosts().subscribe(posts => {
      this.likedPosts = posts.filter(post => post.likes?.includes(currentUser));
    });
  }

  /* ======================= МОДАЛЬНЫЕ ОКНА И ЛАЙКИ ======================= */
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
    
    this.router.navigate(['/blog', postSlug], {
      state: { fromProfile: true }
    });
  }

  closeModal(): void {
    this.selectedPost = null;
  }

  deletePost(id: string): void {
    this.postService.deletePost(id).subscribe({
      next: () => {
        this.userPosts = this.userPosts.filter(p => p.id !== id);
        this.loadLikedPosts();
      },
      error: err => console.error('Ошибка при удалении:', err)
    });
  }

  openEditModal(post: TravelPost): void {
    this.editingPost = post;
    this.editPhotoPreviewUrl = post.photoBase64 || null;
    this.editAdditionalPhotosUrls = post.additionalPhotos ? [...post.additionalPhotos] : [];

    this.editForm = this.fb.group({
      title: [post.title, Validators.required],
      description: [post.description, Validators.required],
      date: [post.date, Validators.required]
    });
  }

  closeEditModal(): void {
    this.editingPost = null;
    this.editPhotoPreviewUrl = null;
    this.editAdditionalPhotosUrls = []; // Очищаем галерею при закрытии
    if (this.editPhotoInput) this.editPhotoInput.nativeElement.value = '';
    if (this.editGalleryInput) this.editGalleryInput.nativeElement.value = '';
  }

  submitEdit(): void {
    if (!this.editForm || !this.editingPost) return;
    if (this.editForm.invalid) return;

    const updatedPost: TravelPost = {
      ...this.editingPost,
      title: this.editForm.value.title,
      description: this.editForm.value.description,
      date: this.editForm.value.date,
      photoBase64: this.editPhotoPreviewUrl || undefined,
      additionalPhotos: this.editAdditionalPhotosUrls
    };

    this.postService.updatePost(updatedPost).subscribe({
      next: updated => {
        const index = this.userPosts.findIndex(p => p.id === updated.id);
        if (index !== -1) this.userPosts[index] = updated;
        this.loadLikedPosts();
        this.closeEditModal();
      },
      error: err => console.error('Ошибка при更新поста:', err)
    });
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
        const idx = this.userPosts.findIndex(p => p.id === updated.id);
        if (idx !== -1) this.userPosts[idx] = updated;
        this.loadLikedPosts();
      },
      error: err => console.error('Ошибка при обновлении лайка:', err)
    });
  }

  hasUserLiked(post: TravelPost): boolean {
    const currentUser = this.authService.currentUser?.username;
    return currentUser ? post.likes?.includes(currentUser) ?? false : false;
  }
}
