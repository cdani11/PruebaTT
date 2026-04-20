import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Estadisticas } from '../modelos/estadisticas.modelo';
import { RespuestaApi } from '../modelos/respuesta-api.modelo';

@Injectable({ providedIn: 'root' })
export class EstadisticasServicio {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiEstadisticas}/estadisticas`;

  obtener(): Observable<Estadisticas> {
    return this.http
      .get<RespuestaApi<Estadisticas>>(this.url)
      .pipe(map(r => r.datos!));
  }
}
