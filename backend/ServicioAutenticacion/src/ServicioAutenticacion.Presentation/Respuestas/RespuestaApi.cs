namespace ServicioAutenticacion.Presentation.Respuestas;

public class RespuestaApi<T>
{
    public bool Exito { get; set; }
    public T? Datos { get; set; }
    public List<string> Errores { get; set; } = new();

    public static RespuestaApi<T> Correcta(T datos) => new() { Exito = true, Datos = datos };
    public static RespuestaApi<T> Fallida(params string[] errores) => new() { Exito = false, Errores = errores.ToList() };
}
