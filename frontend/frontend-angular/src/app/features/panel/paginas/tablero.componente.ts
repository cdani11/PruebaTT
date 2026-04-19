import { Component } from '@angular/core';

@Component({
  selector: 'app-tablero',
  standalone: true,
  template: `
    <h1 class="mb-6 text-3xl font-bold">Tablero</h1>
    <p class="text-gray-600">Métricas e indicadores de negocio.</p>
    <!-- TODO: integrar Chart.js con endpoints /api/v1/reportes/* -->
  `
})
export class TableroComponente {}
