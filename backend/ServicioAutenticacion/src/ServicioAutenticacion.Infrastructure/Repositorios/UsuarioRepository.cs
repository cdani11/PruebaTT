using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using ServicioAutenticacion.Domain.Entidades;
using ServicioAutenticacion.Domain.Repositorios;
using ServicioAutenticacion.Infrastructure.Persistencia;

namespace ServicioAutenticacion.Infrastructure.Repositorios;

public class UsuarioRepository : IUsuarioRepository
{
    private readonly AutenticacionDbContext _contexto;

    public UsuarioRepository(AutenticacionDbContext contexto) => _contexto = contexto;

    public async Task<Usuario?> ObtenerPorCorreoAsync(string correoElectronico, CancellationToken ct = default)
    {
        var param = new SqlParameter("@CorreoElectronico", correoElectronico.ToLowerInvariant());
        var lista = await _contexto.Usuarios
            .FromSqlRaw("EXEC sp_ObtenerUsuarioPorCorreo @CorreoElectronico", param)
            .AsNoTracking()
            .ToListAsync(ct);
        return lista.FirstOrDefault();
    }

    public async Task<Usuario?> ObtenerPorIdAsync(Guid id, CancellationToken ct = default)
    {
        var param = new SqlParameter("@Id", id);
        var lista = await _contexto.Usuarios
            .FromSqlRaw("EXEC sp_ObtenerUsuarioPorId @Id", param)
            .AsNoTracking()
            .ToListAsync(ct);
        return lista.FirstOrDefault();
    }

    public async Task<bool> ExisteCorreoAsync(string correoElectronico, CancellationToken ct = default)
    {
        var param = new SqlParameter("@CorreoElectronico", correoElectronico.ToLowerInvariant());
        var resultado = await _contexto.Set<ExistenciaDto>()
            .FromSqlRaw("EXEC sp_ExisteCorreo @CorreoElectronico", param)
            .ToListAsync(ct);
        return resultado.FirstOrDefault()?.Existe ?? false;
    }

    public async Task AgregarAsync(Usuario usuario, CancellationToken ct = default)
    {
        var parametros = new[]
        {
            new SqlParameter("@Id",                usuario.Id),
            new SqlParameter("@NombreUsuario",     usuario.NombreUsuario),
            new SqlParameter("@CorreoElectronico", usuario.CorreoElectronico),
            new SqlParameter("@ClaveHash",         usuario.ClaveHash),
            new SqlParameter("@FechaCreacion",     usuario.FechaCreacion),
            new SqlParameter("@Activo",            usuario.Activo),
        };

        await _contexto.Database.ExecuteSqlRawAsync(
            "EXEC sp_AgregarUsuario @Id, @NombreUsuario, @CorreoElectronico, @ClaveHash, @FechaCreacion, @Activo",
            parametros,
            ct);
    }

    // El INSERT se ejecuta directamente en AgregarAsync; este método preserva la interfaz.
    public Task GuardarCambiosAsync(CancellationToken ct = default) => Task.CompletedTask;
}
