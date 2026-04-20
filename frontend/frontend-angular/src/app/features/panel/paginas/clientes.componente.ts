import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ClienteServicio } from '../../../core/servicios/cliente.servicio';
import { Cliente } from '../../../core/modelos/cliente.modelo';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [FormsModule, DatePipe],
  template: `
    <div>

      <!-- Encabezado -->
      <div class="mb-6 flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-800">Clientes</h1>
        <button (click)="abrirModalCrear()"
                class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 active:scale-95 transition-transform">
          + Nuevo cliente
        </button>
      </div>

      <!-- Banner de error -->
      @if (error()) {
        <div class="mb-4 flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          <span class="font-medium">Error:</span> {{ error() }}
          <button (click)="cargar()" class="ml-auto underline hover:no-underline">Reintentar</button>
        </div>
      }

      <!-- Tabla -->
      <div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table class="w-full text-left text-sm">
          <thead class="border-b bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Nombre completo</th>
              <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Correo electrónico</th>
              <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Teléfono</th>
              <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Registro</th>
              <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Estado</th>
              <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            @if (cargando()) {
              <tr>
                <td colspan="6" class="px-4 py-10 text-center text-gray-400">
                  <span class="inline-block animate-pulse">Cargando clientes...</span>
                </td>
              </tr>
            } @else if (clientes().length === 0) {
              <tr>
                <td colspan="6" class="px-4 py-10 text-center text-gray-400">
                  No hay clientes registrados. ¡Crea el primero!
                </td>
              </tr>
            } @else {
              @for (c of clientes(); track c.id) {
                <tr class="hover:bg-gray-50 transition-colors">
                  <td class="px-4 py-3 font-medium text-gray-900">{{ c.nombres }} {{ c.apellidos }}</td>
                  <td class="px-4 py-3 text-gray-600">{{ c.correoElectronico }}</td>
                  <td class="px-4 py-3 text-gray-600">{{ c.telefono ?? '—' }}</td>
                  <td class="px-4 py-3 text-gray-500">{{ c.fechaRegistro | date:'dd/MM/yyyy' }}</td>
                  <td class="px-4 py-3">
                    @if (c.activo) {
                      <span class="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Activo</span>
                    } @else {
                      <span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">Inactivo</span>
                    }
                  </td>
                  <td class="px-4 py-3 text-center">
                    <div class="flex items-center justify-center gap-2">
                      <button (click)="abrirModalEditar(c)"
                              class="rounded-lg border border-gray-300 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                        Editar
                      </button>
                      <button (click)="eliminar(c.id)"
                              [disabled]="eliminando() === c.id"
                              class="rounded-lg border border-red-300 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                        {{ eliminando() === c.id ? '...' : 'Eliminar' }}
                      </button>
                    </div>
                  </td>
                </tr>
              }
            }
          </tbody>
        </table>
      </div>

      <!-- Paginación -->
      <div class="mt-4 flex items-center justify-between text-sm text-gray-600">
        <span>Página {{ pagina() }}</span>
        <div class="flex gap-2">
          <button (click)="paginaAnterior()" [disabled]="pagina() === 1"
                  class="rounded border px-3 py-1.5 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            ← Anterior
          </button>
          <button (click)="paginaSiguiente()" [disabled]="clientes().length < tamanio"
                  class="rounded border px-3 py-1.5 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            Siguiente →
          </button>
        </div>
      </div>

    </div>

    <!-- ========= MODAL CREAR / EDITAR CLIENTE ========= -->
    @if (modalAbierto()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
           (click)="cerrarModal()">
        <div class="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"
             (click)="$event.stopPropagation()">

          <div class="mb-5 flex items-center justify-between">
            <h2 class="text-lg font-bold text-gray-800">
              {{ modoEditar() ? 'Editar cliente' : 'Nuevo cliente' }}
            </h2>
            <button (click)="cerrarModal()"
                    class="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">✕</button>
          </div>

          <form #formCliente="ngForm" (ngSubmit)="guardar(formCliente)">

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="mb-1 block text-xs font-medium text-gray-600">Nombres <span class="text-red-500">*</span></label>
                <input [(ngModel)]="form.nombres" name="nombres" required
                       class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                       placeholder="Juan" />
              </div>
              <div>
                <label class="mb-1 block text-xs font-medium text-gray-600">Apellidos <span class="text-red-500">*</span></label>
                <input [(ngModel)]="form.apellidos" name="apellidos" required
                       class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                       placeholder="Pérez" />
              </div>
            </div>

            <div class="mt-3">
              <label class="mb-1 block text-xs font-medium text-gray-600">Correo electrónico <span class="text-red-500">*</span></label>
              <input [(ngModel)]="form.correoElectronico" name="correo" type="email" required
                     class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                     placeholder="juan@ejemplo.com" />
            </div>

            <div class="mt-3">
              <label class="mb-1 block text-xs font-medium text-gray-600">Teléfono</label>
              <input [(ngModel)]="form.telefono" name="telefono"
                     class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                     placeholder="+504 9999-9999" />
            </div>

            @if (errorModal()) {
              <p class="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{{ errorModal() }}</p>
            }

            <div class="mt-5 flex justify-end gap-3">
              <button type="button" (click)="cerrarModal()"
                      class="rounded-lg border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                Cancelar
              </button>
              <button type="submit" [disabled]="formCliente.invalid || guardando()"
                      class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                {{ guardando() ? 'Guardando...' : (modoEditar() ? 'Actualizar' : 'Guardar cliente') }}
              </button>
            </div>

          </form>
        </div>
      </div>
    }
  `
})
export class ClientesComponente implements OnInit {
  private readonly svc = inject(ClienteServicio);

  clientes = signal<Cliente[]>([]);
  cargando = signal(false);
  error = signal<string | null>(null);
  pagina = signal(1);
  readonly tamanio = 20;

  modalAbierto = signal(false);
  modoEditar = signal(false);
  guardando = signal(false);
  eliminando = signal<string | null>(null);
  errorModal = signal<string | null>(null);
  clienteEditandoId = signal<string | null>(null);

  form = { nombres: '', apellidos: '', correoElectronico: '', telefono: '' };

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.svc.listar(this.pagina(), this.tamanio).subscribe({
      next: lista => { this.clientes.set(lista); this.cargando.set(false); },
      error: ()  => { this.error.set('No se pudieron cargar los clientes.'); this.cargando.set(false); }
    });
  }

  paginaAnterior(): void {
    if (this.pagina() > 1) { this.pagina.update(p => p - 1); this.cargar(); }
  }

  paginaSiguiente(): void {
    if (this.clientes().length === this.tamanio) { this.pagina.update(p => p + 1); this.cargar(); }
  }

  abrirModalCrear(): void {
    this.form = { nombres: '', apellidos: '', correoElectronico: '', telefono: '' };
    this.modoEditar.set(false);
    this.clienteEditandoId.set(null);
    this.errorModal.set(null);
    this.modalAbierto.set(true);
  }

  abrirModalEditar(c: Cliente): void {
    this.form = {
      nombres: c.nombres,
      apellidos: c.apellidos,
      correoElectronico: c.correoElectronico,
      telefono: c.telefono ?? ''
    };
    this.modoEditar.set(true);
    this.clienteEditandoId.set(c.id);
    this.errorModal.set(null);
    this.modalAbierto.set(true);
  }

  cerrarModal(): void {
    if (this.guardando()) return;
    this.modalAbierto.set(false);
  }

  guardar(formRef: NgForm): void {
    if (formRef.invalid) return;
    this.guardando.set(true);
    this.errorModal.set(null);

    const dto = {
      nombres: this.form.nombres.trim(),
      apellidos: this.form.apellidos.trim(),
      correoElectronico: this.form.correoElectronico.trim(),
      ...(this.form.telefono.trim() ? { telefono: this.form.telefono.trim() } : {})
    };

    const op = this.modoEditar()
      ? this.svc.actualizar(this.clienteEditandoId()!, dto)
      : this.svc.crear(dto);

    op.subscribe({
      next: () => {
        this.guardando.set(false);
        this.modalAbierto.set(false);
        if (!this.modoEditar()) this.pagina.set(1);
        this.cargar();
      },
      error: e => {
        this.errorModal.set(e?.error?.errores?.[0] ?? 'Error al guardar el cliente.');
        this.guardando.set(false);
      }
    });
  }

  eliminar(id: string): void {
    if (!confirm('¿Confirmas que deseas eliminar este cliente?')) return;
    this.eliminando.set(id);
    this.error.set(null);
    this.svc.eliminar(id).subscribe({
      next: () => { this.eliminando.set(null); this.cargar(); },
      error: e => {
        this.eliminando.set(null);
        this.error.set(e?.error?.errores?.[0] ?? 'Error al eliminar el cliente.');
      }
    });
  }
}
