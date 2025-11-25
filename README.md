✅ Requerimientos previos

Para ejecutar este proyecto necesitás tener instalados:

Backend (C# – .NET 8)
- .NET SDK 8.0 o superior
- SQL Server (local o remoto)
- SQL Server Management Studio (opcional)

Frontend (Angular)
- Node.js 18+
- Angular CLI
npm install -g @angular/cli

Instalación
1) Clonar el repositorio
git clone https://github.com/fraancarignano/TESIS.git


⚙️ Backend (.NET)
2) Restaurar dependencias


3) Configurar la base de datos

Modificar appsettings.json:

"ConnectionStrings": {
  "DefaultConnection": "Server=localhost;Database=TurnosDB;Trusted_Connection=True;"
}

4) Aplicar migraciones 
dotnet ef database update

5) Ejecutar el backend


Frontend (Angular)
6) Instalar dependencias
npm install

7) Ejecutar la aplicación
ng serve -o


📂 Estructura del proyecto
te lo que significa “Crear README con pasos de instalación y dependencias”: entregar este archivo claro, técnico y reproducible.
