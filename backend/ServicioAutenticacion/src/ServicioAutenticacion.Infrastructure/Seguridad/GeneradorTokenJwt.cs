using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using ServicioAutenticacion.Application.Contratos;
using ServicioAutenticacion.Application.DTOs;
using ServicioAutenticacion.Domain.Entidades;

namespace ServicioAutenticacion.Infrastructure.Seguridad;

public class ConfiguracionJwt
{
    public string Clave { get; set; } = null!;
    public string Emisor { get; set; } = null!;
    public string Audiencia { get; set; } = null!;
    public int MinutosExpiracion { get; set; } = 60;
}

public class GeneradorTokenJwt : IGeneradorToken
{
    private readonly ConfiguracionJwt _configuracion;

    public GeneradorTokenJwt(IOptions<ConfiguracionJwt> opciones) => _configuracion = opciones.Value;

    public TokenDto Generar(Usuario usuario)
    {
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, usuario.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, usuario.CorreoElectronico),
            new Claim("nombreUsuario", usuario.NombreUsuario)
        };

        var clave = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuracion.Clave));
        var credenciales = new SigningCredentials(clave, SecurityAlgorithms.HmacSha256);
        var expiracion = DateTime.UtcNow.AddMinutes(_configuracion.MinutosExpiracion);

        var token = new JwtSecurityToken(
            issuer: _configuracion.Emisor,
            audience: _configuracion.Audiencia,
            claims: claims,
            expires: expiracion,
            signingCredentials: credenciales);

        return new TokenDto(new JwtSecurityTokenHandler().WriteToken(token), expiracion);
    }
}
