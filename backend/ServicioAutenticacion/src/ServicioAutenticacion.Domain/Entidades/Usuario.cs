using ServicioAutenticacion.Domain.Excepciones;

namespace ServicioAutenticacion.Domain.Entidades;

public class Usuario
{
    public Guid Id { get; private set; }
    public string NombreUsuario { get; private set; } = null!;
    public string CorreoElectronico { get; private set; } = null!;
    public string ClaveHash { get; private set; } = null!;
    public DateTime FechaCreacion { get; private set; }
    public bool Activo { get; private set; }

    private Usuario() { }

    public Usuario(string nombreUsuario, string correoElectronico, string claveHash)
    {
        if (string.IsNullOrWhiteSpace(nombreUsuario))
            throw new DominioExcepcion("El nombre de usuario es obligatorio.");
        if (string.IsNullOrWhiteSpace(correoElectronico))
            throw new DominioExcepcion("El correo electrónico es obligatorio.");
        if (string.IsNullOrWhiteSpace(claveHash))
            throw new DominioExcepcion("La clave es obligatoria.");

        Id = Guid.NewGuid();
        NombreUsuario = nombreUsuario.Trim();
        CorreoElectronico = correoElectronico.Trim().ToLowerInvariant();
        ClaveHash = claveHash;
        FechaCreacion = DateTime.UtcNow;
        Activo = true;
    }

    public void Desactivar() => Activo = false;
}
