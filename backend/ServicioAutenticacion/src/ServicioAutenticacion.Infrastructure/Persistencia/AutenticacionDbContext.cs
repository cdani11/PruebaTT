using Microsoft.EntityFrameworkCore;
using ServicioAutenticacion.Domain.Entidades;

namespace ServicioAutenticacion.Infrastructure.Persistencia;

public sealed class ExistenciaDto
{
    public bool Existe { get; set; }
}

public class AutenticacionDbContext : DbContext
{
    public AutenticacionDbContext(DbContextOptions<AutenticacionDbContext> options) : base(options) { }

    public DbSet<Usuario> Usuarios => Set<Usuario>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Usuario>(b =>
        {
            b.ToTable("Usuarios");
            b.HasKey(u => u.Id);
            b.Property(u => u.NombreUsuario).HasMaxLength(100).IsRequired();
            b.Property(u => u.CorreoElectronico).HasMaxLength(200).IsRequired();
            b.HasIndex(u => u.CorreoElectronico).IsUnique();
            b.Property(u => u.ClaveHash).HasMaxLength(500).IsRequired();
            b.Property(u => u.FechaCreacion).IsRequired();
            b.Property(u => u.Activo).IsRequired();
        });

        // Necesario para proyectar resultado de sp_ExisteCorreo
        modelBuilder.Entity<ExistenciaDto>().HasNoKey();
    }
}
