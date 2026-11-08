
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { RegisterComponent } from './register.component';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';

describe('RegisterComponent', () => {
  let authService: jasmine.SpyObj<AuthService>;
  let userService: jasmine.SpyObj<UserService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    authService = jasmine.createSpyObj('AuthService', [
      'register',
      'loginServer'
    ]);

    userService = jasmine.createSpyObj('UserService', [
      'updateUserPassword'
    ]);

    router = jasmine.createSpyObj('Router', ['navigate']);

    authService.register.and.returnValue(of({}));
    authService.loginServer.and.returnValue(of({
      token: 'test-token',
      user: {
        id: 'user-1',
        username: 'TestUser'
      }
    }));

    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: UserService, useValue: userService },
        { provide: Router, useValue: router }
      ]
    }).compileComponents();
  });

  it('не должен отправлять пустую форму', () => {
    const fixture = TestBed.createComponent(RegisterComponent);
    const component = fixture.componentInstance;

    component.onSubmit();

    expect(authService.register).not.toHaveBeenCalled();
    expect(authService.loginServer).not.toHaveBeenCalled();
    expect(component.message).toBe('Пожалуйста, заполните все поля');
  });

  it('должен выполнять вход и перенаправлять пользователя в профиль', () => {
    const fixture = TestBed.createComponent(RegisterComponent);
    const component = fixture.componentInstance;

    component.isLoginMode = true;
    component.authForm.setValue({
      username: 'TestUser',
      password: 'password123'
    });

    component.onSubmit();

    expect(authService.loginServer).toHaveBeenCalledWith({
      username: 'TestUser',
      password: 'password123'
    });

    expect(router.navigate).toHaveBeenCalledWith(['/profile'], {
      replaceUrl: true
    });
  });

  it('должен регистрировать пользователя и автоматически выполнять вход', () => {
    const fixture = TestBed.createComponent(RegisterComponent);
    const component = fixture.componentInstance;

    component.authForm.setValue({
      username: 'NewUser',
      password: 'password123'
    });

    component.onSubmit();

    expect(authService.register).toHaveBeenCalledWith({
      username: 'NewUser',
      password: 'password123',
      email: 'NewUser@blog.com'
    });

    expect(authService.loginServer).toHaveBeenCalledWith({
      username: 'NewUser',
      password: 'password123'
    });

    expect(router.navigate).toHaveBeenCalledWith(['/profile'], {
      state: { justRegistered: true },
      replaceUrl: true
    });
  });
});
