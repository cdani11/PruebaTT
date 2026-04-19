using ServicioAutenticacion.Application.Contratos;

namespace ServicioAutenticacion.Infrastructure.Seguridad;

public class HasheadorClavesBcrypt : IHasheadorClaves
{
    public string Hashear(string claveEnTextoPlano) =>
        BCrypt.Net.BCrypt.HashPassword(claveEnTextoPlano, workFactor: 12);

    public bool Verificar(string claveEnTextoPlano, string claveHash) =>
        BCrypt.Net.BCrypt.Verify(claveEnTextoPlano, claveHash);
}
