import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router'; // Добавили роутер
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service'; // Добавили AuthService

interface User {
  id?: string;
  subscribe(arg0: () => void): import("../../services/user.service").User;
  username: string;
  password: string;
}

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
})
export class RegisterComponent implements OnInit {
  authForm: FormGroup; // Переименовали форму в универсальную authForm
  message: string = '';
  isLoginMode: boolean = false; // Переключатель режимов: false = Регистрация, true = Вход
  isPasswordFocused: boolean = false; 

  constructor(
    private fb: FormBuilder, 
    private userService: UserService,
    private authService: AuthService, 
    private router: Router 
  ) {
    this.authForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]],
    });
  }


  ngOnInit() {}

    get isUsernameHasLetters(): boolean {
    const username = this.authForm.get('username')?.value || '';
    return /[A-Za-zА-Яа-яЁё]/.test(username);
  }

  get isPasswordTooShort(): boolean {
    const password = this.authForm.get('password')?.value || '';
    return password.length > 0 && password.length < 8;
  }

  get isPasswordHasLetters(): boolean {
    const password = this.authForm.get('password')?.value || '';
    return /[A-Za-zА-Яа-яЁё]/.test(password);
  }

  get isPasswordHasSymbols(): boolean {
    const password = this.authForm.get('password')?.value || '';
    return /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  }

  onSubmit() {
    const credentials = this.authForm.value;
    const username = credentials.username ? credentials.username.trim() : '';
    const password = credentials.password ? credentials.password.trim() : '';

    if (!username || !password) {
      this.message = 'Пожалуйста, заполните все поля';
      return;
    }

    if (!this.isLoginMode) {
      const usernameHasLetters = /[A-Za-zА-Яа-яЁё]/.test(username);
      if (!usernameHasLetters) {
        this.message = 'Имя пользователя не может состоять только из цифр. Обязательно должна быть хотя бы одна буква!';
        return; 
      }

      if (password.length < 8) {
        this.message = 'Пароль должен быть не менее 8 символов длиной!';
        return; 
      }

      const passwordHasLetters = /[A-Za-zА-Яа-яЁё]/.test(password);
      if (!passwordHasLetters) {
        this.message = 'Пароль должен содержать хотя бы одну букву!';
        return;
      }

      const passwordHasSymbols = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
      if (!passwordHasSymbols) {
        this.message = 'Пароль должен содержать минимум 1 специальный символ (например: !, @, #, $, %, ?, * и др.)!';
        return; 
      }
    }

    if (this.isLoginMode) {
      this.userService.getUsers().subscribe((users: any[]) => {
        const user = users.find(u => 
          (u.username === username || u.id === username) && 
          u.password === password
        );

        if (!user) {
          this.message = 'Неверный логин/ID или пароль';
        } else {
          this.authService.login(user.id, user.username);
          this.router.navigate(['/login']); 
        }
      });
    } else {
      this.userService.getUsers().subscribe((users: any[]) => {
        const isUserExists = users.some(u => u.username.toLowerCase() === username.toLowerCase());

        if (isUserExists) {
          this.message = 'Пользователь с таким именем уже зарегистрирован!';
          return; 
        }

        this.userService.addUser({ username, password }).subscribe({
          next: (createdUser: any) => {
            const userId = createdUser?.id || 'gen-' + Math.random().toString(36).substr(2, 9);
            this.authService.login(userId, username);
            this.router.navigate(['/login'], { state: { justRegistered: true } });
          },
          error: (err) => {
            this.message = 'Произошла ошибка при регистрации';
            console.error(err);
          }
        });
      });
    }
  }


  onPasswordFocus() {
    this.isPasswordFocused = true;
  }

  onPasswordBlur() {
    // Таймаут в 200мс нужен для того, чтобы если пользователь кликнул 
    // именно НА НАДПИСЬ «Сбросить», событие клика успело сработать до того, как надпись исчезнет
    setTimeout(() => {
      this.isPasswordFocused = false;
    }, 200);
  }

  get isPasswordEntered(): boolean {
  const passwordVal = this.authForm.get('password')?.value;
  return passwordVal && passwordVal.trim().length > 0;
}

// Метод сброса и установки нового пароля по надписи
resetPassword() {
  const accountInput = prompt('Введите ваше имя пользователя или уникальный ID для сброса пароля:');
  if (!accountInput) return;

  this.userService.getUsers().subscribe((users: any[]) => {
    const user = users.find(u => u.username === accountInput || u.id === accountInput);

    if (!user) {
      alert('Пользователь с таким именем или ID не найден!');
    } else {
      const newPassword = prompt(`Пользователь найден: ${user.username}.\nВведите новый пароль:`);
      if (!newPassword || newPassword.trim().length === 0) {
        alert('Пароль не может быть пустым!');
        return;
      }

      this.userService.updateUserPassword(user.id, newPassword).subscribe({
        next: () => {
          alert('Пароль успешно изменен! Теперь вы можете войти.');
          this.authForm.get('password')?.setValue(''); // Очищаем поле
        },
        error: (err) => {
          console.error(err);
          alert('Ошибка при смене пароля.');
        }
      });
    }
  });
}

  // Метод для переключения режимов (Вход / Регистрация) в HTML шаблоне
  toggleMode() {
    this.isLoginMode = !this.isLoginMode;
    this.message = '';
  }
}
