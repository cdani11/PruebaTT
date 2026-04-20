import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PedidoServicio } from './pedido.servicio';
import { environment } from '../../../environments/environment';

describe('PedidoServicio', () => {
  let servicio: PedidoServicio;
  let http: HttpTestingController;
  const base = `${environment.apiClientesPedidos}/pedidos`;

  const pedidoMock = {
    id: 'p1', clienteId: 'c1', fechaCreacion: '', estado: 'CONFIRMADO' as const,
    total: 100, detalles: []
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    servicio = TestBed.inject(PedidoServicio);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('listar() incluye parámetros de paginación', () => {
    servicio.listar(1, 20).subscribe();
    const req = http.expectOne(r => r.url === base);
    expect(req.request.params.get('pagina')).toBe('1');
    req.flush({ exito: true, datos: [], errores: [] });
  });

  it('listar() incluye filtros opcionales', () => {
    servicio.listar(1, 20, { estado: 'CANCELADO', clienteId: 'c1' }).subscribe();
    const req = http.expectOne(r => r.url === base);
    expect(req.request.params.get('estado')).toBe('CANCELADO');
    expect(req.request.params.get('clienteId')).toBe('c1');
    req.flush({ exito: true, datos: [], errores: [] });
  });

  it('crear() llama POST y retorna el pedido', () => {
    const dto = { clienteId: 'c1', detalles: [{ producto: 'A', cantidad: 1, precioUnitario: 10 }] };
    servicio.crear(dto).subscribe(p => expect(p.id).toBe('p1'));
    const req = http.expectOne(base);
    expect(req.request.method).toBe('POST');
    req.flush({ exito: true, datos: pedidoMock, errores: [] });
  });

  it('cancelar() llama PATCH /cancelar', () => {
    servicio.cancelar('p1').subscribe();
    const req = http.expectOne(`${base}/p1/cancelar`);
    expect(req.request.method).toBe('PATCH');
    req.flush({ exito: true, datos: { ...pedidoMock, estado: 'CANCELADO' }, errores: [] });
  });

  it('completar() llama PATCH /completar', () => {
    servicio.completar('p1').subscribe();
    const req = http.expectOne(`${base}/p1/completar`);
    expect(req.request.method).toBe('PATCH');
    req.flush({ exito: true, datos: { ...pedidoMock, estado: 'ENTREGADO' }, errores: [] });
  });

  it('editarDetalles() llama PUT /detalles con el cuerpo correcto', () => {
    const detalles = [{ producto: 'X', cantidad: 2, precioUnitario: 50 }];
    servicio.editarDetalles('p1', detalles).subscribe(p => expect(p.id).toBe('p1'));
    const req = http.expectOne(`${base}/p1/detalles`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ detalles });
    req.flush({ exito: true, datos: pedidoMock, errores: [] });
  });

  it('eliminar() llama DELETE', () => {
    servicio.eliminar('p1').subscribe();
    const req = http.expectOne(`${base}/p1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
