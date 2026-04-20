import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ClienteServicio } from './cliente.servicio';
import { environment } from '../../../environments/environment';

describe('ClienteServicio', () => {
  let servicio: ClienteServicio;
  let http: HttpTestingController;
  const base = `${environment.apiClientesPedidos}/clientes`;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    servicio = TestBed.inject(ClienteServicio);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('listar() llama GET con parámetros de paginación', () => {
    servicio.listar(2, 10).subscribe();
    const req = http.expectOne(r => r.url === base);
    expect(req.request.params.get('pagina')).toBe('2');
    expect(req.request.params.get('tamanio')).toBe('10');
    req.flush({ exito: true, datos: [], errores: [] });
  });

  it('crear() llama POST y retorna el cliente creado', () => {
    const dto = { nombres: 'Juan', apellidos: 'Pérez', correoElectronico: 'juan@test.com' };
    const clienteMock = { id: '1', ...dto, telefono: null, fechaRegistro: '', activo: true };

    servicio.crear(dto).subscribe(c => expect(c.id).toBe('1'));

    const req = http.expectOne(base);
    expect(req.request.method).toBe('POST');
    req.flush({ exito: true, datos: clienteMock, errores: [] });
  });

  it('actualizar() llama PUT con el id correcto', () => {
    const dto = { nombres: 'Carlos', apellidos: 'García', correoElectronico: 'c@test.com' };
    const clienteMock = { id: '42', ...dto, telefono: null, fechaRegistro: '', activo: true };

    servicio.actualizar('42', dto).subscribe(c => expect(c.nombres).toBe('Carlos'));

    const req = http.expectOne(`${base}/42`);
    expect(req.request.method).toBe('PUT');
    req.flush({ exito: true, datos: clienteMock, errores: [] });
  });

  it('eliminar() llama DELETE con el id correcto', () => {
    servicio.eliminar('99').subscribe();
    const req = http.expectOne(`${base}/99`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('obtener() llama GET por id', () => {
    const clienteMock = { id: '5', nombres: 'Ana', apellidos: 'Ruiz', correoElectronico: 'a@t.com', telefono: null, fechaRegistro: '', activo: true };
    servicio.obtener('5').subscribe(c => expect(c.id).toBe('5'));
    const req = http.expectOne(`${base}/5`);
    expect(req.request.method).toBe('GET');
    req.flush({ exito: true, datos: clienteMock, errores: [] });
  });
});
