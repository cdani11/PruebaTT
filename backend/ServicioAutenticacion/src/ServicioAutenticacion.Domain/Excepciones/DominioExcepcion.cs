namespace ServicioAutenticacion.Domain.Excepciones;

public class DominioExcepcion : Exception
{
    public DominioExcepcion(string mensaje) : base(mensaje) { }
}
