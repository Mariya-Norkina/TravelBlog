import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { TuiAnimated } from '@taiga-ui/cdk';

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
  imports: [ReactiveFormsModule, CommonModule, TuiAnimated],
})
export class RegisterComponent implements OnInit {
  authForm: FormGroup; 
  message: string = '';
  isLoginMode: boolean = false;
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


onSubmit(): void {
  const credentials = this.authForm.value;

  const username = credentials.username
    ? credentials.username.trim()
    : '';

  const password = credentials.password
    ? credentials.password.trim()
    : '';

  if (!username || !password) {
    this.message = 'Пожалуйста, заполните все поля';
    return;
  }

  // ВХОД
  if (this.isLoginMode) {

    this.authService.loginServer({
      username,
      password
    }).subscribe({

      next: (response) => {

        console.log('Авторизация успешна!');
        console.log('Получен JWT:', !!response.token);
        console.log('Пользователь:', response.user);

        // Переходим в личный кабинет
        this.router.navigate(['/profile'], {
          replaceUrl: true
        });

      },

      error: (err) => {

        console.error('Ошибка авторизации:', err);

        this.message =
          err.error?.message || 'Неверный логин или пароль';

      }

    });

  } else {

    // РЕГИСТРАЦИЯ
    this.authService.register({
      username,
      password,
      email: `${username}@blog.com`
    }).subscribe({

      next: () => {

        // После регистрации автоматически авторизуемся
        this.authService.loginServer({
          username,
          password
        }).subscribe({

          next: (response) => {

            console.log('Регистрация и авторизация успешны!');
            console.log('JWT получен:', !!response.token);

            this.router.navigate(['/profile'], {
              state: { justRegistered: true },
              replaceUrl: true
            });

          },

          error: (err) => {
            console.error('Ошибка автоматического входа:', err);
            this.message = 'Регистрация успешна, но войти не удалось. Попробуйте войти вручную.';
            this.isLoginMode = true;
          }

        });

      },

      error: (err) => {
        console.error('Ошибка регистрации:', err);

        this.message =
          err.error?.message || 'Произошла ошибка при регистрации';
      }

    });

  }
}



  onPasswordFocus() {
    this.isPasswordFocused = true;
  }

  onPasswordBlur() {
    setTimeout(() => {
      this.isPasswordFocused = false;
    }, 200);
  }

  get isPasswordEntered(): boolean {
  const passwordVal = this.authForm.get('password')?.value;
  return passwordVal && passwordVal.trim().length > 0;
}

  resetPassword() {
    const accountInput = prompt('Введите ваше имя пользователя для сброса пароля:');
    if (!accountInput) return;

    const newPassword = prompt(`Введите новый пароль для аккаунта ${accountInput}:`);
    if (!newPassword || newPassword.trim().length === 0) {
      alert('Пароль не может быть пустым!');
      return;
    }

    this.userService.updateUserPassword(accountInput, newPassword).subscribe({
      next: () => {
        alert('Пароль успешно изменен! Теперь вы можете войти.');
        this.authForm.get('password')?.setValue('');
      },
      error: (err) => {
        alert(err.error?.message || 'Ошибка при смене пароля. Возможно, пользователь не найден.');
      }
    });
  }


  toggleMode() {
    this.isLoginMode = !this.isLoginMode;
    this.message = '';
  }
}
