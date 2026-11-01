import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TravelPost, PostService, PostComment } from '../../services/post.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-post-comments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './comments.component.html',
  styleUrls: ['./comments.component.css']
})
export class PostCommentsComponent {
  @Input() post!: TravelPost;
  @Output() closeParentModal = new EventEmitter<void>(); // Событие для закрытия всей модалки при уходе на регистрацию

  newCommentText: string = '';
  showErrorAlert: boolean = false;
  errorMessage: string = '';

  editingCommentId: string | null = null;
  editedCommentText: string = '';
  activePickerCommentId: string | null = null;

  // Список доступных реакций по вашему списку
availableEmojis: string[] = ['😀', '😂', '😍', '😎', '🤔', '😭', '👍', '🔥', '❤️', '🎉', '😺', '💫', '🏝', '🏕'];

// Добавьте метод для переключения панели реакций по клику:
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

  private getCurrentFormattedDateTime(): string {
    const now = new Date();
    const date = now.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
    const time = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    return `${date} в ${time}`;
  }
  

  submitComment(): void {
    if (!this.newCommentText.trim()) return;

    const currentUser = this.authService.currentUser?.username;
    if (!currentUser) {
      this.triggerError('Вы должны быть авторизованы, чтобы оставить комментарий');
      return;
    }

    if (!this.post.comments) {
      this.post.comments = [];
    }

    const comment: PostComment = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      username: currentUser,
      text: this.newCommentText.trim(),
      date: this.getCurrentFormattedDateTime(),
      reactions: {}
    };

    const updatedPost: TravelPost = {
      ...this.post,
      comments: [...this.post.comments, comment]
    };

    this.postService.updatePost(updatedPost).subscribe({
      next: (savedPost) => {
        this.post.comments = savedPost.comments;
        this.newCommentText = '';
      },
      error: (err) => {
        console.error('Ошибка сохранения комментария:', err);
        this.triggerError('Не удалось опубликовать комментарий.');
      }
    });
  }

  toggleReaction(comment: PostComment, emoji: string): void {
    const currentUser = this.authService.currentUser?.username;
    if (!currentUser) {
      this.triggerError('Войдите в профиль, чтобы оставлять реакции');
      return;
    }

    if (!comment.reactions) {
      comment.reactions = {};
    }

    const reactions = comment.reactions;
    const userAlreadyHadThisEmoji = reactions[emoji]?.includes(currentUser);

    // Правило: Только ОДНА реакция на комментарий. Удаляем имя юзера изо всех остальных смайликов этого комментария
    Object.keys(reactions).forEach(key => {
      if (reactions[key]) {
        reactions[key] = reactions[key].filter(user => user !== currentUser);
        if (reactions[key].length === 0) {
          delete reactions[key];
        }
      }
    });

    // Если пользователь нажал на тот же эмодзи, который у него уже стоял — мы его просто убрали (шаг выше).
    // Если нажал на новый — добавляем его имя в массив этого эмодзи
    if (!userAlreadyHadThisEmoji) {
      if (!reactions[emoji]) {
        reactions[emoji] = [];
      }
      reactions[emoji].push(currentUser);
    }

    // Сохраняем обновленный пост на бэкенд
    const commentIndex = this.post.comments!.findIndex(c => c.id === comment.id);
    const updatedComments = [...this.post.comments!];
    updatedComments[commentIndex] = { ...comment, reactions: { ...reactions } };

    const updatedPost: TravelPost = { ...this.post, comments: updatedComments };

    this.postService.updatePost(updatedPost).subscribe({
      next: (savedPost) => {
        this.post.comments = savedPost.comments;
      },
      error: (err) => {
        console.error('Ошибка обновления реакции:', err);
        this.triggerError('Не удалось сохранить реакцию.');
      }
    });
  }

  // Вспомогательный метод для шаблона: проверяет, кликнул ли текущий юзер на этот эмодзи
  isEmojiSelectedByUser(comment: PostComment, emoji: string): boolean {
    const currentUser = this.authService.currentUser?.username;
    if (!currentUser || !comment.reactions || !comment.reactions[emoji]) return false;
    return comment.reactions[emoji].includes(currentUser);
  }

  // Получить массив выставленных смайликов (у которых есть хотя бы один клик), чтобы отрендерить их под текстом
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
    if (!this.editedCommentText.trim() || !this.post.comments) return;

    const commentIndex = this.post.comments.findIndex(c => c.id === commentId);
    if (commentIndex === -1) return;

    const originalComment = this.post.comments[commentIndex];
    const normalizedNewText = this.editedCommentText.trim();

    if (originalComment.text === normalizedNewText) {
      this.cancelEditComment();
      return;
    }

    const updatedComments = [...this.post.comments];
    updatedComments[commentIndex] = {
      ...updatedComments[commentIndex],
      text: normalizedNewText,
      date: this.getCurrentFormattedDateTime(),
      isEdited: true
    };

    const updatedPost: TravelPost = { ...this.post, comments: updatedComments };

    this.postService.updatePost(updatedPost).subscribe({
      next: (savedPost) => {
        this.post.comments = savedPost.comments;
        this.cancelEditComment();
      },
      error: (err) => {
        console.error('Ошибка изменения комментария:', err);
        this.triggerError('Не удалось обновить комментарий.');
      }
    });
  }

  deleteComment(commentId: string): void {
    if (!this.post.comments || !confirm('Вы уверены, что хотите удалить этот комментарий?')) return;

    const updatedPost: TravelPost = {
      ...this.post,
      comments: this.post.comments.filter(c => c.id !== commentId)
    };

    this.postService.updatePost(updatedPost).subscribe({
      next: (savedPost) => {
        this.post.comments = savedPost.comments;
      },
      error: (err) => {
        console.error('Ошибка удаления комментария:', err);
        this.triggerError('Не удалось удалить комментарий.');
      }
    });
  }

  goToAuth(path: string): void {
    this.closeParentModal.emit(); // Сигнализируем родительской модалке закрыться
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
