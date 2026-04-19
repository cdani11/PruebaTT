import { Routes } from '@angular/router';

export const rutasPanel: Routes = [
  {
    path: '',
    loadComponent: () => import('./layout/panel.layout').then(m => m.PanelLayout),
    children: [
      { path: '', redirectTo: 'tablero', pathMatch: 'full' },
      {
        path: 'tablero',
        loadComponent: () => import('./paginas/tablero.componente').then(m => m.TableroComponente)
      },
      {
        path: 'clientes',
        loadComponent: () => import('./paginas/clientes.componente').then(m => m.ClientesComponente)
      },
      {
        path: 'pedidos',
        loadComponent: () => import('./paginas/pedidos.componente').then(m => m.PedidosComponente)
      }
    ]
  }
];
