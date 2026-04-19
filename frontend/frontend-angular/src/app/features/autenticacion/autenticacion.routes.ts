import { Routes } from '@angular/router';

export const rutasAutenticacion: Routes = [
  {
    path: 'inicio-sesion',
    loadComponent: () => import('./paginas/inicio-sesion.componente').then(m => m.InicioSesionComponente)
  },
  {
    path: 'registro',
    loadComponent: () => import('./paginas/registro.componente').then(m => m.RegistroComponente)
  },
  { path: '', redirectTo: 'inicio-sesion', pathMatch: 'full' }
];
