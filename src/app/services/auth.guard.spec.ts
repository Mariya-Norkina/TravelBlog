
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';

import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let authService: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(() => {
    authService = jasmine.createSpyObj('AuthService', ['isLoggedIn']);

    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        provideRouter([]),
        { provide: AuthService, useValue: authService }
      ]
    });

    guard = TestBed.inject(AuthGuard);
    router = TestBed.inject(Router);
  });

  it('должен разрешать доступ авторизованному пользователю', () => {
    authService.isLoggedIn.and.returnValue(true);

    expect(guard.canActivate()).toBeTrue();
  });

  it('должен перенаправлять неавторизованного пользователя на login', () => {
    authService.isLoggedIn.and.returnValue(false);

    const result = guard.canActivate();

    expect(result instanceof UrlTree).toBeTrue();

    if (result instanceof UrlTree) {
      expect(router.serializeUrl(result)).toBe('/login');
    }
  });
});
