Propósito de cada tipo de archivo:

.model.ts - Modelos de Datos
Define la estructura de datos (interfaces/clases) que se usan en el módulo.

typescriptexport interface Cliente {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  empresa: string;
}

.service.ts - Servicios
Contiene la lógica de negocio y comunicación con el backend (API REST).

typescript@Injectable({ providedIn: 'root' })
export class ClientesService {
  getClientes(): Observable<Cliente[]> { ... }
  crearCliente(cliente: Cliente): Observable<Cliente> { ... }
}

.routes.ts - Rutas
Configuración de navegación del módulo con lazy loading.

typescriptexport const CLIENTES_ROUTES: Routes = [
  { path: 'registrar', component: RegistrarClienteComponent },
  { path: 'estado', component: VerEstadoComponent }
];

components/ - Componentes
Elementos de interfaz de usuario (UI) con su lógica de presentación, template HTML y estilos.