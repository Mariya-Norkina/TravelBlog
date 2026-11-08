
import { HttpRequest, HttpResponse, HttpHandlerFn } from '@angular/common/http';
import { of } from 'rxjs';

import { jwtInterceptor } from './jwt.interceptor';

describe('jwtInterceptor', () => {
  let request: HttpRequest<unknown>;

  beforeEach(() => {
    localStorage.clear();
    request = new HttpRequest('GET', '/api/posts');
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('должен добавлять JWT в заголовок Authorization', () => {
    localStorage.setItem('token', 'test-jwt-token');

    let interceptedRequest: HttpRequest<unknown> | undefined;

    const next: HttpHandlerFn = req => {
      interceptedRequest = req;
      return of(new HttpResponse({ status: 200 }));
    };

    jwtInterceptor(request, next).subscribe();

    expect(interceptedRequest?.headers.get('Authorization'))
      .toBe('Bearer test-jwt-token');
  });

  it('не должен добавлять Authorization, если токена нет', () => {
    let interceptedRequest: HttpRequest<unknown> | undefined;

    const next: HttpHandlerFn = req => {
      interceptedRequest = req;
      return of(new HttpResponse({ status: 200 }));
    };

    jwtInterceptor(request, next).subscribe();

    expect(interceptedRequest?.headers.has('Authorization'))
      .toBeFalse();
  });
});
