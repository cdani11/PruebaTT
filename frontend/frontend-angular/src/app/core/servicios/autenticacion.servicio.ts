import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RespuestaApi } from '../modelos/respuesta-api.modelo';

interface Token { token: string; expiracion: string; }

@Injectable({ providedIn: 'root' })
export class AutenticacionServicio {
  private readonly http = inject(HttpClient);
  private readonly claveAlmacenamiento = 'pruebatt_token';

  private readonly tokenSignal = signal<string | null>(localStorage.getItem(this.claveAlmacenamiento));
  readonly autenticado = computed(() => this.tokenSignal() !== null);

  obtenerToken(): string | null { return this.tokenSignal(); }

  iniciarSesion(correoElectronico: string, clave: string): Observable<Token> {
    return this.http.post<RespuestaApi<Token>>(
      `${environment.apiAutenticacion}/autenticacion/inicio-sesion`,
      { correoElectronico, clave }
    ).pipe(
      map(r => r.datos!),
      tap(t => this.guardarToken(t.token))
    );
  }

  registrar(nombreUsuario: string, correoElectronico: string, clave: string): Observable<Token> {
    return this.http.post<RespuestaApi<Token>>(
      `${environment.apiAutenticacion}/autenticacion/registro`,
      { nombreUsuario, correoElectronico, clave }
    ).pipe(
      map(r => r.datos!),
      tap(t => this.guardarToken(t.token))
    );
  }

  cerrarSesion(): void {
    localStorage.removeItem(this.claveAlmacenamiento);
    this.tokenSignal.set(null);
  }

  private guardarToken(token: string): void {
    localStorage.setItem(this.claveAlmacenamiento, token);
    this.tokenSignal.set(token);
  }
}
