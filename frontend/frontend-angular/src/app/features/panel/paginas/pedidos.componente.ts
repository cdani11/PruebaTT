import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { DatePipe, DecimalPipe } from '@angular/common';
import { PedidoServicio } from '../../../core/servicios/pedido.servicio';
import { ClienteServicio } from '../../../core/servicios/cliente.servicio';
import { EstadoPedido, DetallePedidoDto, Pedido } from '../../../core/modelos/pedido.modelo';
import { Cliente } from '../../../core/modelos/cliente.modelo';

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [FormsModule, DatePipe, DecimalPipe],
  template: `
    <div>

      <!-- Encabezado -->
      <div class="mb-6 flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-800">Pedidos</h1>
        <button (click)="abrirModal()"
                class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 active:scale-95 transition-transform">
          + Nuevo pedido
        </button>
      </div>

      <!-- Filtros -->
      <div class="mb-4 flex flex-wrap gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div class="flex flex-col gap-1">
          <label class="text-xs font-medium text-gray-500">Estado</label>
          <select [(ngModel)]="filtros.estado" (change)="aplicarFiltros()"
                  class="rounded-lg border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Todos</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="CONFIRMADO">Confirmado</option>
            <option value="ENTREGADO">Entregado</option>
            <option value="CANCELADO">Cancelado</option>
          </select>
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-xs font-medium text-gray-500">Desde</label>
          <input type="date" [(ngModel)]="filtros.fechaDesde" (change)="aplicarFiltros()"
                 class="rounded-lg border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-xs font-medium text-gray-500">Hasta</label>
          <input type="date" [(ngModel)]="filtros.fechaHasta" (change)="aplicarFiltros()"
                 class="rounded-lg border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-xs font-medium text-gray-500">Cliente</label>
          <select [(ngModel)]="filtros.clienteId" (change)="aplicarFiltros()"
                  class="rounded-lg border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Todos</option>
            @for (c of clientesDisponibles(); track c.id) {
              <option [value]="c.id">{{ c.nombres }} {{ c.apellidos }}</option>
            }
          </select>
        </div>
        @if (hayFiltrosActivos()) {
          <div class="flex items-end">
            <button (click)="limpiarFiltros()"
                    class="rounded-lg border px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-50 transition-colors">
              Limpiar filtros
            </button>
          </div>
        }
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
              <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">ID</th>
              <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Cliente</th>
              <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Fecha</th>
              <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Estado</th>
              <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 text-right">Total</th>
              <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            @if (cargando()) {
              <tr>
                <td colspan="6" class="px-4 py-10 text-center text-gray-400">
                  <span class="inline-block animate-pulse">Cargando pedidos...</span>
                </td>
              </tr>
            } @else if (pedidos().length === 0) {
              <tr>
                <td colspan="6" class="px-4 py-10 text-center text-gray-400">
                  No hay pedidos registrados.
                </td>
              </tr>
            } @else {
              @for (p of pedidos(); track p.id) {
                <tr class="hover:bg-gray-50 transition-colors">
                  <td class="px-4 py-3 font-mono text-xs text-gray-500" title="{{ p.id }}">
                    {{ p.id.slice(0, 8) }}…
                  </td>
                  <td class="px-4 py-3 font-mono text-xs text-gray-500" title="{{ p.clienteId }}">
                    {{ nombreCliente(p.clienteId) }}
                  </td>
                  <td class="px-4 py-3 text-gray-600">{{ p.fechaCreacion | date:'dd/MM/yyyy HH:mm' }}</td>
                  <td class="px-4 py-3">
                    <span [class]="badgeClase(p.estado)">{{ etiquetaEstado(p.estado) }}</span>
                  </td>
                  <td class="px-4 py-3 text-right font-medium text-gray-800">
                    $ {{ p.total | number:'1.2-2' }}
                  </td>
                  <td class="px-4 py-3 text-center">
                    <div class="flex items-center justify-center gap-1">
                      @if (p.estado === 'CONFIRMADO' || p.estado === 'PENDIENTE') {
                        <button (click)="abrirModalEditar(p)"
                                [disabled]="accionando() === p.id"
                                class="rounded-lg border border-gray-300 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                          Editar
                        </button>
                        <button (click)="completar(p.id)"
                                [disabled]="accionando() === p.id"
                                class="rounded-lg border border-blue-300 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                          {{ accionando() === p.id ? '...' : 'Completar' }}
                        </button>
                        <button (click)="cancelar(p.id)"
                                [disabled]="accionando() === p.id"
                                class="rounded-lg border border-orange-300 px-2 py-1 text-xs font-medium text-orange-600 hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                          Cancelar
                        </button>
                      }
                      <button (click)="eliminar(p.id)"
                              [disabled]="accionando() === p.id"
                              class="rounded-lg border border-red-300 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                        Eliminar
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
          <button (click)="paginaSiguiente()" [disabled]="pedidos().length < tamanio"
                  class="rounded border px-3 py-1.5 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            Siguiente →
          </button>
        </div>
      </div>

    </div>

    <!-- ========= MODAL EDITAR DETALLES ========= -->
    @if (modalEditarAbierto()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
           (click)="cerrarModalEditar()">
        <div class="flex w-full max-w-2xl flex-col rounded-xl bg-white shadow-2xl max-h-[90vh]"
             (click)="$event.stopPropagation()">

          <div class="flex items-center justify-between border-b px-6 py-4">
            <h2 class="text-lg font-bold text-gray-800">Editar detalles del pedido</h2>
            <button (click)="cerrarModalEditar()"
                    class="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">✕</button>
          </div>

          <div class="overflow-y-auto px-6 py-4">
            <form #formEditar="ngForm" (ngSubmit)="guardarEdicion(formEditar)">

              <div class="mb-2 flex items-center justify-between">
                <p class="text-xs font-semibold uppercase tracking-wide text-gray-500">Líneas del pedido</p>
                <button type="button" (click)="agregarDetalleEdicion()"
                        class="rounded-lg border px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors">
                  + Agregar línea
                </button>
              </div>

              <div class="overflow-hidden rounded-lg border">
                <div class="grid grid-cols-12 gap-2 bg-gray-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <span class="col-span-5">Producto</span>
                  <span class="col-span-2 text-center">Cant.</span>
                  <span class="col-span-3 text-right">Precio unit.</span>
                  <span class="col-span-1 text-right">Sub.</span>
                  <span class="col-span-1"></span>
                </div>

                @for (d of detallesEdicion; track $index) {
                  <div class="grid grid-cols-12 items-center gap-2 border-t px-3 py-2">
                    <input [(ngModel)]="detallesEdicion[$index].producto" [name]="'ep_' + $index" required
                           placeholder="Descripción"
                           class="col-span-5 rounded border px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    <input [(ngModel)]="detallesEdicion[$index].cantidad" [name]="'ec_' + $index"
                           type="number" min="1" required
                           class="col-span-2 rounded border px-2 py-1.5 text-center text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    <input [(ngModel)]="detallesEdicion[$index].precioUnitario" [name]="'epr_' + $index"
                           type="number" min="0.01" step="0.01" required
                           class="col-span-3 rounded border px-2 py-1.5 text-right text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    <span class="col-span-1 text-right text-xs text-gray-500">
                      {{ (d.cantidad * d.precioUnitario) | number:'1.2-2' }}
                    </span>
                    <button type="button" (click)="eliminarDetalleEdicion($index)"
                            [disabled]="detallesEdicion.length === 1"
                            class="col-span-1 flex justify-center text-gray-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed">
                      ✕
                    </button>
                  </div>
                }

                <div class="flex items-center justify-end gap-2 border-t bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-700">
                  <span>Total:</span>
                  <span>$ {{ totalEdicion() | number:'1.2-2' }}</span>
                </div>
              </div>

              @if (errorModal()) {
                <p class="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{{ errorModal() }}</p>
              }

              <div class="mt-5 flex justify-end gap-3">
                <button type="button" (click)="cerrarModalEditar()"
                        class="rounded-lg border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit"
                        [disabled]="formEditar.invalid || detallesEdicion.length === 0 || guardando()"
                        class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  {{ guardando() ? 'Guardando...' : 'Guardar cambios' }}
                </button>
              </div>

            </form>
          </div>
        </div>
      </div>
    }

    <!-- ========= MODAL CREAR PEDIDO ========= -->
    @if (modalAbierto()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
           (click)="cerrarModal()">
        <div class="flex w-full max-w-2xl flex-col rounded-xl bg-white shadow-2xl max-h-[90vh]"
             (click)="$event.stopPropagation()">

          <div class="flex items-center justify-between border-b px-6 py-4">
            <h2 class="text-lg font-bold text-gray-800">Nuevo pedido</h2>
            <button (click)="cerrarModal()"
                    class="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">✕</button>
          </div>

          <div class="overflow-y-auto px-6 py-4">
            <form #formPedido="ngForm" (ngSubmit)="crear(formPedido)">

              <div class="mb-5">
                <label class="mb-1 block text-xs font-medium text-gray-600">
                  Cliente <span class="text-red-500">*</span>
                </label>
                @if (cargandoClientes()) {
                  <p class="text-xs text-gray-400">Cargando clientes...</p>
                } @else {
                  <select [(ngModel)]="form.clienteId" name="clienteId" required
                          class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="" disabled>Selecciona un cliente</option>
                    @for (c of clientesDisponibles(); track c.id) {
                      <option [value]="c.id">{{ c.nombres }} {{ c.apellidos }} — {{ c.correoElectronico }}</option>
                    }
                  </select>
                }
              </div>

              <div class="mb-2 flex items-center justify-between">
                <p class="text-xs font-semibold uppercase tracking-wide text-gray-500">Líneas del pedido</p>
                <button type="button" (click)="agregarDetalle()"
                        class="rounded-lg border px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors">
                  + Agregar línea
                </button>
              </div>

              <div class="overflow-hidden rounded-lg border">
                <div class="grid grid-cols-12 gap-2 bg-gray-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <span class="col-span-5">Producto</span>
                  <span class="col-span-2 text-center">Cant.</span>
                  <span class="col-span-3 text-right">Precio unit.</span>
                  <span class="col-span-1 text-right">Sub.</span>
                  <span class="col-span-1"></span>
                </div>

                @if (detalles.length === 0) {
                  <p class="px-3 py-4 text-center text-xs text-gray-400">Sin líneas. Agrega al menos una.</p>
                }

                @for (d of detalles; track $index) {
                  <div class="grid grid-cols-12 items-center gap-2 border-t px-3 py-2">
                    <input [(ngModel)]="detalles[$index].producto" [name]="'producto_' + $index" required
                           placeholder="Descripción"
                           class="col-span-5 rounded border px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    <input [(ngModel)]="detalles[$index].cantidad" [name]="'cantidad_' + $index"
                           type="number" min="1" required
                           class="col-span-2 rounded border px-2 py-1.5 text-center text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    <input [(ngModel)]="detalles[$index].precioUnitario" [name]="'precio_' + $index"
                           type="number" min="0.01" step="0.01" required
                           class="col-span-3 rounded border px-2 py-1.5 text-right text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    <span class="col-span-1 text-right text-xs text-gray-500">
                      {{ (d.cantidad * d.precioUnitario) | number:'1.2-2' }}
                    </span>
                    <button type="button" (click)="eliminarDetalle($index)"
                            [disabled]="detalles.length === 1"
                            class="col-span-1 flex justify-center text-gray-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed">
                      ✕
                    </button>
                  </div>
                }

                @if (detalles.length > 0) {
                  <div class="flex items-center justify-end gap-2 border-t bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-700">
                    <span>Total:</span>
                    <span>$ {{ totalActual() | number:'1.2-2' }}</span>
                  </div>
                }
              </div>

              @if (errorModal()) {
                <p class="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{{ errorModal() }}</p>
              }

              <div class="mt-5 flex justify-end gap-3">
                <button type="button" (click)="cerrarModal()"
                        class="rounded-lg border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit"
                        [disabled]="formPedido.invalid || detalles.length === 0 || guardando()"
                        class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  {{ guardando() ? 'Guardando...' : 'Crear pedido' }}
                </button>
              </div>

            </form>
          </div>
        </div>
      </div>
    }
  `
})
export class PedidosComponente implements OnInit {
  private readonly pedidoSvc = inject(PedidoServicio);
  private readonly clienteSvc = inject(ClienteServicio);

  pedidos = signal<Pedido[]>([]);
  cargando = signal(false);
  error = signal<string | null>(null);
  pagina = signal(1);
  readonly tamanio = 20;

  modalAbierto = signal(false);
  modalEditarAbierto = signal(false);
  guardando = signal(false);
  errorModal = signal<string | null>(null);
  clientesDisponibles = signal<Cliente[]>([]);
  cargandoClientes = signal(false);

  accionando = signal<string | null>(null);

  form = { clienteId: '' };
  detalles: DetallePedidoDto[] = [{ producto: '', cantidad: 1, precioUnitario: 0 }];

  pedidoEditando: Pedido | null = null;
  detallesEdicion: DetallePedidoDto[] = [];

  filtros = { estado: '', fechaDesde: '', fechaHasta: '', clienteId: '' };

  ngOnInit(): void {
    this.cargarClientes();
    this.cargar();
  }

  cargarClientes(): void {
    this.clienteSvc.listar(1, 100).subscribe({
      next: lista => this.clientesDisponibles.set(lista),
      error: () => {}
    });
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    const f: Record<string, string> = {};
    if (this.filtros.estado)     f['estado']     = this.filtros.estado;
    if (this.filtros.fechaDesde) f['fechaDesde'] = this.filtros.fechaDesde;
    if (this.filtros.fechaHasta) f['fechaHasta'] = this.filtros.fechaHasta;
    if (this.filtros.clienteId)  f['clienteId']  = this.filtros.clienteId;

    this.pedidoSvc.listar(this.pagina(), this.tamanio, f).subscribe({
      next: lista => { this.pedidos.set(lista); this.cargando.set(false); },
      error: ()  => { this.error.set('No se pudieron cargar los pedidos.'); this.cargando.set(false); }
    });
  }

  aplicarFiltros(): void {
    this.pagina.set(1);
    this.cargar();
  }

  hayFiltrosActivos(): boolean {
    return !!(this.filtros.estado || this.filtros.fechaDesde || this.filtros.fechaHasta || this.filtros.clienteId);
  }

  limpiarFiltros(): void {
    this.filtros = { estado: '', fechaDesde: '', fechaHasta: '', clienteId: '' };
    this.aplicarFiltros();
  }

  paginaAnterior(): void {
    if (this.pagina() > 1) { this.pagina.update(p => p - 1); this.cargar(); }
  }

  paginaSiguiente(): void {
    if (this.pedidos().length === this.tamanio) { this.pagina.update(p => p + 1); this.cargar(); }
  }

  nombreCliente(clienteId: string): string {
    const c = this.clientesDisponibles().find(x => x.id === clienteId);
    return c ? `${c.nombres} ${c.apellidos}` : clienteId.slice(0, 8) + '…';
  }

  abrirModal(): void {
    this.form = { clienteId: '' };
    this.detalles = [{ producto: '', cantidad: 1, precioUnitario: 0 }];
    this.errorModal.set(null);
    this.cargandoClientes.set(true);
    this.clienteSvc.listar(1, 100).subscribe({
      next: lista => { this.clientesDisponibles.set(lista); this.cargandoClientes.set(false); },
      error: ()  => { this.cargandoClientes.set(false); }
    });
    this.modalAbierto.set(true);
  }

  cerrarModal(): void {
    if (this.guardando()) return;
    this.modalAbierto.set(false);
  }

  agregarDetalle(): void {
    this.detalles = [...this.detalles, { producto: '', cantidad: 1, precioUnitario: 0 }];
  }

  eliminarDetalle(indice: number): void {
    if (this.detalles.length === 1) return;
    this.detalles = this.detalles.filter((_, i) => i !== indice);
  }

  totalActual(): number {
    return this.detalles.reduce((sum, d) => sum + d.cantidad * d.precioUnitario, 0);
  }

  totalEdicion(): number {
    return this.detallesEdicion.reduce((sum, d) => sum + d.cantidad * d.precioUnitario, 0);
  }

  abrirModalEditar(p: Pedido): void {
    this.pedidoEditando = p;
    this.detallesEdicion = p.detalles.map(d => ({
      producto: d.producto,
      cantidad: d.cantidad,
      precioUnitario: d.precioUnitario,
    }));
    this.errorModal.set(null);
    this.modalEditarAbierto.set(true);
  }

  cerrarModalEditar(): void {
    if (this.guardando()) return;
    this.modalEditarAbierto.set(false);
    this.pedidoEditando = null;
  }

  agregarDetalleEdicion(): void {
    this.detallesEdicion = [...this.detallesEdicion, { producto: '', cantidad: 1, precioUnitario: 0 }];
  }

  eliminarDetalleEdicion(indice: number): void {
    if (this.detallesEdicion.length === 1) return;
    this.detallesEdicion = this.detallesEdicion.filter((_, i) => i !== indice);
  }

  guardarEdicion(formRef: NgForm): void {
    if (formRef.invalid || !this.pedidoEditando) return;
    this.guardando.set(true);
    this.errorModal.set(null);
    this.pedidoSvc.editarDetalles(
      this.pedidoEditando.id,
      this.detallesEdicion.map(d => ({
        producto: d.producto.trim(),
        cantidad: Number(d.cantidad),
        precioUnitario: Number(d.precioUnitario),
      }))
    ).subscribe({
      next: () => {
        this.guardando.set(false);
        this.modalEditarAbierto.set(false);
        this.pedidoEditando = null;
        this.cargar();
      },
      error: e => {
        this.errorModal.set(e?.error?.errores?.[0] ?? 'Error al guardar los cambios.');
        this.guardando.set(false);
      }
    });
  }

  crear(formRef: NgForm): void {
    if (formRef.invalid || this.detalles.length === 0) return;
    this.guardando.set(true);
    this.errorModal.set(null);
    this.pedidoSvc.crear({
      clienteId: this.form.clienteId,
      detalles: this.detalles.map(d => ({
        producto: d.producto.trim(),
        cantidad: Number(d.cantidad),
        precioUnitario: Number(d.precioUnitario)
      }))
    }).subscribe({
      next: () => {
        this.guardando.set(false);
        this.modalAbierto.set(false);
        this.pagina.set(1);
        this.cargar();
      },
      error: e => {
        this.errorModal.set(e?.error?.errores?.[0] ?? 'Error al crear el pedido.');
        this.guardando.set(false);
      }
    });
  }

  completar(id: string): void {
    if (!confirm('¿Confirmas que deseas marcar este pedido como completado/entregado?')) return;
    this.accionando.set(id);
    this.error.set(null);
    this.pedidoSvc.completar(id).subscribe({
      next: () => { this.accionando.set(null); this.cargar(); },
      error: e => {
        this.accionando.set(null);
        this.error.set(e?.error?.errores?.[0] ?? 'Error al completar el pedido.');
      }
    });
  }

  cancelar(id: string): void {
    if (!confirm('¿Confirmas que deseas cancelar este pedido?')) return;
    this.accionando.set(id);
    this.error.set(null);
    this.pedidoSvc.cancelar(id).subscribe({
      next: () => { this.accionando.set(null); this.cargar(); },
      error: e => {
        this.accionando.set(null);
        this.error.set(e?.error?.errores?.[0] ?? 'Error al cancelar el pedido.');
      }
    });
  }

  eliminar(id: string): void {
    if (!confirm('¿Confirmas que deseas eliminar este pedido? Esta acción no se puede deshacer.')) return;
    this.accionando.set(id);
    this.error.set(null);
    this.pedidoSvc.eliminar(id).subscribe({
      next: () => { this.accionando.set(null); this.cargar(); },
      error: e => {
        this.accionando.set(null);
        this.error.set(e?.error?.errores?.[0] ?? 'Error al eliminar el pedido.');
      }
    });
  }

  etiquetaEstado(estado: EstadoPedido): string {
    const labels: Record<EstadoPedido, string> = {
      PENDIENTE:  'Pendiente',
      CONFIRMADO: 'Confirmado',
      ENTREGADO:  'Entregado',
      CANCELADO:  'Cancelado',
    };
    return labels[estado] ?? estado;
  }

  badgeClase(estado: EstadoPedido): string {
    const estilos: Record<EstadoPedido, string> = {
      CONFIRMADO: 'bg-green-100 text-green-700',
      CANCELADO:  'bg-red-100 text-red-700',
      PENDIENTE:  'bg-yellow-100 text-yellow-700',
      ENTREGADO:  'bg-blue-100 text-blue-700',
    };
    return `rounded-full px-2 py-0.5 text-xs font-medium ${estilos[estado] ?? 'bg-gray-100 text-gray-600'}`;
  }
}
