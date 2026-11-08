import { Component, Input, Output, EventEmitter, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TravelPost, PostService, PostComment } from '../../services/post.service';
import { AuthService } from '../../services/auth.service';
import { TuiNotificationService } from '@taiga-ui/core';

@Component({
  selector: 'app-post-comments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './comments.component.html',
  styleUrls: ['./comments.component.css']
})
export class PostCommentsComponent {
  private readonly notifications = inject(TuiNotificationService);
  @Input() post!: TravelPost;
  @Output() closeParentModal = new EventEmitter<void>();

  newCommentText: string = '';
  showErrorAlert: boolean = false;
  errorMessage: string = '';

  editingCommentId: string | null = null;
  editedCommentText: string = '';
  activePickerCommentId: string | null = null;

availableEmojis: string[] = ['😀', '😂', '😍', '😎', '🤔', '😭', '👍', '🔥', '❤️', '🎉', '😺', '💫', '🏝', '🏕'];

togglePicker(event: Event, commentId: string): void {
  event.stopPropagation(); // Останавливаем всплытие, чтобы клик не закрывал панель сразу
  if (this.activePickerCommentId === commentId) {
    this.activePickerCommentId = null; // Если кликнули повторно — закрываем
  } else {
    this.activePickerCommentId = commentId; // Открываем панель для этого комментария
  }
}

// Добавьте слушатель клика по документу, чтобы панель закрывалась при клике в любое пустое место:
@HostListener('document:click')
closeAllPickers(): void {
  this.activePickerCommentId = null;
}

  constructor(
    public authService: AuthService,
    private postService: PostService,
    private router: Router
  ) {}

  private showToast(message: string): void {
    this.notifications.open(message, {
      label: '',
      autoClose: 3500
    }).subscribe();
  }

  private getCurrentFormattedDateTime(): string {
    const now = new Date();
    const date = now.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
    const time = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    return `${date} в ${time}`;
  }
  

    submitComment(): void {
      const text = this.newCommentText.trim();

      if (!text) return;

      const currentUser = this.authService.currentUser?.username;

      if (!currentUser) {
        this.showToast('Необходимо авторизоваться!');
        return;
      }

      this.postService.addComment(this.post.id, text).subscribe({
        next: (savedComment: PostComment) => {

          if (!this.post.comments) {
            this.post.comments = [];
          }

          this.post.comments = [
            ...this.post.comments,
            savedComment
          ];

          this.newCommentText = '';
        },

        error: (err) => {
          console.error('Ошибка сохранения комментария:', err);

          this.triggerError(
            err.error?.message || 'Не удалось опубликовать комментарий.'
          );
        }
      });
    }

  toggleReaction(comment: PostComment, emoji: string): void {
    const currentUserId = this.authService.currentUser?.id;

    if (!this.authService.isLoggedIn() || !currentUserId) {
      this.showToast('Необходимо авторизоваться, чтобы ставить реакции!');
      return;
    }

    this.postService.toggleCommentReaction(
      this.post.id,
      comment.id,
      emoji
    ).subscribe({
      next: (updatedComment) => {
        this.post.comments = (this.post.comments || []).map(c =>
          c.id === updatedComment.id ? updatedComment : c
        );
      },
      error: (err) => {
        console.error('Ошибка изменения реакции:', err);
        this.triggerError(
          err.error?.message || 'Не удалось изменить реакцию.'
        );
      }
    });
  }

    isEmojiSelectedByUser(comment: PostComment, emoji: string): boolean {
      const currentUserId = this.authService.currentUser?.id;

      if (!currentUserId || !comment.reactions?.[emoji]) {
        return false;
      }

      return comment.reactions[emoji].some(
        userId => userId.toLowerCase() === currentUserId.toLowerCase()
      );
    }

  getActiveReactions(comment: PostComment): { emoji: string; count: number }[] {
    if (!comment.reactions) return [];
    return Object.keys(comment.reactions)
      .map(emoji => ({
        emoji: emoji,
        count: comment.reactions![emoji]?.length ?? 0
      }))
      .filter(r => r.count > 0);
  }


  startEditComment(comment: PostComment): void {
    this.editingCommentId = comment.id;
    this.editedCommentText = comment.text;
  }

  cancelEditComment(): void {
    this.editingCommentId = null;
    this.editedCommentText = '';
  }

    saveEditedComment(commentId: string): void {
      const text = this.editedCommentText.trim();

      if (!text) {
        this.triggerError('Комментарий не может быть пустым');
        return;
      }

      if (text.length > 1000) {
        this.triggerError('Максимальная длина комментария — 1000 символов');
        return;
      }

      this.postService.updateComment(
        this.post.id,
        commentId,
        text
      ).subscribe({
        next: (updatedComment) => {
          this.post.comments = (this.post.comments || []).map(c =>
            c.id === commentId
              ? { ...updatedComment, isEdited: true }
              : c
          );

          this.cancelEditComment();
        },
        error: (err) => {
          this.showToast('Ошибка изменения комментария');
          this.triggerError(
            err.error?.message || 'Не удалось обновить комментарий.'
          );
        }
      });
    }

    deleteComment(commentId: string): void {
      if (!this.post.comments) return;

      if (!confirm('Вы уверены, что хотите удалить этот комментарий?')) {
        return;
      }

      this.postService.deleteComment(
        this.post.id,
        commentId
      ).subscribe({
        next: () => {
          this.post.comments = this.post.comments!.filter(
            c => c.id !== commentId
          );
        },
        error: (err) => {
          this.showToast('Ошибка удаления комментария');
          this.triggerError(
            err.error?.message || 'Не удалось удалить комментарий.'
          );
        }
      });
    }

  goToAuth(path: string): void {
    this.closeParentModal.emit(); 
    this.router.navigate([path]);
  }

  private triggerError(msg: string): void {
    this.errorMessage = msg;
    this.showErrorAlert = true;
    setTimeout(() => {
      this.showErrorAlert = false;
    }, 4000);
  }
}
