import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AutenticacionServicio } from '../../../core/servicios/autenticacion.servicio';

@Component({
  selector: 'app-panel-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="flex min-h-screen">
      <aside class="flex w-60 flex-col bg-slate-800 p-4 text-white">
        <h2 class="mb-6 text-xl font-bold">PruebaTT</h2>
        <nav class="flex flex-col gap-2">
          <a routerLink="/tablero" routerLinkActive="bg-slate-700" class="rounded p-2 hover:bg-slate-700">Tablero</a>
          <a routerLink="/clientes" routerLinkActive="bg-slate-700" class="rounded p-2 hover:bg-slate-700">Clientes</a>
          <a routerLink="/pedidos" routerLinkActive="bg-slate-700" class="rounded p-2 hover:bg-slate-700">Pedidos</a>
        </nav>
        <button (click)="cerrarSesion()" class="mt-auto w-full rounded bg-red-600 p-2">Cerrar sesión</button>
      </aside>
      <main class="flex-1 p-6"><router-outlet /></main>
    </div>
  `
})
export class PanelLayout {
  private readonly auth = inject(AutenticacionServicio);
  private readonly enrutador = inject(Router);

  cerrarSesion(): void {
    this.auth.cerrarSesion();
    this.enrutador.navigate(['/autenticacion/inicio-sesion']);
  }
}
