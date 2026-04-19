using Microsoft.AspNetCore.Mvc;
using ServicioAutenticacion.Application.DTOs;
using ServicioAutenticacion.Application.Servicios;
using ServicioAutenticacion.Presentation.Respuestas;

namespace ServicioAutenticacion.Presentation.Controllers;

[ApiController]
[Route("api/v1/autenticacion")]
public class AutenticacionController : ControllerBase
{
    private readonly IAutenticacionAppService _servicio;

    public AutenticacionController(IAutenticacionAppService servicio) => _servicio = servicio;

    [HttpPost("registro")]
    public async Task<ActionResult<RespuestaApi<TokenDto>>> Registrar([FromBody] RegistroUsuarioDto dto, CancellationToken ct)
    {
        var token = await _servicio.RegistrarAsync(dto, ct);
        return Ok(RespuestaApi<TokenDto>.Correcta(token));
    }

    [HttpPost("inicio-sesion")]
    public async Task<ActionResult<RespuestaApi<TokenDto>>> IniciarSesion([FromBody] InicioSesionDto dto, CancellationToken ct)
    {
        var token = await _servicio.IniciarSesionAsync(dto, ct);
        return Ok(RespuestaApi<TokenDto>.Correcta(token));
    }
}
