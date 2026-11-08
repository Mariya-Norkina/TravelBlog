
import { HttpInterceptorFn } from '@angular/common/http';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {

  let token = localStorage.getItem('token');

  // Проверяем, вызывается ли Interceptor вообще
  console.log('JWT INTERCEPTOR ВЫЗВАН:', req.method, req.url);

  if (token) {
    try {
      // Если токен сохранён как JSON-строка
      const parsed = JSON.parse(token);

      if (typeof parsed === 'string') {
        token = parsed;
      }
    } catch {
      // Если это обычная строка JWT, оставляем без изменений
    }

    token = token.trim();

    // Убираем лишние кавычки
    token = token.replace(/^["']|["']$/g, '');

    console.log('JWT TOKEN НАЙДЕН:', !!token);

    if (token) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log('AUTHORIZATION HEADER ДОБАВЛЕН');
    }
  } else {
    console.warn('JWT TOKEN НЕ НАЙДЕН В LOCAL STORAGE');
  }

  return next(req);
};
