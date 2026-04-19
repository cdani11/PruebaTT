import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AutenticacionServicio } from '../servicios/autenticacion.servicio';

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AutenticacionServicio).obtenerToken();
  if (!token) return next(req);
  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
