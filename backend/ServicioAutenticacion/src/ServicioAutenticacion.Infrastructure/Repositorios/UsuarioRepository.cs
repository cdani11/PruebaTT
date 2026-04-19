using Microsoft.EntityFrameworkCore;
using ServicioAutenticacion.Domain.Entidades;
using ServicioAutenticacion.Domain.Repositorios;
using ServicioAutenticacion.Infrastructure.Persistencia;

namespace ServicioAutenticacion.Infrastructure.Repositorios;

public class UsuarioRepository : IUsuarioRepository
{
    private readonly AutenticacionDbContext _contexto;

    public UsuarioRepository(AutenticacionDbContext contexto) => _contexto = contexto;

    public Task<Usuario?> ObtenerPorCorreoAsync(string correoElectronico, CancellationToken ct = default) =>
        _contexto.Usuarios.FirstOrDefaultAsync(u => u.CorreoElectronico == correoElectronico.ToLower(), ct);

    public Task<Usuario?> ObtenerPorIdAsync(Guid id, CancellationToken ct = default) =>
        _contexto.Usuarios.FirstOrDefaultAsync(u => u.Id == id, ct);

    public Task<bool> ExisteCorreoAsync(string correoElectronico, CancellationToken ct = default) =>
        _contexto.Usuarios.AnyAsync(u => u.CorreoElectronico == correoElectronico.ToLower(), ct);

    public async Task AgregarAsync(Usuario usuario, CancellationToken ct = default) =>
        await _contexto.Usuarios.AddAsync(usuario, ct);

    public Task GuardarCambiosAsync(CancellationToken ct = default) =>
        _contexto.SaveChangesAsync(ct);
}
