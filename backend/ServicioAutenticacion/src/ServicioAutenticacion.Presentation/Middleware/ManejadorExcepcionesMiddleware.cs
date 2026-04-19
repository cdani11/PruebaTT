using System.Text.Json;
using ServicioAutenticacion.Domain.Excepciones;
using ServicioAutenticacion.Presentation.Respuestas;

namespace ServicioAutenticacion.Presentation.Middleware;

public class ManejadorExcepcionesMiddleware
{
    private readonly RequestDelegate _siguiente;
    private readonly ILogger<ManejadorExcepcionesMiddleware> _logger;

    public ManejadorExcepcionesMiddleware(RequestDelegate siguiente, ILogger<ManejadorExcepcionesMiddleware> logger)
    {
        _siguiente = siguiente;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext contexto)
    {
        try
        {
            await _siguiente(contexto);
        }
        catch (DominioExcepcion ex)
        {
            await EscribirRespuestaAsync(contexto, StatusCodes.Status400BadRequest, ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error no controlado");
            await EscribirRespuestaAsync(contexto, StatusCodes.Status500InternalServerError, "Error interno del servidor.");
        }
    }

    private static Task EscribirRespuestaAsync(HttpContext ctx, int codigo, string mensaje)
    {
        ctx.Response.StatusCode = codigo;
        ctx.Response.ContentType = "application/json";
        var cuerpo = JsonSerializer.Serialize(RespuestaApi<object>.Fallida(mensaje));
        return ctx.Response.WriteAsync(cuerpo);
    }
}
