import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RespuestaApi } from '../modelos/respuesta-api.modelo';
import { ActualizarClienteDto, Cliente, CrearClienteDto } from '../modelos/cliente.modelo';

@Injectable({ providedIn: 'root' })
export class ClienteServicio {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiClientesPedidos}/clientes`;

  listar(pagina = 1, tamanio = 20): Observable<Cliente[]> {
    const params = new HttpParams()
      .set('pagina', pagina)
      .set('tamanio', tamanio);
    return this.http
      .get<RespuestaApi<Cliente[]>>(this.base, { params })
      .pipe(map(r => r.datos ?? []));
  }

  obtener(id: string): Observable<Cliente> {
    return this.http
      .get<RespuestaApi<Cliente>>(`${this.base}/${id}`)
      .pipe(map(r => r.datos!));
  }

  crear(dto: CrearClienteDto): Observable<Cliente> {
    return this.http
      .post<RespuestaApi<Cliente>>(this.base, dto)
      .pipe(map(r => r.datos!));
  }

  actualizar(id: string, dto: ActualizarClienteDto): Observable<Cliente> {
    return this.http
      .put<RespuestaApi<Cliente>>(`${this.base}/${id}`, dto)
      .pipe(map(r => r.datos!));
  }

  eliminar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
