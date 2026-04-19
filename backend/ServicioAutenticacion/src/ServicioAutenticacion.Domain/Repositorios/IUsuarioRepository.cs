using ServicioAutenticacion.Domain.Entidades;

namespace ServicioAutenticacion.Domain.Repositorios;

public interface IUsuarioRepository
{
    Task<Usuario?> ObtenerPorCorreoAsync(string correoElectronico, CancellationToken ct = default);
    Task<Usuario?> ObtenerPorIdAsync(Guid id, CancellationToken ct = default);
    Task<bool> ExisteCorreoAsync(string correoElectronico, CancellationToken ct = default);
    Task AgregarAsync(Usuario usuario, CancellationToken ct = default);
    Task GuardarCambiosAsync(CancellationToken ct = default);
}
