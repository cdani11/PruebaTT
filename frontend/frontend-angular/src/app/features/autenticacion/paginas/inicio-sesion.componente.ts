import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AutenticacionServicio } from '../../../core/servicios/autenticacion.servicio';

@Component({
  selector: 'app-inicio-sesion',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="flex min-h-screen items-center justify-center">
      <form (ngSubmit)="enviar()" class="w-full max-w-sm rounded-xl bg-white p-8 shadow">
        <h1 class="mb-6 text-2xl font-bold">Iniciar sesión</h1>
        <input [(ngModel)]="correoElectronico" name="correo" type="email" placeholder="Correo"
               class="mb-3 w-full rounded border p-2" required />
        <input [(ngModel)]="clave" name="clave" type="password" placeholder="Clave"
               class="mb-4 w-full rounded border p-2" required />
        @if (error()) { <p class="mb-3 text-sm text-red-600">{{ error() }}</p> }
        <button class="w-full rounded bg-blue-600 p-2 text-white hover:bg-blue-700">Entrar</button>
        <a routerLink="/autenticacion/registro" class="mt-3 block text-center text-sm text-blue-600">Crear cuenta</a>
      </form>
    </div>
  `
})
export class InicioSesionComponente {
  private readonly auth = inject(AutenticacionServicio);
  private readonly enrutador = inject(Router);
  correoElectronico = '';
  clave = '';
  error = signal<string | null>(null);

  enviar(): void {
    this.auth.iniciarSesion(this.correoElectronico, this.clave).subscribe({
      next: () => this.enrutador.navigate(['/']),
      error: e => this.error.set(e?.error?.errores?.[0] ?? 'Error al iniciar sesión.')
    });
  }
}
