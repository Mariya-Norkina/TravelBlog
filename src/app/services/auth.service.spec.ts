
import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';

import { AuthService, AuthUser } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const apiUrl = '/api/auth';

  const mockUser: AuthUser = {
    id: 'user-1',
    username: 'TestUser'
  };

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService]
    });

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    service = TestBed.inject(AuthService);

    expect(service).toBeTruthy();
  });

  it('должен восстанавливать пользователя из localStorage', () => {
    localStorage.setItem('token', 'test-token');
    localStorage.setItem('user', JSON.stringify(mockUser));

    service = TestBed.inject(AuthService);

    expect(service.currentUser).toEqual(mockUser);
    expect(service.getToken()).toBe('test-token');
    expect(service.isLoggedIn()).toBeTrue();
  });

  it('должен выполнять вход через сервер и сохранять JWT и пользователя', () => {
    service = TestBed.inject(AuthService);

    const credentials = {
      username: 'TestUser',
      password: 'password123'
    };

    service.loginServer(credentials).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/login`);

    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(credentials);

    req.flush({
      token: 'server-jwt-token',
      user: mockUser
    });

    expect(localStorage.getItem('token')).toBe('server-jwt-token');
    expect(JSON.parse(localStorage.getItem('user')!)).toEqual(mockUser);
    expect(service.currentUser).toEqual(mockUser);
    expect(service.isLoggedIn()).toBeTrue();
  });

  it('должен выполнять выход и очищать данные пользователя', () => {
    service = TestBed.inject(AuthService);

    service.loginServer({
      username: 'TestUser',
      password: 'password123'
    }).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/login`);

    req.flush({
      token: 'test-token',
      user: mockUser
    });

    service.logout();

    expect(service.currentUser).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(service.isLoggedIn()).toBeFalse();
  });

  it('должен регистрировать пользователя через POST', () => {
    service = TestBed.inject(AuthService);

    const userData = {
      username: 'NewUser',
      password: 'password123'
    };

    service.register(userData).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/register`);

    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(userData);

    req.flush({ message: 'Пользователь зарегистрирован' });
  });

  it('должен удалять аккаунт через DELETE', () => {
    service = TestBed.inject(AuthService);

    service.deleteAccount().subscribe();

    const req = httpMock.expectOne(
      `${apiUrl}/delete-account`
    );

    expect(req.request.method).toBe('DELETE');

    req.flush(null);

    expect(service.currentUser).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });

  it('должен сохранять пользователя при обычном login', () => {
    service = TestBed.inject(AuthService);

    service.login(mockUser.id, mockUser.username);

    expect(service.currentUser).toEqual(mockUser);
    expect(JSON.parse(localStorage.getItem('user')!)).toEqual(mockUser);
  });

  it('не должен считать пользователя авторизованным без JWT', () => {
    service = TestBed.inject(AuthService);

    service.login(mockUser.id, mockUser.username);

    expect(service.currentUser).toEqual(mockUser);
    expect(service.isLoggedIn()).toBeFalse();
  });
});
