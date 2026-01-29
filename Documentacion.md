.service.ts: Peticiones HTTP, lógica de negocio
.model.ts: Definición de estructuras de datos (interfaces)
.routes.ts: Configuración de navegación del módulo
components/: UI, templates HTML, estilos y lógica de presentación

# Documentacion pantalla clientes
Estructura General
clientes/
├── components/          → Componentes visuales
├── models/             → Definición de datos
├── services/           → Lógica de negocio
└── clientes.routes.ts  → Configuración de rutas

📂 1. Carpeta models/
cliente.model.ts
typescriptexport interface Cliente {
  id?: number;
  nombre: string;
  apellido: string;
  empresa: string;
  email: string;
}
¿Qué hace?

Define la estructura de datos de un cliente
Es como un "contrato" o "molde" que dice qué propiedades debe tener un cliente
El ? en id? significa que es opcional (cuando creas un cliente nuevo no tiene id todavía)

Analogía: Es como un formulario en blanco que dice "un cliente debe tener: nombre, apellido, empresa y email"

📂 2. Carpeta services/
clientes.service.ts
typescript@Injectable({
  providedIn: 'root'
})
export class ClientesService {
  private clientes: Cliente[] = [...]; // Array con datos
  private clientesSubject = new BehaviorSubject<Cliente[]>(this.clientes);
  
  getClientes(): Observable<Cliente[]> { ... }
  agregarCliente(cliente: Cliente): void { ... }
  actualizarCliente(cliente: Cliente): void { ... }
  eliminarCliente(id: number): void { ... }
}
¿Qué hace?

Es el cerebro de tu módulo de clientes
Almacena los datos (por ahora hardcodeados en un array)
Proporciona métodos para:

Obtener la lista de clientes
Agregar un nuevo cliente
Actualizar un cliente existente
Eliminar un cliente



¿Por qué BehaviorSubject?

Es un tipo de Observable de RxJS
Permite que múltiples componentes se "suscriban" a los cambios
Cuando los datos cambian, todos los componentes se actualizan automáticamente

Analogía: Es como un bibliotecario que guarda los libros (datos) y te los entrega cuando los pides. Si alguien devuelve o toma un libro, avisa a todos los interesados.
Ventaja: Cuando conectes el backend, solo modificas este archivo, los componentes no cambian.

📂 3. Carpeta components/
Esta carpeta contiene los componentes visuales (lo que el usuario ve e interactúa)
A) Componente Principal
clientes.component.ts
typescriptexport class ClientesComponent implements OnInit {
  clientes: Cliente[] = [];              // Lista de clientes
  mostrarFormulario = false;             // Controla si se ve el modal
  clienteSeleccionado: Cliente | null;   // Cliente que estás editando
  terminoBusqueda = '';                  // Texto del buscador
  
  ngOnInit(): void {
    // Al iniciar, trae los clientes del servicio
  }
  
  abrirFormularioNuevo(): void { ... }     // Abre modal para crear
  abrirFormularioEditar(cliente): void { ... } // Abre modal para editar
  cerrarFormulario(): void { ... }         // Cierra el modal
  eliminarCliente(id): void { ... }        // Borra un cliente
}
¿Qué hace?

Es el controlador de la pantalla principal
Maneja la lógica de la lista de clientes
Controla cuándo mostrar/ocultar el formulario modal
Implementa la búsqueda en tiempo real
Se comunica con el servicio para hacer las operaciones CRUD

Métodos importantes:

ngOnInit(): Se ejecuta al cargar el componente, trae los datos
clientesFiltrados: Filtra la lista según lo que escribes en el buscador
abrirFormularioNuevo(): Resetea el cliente seleccionado y muestra el modal
abrirFormularioEditar(): Pasa los datos del cliente al modal para editarlo

clientes.component.html
html<div class="clientes-container">
  <!-- Encabezado con breadcrumb -->
  <div class="header">...</div>
  
  <!-- Barra de búsqueda y botón Nuevo -->
  <div class="actions-bar">
    <input [(ngModel)]="terminoBusqueda">
    <button (click)="abrirFormularioNuevo()">+ Nuevo Cliente</button>
  </div>
  
  <!-- Tabla de clientes -->
  <table>
    <tr *ngFor="let cliente of clientesFiltrados">
      <td>{{ cliente.nombre }}</td>
      ...
      <button (click)="eliminarCliente(cliente.id!)">Eliminar</button>
      <button (click)="abrirFormularioEditar(cliente)">Modificar</button>
    </tr>
  </table>
  
  <!-- Modal del formulario (solo se muestra si mostrarFormulario = true) -->
  <app-cliente-form 
    *ngIf="mostrarFormulario"
    [cliente]="clienteSeleccionado"
    (cerrar)="cerrarFormulario()">
  </app-cliente-form>
</div>
¿Qué hace?

Define la estructura visual de la pantalla
Muestra la tabla con los clientes
Tiene el buscador conectado a terminoBusqueda con [(ngModel)] (two-way binding)
*ngFor: Repite cada fila por cada cliente en el array
*ngIf: Solo muestra el modal cuando mostrarFormulario es true
[cliente]: Pasa datos AL componente hijo (formulario)
(cerrar): Escucha eventos DEL componente hijo

Analogía: Es como el HTML de una página web, pero con "superpoderes" de Angular
clientes.component.css
¿Qué hace?

Define los estilos visuales de la pantalla
Colores, tamaños, espaciados, efectos hover
Hace que se vea como tu prototipo


B) Carpeta cliente-form/ (NUEVO - la creaste tú)
Esta es una sub-carpeta dentro de components/ que contiene el componente del formulario modal.
¿Por qué una carpeta separada?

Organización: El formulario es complejo, merece su propio espacio
Reutilización: Podrías usar este formulario en otras partes
Separación de responsabilidades: La lista hace una cosa, el formulario otra

cliente-form.component.ts
typescriptexport class ClienteFormComponent implements OnInit {
  @Input() cliente: Cliente | null = null;  // Recibe datos del padre
  @Output() cerrar = new EventEmitter<void>(); // Envía evento al padre
  
  formulario: FormGroup;  // Maneja el formulario reactivo
  esEdicion = false;      // ¿Estás creando o editando?
  
  ngOnInit(): void {
    // Si recibió un cliente, es edición y pre-llena el formulario
  }
  
  guardar(): void {
    // Valida y guarda (crear o actualizar)
  }
  
  cancelar(): void {
    // Cierra el modal sin guardar
  }
}
¿Qué hace?

Maneja el formulario modal (crear/editar)
Usa Reactive Forms de Angular para validaciones
@Input() cliente: Recibe el cliente desde el componente padre

Si es null → estás creando
Si tiene datos → estás editando


@Output() cerrar: Emite un evento para decirle al padre "cierrá el modal"

FormGroup:
typescriptthis.formulario = this.fb.group({
  nombre: ['', [Validators.required, Validators.minLength(2)]],
  apellido: ['', [Validators.required, Validators.minLength(2)]],
  empresa: ['', Validators.required],
  email: ['', [Validators.required, Validators.email]]
});

Define cada campo con sus validaciones
Validators.required: Campo obligatorio
Validators.minLength(2): Mínimo 2 caracteres
Validators.email: Debe ser un email válido

Flujo:

Se abre el modal
Si hay cliente, pre-llena los campos
Usuario escribe
Al hacer clic en "Guardar":

Valida el formulario
Si es válido, llama al servicio para guardar
Emite evento cerrar para que el padre cierre el modal



cliente-form.component.html
html<div class="modal-overlay" (click)="cancelar()">
  <div class="modal-content" (click)="$event.stopPropagation()">
    <!-- Header con título y X -->
    <div class="modal-header">
      <h2>{{ titulo }}</h2>  <!-- "Nuevo Cliente" o "Modificar Cliente" -->
      <button (click)="cancelar()">✕</button>
    </div>
    
    <!-- Formulario reactivo -->
    <form [formGroup]="formulario" (ngSubmit)="guardar()">
      <!-- Campo Nombre -->
      <input formControlName="nombre">
      <span *ngIf="formulario.get('nombre')?.invalid && formulario.get('nombre')?.touched">
        El nombre es requerido
      </span>
      
      <!-- ...resto de campos... -->
      
      <!-- Botones -->
      <button type="button" (click)="cancelar()">Cancelar</button>
      <button type="submit">Guardar</button>
    </form>
  </div>
</div>
¿Qué hace?

Modal overlay: Fondo oscuro que cubre toda la pantalla
Modal content: Cuadro blanco en el centro
(click)="cancelar()" en overlay: Si hacés clic afuera, se cierra
$event.stopPropagation(): Evita que clics dentro del modal lo cierren
[formGroup]="formulario": Conecta el HTML con el FormGroup
formControlName="nombre": Conecta cada input con su control
Muestra mensajes de error si el campo es inválido Y fue tocado

cliente-form.component.css
¿Qué hace?

Estilos del modal
.modal-overlay: Fondo semi-transparente que cubre todo
.modal-content: Cuadro blanco centrado
Estilos de inputs, botones, mensajes de error
Grid de 2 columnas para los campos
Animaciones y efectos hover


📄 4. clientes.routes.ts
typescriptexport const clientesRoutes: Routes = [
  {
    path: '',
    component: ClientesComponent
  }
];
```

**¿Qué hace?**
- Configura las **rutas** del módulo
- Dice: "cuando alguien vaya a `/clientes`, mostrá `ClientesComponent`"
- Permite **lazy loading** (cargar el módulo solo cuando se necesita)

---

## 🔄 **Flujo completo de funcionamiento:**

1. **Usuario entra a `/clientes`**
   - Router carga `ClientesComponent`

2. **ClientesComponent se inicia**
   - `ngOnInit()` se ejecuta
   - Llama a `clientesService.getClientes()`
   - Se suscribe y recibe el array de clientes
   - Renderiza la tabla

3. **Usuario escribe en el buscador**
   - `[(ngModel)]` actualiza `terminoBusqueda`
   - `clientesFiltrados` recalcula automáticamente
   - La tabla se actualiza con los resultados filtrados

4. **Usuario hace clic en "Nuevo Cliente"**
   - Se ejecuta `abrirFormularioNuevo()`
   - `clienteSeleccionado = null`
   - `mostrarFormulario = true`
   - El `*ngIf` muestra `<app-cliente-form>`

5. **ClienteFormComponent se carga**
   - Ve que `cliente` es `null` → modo creación
   - Muestra formulario vacío
   - Usuario llena los campos

6. **Usuario hace clic en "Guardar"**
   - Se ejecuta `guardar()`
   - Valida el formulario
   - Llama a `clientesService.agregarCliente()`
   - El servicio agrega al array y notifica a todos los suscriptores
   - Emite evento `cerrar`
   - El padre recibe el evento y ejecuta `cerrarFormulario()`
   - `mostrarFormulario = false`
   - El modal desaparece
   - **La tabla se actualiza automáticamente** porque está suscrita al servicio

---

## 📊 **Diagrama de comunicación:**
```
ClientesComponent (Padre)
    ↓ [cliente]          ↑ (cerrar)
ClienteFormComponent (Hijo)
    ↓ agregarCliente()   ↑ Observable notifica
ClientesService (Datos)

🎯 Ventajas de esta arquitectura:

Separación de responsabilidades:

Componente lista → muestra datos
Componente formulario → edita datos
Servicio → maneja datos


Reutilizable:

Podés usar el formulario en otros lados
Podés usar el servicio en otros componentes


Fácil de conectar al backend:
Solo cambiás el servicio
Los componentes no se tocan

Testeable:
Cada pieza se puede testear por separado