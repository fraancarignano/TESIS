Tamarindo-ESCMB/
├── .vscode/                          # Configuración del editor VS Code
├── node_modules/                     # Dependencias del proyecto (generado automáticamente)
├── public/                           # Archivos públicos estáticos
├── src/                              # Código fuente principal
│   ├── app/                          # Aplicación Angular
│   │   ├── core/                     # Funcionalidades centrales del sistema
│   │   │   ├── guards/               # Protección de rutas (autenticación, roles)
│   │   │   ├── interceptors/         # Interceptores HTTP (tokens, manejo de errores)
│   │   │   ├── services/             # Servicios globales (auth, API base)
│   │   │   └── models/               # Modelos de datos globales
│   │   │
│   │   ├── modules/                  # Módulos funcionales del sistema
│   │   │   │
│   │   │   ├── clientes/             # Módulo de gestión de clientes
│   │   │   │   ├── components/       # Componentes de UI del módulo
│   │   │   │   ├── models/           
│   │   │   │   │   └── cliente.model.ts          # Interface del cliente (id, nombre, contacto, etc.)
│   │   │   │   ├── services/
│   │   │   │   │   └── clientes.service.ts       # Lógica de negocio y API calls (CRUD clientes)
│   │   │   │   └── clientes.routes.ts            # Rutas del módulo (registrar, ver estado, programar)
│   │   │   │
│   │   │   ├── inventario/           # Módulo de gestión de inventario
│   │   │   │   ├── components/       # Componentes (ver listado, ingresar insumos, etc.)
│   │   │   │   ├── models/
│   │   │   │   │   └── inventario.model.ts       # Interface de insumos (id, código, cantidad, etc.)
│   │   │   │   ├── services/
│   │   │   │   │   └── inventario.service.ts     # Métodos para operaciones CRUD de inventario
│   │   │   │   └── inventario.routes.ts          # Configuración de rutas del módulo
│   │   │   │
│   │   │   ├── proyectos/            # Módulo de gestión de proyectos
│   │   │   │   ├── components/       # Componentes (ver proyectos, agregar, diseño, scrap)
│   │   │   │   ├── models/
│   │   │   │   │   └── proyecto.model.ts         # Interface de proyecto (id, nombre, estado, diseño, etc.)
│   │   │   │   ├── services/
│   │   │   │   │   └── proyectos.service.ts      # API calls para proyectos y asignación de diseño
│   │   │   │   └── proyectos.routes.ts           # Rutas para la gestión de proyectos
│   │   │   │
│   │   │   ├── reportes/             # Módulo de reportes y análisis
│   │   │   │   ├── components/       # Componentes (reportes de proyectos, producción, scrap)
│   │   │   │   ├── services/
│   │   │   │   │   └── reportes.service.ts       # Métodos para generar y obtener reportes
│   │   │   │   └── reportes.routes.ts            # Rutas de visualización de reportes
│   │   │   │
│   │   │   └── usuarios/             # Módulo de gestión de usuarios
│   │   │       ├── components/       # Componentes (ingresar usuarios, info, roles)
│   │   │       ├── models/
│   │   │       │   └── usuario.model.ts          # Interface de usuario (id, nombre, rol, email, etc.)
│   │   │       ├── services/
│   │   │       │   └── usuarios.service.ts       # CRUD de usuarios y asignación de roles
│   │   │       └── usuarios.routes.ts            # Rutas del módulo de usuarios
│   │   │
│   │   ├── shared/                   # Recursos compartidos entre módulos
│   │   │   ├── components/           # Componentes reutilizables (navbar, modals, botones, tablas)
│   │   │   ├── directives/           # Directivas personalizadas
│   │   │   └── pipes/                # Pipes personalizados (formato de fechas, moneda, etc.)
│   │   │
│   │   ├── app.config.ts             # Configuración principal de la aplicación
│   │   ├── app.html                  # Template raíz de la aplicación
│   │   ├── app.routes.ts             # Configuración de rutas principales
│   │   ├── app.scss                  # Estilos globales de la aplicación
│   │   ├── app.specs.ts              # Pruebas unitarias del componente raíz
│   │   └── app.ts                    # Componente raíz de Angular
│   │
│   ├── assets/                       # Recursos estáticos (imágenes, iconos, fuentes)
│   ├── index.html                    # HTML principal de la aplicación
│   ├── main.ts                       # Punto de entrada de la aplicación
│   └── styles.scss                   # Estilos globales base
│
├── .editorconfig                     # Configuración del editor (indentación, formato)
├── .gitignore                        # Archivos ignorados por Git
├── angular.json                      # Configuración del proyecto Angular
├── package-lock.json                 # Versiones exactas de dependencias instaladas
├── package.json                      # Dependencias y scripts del proyecto
├── README.md                         # Documentación principal del proyecto
├── tsconfig.app.json                 # Configuración de TypeScript para la aplicación
└── tsconfig.spec.json                # Configuración de TypeScript para pruebas