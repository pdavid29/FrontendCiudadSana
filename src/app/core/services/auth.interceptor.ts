import { HttpInterceptorFn } from '@angular/common/http';

const SESSION_KEY = 'ciudad-sana-session-v2';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  if (typeof localStorage === 'undefined') return next(request);
  try {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null') as { token?: string } | null;
    if (session?.token) request = request.clone({ setHeaders: { Authorization: `Bearer ${session.token}` } });
  } catch { /* Ignore a malformed local session; the API will require a new login. */ }
  return next(request);
};
