# ── Stage 1: build ───────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copiar archivos de proyecto primero para aprovechar caché de capas
COPY ServicioAutenticacion.sln .
COPY src/ServicioAutenticacion.Domain/ServicioAutenticacion.Domain.csproj \
     src/ServicioAutenticacion.Domain/
COPY src/ServicioAutenticacion.Application/ServicioAutenticacion.Application.csproj \
     src/ServicioAutenticacion.Application/
COPY src/ServicioAutenticacion.Infrastructure/ServicioAutenticacion.Infrastructure.csproj \
     src/ServicioAutenticacion.Infrastructure/
COPY src/ServicioAutenticacion.Presentation/ServicioAutenticacion.Presentation.csproj \
     src/ServicioAutenticacion.Presentation/
COPY tests/ServicioAutenticacion.UnitTests/ServicioAutenticacion.UnitTests.csproj \
     tests/ServicioAutenticacion.UnitTests/

RUN dotnet restore

# Copiar código fuente y publicar
COPY . .
RUN dotnet publish src/ServicioAutenticacion.Presentation/ServicioAutenticacion.Presentation.csproj \
    --configuration Release \
    --output /app/publish \
    --no-restore

# ── Stage 2: runtime ─────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
ENTRYPOINT ["dotnet", "ServicioAutenticacion.Presentation.dll"]
