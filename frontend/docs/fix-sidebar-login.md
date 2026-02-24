# Fix: Sidebar visible en pantalla de login

## Problema
En algunos casos (principalmente en deploy, por estado persistido en navegador/cache), la sidebar se mostraba en `/login` y permitía intentar navegar a módulos sin autenticación efectiva.

## Causa raíz
La sidebar estaba renderizada en `AppComponent` (layout global) y se ocultaba con una condición (`*ngIf`) basada en estado de autenticación + ruta pública.

Ese enfoque puede fallar cuando el navegador restaura estado o cuando hay datos de sesión residuales, porque la UI global ya está montada y depende de flags de runtime.

## Solución aplicada
Se implementó separación de layouts:

1. `AppComponent` queda como shell mínimo con `<router-outlet>`.
2. Se creó `PrivateLayoutComponent` que contiene la sidebar + contenido privado.
3. `/login` queda fuera del layout privado.
4. Todas las rutas privadas ahora cuelgan de `PrivateLayoutComponent` con `authGuard`.

Resultado: en `/login` la sidebar **no se renderiza** (no existe en el árbol de componentes), en lugar de solo ocultarse.

## Archivos modificados

- `src/app/app.component.ts`
- `src/app/app.component.html`
- `src/app/app.component.css`
- `src/app/app.routes.ts`
- `src/app/layouts/private-layout/private-layout.component.ts`
- `src/app/layouts/private-layout/private-layout.component.html`
- `src/app/layouts/private-layout/private-layout.component.css`

## Estructura de rutas

- Rutas públicas:
  - `/login`

- Rutas privadas (bajo `PrivateLayoutComponent` + `authGuard`):
  - `/clientes`
  - `/proyectos`
  - `/proyectos/crear`
  - `/proyectos/lista`
  - `/inventario`
  - `/reportes/inventario`
  - `/reportes/proyectos`
  - `/ordenes`
  - `/usuarios/proveedores`

## Validación realizada
Se ejecutó build del frontend:

```bash
npm run build
```

Compilación exitosa. Se observaron warnings preexistentes no bloqueantes (budgets CSS, CommonJS, optional chaining).

## Beneficios

- El login queda completamente desacoplado de la navegación privada.
- Se evita que la sidebar aparezca por estados residuales del cliente.
- La arquitectura de rutas queda más mantenible y segura.

## Recomendaciones para deploy

1. Configurar `Cache-Control: no-store` para `index.html` (shell de la SPA).
2. Mantener hash en assets estáticos para invalidación correcta.
3. (Opcional) Validar sesión contra backend al iniciar app para endurecer control de auth.
