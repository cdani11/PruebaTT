-- =============================================================
--  AutenticacionDb — Esquema completo + Stored Procedures
-- =============================================================

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'AutenticacionDb')
BEGIN
    CREATE DATABASE AutenticacionDb;
END
GO

USE AutenticacionDb;
GO

-- ---------------------------------------------------------------
-- Tabla: Usuarios
-- ---------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Usuarios')
BEGIN
    CREATE TABLE Usuarios (
        Id                 UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        NombreUsuario      NVARCHAR(100)    NOT NULL,
        CorreoElectronico  NVARCHAR(200)    NOT NULL,
        ClaveHash          NVARCHAR(500)    NOT NULL,
        FechaCreacion      DATETIME2        NOT NULL,
        Activo             BIT              NOT NULL DEFAULT 1,
        CONSTRAINT UQ_Usuarios_Correo UNIQUE (CorreoElectronico)
    );
END
GO

-- ---------------------------------------------------------------
-- SP: sp_AgregarUsuario
-- ---------------------------------------------------------------
CREATE OR ALTER PROCEDURE sp_AgregarUsuario
    @Id                UNIQUEIDENTIFIER,
    @NombreUsuario     NVARCHAR(100),
    @CorreoElectronico NVARCHAR(200),
    @ClaveHash         NVARCHAR(500),
    @FechaCreacion     DATETIME2,
    @Activo            BIT
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO Usuarios (Id, NombreUsuario, CorreoElectronico, ClaveHash, FechaCreacion, Activo)
    VALUES (@Id, @NombreUsuario, @CorreoElectronico, @ClaveHash, @FechaCreacion, @Activo);
END
GO

-- ---------------------------------------------------------------
-- SP: sp_ObtenerUsuarioPorCorreo
-- ---------------------------------------------------------------
CREATE OR ALTER PROCEDURE sp_ObtenerUsuarioPorCorreo
    @CorreoElectronico NVARCHAR(200)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, NombreUsuario, CorreoElectronico, ClaveHash, FechaCreacion, Activo
    FROM Usuarios
    WHERE CorreoElectronico = @CorreoElectronico;
END
GO

-- ---------------------------------------------------------------
-- SP: sp_ObtenerUsuarioPorId
-- ---------------------------------------------------------------
CREATE OR ALTER PROCEDURE sp_ObtenerUsuarioPorId
    @Id UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, NombreUsuario, CorreoElectronico, ClaveHash, FechaCreacion, Activo
    FROM Usuarios
    WHERE Id = @Id;
END
GO

-- ---------------------------------------------------------------
-- SP: sp_ExisteCorreo
-- ---------------------------------------------------------------
CREATE OR ALTER PROCEDURE sp_ExisteCorreo
    @CorreoElectronico NVARCHAR(200)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT CAST(
        CASE WHEN EXISTS (
            SELECT 1 FROM Usuarios WHERE CorreoElectronico = @CorreoElectronico
        ) THEN 1 ELSE 0 END
    AS BIT) AS Existe;
END
GO
