import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TravelPost } from '../../services/post.service'; 
import { TruncateWordsPipe } from '../../pipes/truncate-words.pipe';
import { TuiNotificationService } from '@taiga-ui/core';

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [CommonModule, TruncateWordsPipe],
  templateUrl: './post-card.component.html',
  styleUrls: ['./post-card.component.css']
})
export class PostCardComponent implements OnChanges {
  private readonly notifications = inject(TuiNotificationService);
  @Input() post!: TravelPost;
  @Input() isLiked: boolean = false;
  @Input() isLoggedIn: boolean = false;
  @Input() currentUsername: string | null | undefined = null;
  @Input() currentUserId: string | null | undefined = null;
  @Input() showAdminActions: boolean = false;
  @Input() isInProfile: boolean = false;

  @Output() detail = new EventEmitter<TravelPost>();
  @Output() like = new EventEmitter<TravelPost>();
  @Output() edit = new EventEmitter<TravelPost>(); // Событие для редактирования
  @Output() delete = new EventEmitter<string>();  // Событие для удаления (передает id поста)


    ngOnChanges(changes: SimpleChanges): void {
      if (this.post && this.currentUserId) {
        this.isLiked = (this.post.likes || []).some(
          userId => userId.toLowerCase() === this.currentUserId!.toLowerCase()
        );
      } else {
        this.isLiked = false;
      }
    }

    private showToast(message: string): void {
    this.notifications.open(message, {
      label: '',
      autoClose: 3500
    }).subscribe();
    }

    // === ИЗМЕНЕНИЕ: Создаем внутренний метод для обработки лайка ===
    onLikeClick(event: MouseEvent): void {
      event.stopPropagation();

      if (!this.isLoggedIn) {
        this.showToast('Необходимо авторизоваться, чтобы ставить лайки');
        return;
      }

      this.like.emit(this.post);
    }
}
