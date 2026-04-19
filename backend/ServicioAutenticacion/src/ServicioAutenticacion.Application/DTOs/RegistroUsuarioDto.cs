namespace ServicioAutenticacion.Application.DTOs;

public record RegistroUsuarioDto(string NombreUsuario, string CorreoElectronico, string Clave);
public record InicioSesionDto(string CorreoElectronico, string Clave);
public record TokenDto(string Token, DateTime Expiracion);
