import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AutenticacionServicio } from '../../../core/servicios/autenticacion.servicio';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="flex min-h-screen items-center justify-center">
      <form (ngSubmit)="enviar()" class="w-full max-w-sm rounded-xl bg-white p-8 shadow">
        <h1 class="mb-6 text-2xl font-bold">Registro</h1>
        <input [(ngModel)]="nombreUsuario" name="usuario" placeholder="Usuario"
               class="mb-3 w-full rounded border p-2" required />
        <input [(ngModel)]="correoElectronico" name="correo" type="email" placeholder="Correo"
               class="mb-3 w-full rounded border p-2" required />
        <input [(ngModel)]="clave" name="clave" type="password" placeholder="Clave"
               class="mb-4 w-full rounded border p-2" required />
        @if (error()) { <p class="mb-3 text-sm text-red-600">{{ error() }}</p> }
        <button class="w-full rounded bg-blue-600 p-2 text-white hover:bg-blue-700">Crear cuenta</button>
        <a routerLink="/autenticacion/inicio-sesion" class="mt-3 block text-center text-sm text-blue-600">Ya tengo cuenta</a>
      </form>
    </div>
  `
})
export class RegistroComponente {
  private readonly auth = inject(AutenticacionServicio);
  private readonly enrutador = inject(Router);
  nombreUsuario = '';
  correoElectronico = '';
  clave = '';
  error = signal<string | null>(null);

  enviar(): void {
    this.auth.registrar(this.nombreUsuario, this.correoElectronico, this.clave).subscribe({
      next: () => this.enrutador.navigate(['/']),
      error: e => this.error.set(e?.error?.errores?.[0] ?? 'Error al registrarse.')
    });
  }
}
