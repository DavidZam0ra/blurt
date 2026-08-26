import { HttpInterceptorFn } from '@angular/common/http';

export const sessionInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req.clone({ withCredentials: true }));
};
