namespace ServicioAutenticacion.Application.Contratos;

public interface IHasheadorClaves
{
    string Hashear(string claveEnTextoPlano);
    bool Verificar(string claveEnTextoPlano, string claveHash);
}
