import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AutenticacionServicio } from './autenticacion.servicio';
import { environment } from '../../../environments/environment';

describe('AutenticacionServicio', () => {
  let servicio: AutenticacionServicio;
  let http: HttpTestingController;

  const tokenMock = { token: 'jwt-abc', expiracion: '2099-01-01T00:00:00Z' };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    servicio = TestBed.inject(AutenticacionServicio);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => { http.verify(); localStorage.clear(); });

  it('iniciarSesion() llama POST y guarda token en localStorage', () => {
    servicio.iniciarSesion('a@a.com', 'pass').subscribe(t => {
      expect(t.token).toBe('jwt-abc');
      expect(localStorage.getItem('pruebatt_token')).toBe('jwt-abc');
    });

    const req = http.expectOne(`${environment.apiAutenticacion}/autenticacion/inicio-sesion`);
    expect(req.request.method).toBe('POST');
    req.flush({ exito: true, datos: tokenMock, errores: [] });
  });

  it('registrar() llama POST y guarda token', () => {
    servicio.registrar('user', 'b@b.com', 'pass').subscribe(t => {
      expect(t.token).toBe('jwt-abc');
    });

    const req = http.expectOne(`${environment.apiAutenticacion}/autenticacion/registro`);
    expect(req.request.method).toBe('POST');
    req.flush({ exito: true, datos: tokenMock, errores: [] });
  });

  it('cerrarSesion() elimina token y marca autenticado=false', () => {
    localStorage.setItem('pruebatt_token', 'tok');
    servicio.cerrarSesion();
    expect(localStorage.getItem('pruebatt_token')).toBeNull();
    expect(servicio.autenticado()).toBeFalse();
  });

  it('autenticado es false cuando no hay token', () => {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    const svc = TestBed.inject(AutenticacionServicio);
    expect(svc.autenticado()).toBeFalse();
  });
});
