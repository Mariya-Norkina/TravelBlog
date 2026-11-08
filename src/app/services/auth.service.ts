import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

export interface AuthUser {
  id: string;
  username: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = '/api/auth'; 

  private userSubject = new BehaviorSubject<AuthUser | null>(null);
  user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient) {
    this.restore();
  }

  get currentUser(): AuthUser | null {
    return this.userSubject.value;
  }

isLoggedIn(): boolean {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');

  return !!token && !!user && !!this.userSubject.value;
}

  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData);
  }

  //метод для синхронизации локального состояния
  login(id: string, username: string) {
    const user: AuthUser = { id, username };
    this.userSubject.next(user);
    localStorage.setItem('user', JSON.stringify(user));
  }

  //реальный запрос на .NET
loginServer(credentials: {
  username: string,
  password: string
}): Observable<any> {

  return this.http.post<any>(
    '/api/auth/login',
    credentials
  ).pipe(

    tap(response => {

      console.log('LOGIN RESPONSE:', response);

      if (response && response.token && response.user) {

        localStorage.setItem('token', response.token);

        const authUser: AuthUser = {
          id: response.user.id,
          username: response.user.username
        };

        localStorage.setItem('user', JSON.stringify(authUser));

        this.userSubject.next(authUser);

        console.log('TOKEN SAVED:', !!localStorage.getItem('token'));
        console.log('USER SAVED:', this.userSubject.value);
        console.log('IS LOGGED IN:', this.isLoggedIn());

      } else {
        console.error('ОШИБКА: Сервер вернул неожиданный формат ответа');
      }

    })

  );
}


  changePassword(passwords: { OldPassword: string, NewPassword: string }): Observable<any> {
    // Шлем запрос на AuthController бэкенда
    return this.http.post('/api/auth/change-password', passwords);
  }

  deleteAccount(): Observable<any> {
    // Шлем запрос на AuthController бэкенда
    return this.http.delete('/api/auth/delete-account').pipe(
      tap(() => this.logout())
    );
  }

  logout() {
    this.userSubject.next(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  }

restore() {
  const user = localStorage.getItem('user');
  const token = localStorage.getItem('token');

  if (user && token) {
    try {
      this.userSubject.next(JSON.parse(user));
    } catch {
      this.logout();
    }
  } else {
    this.logout();
  }
}

  getToken(): string | null {
    return localStorage.getItem('token');
  }
}
