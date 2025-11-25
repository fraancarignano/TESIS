<<<<<<< HEAD
# TamarindoESCMB

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.2.1.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
=======
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
>>>>>>> 4f2f515988498309a789ab6f3c61e70675776cb4
