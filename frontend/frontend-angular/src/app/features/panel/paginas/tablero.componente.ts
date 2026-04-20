import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe, PercentPipe } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);
import { EstadisticasServicio } from '../../../core/servicios/estadisticas.servicio';
import { Estadisticas } from '../../../core/modelos/estadisticas.modelo';

@Component({
  selector: 'app-tablero',
  standalone: true,
  imports: [DecimalPipe, PercentPipe, NgChartsModule],
  template: `
    <div>
      <h1 class="mb-6 text-2xl font-bold text-gray-800">Dashboard</h1>

      @if (cargando()) {
        <div class="flex h-64 items-center justify-center text-gray-400 animate-pulse">
          Cargando estadísticas...
        </div>
      } @else if (error()) {
        <div class="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {{ error() }}
          <button (click)="cargar()" class="ml-2 underline">Reintentar</button>
        </div>
      } @else if (stats()) {

        <!-- Tarjetas resumen -->
        <div class="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p class="text-xs font-medium uppercase tracking-wide text-gray-500">Total pedidos</p>
            <p class="mt-2 text-3xl font-bold text-gray-800">{{ stats()!.resumen.totalPedidos }}</p>
          </div>
          <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p class="text-xs font-medium uppercase tracking-wide text-gray-500">Completados</p>
            <p class="mt-2 text-3xl font-bold text-green-600">{{ stats()!.resumen.completados }}</p>
            @if (stats()!.resumen.totalPedidos > 0) {
              <p class="mt-1 text-xs text-gray-400">
                {{ stats()!.resumen.completados / stats()!.resumen.totalPedidos | percent:'1.0-0' }} del total
              </p>
            }
          </div>
          <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p class="text-xs font-medium uppercase tracking-wide text-gray-500">En curso</p>
            <p class="mt-2 text-3xl font-bold text-yellow-500">{{ stats()!.resumen.pendientesYConfirmados }}</p>
            <p class="mt-1 text-xs text-gray-400">Pendientes + Confirmados</p>
          </div>
          <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p class="text-xs font-medium uppercase tracking-wide text-gray-500">Clientes activos</p>
            <p class="mt-2 text-3xl font-bold text-blue-600">{{ stats()!.resumen.totalClientes }}</p>
          </div>
        </div>

        <!-- Gráficas -->
        <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">

          <!-- Actividad diaria -->
          <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 class="mb-1 text-sm font-semibold text-gray-700">Pedidos diarios — últimos 30 días</h2>
            <p class="mb-3 text-xs text-gray-400">Barras: pedidos reales · Línea: media móvil 7 días</p>
            <canvas baseChart [data]="chartDiario" [options]="chartDiarioOpts" type="bar"></canvas>
          </div>

          <!-- Actividad mensual -->
          <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 class="mb-1 text-sm font-semibold text-gray-700">Actividad mensual</h2>
            <p class="mb-3 text-xs text-gray-400">Total de pedidos por mes</p>
            <canvas baseChart [data]="chartMensual" [options]="chartMensualOpts" type="bar"></canvas>
          </div>

        </div>

        <!-- Distribución de estados -->
        <div class="mt-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 class="mb-4 text-sm font-semibold text-gray-700">Distribución por estado</h2>
          <div class="flex flex-wrap gap-4">
            @for (item of distribucion(); track item.label) {
              <div class="flex items-center gap-3 rounded-lg border px-4 py-3 min-w-[160px]">
                <span class="h-3 w-3 rounded-full" [style.background]="item.color"></span>
                <div>
                  <p class="text-xs text-gray-500">{{ item.label }}</p>
                  <p class="text-xl font-bold text-gray-800">{{ item.valor }}</p>
                </div>
              </div>
            }
          </div>
        </div>

      }
    </div>
  `
})
export class TableroComponente implements OnInit {
  private readonly svc = inject(EstadisticasServicio);

  stats    = signal<Estadisticas | null>(null);
  cargando = signal(true);
  error    = signal<string | null>(null);

  chartDiario:  ChartConfiguration['data'] = { datasets: [], labels: [] };
  chartMensual: ChartConfiguration['data'] = { datasets: [], labels: [] };

  chartDiarioOpts: ChartConfiguration['options'] = {
    responsive: true,
    plugins: { legend: { position: 'bottom' } },
    scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
  };

  chartMensualOpts: ChartConfiguration['options'] = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
  };

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.svc.obtener().subscribe({
      next: data => {
        this.stats.set(data);
        this._construirCharts(data);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar las estadísticas. Verifica que el servicio esté activo (puerto 8001).');
        this.cargando.set(false);
      },
    });
  }

  distribucion(): { label: string; valor: number; color: string }[] {
    const r = this.stats()?.resumen;
    if (!r) return [];
    return [
      { label: 'Completados',  valor: r.completados,            color: '#10b981' },
      { label: 'En curso',     valor: r.pendientesYConfirmados, color: '#f59e0b' },
      { label: 'Cancelados',   valor: r.cancelados,             color: '#ef4444' },
    ];
  }

  private _construirCharts(data: Estadisticas): void {
    // Gráfica diaria: barras + línea media móvil
    this.chartDiario = {
      labels: data.actividadDiaria.map(p => p.fecha.slice(5)),
      datasets: [
        {
          type: 'bar' as const,
          data: data.actividadDiaria.map(p => p.pedidos),
          label: 'Pedidos',
          backgroundColor: 'rgba(59,130,246,0.5)',
          borderColor: '#3b82f6',
          borderWidth: 1,
        },
        {
          type: 'line' as const,
          data: data.actividadDiaria.map(p => p.mediaMovil7d),
          label: 'Media móvil 7d',
          borderColor: '#f59e0b',
          borderDash: [5, 5],
          pointRadius: 0,
          tension: 0.3,
          fill: false,
        },
      ],
    };

    // Gráfica mensual: barras simples
    this.chartMensual = {
      labels: data.actividadMensual.map(p => p.mes),
      datasets: [
        {
          data: data.actividadMensual.map(p => p.pedidos),
          label: 'Pedidos',
          backgroundColor: 'rgba(99,102,241,0.6)',
          borderColor: '#6366f1',
          borderWidth: 1,
        },
      ],
    };
  }
}
