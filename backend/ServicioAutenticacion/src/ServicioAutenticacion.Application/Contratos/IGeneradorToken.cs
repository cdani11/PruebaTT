using ServicioAutenticacion.Application.DTOs;
using ServicioAutenticacion.Domain.Entidades;

namespace ServicioAutenticacion.Application.Contratos;

public interface IGeneradorToken
{
    TokenDto Generar(Usuario usuario);
}
