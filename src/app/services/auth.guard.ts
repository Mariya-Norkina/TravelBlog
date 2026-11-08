
import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean | UrlTree {

    if (this.auth.isLoggedIn()) {
      console.log('AUTH GUARD: Доступ разрешён');
      return true;
    }

    console.warn('AUTH GUARD: Пользователь не авторизован');

    return this.router.createUrlTree(['/login']);
  }
}
