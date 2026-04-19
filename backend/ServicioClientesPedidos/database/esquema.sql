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
