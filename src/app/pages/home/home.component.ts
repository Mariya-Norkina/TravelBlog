import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CreatePostComponent } from '../../shared/create-post/create-post.component';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  imports: [CommonModule, RouterModule, CreatePostComponent] // Подключили CreatePostComponent
})
export class HomeComponent implements OnInit {

  successMessage: string | null = null;

  constructor(
    public authService: AuthService
  ) {}

  ngOnInit(): void {}

  // Обработчик события после успешной публикации на главной странице
  onPostCreated(): void {
    this.successMessage = 'Ваш пост успешно опубликован!';
    setTimeout(() => {
      this.successMessage = null;
    }, 3000);
  }
}
