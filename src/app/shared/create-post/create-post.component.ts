import { Component, ViewChild, ElementRef, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PostService, TravelPost } from '../../services/post.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-create-post',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-post.component.html',
  styleUrls: ['./create-post.component.css']
})
export class CreatePostComponent {
  // Событие, которое генерируется при успешном создании поста
  @Output() postCreated = new EventEmitter<void>();

  postTitle: string = '';
  postDescription: string = '';
  postDate: string = '';
  createPhotoPreviewUrl: string | null = null;
  galleryPhotos: string[] = [];

  @ViewChild('postPhotoInput') postPhotoInput!: ElementRef<HTMLInputElement>;
  @ViewChild('galleryPhotoInput') galleryPhotoInput!: ElementRef<HTMLInputElement>;

  constructor(
    private postService: PostService,
    private authService: AuthService
  ) {}

  removeCoverPhoto(): void {
    this.createPhotoPreviewUrl = null;
    if (this.postPhotoInput) this.postPhotoInput.nativeElement.value = '';
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    if (file.size > 2 * 1024 * 1024) {
      alert('Файл слишком большой (макс. 2MB)');
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => this.createPhotoPreviewUrl = reader.result as string;
    reader.readAsDataURL(file);
  }

  onTitleInput(event: Event): void {
  const input = event.target as HTMLInputElement;
  const value = input.value;
  
  const words = value.trim().split(/\s+/);
  
  if (words.length > 6) {
    let spaceCount = 0;
    let cutIndex = 0;
    
    for (let i = 0; i < value.length; i++) {
      if (/\s/.test(value[i])) {
        if (i > 0 && !/\s/.test(value[i - 1])) {
          spaceCount++;
          if (spaceCount === 6) {
            cutIndex = i;
            break;
          }
        }
      }
    }
    
    this.postTitle = value.substring(0, cutIndex);
    input.value = this.postTitle;
  }
}

  onGalleryFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const files = Array.from(input.files);

    files.forEach(file => {
      if (this.galleryPhotos.length >= 10) {
        alert('Можно добавить не более 10 дополнительных фотографий');
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        alert(`Файл ${file.name} слишком большой (макс. 2MB)`);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        if (this.galleryPhotos.length < 10) {
          this.galleryPhotos.push(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    });

    input.value = '';
  }

  removeGalleryPhoto(index: number): void {
    this.galleryPhotos.splice(index, 1);
  }

  submitPost(): void {
  if (!this.postTitle || !this.postDescription || !this.postDate) {
    alert('Пожалуйста, заполните все обязательные поля');
    return;
  }

  const wordCount = this.postTitle.trim().split(/\s+/).filter(w => w.length > 0).length;
  if (wordCount > 6) {
    alert('Заголовок не может содержать более 6 слов!');
    return;
  }

  const newPost: Omit<TravelPost, 'id'> & { id?: string; additionalPhotos?: string[] } = {
    title: this.postTitle.trim(),
    description: this.postDescription,
    date: this.postDate,
    author: this.authService.currentUser?.username || 'Аноним',
    photoBase64: this.createPhotoPreviewUrl || undefined,
    additionalPhotos: this.galleryPhotos,
    likesCount: 0, 
    likes: []
  };

  this.postService.createPost(newPost as any).subscribe({
    next: () => {
      this.resetForm();
      this.postCreated.emit();
    },
    error: err => console.error('Ошибка при создании поста:', err)
  });
}

  private resetForm(): void {
    this.postTitle = '';
    this.postDescription = '';
    this.postDate = '';
    this.createPhotoPreviewUrl = null;
    this.galleryPhotos = [];
    if (this.postPhotoInput) this.postPhotoInput.nativeElement.value = '';
    if (this.galleryPhotoInput) this.galleryPhotoInput.nativeElement.value = '';
  }
}

