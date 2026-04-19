using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using ServicioAutenticacion.Application.Contratos;
using ServicioAutenticacion.Application.Servicios;
using ServicioAutenticacion.Domain.Repositorios;
using ServicioAutenticacion.Infrastructure.Persistencia;
using ServicioAutenticacion.Infrastructure.Repositorios;
using ServicioAutenticacion.Infrastructure.Seguridad;

namespace ServicioAutenticacion.Infrastructure;

public static class InyeccionDependencias
{
    public static IServiceCollection AgregarInfraestructura(this IServiceCollection servicios, IConfiguration configuracion)
    {
        servicios.AddDbContext<AutenticacionDbContext>(opt =>
            opt.UseSqlServer(configuracion.GetConnectionString("AutenticacionDb")));

        servicios.Configure<ConfiguracionJwt>(configuracion.GetSection("Jwt"));

        servicios.AddScoped<IUsuarioRepository, UsuarioRepository>();
        servicios.AddScoped<IHasheadorClaves, HasheadorClavesBcrypt>();
        servicios.AddScoped<IGeneradorToken, GeneradorTokenJwt>();
        servicios.AddScoped<IAutenticacionAppService, AutenticacionAppService>();

        return servicios;
    }
}
