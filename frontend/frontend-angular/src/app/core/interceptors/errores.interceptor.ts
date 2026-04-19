import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AutenticacionServicio } from '../servicios/autenticacion.servicio';

export const erroresInterceptor: HttpInterceptorFn = (req, next) => {
  const enrutador = inject(Router);
  const auth = inject(AutenticacionServicio);
  return next(req).pipe(
    catchError(err => {
      if (err.status === 401) {
        auth.cerrarSesion();
        enrutador.navigate(['/autenticacion/inicio-sesion']);
      }
      return throwError(() => err);
    })
  );
};
