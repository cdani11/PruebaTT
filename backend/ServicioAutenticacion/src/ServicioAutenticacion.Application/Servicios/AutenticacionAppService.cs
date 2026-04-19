using ServicioAutenticacion.Application.Contratos;
using ServicioAutenticacion.Application.DTOs;
using ServicioAutenticacion.Domain.Entidades;
using ServicioAutenticacion.Domain.Excepciones;
using ServicioAutenticacion.Domain.Repositorios;

namespace ServicioAutenticacion.Application.Servicios;

public class AutenticacionAppService : IAutenticacionAppService
{
    private readonly IUsuarioRepository _repositorio;
    private readonly IHasheadorClaves _hasheador;
    private readonly IGeneradorToken _generadorToken;

    public AutenticacionAppService(
        IUsuarioRepository repositorio,
        IHasheadorClaves hasheador,
        IGeneradorToken generadorToken)
    {
        _repositorio = repositorio;
        _hasheador = hasheador;
        _generadorToken = generadorToken;
    }

    public async Task<TokenDto> RegistrarAsync(RegistroUsuarioDto dto, CancellationToken ct = default)
    {
        if (await _repositorio.ExisteCorreoAsync(dto.CorreoElectronico, ct))
            throw new DominioExcepcion("El correo ya está registrado.");

        var claveHash = _hasheador.Hashear(dto.Clave);
        var usuario = new Usuario(dto.NombreUsuario, dto.CorreoElectronico, claveHash);

        await _repositorio.AgregarAsync(usuario, ct);
        await _repositorio.GuardarCambiosAsync(ct);

        return _generadorToken.Generar(usuario);
    }

    public async Task<TokenDto> IniciarSesionAsync(InicioSesionDto dto, CancellationToken ct = default)
    {
        var usuario = await _repositorio.ObtenerPorCorreoAsync(dto.CorreoElectronico, ct)
            ?? throw new DominioExcepcion("Credenciales inválidas.");

        if (!usuario.Activo)
            throw new DominioExcepcion("El usuario está inactivo.");

        if (!_hasheador.Verificar(dto.Clave, usuario.ClaveHash))
            throw new DominioExcepcion("Credenciales inválidas.");

        return _generadorToken.Generar(usuario);
    }
}
