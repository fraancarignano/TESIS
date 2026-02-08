# ---------- Base runtime ----------
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

# ---------- Build ----------
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

COPY TESIS_OG.csproj .
RUN dotnet restore TESIS_OG.csproj

COPY . .
RUN dotnet build TESIS_OG.csproj -c $BUILD_CONFIGURATION -o /app/build

# ---------- Publish ----------
FROM build AS publish
RUN dotnet publish TESIS_OG.csproj -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

# ---------- Final ----------
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "TESIS_OG.dll"]
