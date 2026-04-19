import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AutenticacionServicio } from '../servicios/autenticacion.servicio';

export const autenticacionGuard: CanActivateFn = () => {
  const auth = inject(AutenticacionServicio);
  const enrutador = inject(Router);
  if (auth.autenticado()) return true;
  enrutador.navigate(['/autenticacion/inicio-sesion']);
  return false;
};
