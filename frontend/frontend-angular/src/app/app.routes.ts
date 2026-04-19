import { Routes } from '@angular/router';
import { autenticacionGuard } from './core/guards/autenticacion.guard';

export const rutas: Routes = [
  {
    path: 'autenticacion',
    loadChildren: () => import('./features/autenticacion/autenticacion.routes').then(m => m.rutasAutenticacion)
  },
  {
    path: '',
    canActivate: [autenticacionGuard],
    loadChildren: () => import('./features/panel/panel.routes').then(m => m.rutasPanel)
  },
  { path: '**', redirectTo: 'autenticacion/inicio-sesion' }
];
