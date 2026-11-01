import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TravelPost } from '../../services/post.service'; 
import { TruncateWordsPipe } from '../../pipes/truncate-words.pipe';

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [CommonModule, TruncateWordsPipe],
  templateUrl: './post-card.component.html',
  styleUrls: ['./post-card.component.css']
})
export class PostCardComponent implements OnChanges {
  @Input() post!: TravelPost;
  @Input() isLiked: boolean = false;
  @Input() isLoggedIn: boolean = false;
  @Input() currentUsername: string | null | undefined = null; // Передаем имя текущего авторизованного пользователя
  @Input() showAdminActions: boolean = false;
  @Input() isInProfile: boolean = false;

  @Output() detail = new EventEmitter<TravelPost>();
  @Output() like = new EventEmitter<TravelPost>();
  @Output() edit = new EventEmitter<TravelPost>(); // Событие для редактирования
  @Output() delete = new EventEmitter<string>();  // Событие для удаления (передает id поста)


  ngOnChanges(changes: SimpleChanges): void {
    // Если обновился пост или имя текущего пользователя — пересчитываем статус лайка
    if (this.post && this.currentUsername) {
      const likesArray = this.post.likes || [];
      this.isLiked = likesArray.includes(this.currentUsername);
    }
  }

    // === ИЗМЕНЕНИЕ: Создаем внутренний метод для обработки лайка ===
  onLikeClick() {
    // Если пользователь не залогинен, клик ничего не делает
    if (!this.isLoggedIn) {
      alert('Пожалуйста, авторизуйтесь, чтобы ставить лайки!');
      return;
    }
    
    // Просто сообщаем родителю, какой пост кликнули
    this.like.emit(this.post);
  }
}
