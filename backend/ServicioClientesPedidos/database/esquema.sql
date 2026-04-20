-- Base de datos del microservicio de Clientes y Pedidos
CREATE DATABASE ClientesPedidosDb;
GO
USE ClientesPedidosDb;
GO

CREATE TABLE Clientes (
    Id                 NVARCHAR(50)  NOT NULL PRIMARY KEY,
    Nombres            NVARCHAR(100) NOT NULL,
    Apellidos          NVARCHAR(100) NOT NULL,
    CorreoElectronico  NVARCHAR(200) NOT NULL UNIQUE,
    Telefono           NVARCHAR(30)  NULL,
    FechaRegistro      DATETIME2     NOT NULL,
    Activo             BIT           NOT NULL DEFAULT 1
);
GO

CREATE TABLE Pedidos (
    Id             NVARCHAR(50)  NOT NULL PRIMARY KEY,
    ClienteId      NVARCHAR(50)  NOT NULL,
    FechaCreacion  DATETIME2     NOT NULL,
    Estado         NVARCHAR(20)  NOT NULL,
    Total          DECIMAL(18,2) NOT NULL,
    CONSTRAINT FK_Pedidos_Clientes FOREIGN KEY (ClienteId) REFERENCES Clientes(Id)
);
GO

CREATE TABLE PedidoDetalles (
    Id              INT IDENTITY(1,1) PRIMARY KEY,
    PedidoId        NVARCHAR(50)  NOT NULL,
    Producto        NVARCHAR(200) NOT NULL,
    Cantidad        INT           NOT NULL,
    PrecioUnitario  DECIMAL(18,2) NOT NULL,
    CONSTRAINT FK_Detalles_Pedidos FOREIGN KEY (PedidoId) REFERENCES Pedidos(Id) ON DELETE CASCADE
);
GO

CREATE INDEX IX_Pedidos_ClienteId ON Pedidos(ClienteId);
CREATE INDEX IX_Pedidos_FechaCreacion ON Pedidos(FechaCreacion DESC);
GO

-- =============================================================
--  Stored Procedures — ClientesPedidosDb
-- =============================================================

-- ---------------------------------------------------------------
-- SP: sp_AgregarCliente
-- ---------------------------------------------------------------
CREATE OR ALTER PROCEDURE sp_AgregarCliente
    @Id                NVARCHAR(50),
    @Nombres           NVARCHAR(100),
    @Apellidos         NVARCHAR(100),
    @CorreoElectronico NVARCHAR(200),
    @Telefono          NVARCHAR(30),
    @FechaRegistro     DATETIME2,
    @Activo            BIT
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO Clientes (Id, Nombres, Apellidos, CorreoElectronico, Telefono, FechaRegistro, Activo)
    VALUES (@Id, @Nombres, @Apellidos, @CorreoElectronico, @Telefono, @FechaRegistro, @Activo);
END
GO

-- ---------------------------------------------------------------
-- SP: sp_ObtenerClientePorId
-- ---------------------------------------------------------------
CREATE OR ALTER PROCEDURE sp_ObtenerClientePorId
    @Id NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, Nombres, Apellidos, CorreoElectronico, Telefono, FechaRegistro, Activo
    FROM Clientes
    WHERE Id = @Id;
END
GO

-- ---------------------------------------------------------------
-- SP: sp_ObtenerClientePorCorreo
-- ---------------------------------------------------------------
CREATE OR ALTER PROCEDURE sp_ObtenerClientePorCorreo
    @CorreoElectronico NVARCHAR(200)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, Nombres, Apellidos, CorreoElectronico, Telefono, FechaRegistro, Activo
    FROM Clientes
    WHERE CorreoElectronico = @CorreoElectronico;
END
GO

-- ---------------------------------------------------------------
-- SP: sp_ListarClientes
-- ---------------------------------------------------------------
CREATE OR ALTER PROCEDURE sp_ListarClientes
    @Pagina  INT,
    @Tamanio INT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Offset INT = (@Pagina - 1) * @Tamanio;
    SELECT Id, Nombres, Apellidos, CorreoElectronico, Telefono, FechaRegistro, Activo
    FROM Clientes
    ORDER BY FechaRegistro DESC
    OFFSET @Offset ROWS FETCH NEXT @Tamanio ROWS ONLY;
END
GO

-- ---------------------------------------------------------------
-- SP: sp_ExisteCorreoCliente
-- ---------------------------------------------------------------
CREATE OR ALTER PROCEDURE sp_ExisteCorreoCliente
    @CorreoElectronico NVARCHAR(200)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT CAST(
        CASE WHEN EXISTS (
            SELECT 1 FROM Clientes WHERE CorreoElectronico = @CorreoElectronico
        ) THEN 1 ELSE 0 END
    AS BIT) AS Existe;
END
GO

-- ---------------------------------------------------------------
-- SP: sp_AgregarPedido
-- ---------------------------------------------------------------
CREATE OR ALTER PROCEDURE sp_AgregarPedido
    @Id            NVARCHAR(50),
    @ClienteId     NVARCHAR(50),
    @FechaCreacion DATETIME2,
    @Estado        NVARCHAR(20),
    @Total         DECIMAL(18,2)
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO Pedidos (Id, ClienteId, FechaCreacion, Estado, Total)
    VALUES (@Id, @ClienteId, @FechaCreacion, @Estado, @Total);
END
GO

-- ---------------------------------------------------------------
-- SP: sp_AgregarDetallePedido
-- ---------------------------------------------------------------
CREATE OR ALTER PROCEDURE sp_AgregarDetallePedido
    @PedidoId       NVARCHAR(50),
    @Producto       NVARCHAR(200),
    @Cantidad       INT,
    @PrecioUnitario DECIMAL(18,2)
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO PedidoDetalles (PedidoId, Producto, Cantidad, PrecioUnitario)
    VALUES (@PedidoId, @Producto, @Cantidad, @PrecioUnitario);
END
GO

-- ---------------------------------------------------------------
-- SP: sp_ObtenerPedidoPorId
-- ---------------------------------------------------------------
CREATE OR ALTER PROCEDURE sp_ObtenerPedidoPorId
    @Id NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, ClienteId, FechaCreacion, Estado, Total
    FROM Pedidos
    WHERE Id = @Id;
END
GO

-- ---------------------------------------------------------------
-- SP: sp_ObtenerDetallesPedido
-- ---------------------------------------------------------------
CREATE OR ALTER PROCEDURE sp_ObtenerDetallesPedido
    @PedidoId NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, PedidoId, Producto, Cantidad, PrecioUnitario
    FROM PedidoDetalles
    WHERE PedidoId = @PedidoId;
END
GO

-- ---------------------------------------------------------------
-- SP: sp_ListarPedidos (con filtros opcionales)
-- ---------------------------------------------------------------
CREATE OR ALTER PROCEDURE sp_ListarPedidos
    @Pagina     INT,
    @Tamanio    INT,
    @Estado     NVARCHAR(20) = NULL,
    @FechaDesde DATETIME2    = NULL,
    @FechaHasta DATETIME2    = NULL,
    @ClienteId  NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Offset INT = (@Pagina - 1) * @Tamanio;
    SELECT Id, ClienteId, FechaCreacion, Estado, Total
    FROM Pedidos
    WHERE (@Estado    IS NULL OR Estado     =  @Estado)
      AND (@FechaDesde IS NULL OR FechaCreacion >= @FechaDesde)
      AND (@FechaHasta IS NULL OR FechaCreacion <  DATEADD(DAY, 1, @FechaHasta))
      AND (@ClienteId  IS NULL OR ClienteId  =  @ClienteId)
    ORDER BY FechaCreacion DESC
    OFFSET @Offset ROWS FETCH NEXT @Tamanio ROWS ONLY;
END
GO

-- ---------------------------------------------------------------
-- SP: sp_ListarPedidosPorCliente
-- ---------------------------------------------------------------
CREATE OR ALTER PROCEDURE sp_ListarPedidosPorCliente
    @ClienteId NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, ClienteId, FechaCreacion, Estado, Total
    FROM Pedidos
    WHERE ClienteId = @ClienteId
    ORDER BY FechaCreacion DESC;
END
GO

-- ---------------------------------------------------------------
-- SP: sp_ActualizarCliente
-- ---------------------------------------------------------------
CREATE OR ALTER PROCEDURE sp_ActualizarCliente
    @Id                NVARCHAR(50),
    @Nombres           NVARCHAR(100),
    @Apellidos         NVARCHAR(100),
    @CorreoElectronico NVARCHAR(200),
    @Telefono          NVARCHAR(30)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Clientes
    SET Nombres           = @Nombres,
        Apellidos         = @Apellidos,
        CorreoElectronico = @CorreoElectronico,
        Telefono          = @Telefono
    WHERE Id = @Id;
END
GO

-- ---------------------------------------------------------------
-- SP: sp_EliminarCliente (soft delete)
-- ---------------------------------------------------------------
CREATE OR ALTER PROCEDURE sp_EliminarCliente
    @Id NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Clientes SET Activo = 0 WHERE Id = @Id;
END
GO

-- ---------------------------------------------------------------
-- SP: sp_EliminarPedido
-- ---------------------------------------------------------------
CREATE OR ALTER PROCEDURE sp_EliminarPedido
    @Id NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM Pedidos WHERE Id = @Id;
END
GO

-- ---------------------------------------------------------------
-- SP: sp_ActualizarPedido
-- ---------------------------------------------------------------
CREATE OR ALTER PROCEDURE sp_ActualizarPedido
    @Id     NVARCHAR(50),
    @Estado NVARCHAR(20),
    @Total  DECIMAL(18,2)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Pedidos
    SET Estado = @Estado,
        Total  = @Total
    WHERE Id = @Id;
END
GO
