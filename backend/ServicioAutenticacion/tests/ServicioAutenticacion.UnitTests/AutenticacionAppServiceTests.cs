using FluentAssertions;
using Moq;
using ServicioAutenticacion.Application.Contratos;
using ServicioAutenticacion.Application.DTOs;
using ServicioAutenticacion.Application.Servicios;
using ServicioAutenticacion.Domain.Entidades;
using ServicioAutenticacion.Domain.Excepciones;
using ServicioAutenticacion.Domain.Repositorios;
using Xunit;

namespace ServicioAutenticacion.UnitTests;

public class AutenticacionAppServiceTests
{
    private readonly Mock<IUsuarioRepository> _repo = new();
    private readonly Mock<IHasheadorClaves> _hash = new();
    private readonly Mock<IGeneradorToken> _token = new();
    private readonly AutenticacionAppService _sut;

    public AutenticacionAppServiceTests()
    {
        _sut = new AutenticacionAppService(_repo.Object, _hash.Object, _token.Object);
    }

    [Fact]
    public async Task Registrar_LanzaExcepcion_CuandoCorreoYaExiste()
    {
        _repo.Setup(r => r.ExisteCorreoAsync(It.IsAny<string>(), default)).ReturnsAsync(true);

        var accion = () => _sut.RegistrarAsync(new RegistroUsuarioDto("u", "a@a.com", "123"));

        await accion.Should().ThrowAsync<DominioExcepcion>();
    }

    [Fact]
    public async Task IniciarSesion_LanzaExcepcion_CuandoClaveIncorrecta()
    {
        var usuario = new Usuario("u", "a@a.com", "hash");
        _repo.Setup(r => r.ObtenerPorCorreoAsync("a@a.com", default)).ReturnsAsync(usuario);
        _hash.Setup(h => h.Verificar("mala", "hash")).Returns(false);

        var accion = () => _sut.IniciarSesionAsync(new InicioSesionDto("a@a.com", "mala"));

        await accion.Should().ThrowAsync<DominioExcepcion>();
    }
}
