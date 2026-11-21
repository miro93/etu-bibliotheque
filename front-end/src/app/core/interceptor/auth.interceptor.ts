import {HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpHeaders, HttpRequest} from '@angular/common/http';
import {AuthService} from '../service/auth.service';
import {catchError, Observable, throwError} from "rxjs";
import {inject} from '@angular/core';
import {Router} from '@angular/router';
import {MatDialog} from '@angular/material/dialog';

export function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  const auth = inject(AuthService);
  const router = inject(Router);
  const dialog = inject(MatDialog);
  const token = auth.getToken()

  if (!token || /\/api\/(login|register)$/.test(req.url)) {
    return next(req)
  }

  const newReq = req.clone({
    setHeaders: {Authorization: `Bearer ${token}`}
  })

  return next(newReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        auth.logout()
        // sinon un dialogue ouvert resterait affiché par-dessus la page de login
        dialog.closeAll()
        void router.navigateByUrl('/login')
      }

      return throwError(() => err);
    })
  )
}
