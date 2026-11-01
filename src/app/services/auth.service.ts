import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface AuthUser {
  id: string;       // === ДОБАВИЛИ ОБЯЗАТЕЛЬНОЕ ПОЛЕ ID ===
  username: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {

  private userSubject = new BehaviorSubject<AuthUser | null>(null);
  user$ = this.userSubject.asObservable();

  constructor() {
    this.restore();
  }

  get currentUser(): AuthUser | null {
    return this.userSubject.value;
  }

  isLoggedIn(): boolean {
    return !!this.userSubject.value;
  }

  // === ИЗМЕНЕНИЕ: Метод теперь принимает и сохраняет id и username ===
  login(id: string, username: string) {
    const user: AuthUser = { id, username };
    this.userSubject.next(user);
    localStorage.setItem('user', JSON.stringify(user));
  }

  logout() {
    this.userSubject.next(null);
    localStorage.removeItem('user');
  }

  restore() {
    const user = localStorage.getItem('user');
    if (user) {
      this.userSubject.next(JSON.parse(user));
    }
  }
}
