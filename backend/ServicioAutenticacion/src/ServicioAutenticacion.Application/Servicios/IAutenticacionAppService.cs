using ServicioAutenticacion.Application.DTOs;

namespace ServicioAutenticacion.Application.Servicios;

public interface IAutenticacionAppService
{
    Task<TokenDto> RegistrarAsync(RegistroUsuarioDto dto, CancellationToken ct = default);
    Task<TokenDto> IniciarSesionAsync(InicioSesionDto dto, CancellationToken ct = default);
}
