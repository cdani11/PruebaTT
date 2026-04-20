import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RespuestaApi } from '../modelos/respuesta-api.modelo';
import { CrearPedidoDto, DetallePedidoDto, Pedido } from '../modelos/pedido.modelo';

@Injectable({ providedIn: 'root' })
export class PedidoServicio {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiClientesPedidos}/pedidos`;

  listar(pagina = 1, tamanio = 20, filtros: Record<string, string> = {}): Observable<Pedido[]> {
    let params = new HttpParams()
      .set('pagina', pagina)
      .set('tamanio', tamanio);
    for (const [k, v] of Object.entries(filtros)) {
      if (v) params = params.set(k, v);
    }
    return this.http
      .get<RespuestaApi<Pedido[]>>(this.base, { params })
      .pipe(map(r => r.datos ?? []));
  }

  crear(dto: CrearPedidoDto): Observable<Pedido> {
    return this.http
      .post<RespuestaApi<Pedido>>(this.base, dto)
      .pipe(map(r => r.datos!));
  }

  cancelar(id: string): Observable<Pedido> {
    return this.http
      .patch<RespuestaApi<Pedido>>(`${this.base}/${id}/cancelar`, {})
      .pipe(map(r => r.datos!));
  }

  completar(id: string): Observable<Pedido> {
    return this.http
      .patch<RespuestaApi<Pedido>>(`${this.base}/${id}/completar`, {})
      .pipe(map(r => r.datos!));
  }

  editarDetalles(id: string, detalles: DetallePedidoDto[]): Observable<Pedido> {
    return this.http
      .put<RespuestaApi<Pedido>>(`${this.base}/${id}/detalles`, { detalles })
      .pipe(map(r => r.datos!));
  }

  eliminar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
